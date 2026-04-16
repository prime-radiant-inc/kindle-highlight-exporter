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

function parseAddedDate(headerText) {
  const match = headerText.match(/Added on \w+ ([A-Za-z]+) (\d{1,2}), (\d{4})/);

  if (!match) {
    return "";
  }

  const [, monthName, day, year] = match;
  const month = MONTHS[monthName];
  const paddedDay = day.padStart(2, "0");

  return `${year}-${month}-${paddedDay}`;
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

function getAnnotationRows(container) {
  const wrappedRows = container.querySelectorAll("#kp-notebook-annotations > .a-row.a-spacing-base");

  if (wrappedRows.length > 0) {
    return Array.from(wrappedRows);
  }

  return Array.from(container.children).filter((child) => child.matches?.(".a-row.a-spacing-base"));
}

export function scrapeBookList(document) {
  return Array.from(document.querySelectorAll("#kp-notebook-library > div")).map((bookCard) => {
    const authorText = getTextContent(bookCard.querySelector("p.kp-notebook-searchable"));
    const lastAnnotatedInput = bookCard.querySelector("[id^='kp-notebook-annotated-date']");

    return {
      asin: bookCard.id,
      title: getTextContent(bookCard.querySelector("h2.kp-notebook-searchable")),
      author: authorText.replace(/^By:\s*/, ""),
      lastAnnotated: lastAnnotatedInput?.value?.trim() ?? ""
    };
  });
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

export function buildMarkdownFile(book) {
  const notesCount = book.annotations.filter((annotation) => annotation.note).length;
  const header = joinPresentLines([
    `# ${book.title}`,
    "",
    book.author ? `author: ${book.author}` : "",
    book.asin ? `asin: ${book.asin}` : "",
    book.lastAnnotated ? `last_annotated: ${book.lastAnnotated}` : "",
    `highlights: ${book.annotations.length}`,
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
      "<highlight>",
      annotation.highlight,
      "</highlight>",
      annotation.note ? "<note>" : "",
      annotation.note ?? "",
      annotation.note ? "</note>" : ""
    ])
  );

  return {
    name: `${slugifyTitle(book.title)}.md`,
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

  for (const book of books) {
    const file = buildMarkdownFile(book);
    zip.file(file.name, file.content);
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
    const books = scrapeBookList(document).slice(
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
