(function () {
  "use strict";

  var indexEl = document.getElementById("search-index");
  var inputEl = document.getElementById("specwiki-search-input");
  var resultsEl = document.getElementById("specwiki-search-results");

  if (!indexEl || !inputEl || !resultsEl || typeof lunr === "undefined") {
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

  var idx = lunr(function () {
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

  var docBySlug = {};
  for (var j = 0; j < data.documents.length; j++) {
    docBySlug[data.documents[j].slug] = data.documents[j];
  }

  function showResults(results) {
    resultsEl.innerHTML = "";
    if (!results.length) {
      resultsEl.hidden = true;
      return;
    }

    var ul = document.createElement("ul");
    ul.className = "specwiki-search-results-list";

    for (var k = 0; k < results.length && k < 10; k++) {
      var ref = results[k].ref;
      var doc = docBySlug[ref];
      if (!doc) {
        continue;
      }

      var li = document.createElement("li");
      var a = document.createElement("a");
      a.href = doc.slug + ".html";
      a.textContent = doc.title;
      li.appendChild(a);

      if (doc.description) {
        var span = document.createElement("span");
        span.className = "specwiki-search-snippet";
        span.textContent = doc.description;
        li.appendChild(span);
      }

      ul.appendChild(li);
    }

    resultsEl.appendChild(ul);
    resultsEl.hidden = false;
  }

  function hideResults() {
    resultsEl.hidden = true;
    resultsEl.innerHTML = "";
  }

  inputEl.addEventListener("input", function () {
    var q = inputEl.value.trim();
    if (!q) {
      hideResults();
      return;
    }

    try {
      showResults(idx.search(q));
    } catch {
      hideResults();
    }
  });

  inputEl.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      hideResults();
      inputEl.blur();
    }
  });

  document.addEventListener("click", function (event) {
    if (!event.target.closest(".specwiki-search")) {
      hideResults();
    }
  });
})();
