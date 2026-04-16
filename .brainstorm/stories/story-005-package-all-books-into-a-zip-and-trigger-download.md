---
id: story-005
title: Package all books into a zip and trigger download
status: ready
tags: export, zip, core
areaId: 651a43b4-56c0-400d-ad3e-969121fc11c0
---


As a user, I want all generated markdown files bundled into a single zip file that downloads automatically so that I get everything in one action.

## Acceptance Criteria
- Zip file is named kindle-highlights-YYYY-MM-DD.zip using the export date
- Zip contains one .md file per book at the root level (no subdirectories)
- Download is triggered automatically via a programmatically created anchor element with the download attribute
- Zip generation uses JSZip loaded dynamically by the bookmarklet (no pre-installed dependency)
