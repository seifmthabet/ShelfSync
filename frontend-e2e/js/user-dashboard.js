document.addEventListener("DOMContentLoaded", function () {
  var S = window.ShelfSync;
  var U = S.utils;
  S.renderNav(document.getElementById("app-nav"), "user-dashboard.html");
  if (!S.auth.requireUser()) return;

  var u = S.storage.getUser();
  document.getElementById("welcome-line").textContent =
    "Signed in as " + (u && u.name ? u.name : "reader") + ".";

  var statsEl = document.getElementById("quick-stats");
  var loansEl = document.getElementById("loans-preview");

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;");
  }

  Promise.all([S.request("users/me/"), S.request("borrowing/loans/me/")])
    .then(function (pair) {
      var me = pair[0];
      var loansRaw = pair[1];
      S.storage.setUser(me);
      var loans = U.listResults(loansRaw);
      var active = loans.filter(function (l) {
        return l.status === "active";
      }).length;
      statsEl.innerHTML =
        '<div class="stat"><div class="stat__value">' +
        active +
        '</div><div class="stat__label">Active loans</div></div>' +
        '<div class="stat"><div class="stat__value">' +
        loans.length +
        '</div><div class="stat__label">On this page</div></div>' +
        '<div class="stat"><div class="stat__value">' +
        me.role +
        '</div><div class="stat__label">Your role</div></div>';

      var slice = loans.slice(0, 5);
      if (!slice.length) {
        loansEl.innerHTML =
          '<p class="muted">No loans yet. <a href="' +
          S.ROUTES.userBooks +
          '">Browse the catalog</a>.</p>';
      } else {
        loansEl.innerHTML =
          '<ul style="margin:0;padding-left:1.1rem">' +
          slice
            .map(function (l) {
              return (
                "<li><strong>" +
                escapeHtml(l.book_title) +
                "</strong> — " +
                l.status +
                " · due " +
                U.formatDate(l.due_date) +
                "</li>"
              );
            })
            .join("") +
          "</ul>";
      }
    })
    .catch(function () {
      statsEl.innerHTML = '<p class="muted">Could not load dashboard.</p>';
      loansEl.innerHTML =
        '<p class="muted">Try again after checking the API URL in <code>js/config.js</code>.</p>';
    });
});
