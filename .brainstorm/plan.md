# Clippings Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static installation page and bookmarklet that exports Kindle Notebook highlights and notes into a zip of per-book markdown files.

**Architecture:** Keep the shipped product as one generated `index.html` file backed by a single readable browser module for the bookmarklet runtime. Use a tiny local build script to inject the encoded bookmarklet payload into the page, and verify the scraper, markdown formatter, progress overlay, and zip flow with Node's built-in test runner plus HTML fixtures.

**Tech Stack:** Static HTML/CSS, vanilla browser JavaScript, Node 24, `node:test`, `jsdom`, JSZip loaded dynamically at runtime from CDN.

---

## File Structure

- Create: `package.json`
- Create: `package-lock.json`
- Modify: `.gitignore`
- Create: `scripts/build.mjs`
- Create: `src/bookmarklet.js`
- Create: `src/index.template.html`
- Create: `tests/story-001-installation-page.test.mjs`
- Create: `tests/story-002-book-list.test.mjs`
- Create: `tests/story-003-annotations.test.mjs`
- Create: `tests/story-004-markdown.test.mjs`
- Create: `tests/story-005-zip-export.test.mjs`
- Create: `tests/story-006-progress-overlay.test.mjs`
- Create: `tests/fixtures/notebook-library.html`
- Create: `tests/fixtures/notebook-annotations-page-1.html`
- Create: `tests/fixtures/notebook-annotations-page-2.html`
- Create: `index.html`
- Create: `.brainstorm/build-report.yaml`

### Responsibility Map

- `src/bookmarklet.js`
  Browser-facing runtime plus small pure helpers: book list scraping, annotation page parsing, date normalization, markdown rendering, progress overlay control, JSZip loading, and download trigger.
- `src/index.template.html`
  The single-file installation page template with inline CSS, inline sample markdown, and a placeholder for the bookmarklet `href`.
- `scripts/build.mjs`
  Reads the readable bookmarklet source, removes ESM exports for browser execution, URI-encodes the payload, injects it into the template, and writes `index.html`.
- `tests/story-001-installation-page.test.mjs`
  Verifies the built page content, step copy, draggable bookmarklet anchor, and `javascript:` payload.
- `tests/story-002-book-list.test.mjs`
  Verifies DOM scraping of visible book cards from Kindle Notebook.
- `tests/story-003-annotations.test.mjs`
  Verifies annotation parsing, pagination token handling, date conversion, and book-level fetch continuation on failure.
- `tests/story-004-markdown.test.mjs`
  Verifies slugified filenames and markdown output formatting.
- `tests/story-005-zip-export.test.mjs`
  Verifies JSZip loading, zip naming, and automatic download trigger behavior.
- `tests/story-006-progress-overlay.test.mjs`
  Verifies overlay creation, updates, cleanup, and error UI.

## Constraints And Risks

- The approved mockups use external scripts, but story `story-001` requires a single static HTML file with no external dependencies. Treat the mockups as visual reference only and reproduce the look with inline CSS and inline markup.
- Kindle Notebook selectors are fixed by the acceptance criteria. Keep selector logic centralized so failures are easy to diagnose if Amazon changes the DOM.
- Story `story-002` explicitly limits export scope to the visible DOM cards. Do not add pagination or API scraping for the book list.
- JSZip is a runtime dependency only. Tests should stub `window.JSZip` and the script loader rather than relying on network access.
- The bookmarklet payload should stay readable in source form. Avoid introducing a bundler; the build step only needs to inject the encoded source into `index.html`.

## Chunk 1: Foundation And Installation Page

### Task 1: Scaffold the local build and test harness

**Stories:** `story-001`

**Files:**
- Create: `package.json`
- Create: `package-lock.json`
- Modify: `.gitignore`
- Create: `scripts/build.mjs`
- Create: `src/index.template.html`
- Create: `index.html`
- Test: `tests/story-001-installation-page.test.mjs`

- [ ] **Step 1: Write the failing installation page test**

