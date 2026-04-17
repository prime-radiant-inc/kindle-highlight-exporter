function getTextContent(element) {
  return element?.textContent?.trim() ?? "";
}

const MONTHS = {
  January: "01",
  February: "02",
  March: "03",
  April: "04",
  May: "05",
  June: "06",
  July: "07",
  August: "08",
  September: "09",
  October: "10",
  November: "11",
  December: "12"
};
const JSZIP_CDN_URL = "https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js";

function formatIsoDate(monthName, day, year) {
  const month = MONTHS[monthName];
  const paddedDay = day.padStart(2, "0");

  return month ? `${year}-${month}-${paddedDay}` : "";
}

function normalizeNotebookDate(value) {
  const normalizedValue = value?.trim() ?? "";

  if (!normalizedValue) {
    return "";
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalizedValue)) {
    return normalizedValue;
  }

  const match = normalizedValue.match(/^(?:\w+,\s+)?([A-Za-z]+) (\d{1,2}), (\d{4})$/);

  if (!match) {
    return normalizedValue;
  }

  const [, monthName, day, year] = match;

  return formatIsoDate(monthName, day, year) || normalizedValue;
}

function parseAddedDate(headerText) {
  const match = headerText.match(/^Added on (?:\w+\s+)?([A-Za-z]+) (\d{1,2}), (\d{4})$/);

  if (!match) {
    return "";
  }

  const [, monthName, day, year] = match;

  return formatIsoDate(monthName, day, year);
}

function parseAnnotationMetadata(headerText) {
  const metadata = {};

  for (const part of headerText.split("|")) {
    const normalizedPart = part.replace(/\u00a0/g, " ").trim();
    const locationMatch = normalizedPart.match(/^Location:?\s*(.+)$/i);
    const pageMatch = normalizedPart.match(/^Page:?\s*(.+)$/i);

    if (locationMatch) {
      metadata.location = locationMatch[1].trim();
    } else if (pageMatch) {
      metadata.page = pageMatch[1].trim();
    } else if (normalizedPart.startsWith("Added on ")) {
      metadata.added = parseAddedDate(normalizedPart);
    }
  }

  return metadata;
}

function joinPresentLines(lines) {
  return lines.filter(Boolean).join("\n");
}

function getPaginationValue(container, selector) {
  return (
    container.querySelector(`input${selector}`)?.value?.trim() ??
    container.querySelector(`${selector} input`)?.value?.trim() ??
    container.querySelector(selector)?.getAttribute("value")?.trim() ??
    ""
  );
}

function getLastValue(container, selector) {
  const matches = Array.from(container.querySelectorAll(selector));
  const lastMatch = [...matches].reverse().find((match) => {
    const value = match.value?.trim() ?? match.getAttribute("value")?.trim() ?? "";

    return Boolean(value);
  }) ?? matches.at(-1);

  return lastMatch?.value?.trim() ?? lastMatch?.getAttribute("value")?.trim() ?? "";
}

function getBookCards(container) {
  const classCards = container.querySelectorAll(".kp-notebook-library-each-book");

  if (classCards.length > 0) {
    return Array.from(classCards);
  }

  const library = container.querySelector("#kp-notebook-library");

  if (!library) {
    return [];
  }

  return Array.from(library.children).filter((child) => child.matches?.("div"));
}

function getLibraryScroller(document) {
  return document.querySelector("#library-section .a-scroller, #library .a-scroller");
}

function getLibraryHydrationSnapshot(document) {
  const bookIds = getBookCards(document)
    .map((bookCard) => bookCard.id || "")
    .join("\u0000");
  const tokens = Array.from(document.querySelectorAll(".kp-notebook-library-next-page-start"))
    .map((node) => node.value?.trim() ?? node.getAttribute("value")?.trim() ?? "")
    .filter(Boolean)
    .join("\u0000");
  const spinnerDisplay = document.querySelector("#kp-notebook-library-spinner")?.style?.display ?? "";

  return `${bookIds}\u0001${tokens}\u0001${spinnerDisplay}`;
}

