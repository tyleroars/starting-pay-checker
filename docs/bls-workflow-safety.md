# Bounded BLS import workflow

The annual import job has a 15-minute GitHub Actions deadline. Both existing BLS downloads now have a 10-second connection timeout, a 120-second transfer timeout per attempt, and at most two retries, with a 5-second retry delay and 240-second retry budget. HTTP failures stop processing instead of passing an error page to the parser.

The curl retry budget can expire during the final transfer; the job-level deadline remains the outer execution limit. This bounds a single run, not total account spending or the number of manually requested runs.

Dataset URLs, filenames, parsing, exclusions, schedule, secrets, Redis key, and output payload are unchanged. The Redis dependency has not been removed or assumed unnecessary.

Run the offline regression tests with:

```sh
node --test tests/bls-workflow.test.cjs
```

The tests inspect the deadline and download options, execute the embedded Node script with local data and mocked shell/Redis dependencies, verify the output, and check that a download failure writes nothing. They make no network calls and do not run the GitHub workflow.
