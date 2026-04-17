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

test("discoverBooks ignores trailing empty library tokens and follows the last actionable token", async () => {
  const html = readFileSync(fixturePath, "utf8");
  const pageTwoHtml = readFileSync(pageTwoFixturePath, "utf8");
  const document = new JSDOM(html).window.document;
  const library = document.querySelector("#kp-notebook-library");
  const fetchCalls = [];

  library.insertAdjacentHTML(
    "beforeend",
    [
      '<input type="hidden" class="kp-notebook-library-next-page-start" value="TOKEN_2">',
      '<input type="hidden" class="kp-notebook-library-next-page-start" value="">'
    ].join("")
  );

  const books = await bookmarklet.discoverBooks({
    document,
    fetchImpl: async (url) => {
      fetchCalls.push(url);
      return new Response(pageTwoHtml, { status: 200 });
    }
  });

  assert.equal(fetchCalls.length, 1);
  assert.match(fetchCalls[0], /token=TOKEN_2/);
  assert.equal(books.length, 3);
});

test("discoverBooks waits for the library pane to hydrate before locking the export count", async () => {
  const firstBookHtml = [
    '<div id="B07VRS84D1" class="kp-notebook-library-each-book">',
    '<h2 class="kp-notebook-searchable">The Pragmatic Programmer</h2>',
    '<p class="kp-notebook-searchable">By: David Thomas, Andrew Hunt</p>',
    '<input type="hidden" id="kp-notebook-annotated-date-B07VRS84D1" value="2024-11-03">',
    "</div>"
  ].join("");
  const secondBookHtml = [
    '<div id="B08DMXZMB3" class="kp-notebook-library-each-book">',
    '<h2 class="kp-notebook-searchable">Deep Work</h2>',
    '<p class="kp-notebook-searchable">By: Cal Newport</p>',
    '<input type="hidden" id="kp-notebook-annotated-date-B08DMXZMB3" value="2024-09-14">',
    "</div>"
  ].join("");
  const document = new JSDOM(
    [
      "<!DOCTYPE html>",
      "<html><body>",
      '<div id="library-section"><div class="a-scroller kp-notebook-scroller-addon a-scroller-vertical"></div></div>',
      `<div id="kp-notebook-library">${firstBookHtml}</div>`,
      "</body></html>"
    ].join("")
  ).window.document;
  const scroller = document.querySelector("#library-section .a-scroller");
  const library = document.querySelector("#kp-notebook-library");
  let injected = false;

  Object.defineProperty(scroller, "scrollHeight", {
    configurable: true,
    get() {
      return 100;
    }
  });

  Object.defineProperty(scroller, "scrollTop", {
    configurable: true,
    get() {
      return injected ? 100 : 0;
    },
    set(value) {
      if (!injected && value === 100) {
        injected = true;
        library.insertAdjacentHTML("beforeend", secondBookHtml);
      }
    }
  });

  const books = await bookmarklet.discoverBooks({
    document,
    fetchImpl: async () => {
      throw new Error("discoverBooks should not fetch pagination for this hydration test");
    },
    waitImpl: async () => {}
  });

  assert.equal(books.length, 2);
  assert.deepEqual(
    books.map((book) => book.title),
    ["The Pragmatic Programmer", "Deep Work"]
  );
});
