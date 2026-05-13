document.addEventListener("DOMContentLoaded", function () {
  var S = window.ShelfSync;
  var U = S.utils;
  S.renderNav(document.getElementById("app-nav"), "admin-borrows.html");
  if (!S.auth.requireAdmin()) return;

  var tbody = document.getElementById("rows");
  var status = document.getElementById("status");

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  }

  function reload() {
    var query = {};
    if (status.value) query.status = status.value;
    S.request("borrowing/admin/borrow-requests/", { query: query })
      .then(function (data) {
        var rows = U.listResults(data);
        if (!rows.length) {
          tbody.innerHTML =
            '<tr><td colspan="7" class="empty">No borrow requests for this filter.</td></tr>';
          return;
        }
        tbody.innerHTML = rows
          .map(function (r) {
            var actions =
              r.status === "pending"
                ? '<button type="button" class="btn btn--sm" data-approve="' +
                  r.id +
                  '">Approve</button> <button type="button" class="btn btn--secondary btn--sm" data-reject="' +
                  r.id +
                  '">Reject</button>'
                : "—";
            return (
              "<tr><td>" +
              escapeHtml(r.user_name) +
              '<div class="muted" style="font-size:0.85rem">' +
              escapeHtml(r.user_email || "") +
              "</div></td><td>" +
              escapeHtml(r.book_title) +
              '<div class="muted" style="font-size:0.85rem">' +
              escapeHtml(r.book_author || "") +
              '</div></td><td><span class="badge ' +
              U.badgeClass(r.status) +
              '">' +
              escapeHtml(r.status) +
              "</span></td><td>" +
              escapeHtml(r.risk_score || "—") +
              "</td><td>" +
              (r.user_loans_count != null ? r.user_loans_count : "—") +
              "</td><td>" +
              U.formatDateTime(r.requested_date) +
              "</td><td>" +
              actions +
              "</td></tr>"
            );
          })
          .join("");
        tbody.querySelectorAll("[data-approve]").forEach(function (btn) {
          btn.addEventListener("click", function () {
            approve(btn.getAttribute("data-approve"));
          });
        });
        tbody.querySelectorAll("[data-reject]").forEach(function (btn) {
          btn.addEventListener("click", function () {
            rejectReq(btn.getAttribute("data-reject"));
          });
        });
      })
      .catch(function (e) {
        S.toast(e.message || "Failed to load", "error");
      });
  }

  function approve(id) {
    S.request("borrowing/borrow-requests/" + id + "/approve/", {
      method: "POST",
      body: {},
    })
      .then(function () {
        S.toast("Approved — loan created", "ok");
        reload();
      })
      .catch(function (e) {
        S.toast(e.message || "Approve failed", "error");
      });
  }

  function rejectReq(id) {
    var reason = prompt("Optional rejection reason:") || "";
    S.request("borrowing/borrow-requests/" + id + "/reject/", {
      method: "POST",
      body: { reason: reason },
    })
      .then(function () {
        S.toast("Request rejected", "ok");
        reload();
      })
      .catch(function (e) {
        S.toast(e.message || "Reject failed", "error");
      });
  }

  document.getElementById("reload").addEventListener("click", reload);
  status.addEventListener("change", reload);
  reload();
});
