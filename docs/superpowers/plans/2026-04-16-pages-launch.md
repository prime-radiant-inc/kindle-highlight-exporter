# Kindle Highlight Exporter Pages Launch Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Launch the Kindle highlight exporter as a public Apache-2.0 Prime Radiant project with a branded GitHub Pages site at `highlights.primeradiant.com`, while fixing the remaining export-quality issues found in a real archive.

**Architecture:** Keep the existing single-page static build and bookmarklet runtime. Tighten export behavior with small targeted changes in `src/bookmarklet.js`, add regression tests first, then add repository metadata and a GitHub Pages workflow so this same repository can build and deploy the public install page.

**Tech Stack:** Node.js, plain ES modules, static HTML/CSS, GitHub Pages, GitHub Actions, JSDOM tests

---

## Chunk 1: Export Polish

### Task 1: Add failing tests for launch polish

**Files:**
- Modify: `tests/story-004-markdown.test.mjs`
- Modify: `tests/story-005-zip-export.test.mjs`

- [ ] **Step 1: Write a failing test for note-only annotations**

Add a test in `tests/story-004-markdown.test.mjs` that builds a book with one annotation containing `note` but no `highlight`, then asserts the markdown contains `<note>` content and does not contain an empty `<highlight>` block.

- [ ] **Step 2: Run the targeted markdown tests to verify failure**

Run: `node --test tests/story-004-markdown.test.mjs`
Expected: FAIL because the current formatter emits an empty highlight block.

- [ ] **Step 3: Write a failing test for empty books being skipped from the ZIP**

Add a test in `tests/story-005-zip-export.test.mjs` that passes one book with zero annotations and one normal book into `downloadZip`, then asserts only the annotated book is written into the fake ZIP.

- [ ] **Step 4: Run the targeted ZIP tests to verify failure**

Run: `node --test tests/story-005-zip-export.test.mjs`
Expected: FAIL because the current ZIP writer includes every book.

- [ ] **Step 5: Write a failing test for stable Unicode author path normalization**

Add a test in `tests/story-005-zip-export.test.mjs` that uses an author name with accents such as `China Miéville` and asserts the generated ZIP path uses the normalized accented spelling, not a decomposed variant.

- [ ] **Step 6: Run the targeted ZIP tests again**

Run: `node --test tests/story-005-zip-export.test.mjs`
Expected: FAIL if the current path sanitizer preserves decomposed forms.

- [ ] **Step 7: Commit the red tests**

```bash
git add tests/story-004-markdown.test.mjs tests/story-005-zip-export.test.mjs
git commit -m "test: cover launch export edge cases"
```

### Task 2: Implement the minimal export fixes

**Files:**
- Modify: `src/bookmarklet.js`
- Test: `tests/story-004-markdown.test.mjs`
- Test: `tests/story-005-zip-export.test.mjs`

- [ ] **Step 1: Update markdown rendering to omit empty highlight blocks**

Adjust the markdown builder so annotation sections only include `<highlight>` when `annotation.highlight` is non-empty, while preserving `<note>` output for note-only annotations.

- [ ] **Step 2: Update ZIP generation to skip books with no annotations**

Filter out books where `book.annotations.length === 0` before creating markdown files and ZIP entries.

- [ ] **Step 3: Normalize path segments before sanitization**

Update the path-segment sanitizer to normalize values into NFC before applying the existing path-safety cleanup.

- [ ] **Step 4: Run the targeted tests**

Run: `node --test tests/story-004-markdown.test.mjs tests/story-005-zip-export.test.mjs`
Expected: PASS

- [ ] **Step 5: Run the full test suite**

Run: `npm test`
Expected: PASS

- [ ] **Step 6: Commit the green export fixes**

```bash
git add src/bookmarklet.js tests/story-004-markdown.test.mjs tests/story-005-zip-export.test.mjs
git commit -m "fix: polish exported markdown and zip paths"
```

## Chunk 2: Public Project Metadata

### Task 3: Make the repository ready for public release

**Files:**
- Create: `LICENSE`
- Create: `README.md`
- Modify: `package.json`

- [ ] **Step 1: Add the Apache-2.0 license**

Create `LICENSE` with the standard Apache License 2.0 text and ensure the copyright header references `2026 Prime Radiant`.

- [ ] **Step 2: Add a public README**

Write `README.md` covering purpose, install flow, export shape, local development commands, and the privacy model of the bookmarklet.

- [ ] **Step 3: Update package metadata for public release**

Set `private` to `false` in `package.json`.

- [ ] **Step 4: Run tests to make sure docs/metadata changes didn’t disturb the build**

Run: `npm test`
Expected: PASS

- [ ] **Step 5: Commit the public metadata**

```bash
git add LICENSE README.md package.json
git commit -m "docs: prepare public project metadata"
```

