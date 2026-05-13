import { domHelper } from "../utils/domHelper.js";
import { Auth } from "../core/auth.js";
import { Storage } from "../core/storage.js";
import { usersService } from "../services/usersService.js";
import { hrefPage } from "../core/config.js";

const homeButton = document.getElementById("navbar__brand");
homeButton?.addEventListener("click", () => {
  window.location.href = hrefPage("home");
});

const logoutButton = document.getElementById("btn-logout");
logoutButton?.addEventListener("click", () => {
  Auth.logout({ redirect: false });
  window.location.href = hrefPage("login");
});

const ui = {
  userName: domHelper.query("#userName"),
  userEmail: domHelper.query("#userEmail"),
  memberSince: domHelper.query("#memberSince"),
  userRole: domHelper.query("#userRole"),
  favoriteGenres: domHelper.query("#favoriteGenres"),
  notifications: domHelper.query("#notifications"),
  readingGoal: domHelper.query("#readingGoal"),

  editPersonalBtn: domHelper.query("#editPersonalBtn"),
  editPersonalForm: domHelper.query("#editPersonalForm"),
  personalInfo: domHelper.query("#personalInfo"),
  editNameInput: domHelper.query("#editName"),
  editEmailInput: domHelper.query("#editEmail"),
  cancelPersonal: domHelper.query("#cancelPersonal"),

  changePasswordBtn: domHelper.query("#changePasswordBtn"),
  changePasswordForm: domHelper.query("#changePasswordForm"),
  oldPasswordInput: domHelper.query("#oldPassword"),
  newPasswordInput: domHelper.query("#newPassword"),
  confirmPasswordInput: domHelper.query("#confirmPassword"),
  cancelPassword: domHelper.query("#cancelPassword"),

  editPreferencesBtn: domHelper.query("#editPreferencesBtn"),
  editPreferencesForm: domHelper.query("#editPreferencesForm"),
  preferencesInfo: domHelper.query("#preferencesInfo"),
  genresInput: domHelper.query("#genres"),
  readingGoalInput: domHelper.query("#readingGoalInput"),
  emailNotifications: domHelper.query("#emailNotifications"),
  cancelPreferences: domHelper.query("#cancelPreferences"),

  enable2FABtn: domHelper.query("#enable2FABtn"),
  deleteAccountBtn: domHelper.query("#deleteAccountBtn"),
};

