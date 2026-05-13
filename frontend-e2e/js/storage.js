(function (S) {
  var ACCESS = "shelfsync_access";
  var REFRESH = "shelfsync_refresh";
  var USER = "shelfsync_user";

  S.storage = {
    getAccessToken: function () {
      return localStorage.getItem(ACCESS);
    },
    setAccessToken: function (token) {
      if (token) localStorage.setItem(ACCESS, token);
      else localStorage.removeItem(ACCESS);
    },
    getRefreshToken: function () {
      return localStorage.getItem(REFRESH);
    },
    setRefreshToken: function (token) {
      if (token) localStorage.setItem(REFRESH, token);
      else localStorage.removeItem(REFRESH);
    },
    getUser: function () {
      try {
        var raw = localStorage.getItem(USER);
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        return null;
      }
    },
    setUser: function (user) {
      if (user) localStorage.setItem(USER, JSON.stringify(user));
      else localStorage.removeItem(USER);
    },
    clearSession: function () {
      localStorage.removeItem(ACCESS);
      localStorage.removeItem(REFRESH);
      localStorage.removeItem(USER);
    },
  };
})(window.ShelfSync);