## Chunk 3: Prime Radiant Branded Install Page

### Task 4: Add failing installation-page tests for the branded site

**Files:**
- Modify: `tests/story-001-installation-page.test.mjs`

- [ ] **Step 1: Add assertions for Prime Radiant branding**

Extend the installation-page test to assert the generated HTML includes Prime Radiant branding copy, brand asset references, and the updated public-release text.

- [ ] **Step 2: Run the installation-page tests to verify failure**

Run: `node --test tests/story-001-installation-page.test.mjs`
Expected: FAIL because the current page still uses the old Clippings branding.

- [ ] **Step 3: Commit the red branding tests**

```bash
git add tests/story-001-installation-page.test.mjs
git commit -m "test: cover branded install page"
```

### Task 5: Implement the branded static site

**Files:**
- Modify: `src/index.template.html`
- Create: `static/brand/logo-horizontal.png`
- Create: `static/brand/favicon.svg`
- Modify: `scripts/build.mjs`
- Test: `tests/story-001-installation-page.test.mjs`

- [ ] **Step 1: Copy the required Prime Radiant assets into this repo**

Bring over the logo and favicon from the corporate site into a local `static/brand/` folder.

- [ ] **Step 2: Update the build so the Pages artifact includes static assets**

Extend `scripts/build.mjs` so it still generates `index.html` and also copies required static assets into the published output.

- [ ] **Step 3: Re-skin the install page template**

Update `src/index.template.html` to use the Prime Radiant visual system while preserving the bookmarklet install flow and markdown sample.

- [ ] **Step 4: Run the installation-page tests**

Run: `node --test tests/story-001-installation-page.test.mjs`
Expected: PASS

- [ ] **Step 5: Run the full suite and rebuild**

Run: `npm test && npm run build`
Expected: PASS

- [ ] **Step 6: Commit the branded site**

```bash
git add src/index.template.html scripts/build.mjs static/brand tests/story-001-installation-page.test.mjs index.html
git commit -m "feat: brand the install page for prime radiant"
```

## Chunk 4: GitHub Pages And Launch Wiring

### Task 6: Add GitHub Pages workflow and custom-domain artifact support

**Files:**
- Create: `.github/workflows/deploy-pages.yml`
- Create: `CNAME`
- Modify: `scripts/build.mjs`

- [ ] **Step 1: Add a GitHub Pages Actions workflow**

Create `.github/workflows/deploy-pages.yml` that:
- runs on pushes to the default branch and `workflow_dispatch`
- uses `actions/checkout`
- uses `actions/configure-pages`
- runs `npm ci`
- runs `npm test`
- runs `npm run build`
- uploads the static artifact with `actions/upload-pages-artifact`
- deploys with `actions/deploy-pages`

- [ ] **Step 2: Add a `CNAME` file for the published artifact**

Create a root `CNAME` file containing `highlights.primeradiant.com` and make sure the build output preserves it.

- [ ] **Step 3: Run the full verification locally**

Run: `npm test && npm run build`
Expected: PASS

- [ ] **Step 4: Commit the Pages workflow**

```bash
git add .github/workflows/deploy-pages.yml CNAME scripts/build.mjs index.html
git commit -m "build: add github pages deployment"
```

### Task 7: Publish the repository and push the launch branch

**Files:**
- No file changes required

- [ ] **Step 1: Create the public GitHub repository if it does not already exist**

Run a `gh repo create` command for `prime-radiant-inc/kindle-highlight-exporter` with public visibility.

- [ ] **Step 2: Add the remote and push the current branch to the default branch**

Push the current work to `origin/main` and set upstream tracking.

- [ ] **Step 3: Configure the repository Pages source to GitHub Actions**

Use GitHub settings or the API so the repo publishes via GitHub Actions.

- [ ] **Step 4: Set the repository Pages custom domain**

Configure the repo to use `highlights.primeradiant.com`.

- [ ] **Step 5: Verify the deployment run**

Confirm the Pages workflow starts from the pushed default branch and produces a Pages deployment.

## Chunk 5: Final Verification

### Task 8: Verify the live launch end to end

**Files:**
- No file changes required

- [ ] **Step 1: Run the full local verification one more time**

Run: `npm test && npm run build`
Expected: PASS

- [ ] **Step 2: Inspect a fresh live export ZIP**

Run the bookmarklet from the latest built site, export a fresh archive, and confirm:
- books with no annotations are absent
- note-only annotations render without empty highlight blocks
- author folder names look clean

- [ ] **Step 3: Check the live site**

Confirm `https://highlights.primeradiant.com` serves the branded install page and that the bookmarklet link is present and draggable.

- [ ] **Step 4: Report any remaining manual GitHub/DNS steps**

If certificate issuance or HTTPS enforcement is still pending, list the exact remaining settings.
