(function (S) {
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  }

  S.renderNav = function (el, current) {
    current = current || "";
    if (!el) return;
    var user = S.storage.getUser();
    var logged = S.auth.isLoggedIn();
    var admin = S.auth.isAdmin();

    function cur(name) {
      return current === name ? ' aria-current="page"' : "";
    }

    var links = [
      '<a class="nav__brand" href="' +
        S.ROUTES.home +
        '"' +
        cur("index.html") +
        ">ShelfSync</a>",
      '<a href="' + S.ROUTES.userBooks + '"' + cur("user-books.html") + ">Catalog</a>",
    ];

    if (logged) {
      links.push(
        '<a href="' + S.ROUTES.userDashboard + '"' + cur("user-dashboard.html") + ">My shelf</a>"
      );
      links.push(
        '<a href="' + S.ROUTES.userLoans + '"' + cur("user-loans.html") + ">Borrowed</a>"
      );
      links.push(
        '<a href="' + S.ROUTES.userBorrows + '"' + cur("user-borrows.html") + ">Requests</a>"
      );
      if (admin) {
        links.push('<span class="nav__sep">|</span>');
        links.push(
          '<a href="' + S.ROUTES.adminDashboard + '"' + cur("admin-dashboard.html") + ">Admin</a>"
        );
        links.push(
          '<a href="' + S.ROUTES.adminUsers + '"' + cur("admin-users.html") + ">Users</a>"
        );
        links.push(
          '<a href="' + S.ROUTES.adminBooks + '"' + cur("admin-books.html") + ">Books</a>"
        );
        links.push(
          '<a href="' +
            S.ROUTES.adminBorrows +
            '"' +
            cur("admin-borrows.html") +
            ">Borrow queue</a>"
        );
        links.push(
          '<a href="' + S.ROUTES.adminReviews + '"' + cur("admin-reviews.html") + ">Reviews</a>"
        );
      }
    }

    var account = logged
      ? '<span class="nav__user">' +
        escapeHtml((user && user.name) || "Reader") +
        '</span><a href="' +
        S.ROUTES.userProfile +
        '" class="btn btn--ghost btn--sm"' +
        cur("user-profile.html") +
        '>Profile</a><button type="button" class="btn btn--ghost btn--sm" id="nav-logout">Log out</button>'
      : '<a href="' +
        S.ROUTES.login +
        '" class="btn btn--ghost btn--sm"' +
        cur("login.html") +
        '>Log in</a><a href="' +
        S.ROUTES.register +
        '" class="btn btn--sm"' +
        cur("register.html") +
        ">Sign up</a>";

    el.innerHTML =
      '<div class="nav__inner"><div class="nav__links">' +
      links.join("") +
      '</div><div class="nav__account">' +
      account +
      "</div></div>";

    var btn = el.querySelector("#nav-logout");
    if (btn) {
      btn.addEventListener("click", function () {
        S.auth.logout();
      });
    }
  };
})(window.ShelfSync);
