---
id: story-004
title: Generate markdown file per book
status: ready
tags: markdown, export, core
areaId: 651a43b4-56c0-400d-ad3e-969121fc11c0
---

As a user, I want each book's highlights exported as a markdown file matching the approved format so that I get readable, portable annotation files.

## Acceptance Criteria
- Each book produces one .md file named using the book title, slugified (lowercase, spaces replaced with hyphens, special characters removed)
- File begins with an H1 heading containing the book title
- Header block contains plain key-value lines for: author, asin, last_annotated (YYYY-MM-DD), highlights count, notes count
- Each annotation entry is preceded by a metadata line in the format: 'location: NNN | page: NN | added: YYYY-MM-DD' (page omitted if unavailable)
- Highlight text is wrapped in <highlight>...</highlight> tags on their own lines
- If a highlight has an attached note, the note text immediately follows wrapped in <note>...</note> tags on their own lines
- Annotations are separated by horizontal rules (---)
- Missing metadata fields are omitted entirely rather than rendered as empty or 'N/A'
