function getTextContent(element) {
  return element?.textContent?.trim() ?? "";
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
