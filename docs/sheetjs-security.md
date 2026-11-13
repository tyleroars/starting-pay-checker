# SheetJS dependency repair

SheetJS 0.18.5 was used by the annual BLS workbook import. The live occupations route serves bundled JSON and does not parse workbooks.

The package is now pinned to the official vendor release 0.20.3, following https://docs.sheetjs.com/docs/getting-started/installation/nodejs/. The lockfile records the archive's integrity hash. The workflow checks out the repository, selects Node 22, and runs `npm ci --ignore-scripts`; an unpinned `npm install xlsx` would reinstall the vulnerable npm release.

BLS URLs, schedule, parsing/filtering rules, Redis key and payload, and timeout safeguards remain unchanged. Regression tests generate real XLSX fixture bytes with the patched library, parse them, and verify the same transformed output with shell and Redis mocked. No production import or Redis write is performed by tests.

Verification: five workflow tests, production build, and npm audit (zero reported vulnerabilities) passed on November 13, 2026. This is dependency validation, not a claim that all application risks are eliminated.
