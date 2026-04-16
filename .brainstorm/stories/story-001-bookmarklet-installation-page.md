---
id: story-001
title: Bookmarklet installation page
status: ready
tags: onboarding, bookmarklet, distribution
notes: null
areaId: cedf9b6c-2da2-4841-9c03-f23ff09583d4
---

As a user, I want a simple webpage that explains how to install the bookmarklet so that I can drag it to my bookmark bar and start using it immediately.

## Acceptance Criteria
- Page renders a header with the product name 'Clippings' and tagline 'Kindle highlights to markdown'
- Page contains a draggable anchor element with href containing a javascript: bookmarklet payload, labeled 'Export Kindle Highlights'
- Draggable anchor has the HTML draggable attribute set
- Page contains an ordered set of steps: (2) Open Kindle Notebook with a link to read.amazon.com/notebook, (3) Click the bookmarklet, (4) Download your zip
- Page contains a code sample block showing the faux-XML markdown output format
- Page is a single static HTML file with no external dependencies (all assets inline or from vendored sources)
