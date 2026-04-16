---
id: story-002
title: Scrape book list from Kindle Notebook
status: ready
tags: scraping, kindle, core
notes: The book list only shows ~54 books at a time. If the user has more than 54 books, additional books beyond the first 54 will be silently missed. The kindle-library/search JSON API supports pagination but is same-origin only — acceptable for a bookmarklet. V1 will scrape only what's visible in the DOM; pagination is a future improvement.
areaId: 27355d6b-0f90-45a1-a16d-f71abd08f76d
---

As a user, I want the bookmarklet to discover all books in my Kindle Notebook so that every book is included in the export without manual selection.

## Acceptance Criteria
- Bookmarklet queries document.querySelectorAll('#kp-notebook-library > div') to obtain all book card elements
- Each book card's id attribute is extracted as the ASIN
- Book title is extracted from h2.kp-notebook-searchable within each card
- Author is extracted from p.kp-notebook-searchable within each card, with the 'By: ' prefix stripped
- Last annotated date is extracted from the value of the input element matching [id^='kp-notebook-annotated-date'] within each card
- The full list of ASINs is passed to the highlight scraping step (story-003) before any downloads begin
