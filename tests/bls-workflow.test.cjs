const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const workflow = fs.readFileSync(path.join(__dirname, '../.github/workflows/fetch-bls.yml'), 'utf8');
const match = workflow.match(/node << 'EOF'\n([\s\S]*?)\n\s+EOF\n/);
assert.ok(match, 'The workflow must contain its expected Node heredoc');
const script = match[1];

function runFixture({ downloadError = null, state = {} } = {}) {
  const commands = state.commands = [];
  const writes = state.writes = [];
  const reads = state.reads = [];
  const wages = [
    { OCC_CODE: '15-1252', OCC_TITLE: 'Software Developers', OCC_GROUP: 'detailed', A_PCT10: 50123.4, A_PCT25: 60000, A_MEDIAN: 90000, A_PCT75: 120000, TOT_EMP: 100000 },
    { OCC_CODE: '11-1011', OCC_TITLE: 'Chief Executives', OCC_GROUP: 'detailed', A_PCT10: 70000 },
    { OCC_CODE: '15-0000', OCC_TITLE: 'Computer Occupations', OCC_GROUP: 'major', A_PCT10: 40000 },
    { OCC_CODE: '19-0001', OCC_TITLE: 'Doctoral Fixture', OCC_GROUP: 'detailed', A_PCT10: 60000 },
    { OCC_CODE: '43-0001', OCC_TITLE: 'Missing Pay Fixture', OCC_GROUP: 'detailed', A_PCT10: 0 },
  ];
  const education = [
    { OCC_CODE: '15-1252', EDUCATION: "Bachelor's degree" },
    { OCC_CODE: '19-0001', EDUCATION: 'Doctoral or professional degree' },
  ];
  const modules = {
    'child_process': { execSync(command) {
      commands.push(command);
      if (downloadError && command.startsWith('curl ')) throw downloadError;
    } },
    fs: { readdirSync() { return ['national.xlsx']; } },
    xlsx: {
      readFile(filename) {
        reads.push(filename);
        return { SheetNames: ['Sheet1'], Sheets: { Sheet1: filename.includes('oes_educ') ? education : wages } };
      },
      utils: { sheet_to_json(sheet) { return sheet; } },
    },
    '@upstash/redis': {
      Redis: class {
        async set(key, value) { writes.push({ key, value: JSON.parse(value) }); }
      },
    },
  };
  const completion = vm.runInNewContext(script, {
    require(name) {
      assert.ok(Object.hasOwn(modules, name), `Unexpected dependency: ${name}`);
      return modules[name];
    },
    console: { log() {}, error() {} },
    process: { env: {}, exit(code) { throw new Error(`Workflow exited ${code}`); } },
  }, { timeout: 1000 });
  return Promise.resolve(completion).then(() => ({ commands, writes, reads }));
}

test('job has a finite 15-minute deadline', () => {
  assert.match(workflow, /fetch-bls:\n\s+runs-on: ubuntu-latest\n\s+timeout-minutes: 15\n/);
});

test('both downloads retain their URLs and have bounded retry and transfer times', async () => {
  const { commands } = await runFixture();
  assert.equal(commands.length, 3);
  const downloads = commands.filter(command => command.startsWith('curl '));
  assert.equal(downloads.length, 2);
  for (const command of downloads) {
    for (const option of ['--fail', '--show-error', '--location', '--connect-timeout 10', '--max-time 120', '--retry 2', '--retry-delay 5', '--retry-max-time 240']) {
      assert.ok(command.includes(option), `Missing ${option}: ${command}`);
    }
  }
  assert.ok(downloads[0].endsWith('-o /tmp/oesnat.zip "https://www.bls.gov/oes/special-requests/oesm24nat.zip"'));
  assert.ok(downloads[1].endsWith('-o /tmp/oes_educ.xlsx "https://www.bls.gov/oes/special-requests/oes_educ.xlsx"'));
  assert.equal(commands[1], 'unzip -o /tmp/oesnat.zip -d /tmp/oesnat/');
});

test('parsing, exclusions, and Redis payload remain intact using local fixtures', async () => {
  const { writes, reads } = await runFixture();
  assert.deepEqual(reads, ['/tmp/oesnat/national.xlsx', '/tmp/oes_educ.xlsx']);
  assert.equal(writes.length, 1);
  assert.equal(writes[0].key, 'spc:data');
  const payload = writes[0].value;
  assert.equal(payload.year, 2024);
  assert.equal(payload.count, 1);
  assert.match(payload.updatedAt, /^\d{4}-\d\d-\d\dT/);
  assert.deepEqual(payload.occupations, [{
    code: '15-1252', title: 'Software Developers', category: 'Tech',
    entryPay: 50123, p25: 60000, median: 90000, p75: 120000,
    employment: 100000, education: "Bachelor's degree",
  }]);
});

test('download failures exit without parsing or writing Redis', async () => {
  const state = {};
  await assert.rejects(runFixture({ downloadError: new Error('curl deadline exceeded'), state }), /Workflow exited 1/);
  assert.equal(state.commands.length, 1);
  assert.deepEqual(state.reads, []);
  assert.deepEqual(state.writes, []);
});
