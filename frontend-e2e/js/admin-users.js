document.addEventListener("DOMContentLoaded", function () {
  var S = window.ShelfSync;
  var U = S.utils;
  S.renderNav(document.getElementById("app-nav"), "admin-users.html");
  if (!S.auth.requireAdmin()) return;

  var tbody = document.getElementById("rows");
  var pager = document.getElementById("pager");
  var dlg = document.getElementById("dlg");
  var dlgEdit = document.getElementById("dlg-edit");
  var createForm = document.getElementById("create-form");
  var editForm = document.getElementById("edit-form");

  var nextPath = null;
  var prevPath = null;
  var lastRows = [];

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  }

  function findUser(id) {
    for (var i = 0; i < lastRows.length; i++) {
      if (lastRows[i].id === id) return lastRows[i];
    }
    return null;
  }

  document.getElementById("open-create").addEventListener("click", function () {
    createForm.reset();
    createForm.querySelector("[name=is_active]").checked = true;
    dlg.showModal();
  });
  document.getElementById("cancel-create").addEventListener("click", function () {
    dlg.close();
  });
  document.getElementById("cancel-edit").addEventListener("click", function () {
    dlgEdit.close();
  });

  function openEdit(u) {
    if (!u) return;
    editForm.querySelector('[name="id"]').value = u.id;
    editForm.elements.name.value = u.name;
    editForm.elements.email.value = u.email;
    editForm.elements.role.value = u.role;
    editForm.elements.is_active.checked = Boolean(u.is_active);
    dlgEdit.showModal();
  }

  function load(path) {
    var p = path ? S.request(path) : S.request("admin/users/");
    return p
      .then(function (data) {
        nextPath = U.pathFromApiUrl(data.next);
        prevPath = U.pathFromApiUrl(data.previous);
        var rows = data.results || [];
        lastRows = rows;
        tbody.innerHTML = rows
          .map(function (u) {
            return (
              "<tr><td>" +
              escapeHtml(u.name) +
              "</td><td>" +
              escapeHtml(u.email) +
              '</td><td><span class="badge ' +
              (u.role === "ADMIN" ? "badge--neutral" : "") +
              '">' +
              escapeHtml(u.role) +
              "</span></td><td>" +
              (u.is_active ? "Yes" : "No") +
              '</td><td><button type="button" class="btn btn--ghost btn--sm" data-edit="' +
              u.id +
              '">Edit</button></td></tr>'
            );
          })
          .join("");
        tbody.querySelectorAll("[data-edit]").forEach(function (btn) {
          btn.addEventListener("click", function () {
            openEdit(findUser(btn.getAttribute("data-edit")));
          });
        });
        var cnt = data.count != null ? data.count : rows.length;
        pager.innerHTML =
          '<button type="button" class="btn btn--ghost btn--sm" id="u-prev" ' +
          (prevPath ? "" : "disabled") +
          '>Previous</button><span class="muted">' +
          cnt +
          ' users</span><button type="button" class="btn btn--ghost btn--sm" id="u-next" ' +
          (nextPath ? "" : "disabled") +
          ">Next</button>";
        var prevBtn = document.getElementById("u-prev");
        var nextBtn = document.getElementById("u-next");
        if (prevBtn)
          prevBtn.addEventListener("click", function () {
            if (prevPath) load(prevPath);
          });
        if (nextBtn)
          nextBtn.addEventListener("click", function () {
            if (nextPath) load(nextPath);
          });
      })
      .catch(function (e) {
        S.toast(e.message || "Failed to load users", "error");
      });
  }

  createForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var fd = new FormData(createForm);
    var body = {
      name: String(fd.get("name") || "").trim(),
      email: String(fd.get("email") || "").trim(),
      password: String(fd.get("password") || ""),
      role: String(fd.get("role") || "USER"),
      is_active: fd.get("is_active") === "on",
    };
    S.request("admin/users/", { method: "POST", body: body })
      .then(function () {
        dlg.close();
        S.toast("User created", "ok");
        load(null);
      })
      .catch(function (err) {
        S.toast(err.message || "Create failed", "error");
      });
  });

  editForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var fd = new FormData(editForm);
    var id = String(fd.get("id"));
    var body = {
      name: String(fd.get("name") || "").trim(),
      role: String(fd.get("role") || "USER"),
      is_active: fd.get("is_active") === "on",
    };
    S.request("admin/users/" + id + "/", { method: "PATCH", body: body })
      .then(function () {
        dlgEdit.close();
        S.toast("User updated", "ok");
        load(null);
      })
      .catch(function (err) {
        S.toast(err.message || "Update failed", "error");
      });
  });

  load(null);
});
