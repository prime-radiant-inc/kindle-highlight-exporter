# Full Library Discovery Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Export all Kindle notebook books by following the live library pagination endpoint and write markdown files to `kindle-highlights/<author>/` inside the ZIP archive.

**Architecture:** Extend the bookmarklet's book-discovery phase to merge the initially rendered cards with additional paginated library fragments fetched from `/notebook?library=list&token=...`. Keep markdown generation simple, but move path computation into helpers that can produce author-folder ZIP paths and avoid filename collisions.

**Tech Stack:** Node.js, native test runner, JSDOM, browser bookmarklet runtime, JSZip

---

## Chunk 1: Book Discovery

### Task 1: Add failing tests for paginated library discovery

**Files:**
- Modify: `tests/story-002-book-list.test.mjs`
- Create: `tests/fixtures/notebook-library-page-2.html`

- [ ] **Step 1: Write the failing tests**

Add tests that verify:
- the first page of library cards is parsed from the DOM
- the next-page token is discovered from the DOM or fetched fragment
- additional cards from fetched fragments are appended
- duplicate ASINs are ignored

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/story-002-book-list.test.mjs`
Expected: FAIL because the current code only reads the visible DOM cards.

- [ ] **Step 3: Write minimal implementation**

Modify `src/bookmarklet.js` to:
- extract book card parsing into a reusable helper
- parse library fragments returned by `/notebook?library=list&token=...`
- add a full discovery function that follows next-page tokens and de-duplicates by ASIN

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/story-002-book-list.test.mjs`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tests/fixtures/notebook-library-page-2.html tests/story-002-book-list.test.mjs src/bookmarklet.js
git commit -m "feat: paginate kindle library discovery"
```

## Chunk 2: ZIP Paths

### Task 2: Add failing tests for author-folder ZIP paths

**Files:**
- Modify: `tests/story-004-markdown.test.mjs`
- Modify: `tests/story-005-zip-export.test.mjs`

- [ ] **Step 1: Write the failing tests**

Add tests that verify:
- a markdown export path includes `kindle-highlights/<author>/`
- a blank author uses `Unknown Author`
- duplicate titles under the same author gain an ASIN suffix

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/story-004-markdown.test.mjs tests/story-005-zip-export.test.mjs`
Expected: FAIL because files are currently written at the ZIP root.

- [ ] **Step 3: Write minimal implementation**

Modify `src/bookmarklet.js` to:
- add path sanitization helpers
- compute unique ZIP paths before writing files
- keep markdown content generation unchanged except for metadata normalization needed by the tests

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/story-004-markdown.test.mjs tests/story-005-zip-export.test.mjs`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tests/story-004-markdown.test.mjs tests/story-005-zip-export.test.mjs src/bookmarklet.js
git commit -m "feat: organize exports by author in zip"
```

## Chunk 3: End-to-End Wiring

### Task 3: Wire full discovery into the bookmarklet flow

**Files:**
- Modify: `tests/story-006-progress-overlay.test.mjs`
- Modify: `src/bookmarklet.js`

- [ ] **Step 1: Write the failing tests**

Extend the bookmarklet integration test so it:
- serves both annotation pages and paginated library fragments
- confirms all discovered books are exported
- confirms the ZIP file names use author folders

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/story-006-progress-overlay.test.mjs`
Expected: FAIL because `runClippingsBookmarklet` still uses the DOM-only discovery path.

- [ ] **Step 3: Write minimal implementation**

Update `runClippingsBookmarklet` to use the full discovery helper before applying any optional dev cap.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/story-006-progress-overlay.test.mjs`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tests/story-006-progress-overlay.test.mjs src/bookmarklet.js
git commit -m "feat: use full library discovery in bookmarklet flow"
```

## Chunk 4: Final Verification

### Task 4: Rebuild and run the full suite

**Files:**
- Modify: `scripts/build.mjs` only if tests prove it is necessary
- Verify: `index.html`

- [ ] **Step 1: Run the full test suite**

Run: `npm test`
Expected: PASS

- [ ] **Step 2: Run the build**

Run: `npm run build`
Expected: PASS and regenerate `index.html`

- [ ] **Step 3: Inspect git status**

Run: `git status --short`
Expected: only the intended docs, tests, source, and generated `index.html` changes remain.

- [ ] **Step 4: Commit the verified finish state**

```bash
git add docs/superpowers/specs/2026-04-16-full-library-discovery-design.md docs/superpowers/plans/2026-04-16-full-library-discovery.md src/bookmarklet.js tests/fixtures/notebook-library-page-2.html tests/story-002-book-list.test.mjs tests/story-004-markdown.test.mjs tests/story-005-zip-export.test.mjs tests/story-006-progress-overlay.test.mjs index.html
git commit -m "feat: export full kindle library by author"
```
