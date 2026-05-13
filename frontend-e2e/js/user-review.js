document.addEventListener("DOMContentLoaded", function () {
  var S = window.ShelfSync;
  var U = S.utils;
  S.renderNav(document.getElementById("app-nav"), "user-review.html");
  if (!S.auth.requireUser()) return;

  var bookId = U.getQueryParam("book");
  var line = document.getElementById("book-line");
  var form = document.getElementById("rev-form");

  if (!bookId) {
    line.textContent = "Missing ?book=… query.";
    form.style.display = "none";
    return;
  }

  S.request("books/" + bookId + "/", { auth: false })
    .then(function (book) {
      line.textContent = "Reviewing “" + book.title + "” by " + book.author + ".";
    })
    .catch(function () {
      line.textContent = "Could not load that book.";
      form.style.display = "none";
    });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var fd = new FormData(form);
    var body = {
      book_id: bookId,
      rating: Number(fd.get("rating")),
      headline: String(fd.get("headline") || "").trim(),
      comment: String(fd.get("comment") || "").trim(),
    };
    S.request("reviews/", { method: "POST", body: body })
      .then(function () {
        S.toast("Review submitted (pending moderation)", "ok");
        window.location.href =
          S.ROUTES.userBook + "?id=" + encodeURIComponent(bookId);
      })
      .catch(function (err) {
        S.toast(err.message || "Submit failed", "error");
      });
  });
});
