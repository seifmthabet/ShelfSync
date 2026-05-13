import { domHelper } from "../utils/domHelper.js";
import { Auth } from "../core/auth.js";
import { config, hrefPage } from "../core/config.js";
import { wireAdminLogout } from "../core/adminNav.js";

domHelper.ready(() => {
  if (!Auth.isAuthenticated()) {
    window.location.href = hrefPage("login");
    return;
  }
  if (!Auth.isAdmin()) {
    window.location.href = hrefPage("userDashboard");
    return;
  }
  wireAdminLogout();

  const baseEl = document.getElementById("as-api-base");
  if (baseEl) baseEl.textContent = config.apiBaseUrl;

  const u = Auth.getCurrentUser();
  const emailEl = document.getElementById("as-email");
  if (emailEl) emailEl.textContent = u?.email || "—";
});