```js
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

test("build writes a static installation page with a bookmarklet link", () => {
  execFileSync("node", ["scripts/build.mjs"]);
  const html = readFileSync("index.html", "utf8");
  assert.match(html, /Export Kindle Highlights/);
  assert.match(html, /href="javascript:/);
});
```

- [ ] **Step 2: Run the test to verify the red state**

Run: `node --test tests/story-001-installation-page.test.mjs`
Expected: FAIL because `scripts/build.mjs` and `index.html` do not exist yet.

- [ ] **Step 3: Write the minimal build pipeline**

Create `package.json` with:
- `"type": "module"`
- `"scripts": { "build": "node scripts/build.mjs", "test": "node --test" }`
- dev dependency on `jsdom`

Create `.gitignore` entries for:
- `node_modules/`

Create `src/index.template.html` as the installation page source with:
- inline CSS only
- placeholder token such as `__BOOKMARKLET_HREF__`
- approved page copy and faux-XML sample block

Create `scripts/build.mjs` to:
- read `src/bookmarklet.js`
- strip line-start `export ` keywords
- wrap the source in a self-executing `javascript:` payload
- URI-encode the payload
- inject it into the template
- write `index.html`

- [ ] **Step 4: Run the story test and build command**

Run: `node --test tests/story-001-installation-page.test.mjs`
Expected: PASS

Run: `npm run build`
Expected: PASS and rewrite `index.html` from source.

- [ ] **Step 5: Commit**

```bash
git add .gitignore package.json package-lock.json scripts/build.mjs src/index.template.html index.html tests/story-001-installation-page.test.mjs
git commit -m "[story-001-bookmarklet-installation-page] scaffold static page build"
```

### Task 2: Finish the installation page content and bookmarklet affordance

**Stories:** `story-001`

**Files:**
- Modify: `src/index.template.html`
- Modify: `tests/story-001-installation-page.test.mjs`
- Modify: `index.html`

- [ ] **Step 1: Extend the failing story test to cover all acceptance criteria**

Add assertions for:
- `Clippings`
- `Kindle highlights to markdown`
- ordered steps 2-4
- `https://read.amazon.com/notebook`
- `draggable="true"`
- the code sample block

- [ ] **Step 2: Run the test to verify the red state**

Run: `node --test tests/story-001-installation-page.test.mjs`
Expected: FAIL on the missing or incomplete page details.

- [ ] **Step 3: Implement the approved page markup**

Update `src/index.template.html` to:
- match the approved structure and copy
- keep the bookmarklet anchor draggable
- use inline CSS for the simple polished layout
- include the faux-XML markdown sample

- [ ] **Step 4: Rebuild and rerun the test**

Run: `npm run build`
Expected: PASS

Run: `node --test tests/story-001-installation-page.test.mjs`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/index.template.html index.html tests/story-001-installation-page.test.mjs
git commit -m "[story-001-bookmarklet-installation-page] add install page content"
```

## Chunk 2: Scraping And Progress

### Task 3: Scrape the visible book list from Kindle Notebook

**Stories:** `story-002`

**Files:**
- Create: `tests/fixtures/notebook-library.html`
- Create: `tests/story-002-book-list.test.mjs`
- Create: `src/bookmarklet.js`

- [ ] **Step 1: Write the failing book list test**

```js
test("scrapeBookList reads visible Kindle Notebook cards", async () => {
  const books = scrapeBookList(document);
  assert.deepEqual(books, [{
    asin: "B07VRS84D1",
    title: "The Pragmatic Programmer",
    author: "David Thomas, Andrew Hunt",
    lastAnnotated: "2024-11-03"
  }]);
});
```

- [ ] **Step 2: Run the test to verify the red state**

Run: `node --test tests/story-002-book-list.test.mjs`
Expected: FAIL because `scrapeBookList` is not implemented yet.

- [ ] **Step 3: Implement minimal book-card scraping**

In `src/bookmarklet.js`:
- export `scrapeBookList(document)`
- query `#kp-notebook-library > div`
- read `id`, title, author, and annotated date exactly per the story
- strip the `"By: "` prefix from the author text

- [ ] **Step 4: Run the focused test**

