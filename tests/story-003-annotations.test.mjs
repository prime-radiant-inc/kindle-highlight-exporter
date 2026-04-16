import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

import { JSDOM } from "jsdom";
import * as bookmarklet from "../src/bookmarklet.js";

const fixtureDirectory = path.join(import.meta.dirname, "fixtures");
const pageOneHtml = readFileSync(path.join(fixtureDirectory, "notebook-annotations-page-1.html"), "utf8");
const pageTwoHtml = readFileSync(path.join(fixtureDirectory, "notebook-annotations-page-2.html"), "utf8");

function createDocument() {
  return new JSDOM("<!DOCTYPE html><html><body></body></html>").window.document;
}

test("parseAnnotationPage extracts annotations and next-page state", () => {
  const document = createDocument();

  assert.equal(typeof bookmarklet.parseAnnotationPage, "function");

  assert.deepEqual(bookmarklet.parseAnnotationPage(pageOneHtml, document), {
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
    ],
    nextToken: "TOKEN_2",
    contentLimitState: "STATE_2"
  });
});

test("scrapeAnnotationsByBook paginates one book and records failures for another", async () => {
  const document = createDocument();
  const overlayUpdates = [];
  const fetchCalls = [];

  assert.equal(typeof bookmarklet.scrapeAnnotationsByBook, "function");

  const result = await bookmarklet.scrapeAnnotationsByBook(
    [
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
    ],
    {
      document,
      fetchImpl: async (url, options) => {
        fetchCalls.push({ url, options });

        const parsedUrl = new URL(url);
        const asin = parsedUrl.searchParams.get("asin");
        const token = parsedUrl.searchParams.get("token");

        if (asin === "B07VRS84D1" && token === "") {
          return new Response(pageOneHtml, { status: 200 });
        }

        if (asin === "B07VRS84D1" && token === "TOKEN_2") {
          return new Response(pageTwoHtml, { status: 200 });
        }

        throw new Error("Request failed");
      },
      overlay: {
        update(message, completed, total) {
          overlayUpdates.push({ message, completed, total });
        }
      }
    }
  );

  assert.equal(fetchCalls[0].options.credentials, "include");
  assert.equal(fetchCalls[1].options.credentials, "include");
  assert.deepEqual(result.books, [
    {
      asin: "B07VRS84D1",
      title: "The Pragmatic Programmer",
      author: "David Thomas, Andrew Hunt",
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
        },
        {
          highlight: "Program close to the problem domain.",
          location: "812",
          page: "74",
          added: "2024-11-04"
        }
      ]
    }
  ]);
  assert.deepEqual(result.errors, [
    {
      asin: "B08DMXZMB3",
      title: "Deep Work",
      message: "Request failed"
    }
  ]);
  assert.deepEqual(overlayUpdates, [
    {
      message: "Processed 1 of 2 books",
      completed: 1,
      total: 2
    },
    {
      message: "Processed 2 of 2 books",
      completed: 2,
      total: 2
    }
  ]);
});
