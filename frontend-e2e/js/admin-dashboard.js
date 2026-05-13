document.addEventListener("DOMContentLoaded", function () {
  var S = window.ShelfSync;
  S.renderNav(document.getElementById("app-nav"), "admin-dashboard.html");
  if (!S.auth.requireAdmin()) return;

  var stats = document.getElementById("stats");

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;");
  }

  S.request("admin/dashboard/")
    .then(function (d) {
      var pairs = [
        ["catalog_size", "Titles in catalog"],
        ["active_users", "Active readers"],
        ["total_reviews", "Approved reviews"],
        ["borrowed_books", "Books on loan"],
        ["average_rating", "Avg. rating"],
        ["retention_rate", "Retention %"],
        ["storage_utilization", "Storage %"],
      ];
      stats.innerHTML = pairs
        .map(function (row) {
          var k = row[0];
          var label = row[1];
          var v = d[k] != null ? d[k] : "—";
          return (
            '<div class="stat"><div class="stat__value">' +
            escapeHtml(String(v)) +
            '</div><div class="stat__label">' +
            escapeHtml(label) +
            "</div></div>"
          );
        })
        .join("");
    })
    .catch(function (e) {
      S.toast(e.message || "Failed to load stats", "error");
      stats.innerHTML =
        '<p class="muted">Admin dashboard requires an admin account and API access.</p>';
    });
});
