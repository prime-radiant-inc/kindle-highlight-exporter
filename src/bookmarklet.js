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

  for (const part of headerText.split(" | ")) {
    if (part.startsWith("Location ")) {
      metadata.location = part.replace("Location ", "");
    } else if (part.startsWith("Page ")) {
      metadata.page = part.replace("Page ", "");
    } else if (part.startsWith("Added on ")) {
      metadata.added = parseAddedDate(part);
    }
  }

  return metadata;
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

  const annotations = Array.from(
    container.querySelectorAll("#kp-notebook-annotations > .a-row.a-spacing-base")
  ).map((annotationRow) => {
    const headerText = getTextContent(
      annotationRow.querySelector("#annotationHighlightHeader, #annotationNoteHeader")
    );
    const note = getTextContent(annotationRow.querySelector("#note"));

    return {
      highlight: getTextContent(annotationRow.querySelector("#highlight")),
      ...parseAnnotationMetadata(headerText),
      ...(note ? { note } : {})
    };
  });

  return {
    annotations,
    nextToken: container.querySelector(".kp-notebook-annotations-next-page-start input")?.value?.trim() ?? "",
    contentLimitState:
      container.querySelector(".kp-notebook-content-limit-state input")?.value?.trim() ?? ""
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

export function runClippingsBookmarklet() {
  window.alert("Clippings bookmarklet placeholder");
}
