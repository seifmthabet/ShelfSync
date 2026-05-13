document.addEventListener("DOMContentLoaded", function () {
  var S = window.ShelfSync;
  S.renderNav(document.getElementById("app-nav"), "user-profile.html");
  if (!S.auth.requireUser()) return;

  var roleLine = document.getElementById("role-line");
  var nameInput = document.getElementById("f-name");

  S.request("users/me/")
    .then(function (me) {
      S.storage.setUser(me);
      roleLine.textContent = me.email + " · Role " + me.role;
      nameInput.value = me.name;
    })
    .catch(function (e) {
      S.toast(e.message || "Failed to load profile", "error");
    });

  document.getElementById("profile-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var name = String(nameInput.value || "").trim();
    S.request("users/me/", { method: "PATCH", body: { name: name } })
      .then(function (me) {
        S.storage.setUser(me);
        S.toast("Profile updated", "ok");
        S.renderNav(document.getElementById("app-nav"), "user-profile.html");
      })
      .catch(function (err) {
        S.toast(err.message || "Update failed", "error");
      });
  });

  document.getElementById("pw-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var form = e.target;
    S.request("users/me/change-password/", {
      method: "PATCH",
      body: {
        old_password: String(form.old_password.value),
        new_password: String(form.new_password.value),
      },
    })
      .then(function () {
        form.reset();
        S.toast("Password updated", "ok");
      })
      .catch(function (err) {
        S.toast(err.message || "Password change failed", "error");
      });
  });

  document.getElementById("btn-deactivate").addEventListener("click", function () {
    if (!confirm("Deactivate your account? You will be signed out.")) return;
    S.request("users/me/deactivate/", { method: "POST", body: {} })
      .then(function () {
        S.storage.clearSession();
        S.toast("Account deactivated", "ok");
        window.location.href = S.ROUTES.home;
      })
      .catch(function (err) {
        S.toast(err.message || "Could not deactivate", "error");
      });
  });
});
