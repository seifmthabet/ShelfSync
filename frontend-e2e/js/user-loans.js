document.addEventListener("DOMContentLoaded", function () {
  var S = window.ShelfSync;
  var U = S.utils;
  S.renderNav(document.getElementById("app-nav"), "user-loans.html");
  if (!S.auth.requireUser()) return;

  var wrap = document.getElementById("loans");

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  }

  function escapeAttr(s) {
    return escapeHtml(s).replace(/'/g, "&#39;");
  }

  function card(l) {
    var active = l.status === "active";
    var cover = l.book_cover
      ? '<img src="' +
        escapeAttr(l.book_cover) +
        '" alt="" style="width:72px;height:108px;object-fit:cover;border-radius:8px" />'
      : '<div style="width:72px;height:108px;background:var(--surface-2);border-radius:8px"></div>';
    return (
      '<article class="card" style="margin-bottom:1rem;display:grid;grid-template-columns:auto 1fr auto;gap:1rem;align-items:center">' +
      cover +
      "<div><h3 style=\"margin:0 0 0.25rem;font-size:1.1rem\">" +
      escapeHtml(l.book_title) +
      '</h3><p class="muted" style="margin:0;font-size:0.9rem">' +
      escapeHtml(l.book_author || "") +
      '</p><p class="muted" style="margin:0.35rem 0 0;font-size:0.85rem">Borrowed ' +
      U.formatDate(l.borrowed_date) +
      " · Due " +
      U.formatDate(l.due_date) +
      '</p><p style="margin:0.35rem 0 0"><span class="badge ' +
      U.badgeClass(l.status) +
      '">' +
      escapeHtml(l.status) +
      '</span></p></div><div class="link-row" style="flex-direction:column;align-items:stretch">' +
      '<button type="button" class="btn btn--sm" data-renew="' +
      l.id +
      '"' +
      (active ? "" : " disabled") +
      '>Renew</button><button type="button" class="btn btn--secondary btn--sm" data-return="' +
      l.id +
      '"' +
      (active ? "" : " disabled") +
      ">Return</button></div></article>"
    );
  }

  S.request("borrowing/loans/me/")
    .then(function (data) {
      var loans = U.listResults(data);
      if (!loans.length) {
        wrap.innerHTML =
          '<div class="card empty">Nothing borrowed yet. <a href="' +
          S.ROUTES.userBooks +
          '">Explore the catalog</a>.</div>';
        return;
      }
      wrap.innerHTML = loans.map(card).join("");
      wrap.querySelectorAll("[data-renew]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          renew(btn.getAttribute("data-renew"));
        });
      });
      wrap.querySelectorAll("[data-return]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          returnLoan(btn.getAttribute("data-return"));
        });
      });
    })
    .catch(function (e) {
      S.toast(e.message || "Failed to load loans", "error");
      wrap.innerHTML = '<div class="card empty">Unable to load loans.</div>';
    });

  function renew(id) {
    S.request("borrowing/loans/" + id + "/renew/", { method: "POST", body: {} })
      .then(function () {
        S.toast("Loan renewed", "ok");
        location.reload();
      })
      .catch(function (e) {
        S.toast(e.message || "Renew failed", "error");
      });
  }

  function returnLoan(id) {
    S.request("borrowing/loans/" + id + "/return/", { method: "POST", body: {} })
      .then(function () {
        S.toast("Book returned", "ok");
        location.reload();
      })
      .catch(function (e) {
        S.toast(e.message || "Return failed", "error");
      });
  }
});
