# Contributing to Resume Starter Pack

Thanks for helping improve the editor. Bug fixes, usability improvements, documentation,
and reproducible bug reports are welcome.

## Local setup

Use Node.js 22 or newer with npm. Fork this repository, clone your fork, and run
these commands from the project root:

```sh
npm ci
npx playwright install chromium
npm run dev
```

Open http://localhost:3000. On Linux, browser checks may need
`npx playwright install --with-deps chromium`.

## Make a change

1. Create a branch from the latest main.
2. Keep the change focused on one bug, feature, or documentation improvement.
3. Use fictional sample data. Keep personal resume content, credentials, backups,
   and generated output out of your contribution.
4. Update documentation when setup, commands, or behavior changes.
5. Commit your changes and open a pull request against main.

Discuss substantial changes in an issue first so the approach can be agreed on.
For bugs, include reproduction steps, expected and actual behavior, and your browser
and operating system. Screenshots help for layout issues.

## Project conventions

- Preserve the shared rendering used by the live preview, clean view, and PDF export.
- Keep user content intact. Report overflow instead of silently deleting text or
  making it unreadable.
- Give icon controls accessible names, keyboard support, and visible focus states.
  Respect reduced-motion preferences.
- Keep drag handles visually stable throughout interaction.
- Keep local saves validated and preserve stale-write protection.
- Keep external assets and their license notices together.
- Update package-lock.json with dependency changes; use npm ci to verify the lockfile.

## Validate your work

Run the source validation and whitespace check for every contribution:

```sh
npm run validate
git diff --check
```

Then run checks appropriate to what changed:

| Change | Verification |
| --- | --- |
| Editor controls, icons, or drag handles | Exercise the affected flow in the browser; run `npm run test:drag-icon` when drag icons are affected |
| Layout, rendering, page settings, or PDF export | Run `npm run build:pdf -- 1.0`; inspect the generated PDF for one page, clipping, alignment, and links |
| Save behavior or data validation | Check save/reload persistence, invalid input, and conflicting edits without committing real personal data |
| Walkthrough recording | Run `npm run record:demo`; review the MP4/GIF and confirm data files were not changed |
| Documentation only | Verify commands, paths, and links; browser/PDF checks can be marked not applicable |

Add or update a regression test when a behavioral bug warrants it. Do not add tests
that only repeat the implementation. Generated PDFs, raw recordings, and backups
belong in ignored output/. Deliberate README demo assets belong in assets/demo/.

## Pull request format

The PR template loads automatically. Include:

- **Problem / purpose:** what the change fixes or enables.
- **Changes:** the final behavior and relevant implementation details.
- **Validation:** exact checks performed and their results; explain anything not run.
- **Visual evidence:** screenshots or a short recording for visible UI changes.
- **Related issue:** link an issue when one exists.

Use a descriptive title such as "Keep drag icons stable during reordering".
Keep unrelated refactors and formatting out of the PR.

## Review and merge

Changes to main go through a pull request. Required checks and the repository's
review requirements must pass before merge. Address review feedback on the same
branch. Maintainers handle merging and versioned releases; do not publish a release
as part of a contribution unless requested.

Publishing a release generates its versioned PDF. Ordinary pushes and pull requests
validate source and do not generate a release PDF automatically.
