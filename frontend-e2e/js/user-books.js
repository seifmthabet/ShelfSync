document.addEventListener("DOMContentLoaded", function () {
  var S = window.ShelfSync;
  var U = S.utils;
  S.renderNav(document.getElementById("app-nav"), "user-books.html");

  var catalog = document.getElementById("catalog");
  var pager = document.getElementById("pager");
  var q = document.getElementById("q");
  var availability = document.getElementById("availability");
  var category = document.getElementById("category");
  var ordering = document.getElementById("ordering");

  var nextPath = null;
  var prevPath = null;

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  }

  function escapeAttr(s) {
    return escapeHtml(s).replace(/'/g, "&#39;");
  }

  function renderCard(b) {
    var cover = b.cover
      ? '<img src="' +
        escapeAttr(b.cover) +
        '" alt="" loading="lazy" />'
      : '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--muted);font-size:0.85rem;">No cover</div>';
    var r = b.rating != null ? Number(b.rating).toFixed(1) : "—";
    return (
      '<article class="card book-card">' +
      '<a href="' +
      S.ROUTES.userBook +
      "?id=" +
      encodeURIComponent(b.id) +
      '" class="book-card__cover">' +
      cover +
      "</a>" +
      '<a href="' +
      S.ROUTES.userBook +
      "?id=" +
      encodeURIComponent(b.id) +
      '" class="book-card__title">' +
      escapeHtml(b.title) +
      "</a>" +
      '<div class="book-card__meta">' +
      escapeHtml(b.author) +
      " · " +
      escapeHtml(b.category || "Uncategorized") +
      "<br />★ " +
      r +
      " · " +
      escapeHtml(b.availability || "") +
      "</div></article>"
    );
  }

  function load(pathOrNull) {
    var p = pathOrNull
      ? S.request(pathOrNull)
      : S.request("books/", {
          query: {
            search: q.value.trim() || undefined,
            availability: availability.value || undefined,
            category: category.value.trim() || undefined,
            ordering: ordering.value || undefined,
            page: 1,
          },
        });
    return p
      .then(function (data) {
        nextPath = U.pathFromApiUrl(data.next);
        prevPath = U.pathFromApiUrl(data.previous);
        var results = data.results || [];
        if (!results.length) {
          catalog.innerHTML = '<div class="empty">No books match these filters.</div>';
        } else {
          catalog.innerHTML = results.map(renderCard).join("");
        }
        pager.innerHTML =
          '<button type="button" class="btn btn--ghost btn--sm" id="pg-prev" ' +
          (prevPath ? "" : "disabled") +
          '>Previous</button><span class="muted">' +
          (data.count != null ? data.count : results.length) +
          ' titles</span><button type="button" class="btn btn--ghost btn--sm" id="pg-next" ' +
          (nextPath ? "" : "disabled") +
          ">Next</button>";
        var prevBtn = document.getElementById("pg-prev");
        var nextBtn = document.getElementById("pg-next");
        if (prevBtn)
          prevBtn.addEventListener("click", function () {
            if (prevPath) load(prevPath);
          });
        if (nextBtn)
          nextBtn.addEventListener("click", function () {
            if (nextPath) load(nextPath);
          });
      })
      .catch(function (e) {
        S.toast(e.message || "Failed to load catalog", "error");
        catalog.innerHTML =
          '<div class="empty">Unable to reach the API. Set <code>API_BASE</code> in <code>js/config.js</code>.</div>';
      });
  }

  document.getElementById("apply-filters").addEventListener("click", function () {
    load(null);
  });
  load(null);
});
