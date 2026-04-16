---
id: story-003
title: Scrape highlights and notes per book
status: ready
tags: scraping, kindle, core
notes: null
areaId: 27355d6b-0f90-45a1-a16d-f71abd08f76d
---

As a user, I want the bookmarklet to extract all highlights and notes for each book so that my exported files contain complete annotation data with full metadata.

## Acceptance Criteria
- For each ASIN, fetches https://read.amazon.com/notebook?asin={ASIN}&contentLimitState={state}&token={token} with credentials: 'include'
- Parsed HTML fragment is injected into a temporary detached div element for DOM querying
- All highlight rows are selected via #kp-notebook-annotations > .a-row.a-spacing-base
- Highlight text is extracted from the element with id='highlight' via textContent.trim()
- Note text is extracted from the element with id='note' via textContent.trim(); omitted if empty
- Location and page number are parsed from the text of #annotationHighlightHeader or #annotationNoteHeader by splitting on ' | '
- Date added is parsed from the header text (format: 'Added on [weekday] [Month] [D], [YYYY]') and converted to YYYY-MM-DD
- Pagination is handled by reading .kp-notebook-annotations-next-page-start input value as the next token and .kp-notebook-content-limit-state input value as the next contentLimitState; fetching continues until the next page token is absent or empty
- If a fetch fails for a book, that book is skipped and the error is recorded; remaining books continue processing
- Progress indicator is updated after each book completes (see story-006)
