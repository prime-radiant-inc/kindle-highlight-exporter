# Kindle Highlight Exporter Pages Launch Design

## Goal

Launch the Kindle highlight exporter as a public Prime Radiant project with a branded static install page at `highlights.primeradiant.com`, backed by GitHub Pages, while tightening a few export-quality issues that showed up during manual testing.

## Release Constraints

- Source repository name: `prime-radiant-inc/kindle-highlight-exporter`
- Repository visibility: public
- Site hostname: `highlights.primeradiant.com`
- License: Apache-2.0
- Copyright notice: `Copyright 2026 Prime Radiant`

The repository name does not need to match the public hostname. GitHub Pages custom domains are configured independently from repository names, so the source repo can remain `kindle-highlight-exporter` while the published site uses `highlights.primeradiant.com`.

Prime Radiant already serves `www.primeradiant.com` from GitHub Pages. That is compatible with this launch. The exporter repo just needs its own repository-level custom domain set to `highlights.primeradiant.com` so it overrides any inherited default project-site domain behavior from the organization Pages configuration.

## Approved Architecture

Use the existing repository as both the source of truth and the GitHub Pages publishing source.

The current site is already a small static build:

- `src/index.template.html` contains the install-page template
- `src/bookmarklet.js` contains the bookmarklet runtime
- `scripts/build.mjs` generates the final `index.html`

That is the right level of complexity for this product. No framework, bundler, or secondary deployment repository is needed.

The deployment model will be:

1. Keep `prime-radiant-inc/kindle-highlight-exporter` as the canonical public repo.
2. Add a GitHub Pages Actions workflow in this repo.
3. On pushes to the default branch, run tests and build the static page.
4. Deploy the generated site artifact to GitHub Pages.
5. Configure the repo custom domain as `highlights.primeradiant.com`.

This keeps the release path simple and avoids unnecessary cross-repository mirroring or `gh-pages` branch management.

## Site Design

The install page should adopt Prime Radiant branding while preserving the current focused product flow.

### Visual Direction

Reuse the existing Prime Radiant visual system rather than inventing a second one:

- Merriweather Sans
- dark cosmos background treatment
- teal accent palette
- Prime Radiant logo and favicon assets

The page should still read as a lightweight product landing page, not a copy of the full corporate homepage. It needs to do one job well:

1. explain what the bookmarklet does
2. make the bookmarklet easy to drag
3. show the few manual steps clearly
4. reassure the user about the output shape

### Asset Strategy

Copy the required brand assets into this repository rather than referencing assets from `primeradiant.com` at runtime.

That keeps GitHub Pages deployment self-contained and avoids coupling the install page to another site remaining live and unchanged.

## Export Polish Required Before Launch

Manual inspection of a real export archive found three quality issues worth fixing before public release.

### 1. Empty Book Files

Some exported books currently produce markdown files with:

- `highlights: 0`
- `notes: 0`

These files add clutter and do not represent user-visible content. The exporter should skip writing book files when a book has no annotations after scraping.

### 2. Note-Only Annotations

Some note-only entries currently render as:

```text
<highlight>
</highlight>
<note>
...
</note>
```

That is semantically wrong and makes downstream processing messy. The exporter should omit empty highlight blocks and emit only the note block for note-only annotations.

### 3. Path Normalization

Author folder names with accents are currently landing in decomposed Unicode forms. That is valid Unicode, but it is ugly and inconsistent across archive viewers and filesystems. Author path segments should be normalized into a cleaner, stable form before ZIP paths are generated.

The current sanitization behavior should remain conservative about path safety. The change is about representation quality, not broadening the allowed character set.

## Repository Metadata

Before launch, the repository should include:

- an Apache-2.0 license file
- a README suitable for a public project
- explicit Prime Radiant copyright language where appropriate

The README should explain:

- what the tool does
- how to install the bookmarklet
- what the export format looks like
- the privacy/security model at a high level
- how to develop and test locally

## GitHub Pages Deployment

The Pages workflow should:

1. trigger on pushes to the default branch and manual dispatch
2. install dependencies with `npm ci`
3. run `npm test`
4. run `npm run build`
5. upload the built static site as the Pages artifact
6. deploy with the standard GitHub Pages deploy action

The repo Pages settings should use GitHub Actions as the publishing source.

## DNS And Domain Setup

For `highlights.primeradiant.com`, DNS should use a subdomain `CNAME`:

- record name: `highlights`
- record value: `prime-radiant-inc.github.io`

At the GitHub side:

1. set the repo custom domain to `highlights.primeradiant.com`
2. verify `primeradiant.com` at the Prime Radiant organization level for GitHub Pages
3. wait for certificate provisioning
4. enable HTTPS enforcement

Domain verification is important because it reduces takeover risk for Pages-hosted subdomains.

## Testing And Verification

### Automated

Add regression coverage for:

- skipping books with zero highlights and zero notes
- rendering note-only annotations without empty highlight blocks
- stable author-folder path normalization
- any install-page changes required for branding and public release text

The standard verification commands remain:

- `npm test`
- `npm run build`

### Manual

Before calling the launch ready:

1. run the bookmarklet against a live Kindle Notebook account
2. confirm the export count matches the fully hydrated library
3. inspect a fresh ZIP for correct folder structure and note-only behavior
4. confirm the deployed page loads correctly at `highlights.primeradiant.com`
5. confirm the live bookmarklet still works when copied from the deployed page

## Non-Goals

- No move to a frontend framework
- No separate deployment-only repository
- No hosted backend or account system
- No redesign of the export markdown format beyond the launch polish listed above
- No attempt to expose the exported library through the website itself
