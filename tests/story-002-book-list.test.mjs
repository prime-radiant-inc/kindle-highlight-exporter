import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

import { JSDOM } from "jsdom";
import * as bookmarklet from "../src/bookmarklet.js";

const fixturePath = path.join(import.meta.dirname, "fixtures", "notebook-library.html");

test("scrapeBookList reads the visible Kindle Notebook cards", () => {
  const html = readFileSync(fixturePath, "utf8");
  const document = new JSDOM(html).window.document;

  assert.equal(typeof bookmarklet.scrapeBookList, "function");
  assert.deepEqual(bookmarklet.scrapeBookList(document), [
    {
      asin: "B07VRS84D1",
      title: "The Pragmatic Programmer",
      author: "David Thomas, Andrew Hunt",
      lastAnnotated: "2024-11-03"
    },
    {
      asin: "B08DMXZMB3",
      title: "Deep Work",
      author: "Cal Newport",
      lastAnnotated: "2024-09-14"
    }
  ]);
});
