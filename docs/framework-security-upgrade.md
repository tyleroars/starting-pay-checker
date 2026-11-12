# Framework security upgrade

This change pins Next.js to 16.4.6, records the dependency tree in package-lock.json, and declares the required Node.js minimum (20.9.0). React stays on the existing version 18 range to avoid combining a React migration with this security update.

## Local verification

On Node.js 24.22.1:

- `npm run build` passed with the default Turbopack compiler.
- `npm run build -- --webpack` also passed.
- The existing `/`, `/404`, and `/api/occupations` routes were produced.
- `npm audit --omit=dev` no longer reports the Next.js and PostCSS findings present with Next.js 14.2.3.

Next.js 16 warns that React 18 support is deprecated and will be removed in Next.js 17. React 19 migration is separate work.

## Remaining limitations

- The existing `xlsx` dependency still has a high-severity audit finding and no npm-provided fix. The annual BLS workflow installs and uses SheetJS separately. This framework upgrade does not fix that workflow or claim a clean audit.
- The current live-route source imports bundled `data/occupations.json`; it does not call the legacy Redis helper. The older README import instructions describe that legacy workflow, not a tested production Redis dependency.
- The production Node runtime, hosting plan, preview behavior, and spending limits must be verified before publishing. A successful local build is not a deployment or billing guarantee.
