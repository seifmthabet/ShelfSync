import { domHelper } from "../utils/domHelper.js";
import { Auth } from "../core/auth.js";
import { Storage } from "../core/storage.js";
import { usersService } from "../services/usersService.js";
import { hrefPage } from "../core/config.js";
import { wireAdminLogout } from "../core/adminNav.js";

function formatSince(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function applyUser(user) {
  if (!user) return;
  const nameEl = document.getElementById("ap-name");
  const emailEl = document.getElementById("ap-email");
  const roleEl = document.getElementById("ap-role");
  const sinceEl = document.getElementById("ap-since");
  const input = document.getElementById("ap-name-input");
  if (nameEl) nameEl.textContent = user.name || "—";
  if (emailEl) emailEl.textContent = user.email || "—";
  if (roleEl) {
    const r = user.role || "";
    roleEl.textContent =
      r === "ADMIN" || r === "admin" ? "Administrator" : String(r || "—");
  }
  if (sinceEl) sinceEl.textContent = formatSince(user.date_joined);
  if (input && user.name) input.value = user.name;
}

domHelper.ready(async () => {
  if (!Auth.isAuthenticated()) {
    window.location.href = hrefPage("login");
    return;
  }
  if (!Auth.isAdmin()) {
    window.location.href = hrefPage("userDashboard");
    return;
  }
  wireAdminLogout();

  try {
    const user = await usersService.getProfile();
    Storage.setUser(user);
    applyUser(user);
  } catch (e) {
    console.warn(e);
    applyUser(Auth.getCurrentUser());
  }

  document.getElementById("ap-save")?.addEventListener("click", async () => {
    const input = document.getElementById("ap-name-input");
    const name = input?.value?.trim();
    if (!name) {
      alert("Please enter a name.");
      return;
    }
    try {
      const updated = await usersService.updateProfile({ name });
      Storage.setUser(updated);
      applyUser(updated);
      alert("Profile updated.");
    } catch (err) {
      alert(err?.message || "Could not update profile.");
    }
  });
});