async function waitForLibraryToHydrate(document, options) {
  const scroller = getLibraryScroller(document);
  const spinner = document.querySelector("#kp-notebook-library-spinner");

  if (!scroller && !spinner) {
    return;
  }

  const waitImpl =
    options.waitImpl ??
    ((delayMs) => new Promise((resolve) => setTimeout(resolve, delayMs)));
  const pollMs = options.pollMs ?? 500;
  const stablePolls = options.stablePolls ?? 2;
  const maxPolls = options.maxPolls ?? 10;
  let previousSnapshot = getLibraryHydrationSnapshot(document);
  let stableReads = 0;

  for (let pollIndex = 0; pollIndex < maxPolls; pollIndex += 1) {
    if (scroller) {
      scroller.scrollTop = scroller.scrollHeight;

      if (document.defaultView?.Event) {
        scroller.dispatchEvent(new document.defaultView.Event("scroll", { bubbles: true }));
      }
    }

    await waitImpl(pollMs);

    const nextSnapshot = getLibraryHydrationSnapshot(document);

    if (nextSnapshot === previousSnapshot) {
      stableReads += 1;

      if (stableReads >= stablePolls) {
        return;
      }
    } else {
      previousSnapshot = nextSnapshot;
      stableReads = 0;
    }
  }
}

function parseBookCard(bookCard) {
  const authorText = getTextContent(bookCard.querySelector("p.kp-notebook-searchable"));
  const lastAnnotatedInput = bookCard.querySelector("[id^='kp-notebook-annotated-date']");

  return {
    asin: bookCard.id,
    title: getTextContent(bookCard.querySelector("h2.kp-notebook-searchable")),
    author: authorText.replace(/^By:\s*/, ""),
    lastAnnotated: normalizeNotebookDate(lastAnnotatedInput?.value ?? "")
  };
}

function getAnnotationRows(container) {
  const wrappedRows = container.querySelectorAll("#kp-notebook-annotations > .a-row.a-spacing-base");

  if (wrappedRows.length > 0) {
    return Array.from(wrappedRows);
  }

  return Array.from(container.children).filter((child) => child.matches?.(".a-row.a-spacing-base"));
}

export function scrapeBookList(document) {
  return getBookCards(document).map(parseBookCard);
}

function parseLibraryPage(html, document) {
  const container = document.createElement("div");
  container.innerHTML = html;

  return {
    books: scrapeBookList(container),
    nextToken: getLastValue(container, ".kp-notebook-library-next-page-start")
  };
}

function getBookIdentity(book) {
  return book.asin || `${book.title}\u0000${book.author}\u0000${book.lastAnnotated}`;
}

