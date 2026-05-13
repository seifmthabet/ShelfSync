document.addEventListener("DOMContentLoaded", function () {
  var S = window.ShelfSync;
  var U = S.utils;
  S.renderNav(document.getElementById("app-nav"), "user-borrows.html");
  if (!S.auth.requireUser()) return;

  var tbody = document.getElementById("rows");

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  }

  S.request("borrowing/borrow-requests/me/")
    .then(function (data) {
      var rows = U.listResults(data);
      if (!rows.length) {
        tbody.innerHTML =
          '<tr><td colspan="4" class="empty">No borrow requests yet.</td></tr>';
        return;
      }
      tbody.innerHTML = rows
        .map(function (r) {
          return (
            "<tr><td><strong>" +
            escapeHtml(r.book_title) +
            '</strong><div class="muted" style="font-size:0.85rem">' +
            escapeHtml(r.book_author || "") +
            '</div></td><td><span class="badge ' +
            U.badgeClass(r.status) +
            '">' +
            escapeHtml(r.status) +
            "</span></td><td>" +
            escapeHtml(r.risk_score || "—") +
            "</td><td>" +
            U.formatDateTime(r.requested_at) +
            "</td></tr>"
          );
        })
        .join("");
    })
    .catch(function (e) {
      S.toast(e.message || "Failed to load", "error");
      tbody.innerHTML =
        '<tr><td colspan="4" class="empty">Could not load requests.</td></tr>';
    });
});
