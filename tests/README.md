# Keyboard regression tests

These tests use synthetic occupation data and block external requests. They never call Redis or a live API.

Install test tooling in a Python virtual environment:

```sh
python -m venv .venv
. .venv/bin/activate
pip install playwright
python -m playwright install chromium
```

Start the app in one terminal (`npm install`, then `npm run dev -- --hostname 127.0.0.1 --port 3315`), and run in another:

```sh
python -m unittest discover -s tests -v
```

Optional environment variables: `TEST_BASE_URL` (local app URL), `CHROMIUM_EXECUTABLE` (existing Chromium path).

Coverage: actual Tab navigation, visible focus, Enter/Space disclosure toggling, focus retention, single-open behavior, pointer activation, accessible field labels, filter state and results, pagination, a 390px viewport, and reverse-Tab focus visibility below the sticky header. This focused suite is not a full WCAG audit or a substitute for screen-reader testing.