export async function discoverBooks(options) {
  const { document, fetchImpl } = options;
  const booksByIdentity = new Map();
  const seenTokens = new Set();

  const collectBooks = (books) => {
    for (const book of books) {
      const identity = getBookIdentity(book);

      if (!booksByIdentity.has(identity)) {
        booksByIdentity.set(identity, book);
      }
    }
  };

  await waitForLibraryToHydrate(document, options);
  collectBooks(scrapeBookList(document));

  let token = getLastValue(document, ".kp-notebook-library-next-page-start");

  while (token) {
    if (seenTokens.has(token)) {
      throw new Error("Library pagination token repeated");
    }

    seenTokens.add(token);

    const url = new URL("https://read.amazon.com/notebook");
    url.searchParams.set("library", "list");
    url.searchParams.set("token", token);

    const response = await fetchImpl(url.toString(), {
      credentials: "include"
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const page = parseLibraryPage(await response.text(), document);

    collectBooks(page.books);
    token = page.nextToken;
  }

  return Array.from(booksByIdentity.values());
}

export function parseAnnotationPage(html, document) {
  const container = document.createElement("div");
  container.innerHTML = html;

  const annotations = getAnnotationRows(container).map((annotationRow) => {
    const headerText = getTextContent(
      annotationRow.querySelector("#annotationHighlightHeader, #annotationNoteHeader")
    );
    const note = getTextContent(annotationRow.querySelector("#note"));
    const locationInput = annotationRow.querySelector("input[id^='kp-annotation-location']")?.value?.trim();

    return {
      highlight: getTextContent(annotationRow.querySelector("#highlight")),
      ...parseAnnotationMetadata(headerText),
      ...(locationInput ? { location: locationInput } : {}),
      ...(note ? { note } : {})
    };
  });

  return {
    annotations,
    nextToken: getPaginationValue(container, ".kp-notebook-annotations-next-page-start"),
    contentLimitState: getPaginationValue(container, ".kp-notebook-content-limit-state")
  };
}

export async function fetchAnnotationsForBook(book, options) {
  const { document, fetchImpl } = options;
  const annotations = [];
  let token = "";
  let contentLimitState = "";

  do {
    const url = new URL("https://read.amazon.com/notebook");
    url.searchParams.set("asin", book.asin);
    url.searchParams.set("contentLimitState", contentLimitState);
    url.searchParams.set("token", token);

    const response = await fetchImpl(url.toString(), {
      credentials: "include"
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const page = parseAnnotationPage(await response.text(), document);
    annotations.push(...page.annotations);
    token = page.nextToken;
    contentLimitState = page.contentLimitState || contentLimitState;
  } while (token);

  return {
    ...book,
    annotations
  };
}

export async function scrapeAnnotationsByBook(books, options) {
  const { document, fetchImpl, overlay } = options;
  const completeBooks = [];
  const errors = [];

  for (const [index, book] of books.entries()) {
    try {
      completeBooks.push(await fetchAnnotationsForBook(book, { document, fetchImpl }));
    } catch (error) {
      errors.push({
        asin: book.asin,
        title: book.title,
        message: error.message
      });
    }

    const completed = index + 1;
    overlay?.update(`Processed ${completed} of ${books.length} books`, completed, books.length);
  }

  return {
    books: completeBooks,
    errors
  };
}

export function slugifyTitle(title) {
  return title
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function sanitizePathSegment(value) {
  return (value ?? "")
    .normalize("NFC")
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getBookFileName(book) {
  const slug = slugifyTitle(book.title);

  return `${slug || "untitled"}.md`;
}

function buildZipFilePath(book, usedPaths) {
  const authorFolder = sanitizePathSegment(book.author) || "Unknown Author";
  const baseName = getBookFileName(book);
  const basePath = `kindle-highlights/${authorFolder}/${baseName}`;

  if (!usedPaths.has(basePath)) {
    return basePath;
  }

  const slug = baseName.replace(/\.md$/, "");
  const asinSuffix = book.asin ? `-${book.asin}` : "-duplicate";
  let duplicateIndex = 2;
  let candidatePath = `kindle-highlights/${authorFolder}/${slug}${asinSuffix}.md`;

  while (usedPaths.has(candidatePath)) {
    candidatePath = `kindle-highlights/${authorFolder}/${slug}${asinSuffix}-${duplicateIndex}.md`;
    duplicateIndex += 1;
  }

  return candidatePath;
}

export function buildMarkdownFile(book) {
  const highlightsCount = book.annotations.filter((annotation) => annotation.highlight).length;
  const notesCount = book.annotations.filter((annotation) => annotation.note).length;
  const header = joinPresentLines([
    `# ${book.title}`,
    "",
    book.author ? `author: ${book.author}` : "",
    book.asin ? `asin: ${book.asin}` : "",
    book.lastAnnotated ? `last_annotated: ${book.lastAnnotated}` : "",
    `highlights: ${highlightsCount}`,
    `notes: ${notesCount}`
  ]);
  const sections = book.annotations.map((annotation) =>
    joinPresentLines([
      [
        annotation.location ? `location: ${annotation.location}` : "",
        annotation.page ? `page: ${annotation.page}` : "",
        annotation.added ? `added: ${annotation.added}` : ""
      ]
        .filter(Boolean)
        .join(" | "),
      annotation.highlight ? "<highlight>" : "",
      annotation.highlight ?? "",
      annotation.highlight ? "</highlight>" : "",
      annotation.note ? "<note>" : "",
      annotation.note ?? "",
      annotation.note ? "</note>" : ""
    ])
  );

  return {
    name: getBookFileName(book),
    content: [header, ...sections].join("\n\n---\n\n")
  };
}

function formatDateForFileName(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function loadJsZip(document, runtime = globalThis) {
  if (runtime.JSZip) {
    return Promise.resolve(runtime.JSZip);
  }

  if (runtime.__clippingsJsZipPromise) {
    return runtime.__clippingsJsZipPromise;
  }

  runtime.__clippingsJsZipPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = JSZIP_CDN_URL;
    script.async = true;
    script.addEventListener("load", () => {
      if (runtime.JSZip) {
        resolve(runtime.JSZip);
        return;
      }

      delete runtime.__clippingsJsZipPromise;
      reject(new Error("JSZip failed to load"));
    });
    script.addEventListener("error", () => {
      delete runtime.__clippingsJsZipPromise;
      reject(new Error("JSZip failed to load"));
    });
    (document.head || document.body || document.documentElement).append(script);
  });

  return runtime.__clippingsJsZipPromise;
}

export async function downloadZip(books, options) {
  const { document, exportDate = new Date(), jszipCtor, urlApi = URL } = options;
  const jszipClass = jszipCtor ?? (await loadJsZip(document, document.defaultView ?? globalThis));
  const zip = new jszipClass();
  const usedPaths = new Set();

  for (const book of books) {
    if (!book.annotations.length) {
      continue;
    }

    const file = buildMarkdownFile(book);
    const filePath = buildZipFilePath(book, usedPaths);

    usedPaths.add(filePath);
    zip.file(filePath, file.content);
  }

  const blob = await zip.generateAsync({ type: "blob" });
  const downloadUrl = urlApi.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = downloadUrl;
  anchor.download = `kindle-highlights-${formatDateForFileName(exportDate)}.zip`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  urlApi.revokeObjectURL(downloadUrl);
}

export function createProgressOverlay(document) {
  const overlay = document.createElement("div");
  const card = document.createElement("div");
  const status = document.createElement("p");
  const count = document.createElement("p");
  const actions = document.createElement("div");
  const dismissButton = document.createElement("button");

  overlay.dataset.clippingsProgress = "true";
  Object.assign(overlay.style, {
    position: "fixed",
    inset: "0",
    zIndex: "2147483647",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    background: "rgba(17, 24, 39, 0.42)"
  });

  Object.assign(card.style, {
    width: "min(360px, 100%)",
    padding: "20px",
    borderRadius: "16px",
    background: "#111827",
    color: "#f9fafb",
    boxShadow: "0 24px 60px rgba(15, 23, 42, 0.4)",
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
  });

  Object.assign(status.style, {
    margin: "0",
    fontSize: "16px",
    fontWeight: "600"
  });

  Object.assign(count.style, {
    margin: "12px 0 0",
    fontSize: "14px",
    color: "#d1d5db"
  });

  Object.assign(actions.style, {
    marginTop: "16px",
    display: "none"
  });

  dismissButton.type = "button";
  dismissButton.textContent = "Dismiss";
  Object.assign(dismissButton.style, {
    border: "0",
    borderRadius: "999px",
    padding: "10px 14px",
    background: "#f59e0b",
    color: "#111827",
    font: "inherit",
    fontWeight: "700",
    cursor: "pointer"
  });
  dismissButton.addEventListener("click", () => overlay.remove());

  actions.append(dismissButton);
  card.append(status, count, actions);
  overlay.append(card);
  document.body.append(overlay);

  return {
    update(message, completed, total) {
      status.textContent = message;
      count.textContent = `${completed} / ${total}`;
      actions.style.display = "none";
    },
    showError(message) {
      status.textContent = message;
      actions.style.display = "block";
    },
    remove() {
      overlay.remove();
    }
  };
}

export async function runClippingsBookmarklet(runtime = globalThis) {
  const document = runtime.document;
  const fetchImpl = runtime.fetchImpl ?? runtime.fetch?.bind(runtime) ?? globalThis.fetch?.bind(globalThis);
  const overlay = createProgressOverlay(document);

  try {
    overlay.update("Discovering books...", 0, 0);

    const discoveredBooks = await discoverBooks({
      document,
      fetchImpl
    });
    const books = discoveredBooks.slice(
      0,
      runtime.devMaxBooks && runtime.devMaxBooks > 0 ? runtime.devMaxBooks : Infinity
    );

    if (!books.length) {
      const message = "No Kindle Notebook books were found on this page.";
      overlay.showError(message);

      return {
        books: [],
        errors: [{ message }]
      };
    }

    overlay.update(`Fetching book 1 of ${books.length}...`, 0, books.length);

    const result = await scrapeAnnotationsByBook(books, {
      document,
      fetchImpl,
      overlay
    });

    if (!result.books.length) {
      overlay.showError(result.errors[0]?.message ?? "No books could be exported.");
      return result;
    }

    overlay.update("Preparing download...", result.books.length, result.books.length);

    await downloadZip(result.books, {
      document,
      exportDate: runtime.exportDate,
      jszipCtor: runtime.jszipCtor,
      urlApi: runtime.urlApi ?? runtime.URL ?? globalThis.URL
    });

    overlay.remove();

    return result;
  } catch (error) {
    overlay.showError(error.message);

    return {
      books: [],
      errors: [{ message: error.message }]
    };
  }
}
