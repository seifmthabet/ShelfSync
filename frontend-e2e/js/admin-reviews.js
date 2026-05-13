document.addEventListener("DOMContentLoaded", function () {
  var S = window.ShelfSync;
  var U = S.utils;
  S.renderNav(document.getElementById("app-nav"), "admin-reviews.html");
  if (!S.auth.requireAdmin()) return;

  var list = document.getElementById("list");

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  }

  function card(r) {
    return (
      '<article class="card" style="margin-bottom:1rem">' +
      '<div style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:0.75rem;align-items:flex-start">' +
      "<div><h3 style=\"margin:0 0 0.25rem\">" +
      escapeHtml(r.headline || "Review") +
      '</h3><p class="muted" style="margin:0;font-size:0.9rem">' +
      escapeHtml(r.user_name) +
      " · " +
      escapeHtml(r.book_title) +
      " · " +
      U.formatDateTime(r.created_at) +
      '</p></div><div class="link-row">' +
      '<button type="button" class="btn btn--sm" data-approve="' +
      r.id +
      '">Approve</button>' +
      '<button type="button" class="btn btn--secondary btn--sm" data-reject="' +
      r.id +
      '">Reject</button></div></div>' +
      '<p style="margin:0.75rem 0 0">★ ' +
      r.rating +
      '</p><p style="margin:0.35rem 0 0">' +
      escapeHtml(r.comment || "") +
      "</p></article>"
    );
  }

  function reload() {
    S.request("admin/reviews/pending/")
      .then(function (data) {
        var rows = U.listResults(data);
        if (!rows.length) {
          list.innerHTML =
            '<div class="card empty">No pending reviews. Good work.</div>';
          return;
        }
        list.innerHTML = rows.map(card).join("");
        list.querySelectorAll("[data-approve]").forEach(function (btn) {
          btn.addEventListener("click", function () {
            doApprove(btn.getAttribute("data-approve"));
          });
        });
        list.querySelectorAll("[data-reject]").forEach(function (btn) {
          btn.addEventListener("click", function () {
            doReject(btn.getAttribute("data-reject"));
          });
        });
      })
      .catch(function (e) {
        S.toast(e.message || "Failed to load reviews", "error");
        list.innerHTML =
          '<div class="card empty">Could not load moderation queue.</div>';
      });
  }

  function doApprove(id) {
    S.request("reviews/" + id + "/approve/", { method: "POST", body: {} })
      .then(function () {
        S.toast("Review approved", "ok");
        reload();
      })
      .catch(function (e) {
        S.toast(e.message || "Approve failed", "error");
      });
  }

  function doReject(id) {
    var note = prompt("Optional moderation note:") || "";
    S.request("reviews/" + id + "/reject/", { method: "POST", body: { note: note } })
      .then(function () {
        S.toast("Review rejected", "ok");
        reload();
      })
      .catch(function (e) {
        S.toast(e.message || "Reject failed", "error");
      });
  }

  reload();
});
