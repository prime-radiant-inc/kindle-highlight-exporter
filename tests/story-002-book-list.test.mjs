import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

import { JSDOM } from "jsdom";
import * as bookmarklet from "../src/bookmarklet.js";

const fixturePath = path.join(import.meta.dirname, "fixtures", "notebook-library.html");
const pageTwoFixturePath = path.join(import.meta.dirname, "fixtures", "notebook-library-page-2.html");

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

test("discoverBooks follows paginated Kindle library fragments and de-duplicates ASINs", async () => {
  const html = readFileSync(fixturePath, "utf8");
  const pageTwoHtml = readFileSync(pageTwoFixturePath, "utf8");
  const document = new JSDOM(html).window.document;
  const library = document.querySelector("#kp-notebook-library");
  const fetchCalls = [];

  library.insertAdjacentHTML(
    "beforeend",
    '<input type="hidden" class="kp-notebook-library-next-page-start" value="TOKEN_2">'
  );

  assert.equal(typeof bookmarklet.discoverBooks, "function");

  const books = await bookmarklet.discoverBooks({
    document,
    fetchImpl: async (url, options) => {
      fetchCalls.push({ url, options });
      const parsedUrl = new URL(url);

      assert.equal(parsedUrl.searchParams.get("library"), "list");
      assert.equal(parsedUrl.searchParams.get("token"), "TOKEN_2");
      assert.deepEqual(options, {
        credentials: "include"
      });

      return new Response(pageTwoHtml, { status: 200 });
    }
  });

  assert.deepEqual(fetchCalls.length, 1);
  assert.deepEqual(books, [
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
    },
    {
      asin: "B09VCR9Q12",
      title: "Working in Public",
      author: "Nadia Eghbal",
      lastAnnotated: "2024-07-25"
    }
  ]);
});
