document.addEventListener("DOMContentLoaded", function () {
  var S = window.ShelfSync;
  var U = S.utils;
  S.renderNav(document.getElementById("app-nav"), "admin-books.html");
  if (!S.auth.requireAdmin()) return;

  var tbody = document.getElementById("rows");
  var pager = document.getElementById("pager");
  var dlg = document.getElementById("dlg");
  var form = document.getElementById("book-form");
  var dlgTitle = document.getElementById("dlg-title");
  var q = document.getElementById("q");

  var nextPath = null;
  var prevPath = null;

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  }

  document.getElementById("open-create").addEventListener("click", function () {
    dlgTitle.textContent = "Add book";
    form.reset();
    form.querySelector('[name="id"]').value = "";
    form.elements.is_active.checked = true;
    dlg.showModal();
  });
  document.getElementById("cancel-book").addEventListener("click", function () {
    dlg.close();
  });

  document.getElementById("apply").addEventListener("click", function () {
    load(null);
  });

  function load(path) {
    var p = path
      ? S.request(path)
      : S.request("books/", { query: { search: q.value.trim() || undefined } });
    return p
      .then(function (data) {
        nextPath = U.pathFromApiUrl(data.next);
        prevPath = U.pathFromApiUrl(data.previous);
        var rows = data.results || [];
        tbody.innerHTML = rows
          .map(function (b) {
            var rt =
              b.rating != null ? Number(b.rating).toFixed(1) : "—";
            return (
              "<tr><td>" +
              escapeHtml(b.title) +
              "</td><td>" +
              escapeHtml(b.author) +
              "</td><td>" +
              escapeHtml(String(b.availability || "")) +
              "</td><td>" +
              rt +
              '</td><td><button type="button" class="btn btn--ghost btn--sm" data-edit="' +
              b.id +
              '">Edit</button></td></tr>'
            );
          })
          .join("");
        tbody.querySelectorAll("[data-edit]").forEach(function (btn) {
          btn.addEventListener("click", function () {
            openEdit(btn.getAttribute("data-edit"));
          });
        });
        var cnt = data.count != null ? data.count : rows.length;
        pager.innerHTML =
          '<button type="button" class="btn btn--ghost btn--sm" id="b-prev" ' +
          (prevPath ? "" : "disabled") +
          '>Previous</button><span class="muted">' +
          cnt +
          ' books</span><button type="button" class="btn btn--ghost btn--sm" id="b-next" ' +
          (nextPath ? "" : "disabled") +
          ">Next</button>";
        var prevBtn = document.getElementById("b-prev");
        var nextBtn = document.getElementById("b-next");
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
        S.toast(e.message || "Failed to load books", "error");
      });
  }

  function openEdit(id) {
    dlgTitle.textContent = "Edit book";
    S.request("books/" + id + "/")
      .then(function (b) {
        var idInput = form.querySelector('[name="id"]');
        idInput.value = b.id;
        form.elements.isbn.value = b.isbn || "";
        form.elements.title.value = b.title || "";
        form.elements.author.value = b.author || "";
        form.elements.category.value = "";
        form.elements.description.value = b.summary || "";
        form.elements.publication_year.value =
          b.year != null && b.year !== "" ? b.year : "";
        form.elements.cover_url.value = b.cover || "";
        form.elements.total_copies.value =
          b.total_copies != null ? b.total_copies : 1;
        form.elements.available_copies.value =
          b.available_copies != null ? b.available_copies : 1;
        form.elements.is_active.checked = true;
        dlg.showModal();
      })
      .catch(function (e) {
        S.toast(e.message || "Could not load book", "error");
      });
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var fd = new FormData(form);
    var id = String(form.querySelector('[name="id"]').value || "").trim();
    var isbnTrim = String(fd.get("isbn") || "").trim();
    var payload = {
      isbn: isbnTrim ? isbnTrim : null,
      title: String(fd.get("title") || "").trim(),
      author: String(fd.get("author") || "").trim(),
      description: String(fd.get("description") || ""),
      publication_year: fd.get("publication_year")
        ? Number(fd.get("publication_year"))
        : null,
      cover_url: String(fd.get("cover_url") || "").trim() || "",
      total_copies: Number(fd.get("total_copies")),
      available_copies: Number(fd.get("available_copies")),
      is_active: fd.get("is_active") === "on",
    };
    var cat = String(fd.get("category") || "").trim();
    if (cat) payload.category = cat;

    var req = id
      ? S.request("books/" + id + "/", { method: "PATCH", body: payload })
      : S.request("books/", { method: "POST", body: payload });
    req
      .then(function () {
        S.toast(id ? "Book updated" : "Book created", "ok");
        dlg.close();
        load(null);
      })
      .catch(function (err) {
        S.toast(err.message || "Save failed", "error");
      });
  });

  load(null);
});
