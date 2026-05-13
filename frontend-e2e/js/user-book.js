document.addEventListener("DOMContentLoaded", function () {
  var S = window.ShelfSync;
  var U = S.utils;
  S.renderNav(document.getElementById("app-nav"), "user-book.html");

  var id = U.getQueryParam("id");
  var loadState = document.getElementById("load-state");
  var root = document.getElementById("book-root");

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  }

  function escapeAttr(s) {
    return escapeHtml(s).replace(/'/g, "&#39;");
  }

  function renderReview(r) {
    return (
      '<div class="review"><strong>' +
      escapeHtml(r.user_name || "Reader") +
      '</strong><span class="muted"> · ★ ' +
      r.rating +
      " · " +
      U.formatDate(r.created_at) +
      '</span><p style="margin:0.35rem 0 0">' +
      escapeHtml(r.content || "") +
      "</p></div>"
    );
  }

  if (!id) {
    loadState.textContent = "Missing book id.";
    return;
  }

  Promise.all([
    S.request("books/" + id + "/", { auth: false }),
    S.request("books/" + id + "/reviews/", { auth: false }),
  ])
    .then(function (pair) {
      var book = pair[0];
      var reviews = pair[1];

      loadState.style.display = "none";
      root.style.display = "block";

      document.getElementById("b-title").textContent = book.title;
      document.getElementById("b-author").textContent = book.author;
      var metaParts = [];
      if (book.category) metaParts.push(book.category);
      if (book.year) metaParts.push("First published " + book.year);
      var ac = book.available_copies != null ? book.available_copies : 0;
      var tc = book.total_copies != null ? book.total_copies : "?";
      metaParts.push(ac + " of " + tc + " copies available");
      if (book.isbn) metaParts.push("ISBN " + book.isbn);
      document.getElementById("b-meta").textContent = metaParts.join(" · ");
      document.getElementById("b-summary").textContent =
        book.summary || "No description yet.";

      var cw = document.getElementById("cover-wrap");
      if (book.cover) {
        cw.innerHTML =
          '<img src="' +
          escapeAttr(book.cover) +
          '" alt="" style="width:100%;height:100%;object-fit:cover" />';
      } else {
        cw.innerHTML =
          '<div style="padding:2rem;text-align:center;color:var(--muted)">No cover</div>';
      }

      var linkRev = document.getElementById("link-review");
      linkRev.href =
        S.ROUTES.userReview + "?book=" + encodeURIComponent(id);

      var btn = document.getElementById("btn-borrow");
      var hint = document.getElementById("borrow-hint");

      if (!S.auth.isLoggedIn()) {
        btn.textContent = "Log in to borrow";
        btn.addEventListener("click", function () {
          window.location.href =
            S.ROUTES.login + "?next=" + encodeURIComponent(location.href);
        });
        hint.textContent = "Borrowing requires an account.";
      } else if (ac < 1) {
        btn.disabled = true;
        btn.textContent = "Out of stock";
        hint.textContent = "Ask a librarian to add copies.";
      } else {
        btn.addEventListener("click", function () {
          btn.disabled = true;
          S.request("borrowing/borrow-requests/", {
            method: "POST",
            body: { book_id: id },
          })
            .then(function () {
              S.toast("Borrow request submitted", "ok");
              hint.textContent = "Request is pending librarian approval.";
            })
            .catch(function (e) {
              S.toast(e.message || "Could not request borrow", "error");
              btn.disabled = false;
            });
        });
        hint.textContent =
          "Creates a pending request. You will see it under Requests.";
      }

      var reviewList = U.listResults(reviews);
      var box = document.getElementById("reviews-box");
      if (!reviewList.length) {
        box.innerHTML =
          '<p class="muted">No approved reviews yet. Be the first to <a href="' +
          linkRev.href +
          '">write one</a>.</p>';
      } else {
        box.innerHTML = reviewList.map(renderReview).join("");
      }
    })
    .catch(function (e) {
      loadState.textContent = e.message || "Book not found.";
    });
});
