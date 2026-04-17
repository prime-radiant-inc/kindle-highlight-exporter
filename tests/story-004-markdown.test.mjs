import assert from "node:assert/strict";
import test from "node:test";

import * as bookmarklet from "../src/bookmarklet.js";

test("buildMarkdownFile creates a slugged markdown export per book", () => {
  assert.equal(typeof bookmarklet.buildMarkdownFile, "function");

  const file = bookmarklet.buildMarkdownFile({
    title: "The Pragmatic Programmer",
    author: "David Thomas, Andrew Hunt",
    asin: "B07VRS84D1",
    lastAnnotated: "2024-11-03",
    annotations: [
      {
        highlight: "Care about your craft.",
        note: "Core thesis. Revisit when motivation dips.",
        location: "312",
        page: "28",
        added: "2024-10-15"
      },
      {
        highlight: "It's your life. You own it. You create it.",
        location: "540",
        added: "2024-10-17"
      }
    ]
  });

  assert.equal(file.name, "the-pragmatic-programmer.md");
  assert.match(file.content, /^# The Pragmatic Programmer/m);
  assert.match(file.content, /^author: David Thomas, Andrew Hunt$/m);
  assert.match(file.content, /^asin: B07VRS84D1$/m);
  assert.match(file.content, /^last_annotated: 2024-11-03$/m);
  assert.match(file.content, /^highlights: 2$/m);
  assert.match(file.content, /^notes: 1$/m);
  assert.match(file.content, /location: 312 \| page: 28 \| added: 2024-10-15/);
  assert.match(file.content, /location: 540 \| added: 2024-10-17/);
  assert.doesNotMatch(file.content, /location: 540 \| page:/);
  assert.match(file.content, /<highlight>\nCare about your craft\.\n<\/highlight>/);
  assert.match(file.content, /<note>\nCore thesis\. Revisit when motivation dips\.\n<\/note>/);
  assert.equal(file.content.match(/^---$/gm)?.length, 2);
});

test("buildMarkdownFile omits empty highlight blocks for note-only annotations", () => {
  const file = bookmarklet.buildMarkdownFile({
    title: "The Quiet War",
    author: "Paul McAuley",
    asin: "B002Q0W8NE",
    lastAnnotated: "2010-11-05",
    annotations: [
      {
        note: "this is a fragment",
        location: "4246"
      }
    ]
  });

  assert.match(file.content, /^highlights: 0$/m);
  assert.match(file.content, /^notes: 1$/m);
  assert.match(file.content, /location: 4246/);
  assert.match(file.content, /<note>\nthis is a fragment\n<\/note>/);
  assert.doesNotMatch(file.content, /<highlight>\s*<\/highlight>/);
});
