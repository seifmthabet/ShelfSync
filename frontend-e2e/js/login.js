document.addEventListener("DOMContentLoaded", function () {
  var S = window.ShelfSync;
  S.renderNav(document.getElementById("app-nav"), "login.html");
  if (S.auth.requireGuest()) return;

  function getSafeNext(raw) {
    if (!raw) return null;
    var n = String(raw).trim();
    if (!n || n.indexOf("//") === 0 || /^[a-z]+:/i.test(n)) return null;
    if (n.indexOf("\\") !== -1) return null;
    return n;
  }

  document.getElementById("login-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var form = e.target;
    var email = String(form.email.value || "").trim();
    var password = String(form.password.value || "");
    S.request("auth/login/", {
      method: "POST",
      body: { email: email, password: password },
      auth: false,
    })
      .then(function (data) {
        S.storage.setAccessToken(data.access);
        S.storage.setRefreshToken(data.refresh);
        S.storage.setUser(data.user);
        S.toast("Signed in", "ok");
        var next = getSafeNext(new URLSearchParams(location.search).get("next"));
        var fallback =
          data.user && data.user.role === "ADMIN"
            ? S.ROUTES.adminDashboard
            : S.ROUTES.userDashboard;
        window.location.href = next || fallback;
      })
      .catch(function (err) {
        S.toast(err.message || "Login failed", "error");
      });
  });
});