function formatMemberSince(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function genresToDisplay(genres) {
  if (!genres) return "Not set";
  if (Array.isArray(genres)) return genres.length ? genres.join(", ") : "Not set";
  if (typeof genres === "string") return genres.trim() || "Not set";
  return "Not set";
}

function applyUserToUI(user) {
  if (!user) return;
  if (ui.userName) ui.userName.textContent = user.name || "Not set";
  if (ui.userEmail) ui.userEmail.textContent = user.email || "Not set";
  if (ui.memberSince) ui.memberSince.textContent = formatMemberSince(user.date_joined);
  const role = user.role || "";
  if (ui.userRole) {
    ui.userRole.textContent =
      role === "ADMIN" || role === "admin" ? "Administrator" : "Reader";
  }
  if (ui.favoriteGenres) ui.favoriteGenres.textContent = genresToDisplay(user.favorite_genres);
  if (ui.readingGoal) {
    ui.readingGoal.textContent = user.reading_goal_per_year
      ? `${user.reading_goal_per_year} books/year`
      : "Not set";
  }
  if (ui.notifications) {
    ui.notifications.textContent =
      user.email_notifications === false ? "Email disabled" : "Email enabled";
  }
}

async function loadProfileData() {
  try {
    const userData = await usersService.getProfile();
    Storage.setUser(userData);
    applyUserToUI(userData);
  } catch (error) {
    console.error("Error loading profile:", error);
    applyUserToUI(Auth.getCurrentUser());
  }
}

function setupEventListeners() {
  ui.editPersonalBtn?.addEventListener("click", () => {
    ui.personalInfo.style.display = "none";
    ui.editPersonalForm.style.display = "flex";
    ui.editNameInput.value = ui.userName.textContent;
    ui.editEmailInput.value = ui.userEmail.textContent;
  });

  ui.cancelPersonal?.addEventListener("click", () => {
    ui.personalInfo.style.display = "block";
    ui.editPersonalForm.style.display = "none";
  });

  ui.editPersonalForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      const updated = await usersService.updateProfile({
        name: ui.editNameInput.value.trim(),
      });
      Storage.setUser(updated);
      applyUserToUI(updated);
      ui.personalInfo.style.display = "block";
      ui.editPersonalForm.style.display = "none";
      alert("Profile updated successfully!");
    } catch (err) {
      alert(err?.message || "Update failed.");
    }
  });

  ui.changePasswordBtn?.addEventListener("click", () => {
    ui.changePasswordForm.style.display = "flex";
  });

  ui.cancelPassword?.addEventListener("click", () => {
    ui.changePasswordForm.style.display = "none";
    ui.oldPasswordInput.value = "";
    ui.newPasswordInput.value = "";
    ui.confirmPasswordInput.value = "";
  });

  ui.changePasswordForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (ui.newPasswordInput.value !== ui.confirmPasswordInput.value) {
      alert("Passwords do not match!");
      return;
    }
    try {
      await usersService.changePassword({
        old_password: ui.oldPasswordInput.value,
        new_password: ui.newPasswordInput.value,
      });
      alert("Password changed successfully!");
      ui.changePasswordForm.style.display = "none";
      ui.oldPasswordInput.value = "";
      ui.newPasswordInput.value = "";
      ui.confirmPasswordInput.value = "";
    } catch (err) {
      alert(err?.message || "Password change failed.");
    }
  });

  ui.editPreferencesBtn?.addEventListener("click", async () => {
    let u = Auth.getCurrentUser();
    try {
      u = await usersService.getProfile();
    } catch {
      /* use cached */
    }
    ui.preferencesInfo.style.display = "none";
    ui.editPreferencesForm.style.display = "flex";
    ui.genresInput.value = genresToDisplay(u?.favorite_genres);
    if (u?.reading_goal_per_year) ui.readingGoalInput.value = String(u.reading_goal_per_year);
    if (ui.emailNotifications) ui.emailNotifications.checked = u?.email_notifications !== false;
  });

  ui.cancelPreferences?.addEventListener("click", () => {
    ui.preferencesInfo.style.display = "block";
    ui.editPreferencesForm.style.display = "none";
  });

  ui.editPreferencesForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const raw = ui.genresInput.value.trim();
    const favorite_genres = raw
      ? raw.split(",").map((s) => s.trim()).filter(Boolean)
      : [];
    const reading_goal_per_year = parseInt(ui.readingGoalInput.value, 10) || null;
    const email_notifications = ui.emailNotifications?.checked ?? true;
    try {
      const updated = await usersService.updateProfile({
        favorite_genres,
        reading_goal_per_year,
        email_notifications,
      });
      Storage.setUser(updated);
      applyUserToUI(updated);
      ui.preferencesInfo.style.display = "block";
      ui.editPreferencesForm.style.display = "none";
      alert("Preferences saved successfully!");
    } catch (err) {
      alert(err?.message || "Save failed.");
    }
  });

  ui.enable2FABtn?.addEventListener("click", () => {
    alert("Two-factor authentication setup coming soon!");
  });

  ui.deleteAccountBtn?.addEventListener("click", async () => {
    if (!confirm("Are you sure you want to delete your account? This deactivates your login.")) return;
    if (!confirm("Final confirmation: deactivate this account?")) return;
    try {
      await usersService.deleteAccount();
      Auth.logout({ redirect: false });
      window.location.href = hrefPage("login");
    } catch (err) {
      alert(err?.message || "Could not deactivate account.");
    }
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  if (!Auth.isAuthenticated()) {
    window.location.href = hrefPage("login");
    return;
  }
  if (Auth.isAdmin()) {
    window.location.href = hrefPage("adminDashboard");
    return;
  }
  await loadProfileData();
  setupEventListeners();
});