Run: `node --test tests/story-002-book-list.test.mjs`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/bookmarklet.js tests/fixtures/notebook-library.html tests/story-002-book-list.test.mjs
git commit -m "[story-002-scrape-book-list-from-kindle-notebook] scrape visible book cards"
```

### Task 4: Add the progress overlay controller

**Stories:** `story-006`

**Files:**
- Create: `tests/story-006-progress-overlay.test.mjs`
- Modify: `src/bookmarklet.js`

- [ ] **Step 1: Write the failing progress overlay test**

Add coverage for:
- overlay injected once
- status text updates in place
- `completed / total` count renders
- `showError` renders dismiss button
- `remove` cleans up the DOM

- [ ] **Step 2: Run the test to verify the red state**

Run: `node --test tests/story-006-progress-overlay.test.mjs`
Expected: FAIL because the overlay helpers do not exist yet.

- [ ] **Step 3: Implement the minimal overlay controller**

In `src/bookmarklet.js`:
- export `createProgressOverlay(document)`
- render fixed overlay markup with inline styles
- expose `update`, `showError`, and `remove` methods

- [ ] **Step 4: Run the focused test**

Run: `node --test tests/story-006-progress-overlay.test.mjs`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/bookmarklet.js tests/story-006-progress-overlay.test.mjs
git commit -m "[story-006-progress-indicator-during-export] add progress overlay controller"
```

### Task 5: Parse annotation pages and paginate per book

**Stories:** `story-003`

**Files:**
- Create: `tests/fixtures/notebook-annotations-page-1.html`
- Create: `tests/fixtures/notebook-annotations-page-2.html`
- Create: `tests/story-003-annotations.test.mjs`
- Modify: `src/bookmarklet.js`

- [ ] **Step 1: Write the failing annotation parsing tests**

Add tests for:
- `parseAnnotationPage(html)` returning parsed rows, `nextToken`, and `contentLimitState`
- header parsing into `location`, `page`, and `added`
- missing note omission
- `fetchAnnotationsForBook(book, fetchImpl, overlay)` continuing through pagination
- fetch failure recorded and surfaced without aborting the full export

- [ ] **Step 2: Run the test to verify the red state**

Run: `node --test tests/story-003-annotations.test.mjs`
Expected: FAIL because annotation parsing and fetch looping are not implemented yet.

- [ ] **Step 3: Implement minimal annotation scraping**

In `src/bookmarklet.js`:
- export `parseAnnotationPage(html)`
- export `fetchAnnotationsForBook(book, fetchImpl)`
- fetch `https://read.amazon.com/notebook?...` with `credentials: "include"`
- parse in a detached `div`
- read rows from `#kp-notebook-annotations > .a-row.a-spacing-base`
- read highlight text, note text, metadata, and next-page controls
- normalize `"Added on ..."` into `YYYY-MM-DD`

- [ ] **Step 4: Run the focused test**

Run: `node --test tests/story-003-annotations.test.mjs`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/bookmarklet.js tests/fixtures/notebook-annotations-page-1.html tests/fixtures/notebook-annotations-page-2.html tests/story-003-annotations.test.mjs
git commit -m "[story-003-scrape-highlights-and-notes-per-book] paginate and parse annotations"
```

## Chunk 3: Markdown, Zip, And Full Flow

### Task 6: Generate the per-book markdown files

**Stories:** `story-004`

**Files:**
- Create: `tests/story-004-markdown.test.mjs`
- Modify: `src/bookmarklet.js`

- [ ] **Step 1: Write the failing markdown tests**

Add tests for:
- slugified filename output
- header block content and omission of missing fields
- metadata line formatting
- `<highlight>` and `<note>` wrappers
- horizontal rule separation

- [ ] **Step 2: Run the test to verify the red state**

Run: `node --test tests/story-004-markdown.test.mjs`
Expected: FAIL because filename and markdown formatting helpers are not implemented yet.

- [ ] **Step 3: Implement minimal markdown helpers**

In `src/bookmarklet.js`:
- export `slugifyTitle(title)`
- export `buildMarkdownFile(book)`
- omit missing fields instead of rendering placeholders

- [ ] **Step 4: Run the focused test**

Run: `node --test tests/story-004-markdown.test.mjs`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/bookmarklet.js tests/story-004-markdown.test.mjs
git commit -m "[story-004-generate-markdown-file-per-book] format markdown export files"
```

