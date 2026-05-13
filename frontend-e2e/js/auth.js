(function (S) {
  S.auth = {
    isLoggedIn: function () {
      return Boolean(S.storage.getAccessToken() && S.storage.getUser());
    },
    isAdmin: function () {
      var u = S.storage.getUser();
      return u && u.role === "ADMIN";
    },
    requireGuest: function () {
      if (S.auth.isLoggedIn()) {
        var dest = S.auth.isAdmin() ? S.ROUTES.adminDashboard : S.ROUTES.userDashboard;
        window.location.href = dest;
        return true;
      }
      return false;
    },
    requireUser: function () {
      if (!S.auth.isLoggedIn()) {
        window.location.href =
          S.ROUTES.login +
          "?next=" +
          encodeURIComponent(window.location.pathname + window.location.search);
        return false;
      }
      return true;
    },
    requireAdmin: function () {
      if (!S.auth.isLoggedIn()) {
        window.location.href = S.ROUTES.login;
        return false;
      }
      if (!S.auth.isAdmin()) {
        window.location.href = S.ROUTES.userDashboard;
        return false;
      }
      return true;
    },
    logout: function () {
      var refresh = S.storage.getRefreshToken();
      var access = S.storage.getAccessToken();
      var done = function () {
        S.storage.clearSession();
        window.location.href = S.ROUTES.home;
      };
      if (refresh && access) {
        S.request("auth/logout/", { method: "POST", body: { refresh: refresh }, auth: true })
          .then(done)
          .catch(done);
      } else {
        done();
      }
    },
  };
})(window.ShelfSync);
