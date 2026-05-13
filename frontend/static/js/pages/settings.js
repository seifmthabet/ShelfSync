import { domHelper } from "../utils/domHelper.js";
import { Auth } from "../core/auth.js";
import { config, hrefPage } from "../core/config.js";

domHelper.ready(() => {
  const brand = document.getElementById("navbar__brand");
  brand?.addEventListener("click", () => {
    window.location.href = hrefPage("home");
  });

  document.getElementById("btn-logout")?.addEventListener("click", () => {
    Auth.logout({ redirect: false });
    window.location.href = hrefPage("login");
  });

  if (!Auth.isAuthenticated()) {
    window.location.href = hrefPage("login");
    return;
  }

  const baseEl = document.getElementById("st-api-base");
  if (baseEl) baseEl.textContent = config.apiBaseUrl;

  const u = Auth.getCurrentUser();
  const emailEl = document.getElementById("st-email");
  if (emailEl) emailEl.textContent = u?.email || "—";

  if (Auth.isAdmin()) {
    const adminLink = document.getElementById("st-admin-link");
    if (adminLink) adminLink.style.display = "inline-block";
  }
});
