# Kindle Highlight Exporter

Kindle Highlight Exporter is a bookmarklet that exports your Kindle Notebook highlights and notes into markdown files, one book per file, bundled into a ZIP archive.

The install page is published at `https://highlights.primeradiant.com`.

## What It Does

- discovers your annotated books from Kindle Notebook
- fetches each book's highlights and notes
- writes one markdown file per book
- organizes the ZIP as `kindle-highlights/<author>/<title>.md`

## How To Use It

1. Open `https://highlights.primeradiant.com`.
2. Drag the bookmarklet into your browser bookmarks bar.
3. Visit `https://read.amazon.com/notebook` while logged into Amazon.
4. Click the bookmarklet from your bookmarks bar.
5. Wait for the ZIP download to finish.

## Output Format

The exported ZIP contains markdown files under:

`kindle-highlights/<author>/<slugged-title>.md`

Each markdown file includes:

- title
- author
- ASIN
- last annotated date
- counts for highlights and notes
- per-annotation location, page, added date, highlight text, and note text when available

## Privacy Model

This project runs as a bookmarklet in your browser against Kindle Notebook while you are logged in.

- there is no project backend
- no exported highlights are sent to Prime Radiant
- requests go directly from your browser to Amazon and the ZIP is generated locally in your browser session

The install page itself is static.

## Local Development

Install dependencies:

```bash
npm ci
```

Run tests:

```bash
npm test
```

Build the static install page:

```bash
npm run build
```

Serve the built page locally:

```bash
python3 -m http.server 4173
```

Then open `http://127.0.0.1:4173/`.

## License

Apache-2.0

Copyright 2026 Prime Radiant
