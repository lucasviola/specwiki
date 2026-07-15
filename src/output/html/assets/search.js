(function () {
  "use strict";

  var indexEl = document.getElementById("search-index");
  var inputEl = document.getElementById("specwiki-search-input");
  var resultsEl = document.getElementById("specwiki-search-results");
  var groupsEl = document.getElementById("specwiki-search-groups");
  var statusEl = document.getElementById("specwiki-search-status");

  if (
    !indexEl ||
    !inputEl ||
    !resultsEl ||
    !groupsEl ||
    !statusEl ||
    typeof lunr === "undefined"
  ) {
    return;
  }

  var data;
  try {
    data = JSON.parse(indexEl.textContent || "");
  } catch {
    return;
  }

  if (!data || !Array.isArray(data.documents)) {
    return;
  }

  var idx;
  try {
    idx = lunr(function () {
      this.ref("slug");
      this.field("title", { boost: 10 });
      this.field("description", { boost: 5 });
      this.field("category", { boost: 3 });
      this.field("body");

      for (var i = 0; i < data.documents.length; i++) {
        var doc = data.documents[i];
        this.add({
          slug: doc.slug,
          title: doc.title,
          description: doc.description || "",
          category: doc.category || "",
          body: doc.body || "",
        });
      }
    });
  } catch {
    return;
  }

  var docBySlug = Object.create(null);
  for (var j = 0; j < data.documents.length; j++) {
    docBySlug[data.documents[j].slug] = data.documents[j];
  }

  var activeOptions = [];
  var activeIndex = -1;

  function clearActiveOption() {
    for (var i = 0; i < activeOptions.length; i++) {
      activeOptions[i].setAttribute("aria-selected", "false");
    }
    activeIndex = -1;
    inputEl.removeAttribute("aria-activedescendant");
  }

  function setOpen(open) {
    resultsEl.hidden = !open;
    inputEl.setAttribute("aria-expanded", String(open));
  }

  function closeResults() {
    clearActiveOption();
    activeOptions = [];
    groupsEl.replaceChildren();
    statusEl.textContent = "";
    statusEl.hidden = true;
    setOpen(false);
  }

  function closeDrawer() {
    var toggle = document.getElementById("specwiki-nav-toggle");
    var drawer = document.getElementById("specwiki-nav-drawer");
    var backdrop = document.getElementById("specwiki-nav-backdrop");
    if (
      !toggle ||
      !drawer ||
      !backdrop ||
      toggle.getAttribute("aria-expanded") !== "true"
    ) {
      return;
    }

    document.documentElement.classList.remove("specwiki-nav-open");
    toggle.setAttribute("aria-expanded", "false");
    drawer.setAttribute("aria-hidden", "true");
    drawer.inert = true;
    backdrop.hidden = true;
  }

  function focusSearch() {
    closeDrawer();
    inputEl.focus();
  }

  function isEditable(target) {
    if (!target || !target.tagName) {
      return false;
    }
    var tagName = target.tagName.toLowerCase();
    return (
      tagName === "input" ||
      tagName === "textarea" ||
      tagName === "select" ||
      tagName === "button" ||
      target.isContentEditable
    );
  }

  function appendHighlighted(parent, text, query) {
    var terms = query
      .split(/\s+/)
      .filter(Boolean)
      .map(function (term) {
        return term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      });
    if (!terms.length) {
      parent.appendChild(document.createTextNode(text));
      return;
    }

    var matcher = new RegExp("(" + terms.join("|") + ")", "gi");
    var parts = text.split(matcher);
    for (var i = 0; i < parts.length; i++) {
      if (!parts[i]) {
        continue;
      }
      if (i % 2 === 1) {
        var mark = document.createElement("mark");
        mark.className = "specwiki-search-match";
        mark.textContent = parts[i];
        parent.appendChild(mark);
      } else {
        parent.appendChild(document.createTextNode(parts[i]));
      }
    }
  }

  function excerptFor(doc) {
    var excerpt = doc.description || doc.body || "";
    return excerpt.length > 180 ? excerpt.slice(0, 179) + "…" : excerpt;
  }

  function createOption(doc, query, optionIndex) {
    var option = document.createElement("a");
    var optionId = "specwiki-search-option-" + optionIndex;
    option.className = "specwiki-search-option";
    option.href = doc.slug + ".html";
    option.setAttribute("href", doc.slug + ".html");
    option.setAttribute("id", optionId);
    option.setAttribute("role", "option");
    option.setAttribute("aria-selected", "false");

    var title = document.createElement("span");
    title.className = "specwiki-search-title";
    appendHighlighted(title, doc.title || doc.slug, query);
    option.appendChild(title);

    var category = document.createElement("span");
    category.className = "specwiki-search-category";
    category.textContent = doc.categoryLabel || doc.category || "Other";
    option.appendChild(category);

    var excerpt = excerptFor(doc);
    if (excerpt) {
      var snippet = document.createElement("span");
      snippet.className = "specwiki-search-snippet";
      appendHighlighted(snippet, excerpt, query);
      option.appendChild(snippet);
    }

    option.addEventListener("mouseenter", function () {
      setActiveOption(optionIndex);
    });
    option.addEventListener("click", function () {
      closeResults();
    });
    return option;
  }

  function setActiveOption(nextIndex) {
    if (!activeOptions.length) {
      return;
    }
    if (activeIndex >= 0) {
      activeOptions[activeIndex].setAttribute("aria-selected", "false");
    }
    activeIndex = (nextIndex + activeOptions.length) % activeOptions.length;
    var active = activeOptions[activeIndex];
    active.setAttribute("aria-selected", "true");
    inputEl.setAttribute("aria-activedescendant", active.getAttribute("id"));
    if (active.scrollIntoView) {
      active.scrollIntoView({ block: "nearest" });
    }
  }

  function showNoResults() {
    clearActiveOption();
    activeOptions = [];
    groupsEl.replaceChildren();
    statusEl.textContent = "No matching specs. Try fewer or different words.";
    statusEl.hidden = false;
    setOpen(true);
  }

  function showResults(results, query) {
    clearActiveOption();
    activeOptions = [];
    groupsEl.replaceChildren();
    statusEl.textContent = "";
    statusEl.hidden = true;

    var rankedDocs = [];
    for (var i = 0; i < results.length && rankedDocs.length < 10; i++) {
      var doc = docBySlug[results[i].ref];
      if (doc) {
        rankedDocs.push(doc);
      }
    }
    if (!rankedDocs.length) {
      showNoResults();
      return;
    }

    var groups = [];
    var groupByLabel = Object.create(null);
    for (var j = 0; j < rankedDocs.length; j++) {
      var rankedDoc = rankedDocs[j];
      var categoryLabel =
        rankedDoc.categoryLabel || rankedDoc.category || "Other";
      var group = groupByLabel[categoryLabel];
      if (!group) {
        group = {
          label: categoryLabel,
          documents: [],
        };
        groupByLabel[categoryLabel] = group;
        groups.push(group);
      }
      group.documents.push(rankedDoc);
    }

    for (var groupIndex = 0; groupIndex < groups.length; groupIndex++) {
      var section = document.createElement("section");
      section.className = "specwiki-search-group";
      var heading = document.createElement("h2");
      heading.className = "specwiki-search-group-heading";
      heading.textContent = groups[groupIndex].label;
      section.appendChild(heading);

      var list = document.createElement("ul");
      list.className = "specwiki-search-results-list";
      list.setAttribute("role", "presentation");
      for (
        var docIndex = 0;
        docIndex < groups[groupIndex].documents.length;
        docIndex++
      ) {
        var listItem = document.createElement("li");
        listItem.setAttribute("role", "presentation");
        var option = createOption(
          groups[groupIndex].documents[docIndex],
          query,
          activeOptions.length,
        );
        activeOptions.push(option);
        listItem.appendChild(option);
        list.appendChild(listItem);
      }
      section.appendChild(list);
      groupsEl.appendChild(section);
    }

    closeDrawer();
    setOpen(true);
  }

  inputEl.addEventListener("input", function () {
    var q = inputEl.value.trim();
    if (!q) {
      closeResults();
      return;
    }

    try {
      showResults(idx.search(q), q);
    } catch {
      closeResults();
    }
  });

  inputEl.addEventListener("keydown", function (event) {
    if (
      (event.key === "ArrowDown" || event.key === "ArrowUp") &&
      activeOptions.length
    ) {
      event.preventDefault();
      setActiveOption(
        activeIndex < 0
          ? event.key === "ArrowDown"
            ? 0
            : activeOptions.length - 1
          : event.key === "ArrowDown"
            ? activeIndex + 1
            : activeIndex - 1,
      );
      return;
    }
    if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      document.location.href = activeOptions[activeIndex].getAttribute("href");
      return;
    }
    if (event.key === "Escape") {
      closeResults();
      inputEl.focus();
    }
  });

  inputEl.addEventListener("focus", closeDrawer);
  var navToggle = document.getElementById("specwiki-nav-toggle");
  if (navToggle) {
    navToggle.addEventListener("click", closeResults);
  }

  document.addEventListener("keydown", function (event) {
    var slashShortcut =
      event.key === "/" &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.altKey &&
      !event.shiftKey &&
      !isEditable(event.target);
    var commandShortcut =
      event.key.toLowerCase() === "k" &&
      (event.metaKey || event.ctrlKey) &&
      !event.altKey;
    if (slashShortcut || commandShortcut) {
      event.preventDefault();
      focusSearch();
    }
  });

  document.addEventListener("click", function (event) {
    if (
      event.target &&
      typeof event.target.closest === "function" &&
      !event.target.closest(".specwiki-search")
    ) {
      closeResults();
    }
  });
})();
