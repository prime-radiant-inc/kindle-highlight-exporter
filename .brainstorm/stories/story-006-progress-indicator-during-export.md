---
id: story-006
title: Progress indicator during export
status: ready
tags: ux, feedback, bookmarklet
areaId: 651a43b4-56c0-400d-ad3e-969121fc11c0
---


As a user, I want to see progress while the bookmarklet is running so that I know it's working and how far along it is.

## Acceptance Criteria
- A fixed overlay element is injected into the page DOM when the bookmarklet starts
- Overlay displays current status text (e.g. 'Fetching book 3 of 24...')
- Overlay displays a numeric progress count (books completed / total books)
- Overlay is removed from the DOM when the zip download is triggered
- If an error occurs, the overlay displays the error message and a dismiss button

## Implementation Notes
Overlay should feel unobtrusive — semi-transparent dark background, centered card, clean sans-serif type. Progress text updates in place without flickering.
