---
title: Clippings — Product Vision
---

## Purpose

Clippings is a bookmarklet that exports all of a user's Kindle highlights and notes to local markdown files. The user visits read.amazon.com/notebook, clicks the bookmarklet, and receives a zip file containing one `.md` file per book — with full metadata including author, ASIN, highlight dates, locations, page numbers, and inline notes.

## Problem

Amazon's Kindle Notebook is the canonical place all highlights sync to, but it's a walled garden. There's no export feature, no API, and no guarantee Amazon will keep the service running forever. Readers who annotate heavily have no easy way to get their own data out in a portable, readable format.

## Target User

A voracious Kindle reader who highlights and annotates books regularly and wants a permanent, locally-owned copy of their annotations — ideally in a format that works with tools like Obsidian, Notion, or plain text editors.

## How It Works

1. User visits read.amazon.com/notebook (already logged in to Amazon)
2. User clicks the Clippings bookmarklet in their browser bar
3. The bookmarklet scrapes all books and their highlights/notes from the page
4. A zip file is downloaded containing one `.md` file per book

## Markdown Format

Each file contains:
- Book-level header: title, author, ASIN, last annotated date, highlight count, note count
- One section per highlight with: location, page number (if available), date added, highlight text
- Notes appear inline directly below the highlight they're attached to

## Scope

**In scope for v1:**
- Bookmarklet (no browser extension, no backend)
- Scraping read.amazon.com/notebook DOM
- Zip download of all books at once
- Full metadata extraction where available

**Out of scope for v1:**
- Selective export (choosing specific books)
- Sync / incremental updates
- Integration with Obsidian, Notion, or other tools
- My Clippings.txt parsing
