# Kindle Full Library Discovery Design

## Goal

Export every annotated Kindle book visible to the logged-in notebook account, even when the notebook page has only partially loaded the library UI. Keep the export format simple, but place markdown files under `kindle-highlights/<author>/` in the ZIP archive.

## Root Cause

The current bookmarklet only reads the cards already present in `#kp-notebook-library`. Kindle lazily appends more cards with same-origin requests to `GET /notebook?library=list&token=...`. When the page has not fully loaded those fragments, the export silently misses books.

## Approved Approach

Use Kindle's existing library pagination endpoint rather than trying to coerce the UI to load every card. The bookmarklet will:

1. Scrape the currently rendered library cards.
2. Read any `.kp-notebook-library-next-page-start` token already present in the library container.
3. Continue requesting `/notebook?library=list&token=...` until the returned fragment has no next-page token.
4. Parse each returned HTML fragment for additional book cards and merge them into the discovered set by ASIN.

This keeps the implementation aligned with the live site behavior and avoids brittle viewport-driven scrolling logic.

## Data Shape

Reliable book-level metadata available from the library card UI remains limited to:

- ASIN
- title
- author
- last annotated date

The live `library=list` response also includes cover image URLs, but Jesse explicitly asked not to prioritize covers, so the export will not expand around them. No richer structured metadata was observed in the library response.

## ZIP Layout

Each markdown file will be written to:

`kindle-highlights/<author>/<slugged-title>.md`

Rules:

- Use a sanitized author folder name.
- Use `Unknown Author` when the book card has no author.
- If two files in the same author folder would collide, append `-<asin>` to the markdown filename.

## Testing

Test coverage will expand in three areas:

- paginated library discovery from HTML fragments
- de-duplication when the DOM and a fetched fragment contain the same ASIN
- ZIP output paths under `kindle-highlights/<author>/...`, including filename collision handling

## Non-Goals

- No new browser automation for scrolling the notebook UI
- No attempt to reverse-engineer unrelated private APIs
- No redesign of the markdown body format beyond the path layout and metadata normalization needed for the new book discovery flow
