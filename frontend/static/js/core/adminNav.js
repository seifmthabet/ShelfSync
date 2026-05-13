import { Auth } from "./auth.js";
import { hrefPage } from "./config.js";

/** Wire `[data-admin-logout]` buttons (and `#btn-logout` when flagged) to clear session and go to login. */
export function wireAdminLogout() {
  const handler = (e) => {
    e.preventDefault();
    Auth.logout({ redirect: false });
    window.location.href = hrefPage("login");
  };
  document.querySelectorAll("[data-admin-logout]").forEach((el) => {
    el.addEventListener("click", handler);
  });
}
