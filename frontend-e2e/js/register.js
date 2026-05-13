document.addEventListener("DOMContentLoaded", function () {
  var S = window.ShelfSync;
  S.renderNav(document.getElementById("app-nav"), "register.html");
  if (S.auth.requireGuest()) return;

  document.getElementById("reg-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var form = e.target;
    var body = {
      name: String(form.name.value || "").trim(),
      email: String(form.email.value || "").trim(),
      password: String(form.password.value || ""),
    };
    S.request("auth/register/", { method: "POST", body: body, auth: false })
      .then(function (data) {
        S.storage.setAccessToken(data.access);
        S.storage.setRefreshToken(data.refresh);
        S.storage.setUser(data.user);
        S.toast("Account created", "ok");
        window.location.href =
          data.user && data.user.role === "ADMIN"
            ? S.ROUTES.adminDashboard
            : S.ROUTES.userDashboard;
      })
      .catch(function (err) {
        S.toast(err.message || "Registration failed", "error");
      });
  });
});