### Task 7: Load JSZip, package the files, and trigger download

**Stories:** `story-005`

**Files:**
- Create: `tests/story-005-zip-export.test.mjs`
- Modify: `src/bookmarklet.js`

- [ ] **Step 1: Write the failing zip export tests**

Add tests for:
- dynamic JSZip loader only injecting the script once
- zip filename format `kindle-highlights-YYYY-MM-DD.zip`
- one markdown file per book at zip root
- anchor download trigger using `download`

- [ ] **Step 2: Run the test to verify the red state**

Run: `node --test tests/story-005-zip-export.test.mjs`
Expected: FAIL because zip packaging helpers do not exist yet.

- [ ] **Step 3: Implement the minimal zip flow**

In `src/bookmarklet.js`:
- export `loadJsZip(document)`
- export `downloadZip(books, jszipCtor, document, URL)`
- load JSZip from CDN when `window.JSZip` is absent
- add one markdown file per book at the zip root
- generate a blob and click a temporary anchor with `download`

- [ ] **Step 4: Run the focused test**

Run: `node --test tests/story-005-zip-export.test.mjs`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/bookmarklet.js tests/story-005-zip-export.test.mjs
git commit -m "[story-005-package-all-books-into-a-zip-and-trigger-download] package markdown files into zip"
```

### Task 8: Wire the end-to-end bookmarklet flow and publish the build report

**Stories:** `story-002`, `story-003`, `story-005`, `story-006`

**Files:**
- Modify: `src/bookmarklet.js`
- Modify: `scripts/build.mjs`
- Modify: `index.html`
- Modify: `tests/story-001-installation-page.test.mjs`
- Modify: `tests/story-003-annotations.test.mjs`
- Modify: `tests/story-005-zip-export.test.mjs`
- Modify: `tests/story-006-progress-overlay.test.mjs`
- Create: `.brainstorm/build-report.yaml`

- [ ] **Step 1: Extend the tests to cover the integration path**

Add coverage for:
- `runClippingsBookmarklet()` orchestrating book scrape, per-book annotation fetch, markdown build, zip download, and overlay cleanup
- overlay error state when at least one book fails
- build output still embedding a valid bookmarklet payload after integration changes

- [ ] **Step 2: Run the focused tests to verify the red state**

Run: `node --test tests/story-001-installation-page.test.mjs tests/story-003-annotations.test.mjs tests/story-005-zip-export.test.mjs tests/story-006-progress-overlay.test.mjs`
Expected: FAIL because the orchestration flow is incomplete.

- [ ] **Step 3: Implement the minimal orchestration**

In `src/bookmarklet.js`:
- export `runClippingsBookmarklet(globalThis)`
- create the overlay at start
- scrape books before download work begins
- process books sequentially so progress counts stay deterministic
- record per-book failures and continue
- remove the overlay on successful download
- show error details and dismiss UI when the overall export cannot finish

In `.brainstorm/build-report.yaml`:
- mark each story with its final status
- include the commit hashes created during implementation

- [ ] **Step 4: Run full verification**

Run: `npm test`
Expected: PASS

Run: `npm run build`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/bookmarklet.js scripts/build.mjs index.html tests/story-001-installation-page.test.mjs tests/story-003-annotations.test.mjs tests/story-005-zip-export.test.mjs tests/story-006-progress-overlay.test.mjs .brainstorm/build-report.yaml
git commit -m "[story-006-progress-indicator-during-export] wire bookmarklet export flow"
```

## Final Verification Checklist

- [ ] Run `npm test`
- [ ] Run `npm run build`
- [ ] Open `index.html` in a browser and verify the bookmarklet anchor is draggable and uses a `javascript:` `href`
- [ ] Re-read each story card and confirm every acceptance criterion is covered by code or explicit build-report notes
- [ ] Fill in `.brainstorm/build-report.yaml` with final statuses and commit hashes
