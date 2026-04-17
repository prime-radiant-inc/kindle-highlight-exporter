import assert from "node:assert/strict";
import test from "node:test";

import { JSDOM } from "jsdom";
import * as bookmarklet from "../src/bookmarklet.js";

test("loadJsZip injects the CDN script once and resolves the constructor", async () => {
  const window = new JSDOM("<!DOCTYPE html><html><head></head><body></body></html>").window;
  const { document } = window;

  assert.equal(typeof bookmarklet.loadJsZip, "function");

  const firstPromise = bookmarklet.loadJsZip(document, window);
  const script = document.querySelector("script");

  assert.equal(script?.src, "https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js");
  assert.equal(document.querySelectorAll("script").length, 1);

  const secondPromise = bookmarklet.loadJsZip(document, window);
  assert.equal(document.querySelectorAll("script").length, 1);

  class FakeJsZip {}

  window.JSZip = FakeJsZip;
  script.dispatchEvent(new window.Event("load"));

  assert.equal(await firstPromise, FakeJsZip);
  assert.equal(await secondPromise, FakeJsZip);
});

test("downloadZip writes markdown files under kindle-highlights author folders and triggers download", async () => {
  const window = new JSDOM("<!DOCTYPE html><html><body></body></html>").window;
  const { document } = window;
  const clicks = [];
  const createObjectUrlCalls = [];
  const revokeObjectUrlCalls = [];

  assert.equal(typeof bookmarklet.downloadZip, "function");

  class FakeJsZip {
    static instances = [];

    constructor() {
      this.files = [];
      FakeJsZip.instances.push(this);
    }

    file(name, content) {
      this.files.push({ name, content });
    }

    async generateAsync(options) {
      assert.deepEqual(options, { type: "blob" });
      return new Blob(["zip"]);
    }
  }

  window.HTMLAnchorElement.prototype.click = function click() {
    clicks.push({
      href: this.href,
      download: this.download
    });
  };

  await bookmarklet.downloadZip(
    [
      {
        title: "The Pragmatic Programmer",
        author: "David Thomas, Andrew Hunt",
        asin: "B07VRS84D1",
        lastAnnotated: "2024-11-03",
        annotations: [
          {
            highlight: "Care about your craft.",
            location: "312",
            added: "2024-10-15"
          }
        ]
      },
      {
        title: "Deep Work",
        author: "Cal Newport",
        asin: "B08DMXZMB3",
        lastAnnotated: "2024-09-14",
        annotations: []
      }
    ],
    {
      document,
      exportDate: new Date("2026-04-16T12:00:00Z"),
      jszipCtor: FakeJsZip,
      urlApi: {
        createObjectURL(blob) {
          createObjectUrlCalls.push(blob);
          return "blob:clippings";
        },
        revokeObjectURL(url) {
          revokeObjectUrlCalls.push(url);
        }
      }
    }
  );

  assert.deepEqual(
    FakeJsZip.instances[0].files.map((file) => file.name),
    [
      "kindle-highlights/David Thomas, Andrew Hunt/the-pragmatic-programmer.md",
      "kindle-highlights/Cal Newport/deep-work.md"
    ]
  );
  assert.equal(clicks[0].download, "kindle-highlights-2026-04-16.zip");
  assert.equal(clicks[0].href, "blob:clippings");
  assert.equal(createObjectUrlCalls.length, 1);
  assert.deepEqual(revokeObjectUrlCalls, ["blob:clippings"]);
});

test("downloadZip falls back to Unknown Author and appends the ASIN when file paths collide", async () => {
  const window = new JSDOM("<!DOCTYPE html><html><body></body></html>").window;
  const { document } = window;

  class FakeJsZip {
    static instances = [];

    constructor() {
      this.files = [];
      FakeJsZip.instances.push(this);
    }

    file(name, content) {
      this.files.push({ name, content });
    }

    async generateAsync() {
      return new Blob(["zip"]);
    }
  }

  await bookmarklet.downloadZip(
    [
      {
        title: "Shared Title",
        author: "Shared Author",
        asin: "B000000001",
        annotations: []
      },
      {
        title: "Shared Title",
        author: "Shared Author",
        asin: "B000000002",
        annotations: []
      },
      {
        title: "Untitled Notes",
        author: "",
        asin: "B000000003",
        annotations: []
      }
    ],
    {
      document,
      exportDate: new Date("2026-04-16T12:00:00Z"),
      jszipCtor: FakeJsZip,
      urlApi: {
        createObjectURL() {
          return "blob:clippings";
        },
        revokeObjectURL() {}
      }
    }
  );

  assert.deepEqual(
    FakeJsZip.instances[0].files.map((file) => file.name),
    [
      "kindle-highlights/Shared Author/shared-title.md",
      "kindle-highlights/Shared Author/shared-title-B000000002.md",
      "kindle-highlights/Unknown Author/untitled-notes.md"
    ]
  );
});
