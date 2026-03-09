# Spider-Man Menu Web Port (Test Repo)

This folder is prepared as a standalone GitHub repository for testing.

## Quick start

1. Install Node.js 18+.
2. Run:

```bash
npm install
npm start
```

3. Open http://localhost:5173

## Publish to GitHub

Run inside this folder:

```bash
git init
git add .
git commit -m "Initial test upload"
git branch -M main
git remote add origin https://github.com/<your-user>/<your-repo>.git
git push -u origin main
```

## Included

- Runtime assets and pages: `assets`, `legacy`, `public`, `src`
- Entry files: `index.html`, `server.js`, `package.json`
- Additional pages: `crawl.html`, `lab.html`, `mode.html`, `mugshot.html`, `print.html`, `websling.html`

## Notes

- `legacy/` contains only required files migrated from the old `original assets` tree.
- All migrated `legacy/` paths are lowercase and contain no spaces.
- The old `original assets` folder was removed.