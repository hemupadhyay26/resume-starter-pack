# Resume Starter Pack

A local visual resume editor with a live one-page preview, drag-and-drop ordering, and versioned PDF releases. Edit through your browser without writing LaTeX or JSON.

All included resume content is placeholder text. Replace it with your own details.

## Editor walkthrough

See text editing, drag-and-drop section ordering, page settings, saving, and the clean resume view.

[![Watch the editor walkthrough](assets/demo/editor-walkthrough.gif)](https://github.com/hemupadhyay26/resume-starter-pack/raw/refs/heads/main/assets/demo/editor-walkthrough.mp4)

[Watch or download the full MP4 walkthrough](https://github.com/hemupadhyay26/resume-starter-pack/raw/refs/heads/main/assets/demo/editor-walkthrough.mp4).

The recording uses fictional details and keeps demo edits in memory.

## Get your own copy

Click **Use this template → Create a new repository** on GitHub. Choose a private repository if you will store personal contact details. Template copies start with their own Git history.

Clone your new repository and open its folder in a terminal.

## Quick start

Install Node.js 22 or newer (with npm), then run:

```sh
npm ci
npm run dev
```

Open http://localhost:3000. Run commands from the repository root. Windows, macOS, and Linux use the same commands. If you use nvm, run `nvm use` first.

## Edit your resume

1. Expand sidebar sections and replace the examples.
2. Add or remove entries using the icon buttons.
3. Drag handles to reorder entries or sections. Handles also support Up/Down keys. Drag icons stay static during hover and dragging.
4. Adjust page size, margins, font, line spacing, and gaps in **Page and spacing**.
5. Click **Save changes** to write your changes locally.
6. Open **Resume only** for the clean saved version.

The sidebar resizes and collapses. Hover over an icon to see its action. Live preview updates before saving; the clean view shows saved data. Reload saved data discards a draft after confirmation.

The preview warns about overflow. It does not shrink or remove your content silently. Edit content or spacing until it fits.

## Export a PDF locally

For quick manual export, click **Print / Save PDF**. Match the selected paper size (Letter by default), use 100% scale, and disable browser headers and footers.

For the automated exporter:

```sh
npx playwright install chromium
npm run build:pdf -- 1.0
```

On Linux, install browser dependencies if required:

```sh
npx playwright install --with-deps chromium
```

Output: `output/resume-1.0.pdf`. Export fails if the PDF is not exactly one page.

## Automatic PDFs on GitHub releases

1. Save your edits, commit, and push to your own repository.
2. Ensure GitHub Actions is enabled on the repository.
3. Create and publish a release targeting your latest commit, with a tag such as `v1.0` or `v1.0.1`.
4. The **Build release PDF** workflow builds the resume from that tag and attaches `resume-1.0.pdf` to the release.
5. Download old versions from their respective release Assets sections.

Pushes and pull requests validate only; they do not create PDFs. A tag push alone does not create a PDF. No personal access token or custom secret is needed: the workflow uses the repository's GitHub token with contents-write permission.

The workflow uploads after publication, so it requires mutable releases. For repositories enforcing immutable releases, adapt the workflow to build and upload to a draft before publishing. Publish via GitHub's UI or a user-authenticated CLI; releases created by another workflow with GITHUB_TOKEN do not trigger this release workflow.

Re-running a successful build does not overwrite an existing release asset. Choose a new version for changed content.

## Files and folders

| Path | Purpose |
| --- | --- |
| `editor/` | Browser editor, live renderer, and animated icon components |
| `data/resume.json` | Your saved content |
| `data/layout.json` | Page and typography settings |
| `templates/` | Shared preview and print styles |
| `scripts/` | Local server, validation, and PDF exporter |
| `assets/` | Optional local fonts and images |
| `.github/workflows/` | Validation and release PDF automation |
| `output/` | Generated assets and last pre-save backup; ignored by Git |
| `docs/` | Optional local notes; ignored by Git |

The server binds to your computer's loopback address. Saving requires same-origin requests, validates data, and rejects stale writes. The last pre-save backup is `output/backups/before-save.json`; each save replaces it. Commit regularly for durable history.

## Commands

- `npm run dev` — editor at localhost:3000
- `npm run preview` — same local editor
- `npm run validate` — validate saved content and layout
- `npm run build:pdf -- 1.0` — generate a versioned one-page PDF

To use another port: `PORT=3001 npm run dev` on macOS/Linux, or `$env:PORT=3001; npm run dev` in PowerShell.

## Icons and license

Dashboard icons use [Animate UI](https://animate-ui.com/docs/icons) React components with Motion. They are bundled locally; the editor does not load icons from a CDN. Upstream licensing is retained in `editor/icons/LICENSE`.

Project code is MIT licensed; see LICENSE. Keep your own resume data private if you do not want it published.
