import { domHelper } from "../utils/domHelper.js";
import { Auth } from "../core/auth.js";

// Navigation
const homeButton = document.getElementById("navbar__brand");
homeButton.addEventListener("click", () => {
    window.location.href = "../index.html";
});

const logoutButton = document.getElementById("btn-logout");
logoutButton.addEventListener("click", () => {
    Auth.logout();
    window.location.href = "loginPage.html";
});

// UI Elements
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

// Initialize
document.addEventListener("DOMContentLoaded", async () => {
    if (!Auth.isAuthenticated()) {
        window.location.href = "loginPage.html";
        return;
    }
    loadProfileData();
    setupEventListeners();
});

// Load profile data
async function loadProfileData() {
    try {
        // Mock data for now - replace with API call
        const userData = Auth.getUser() || {
            id: "1",
            name: "John Doe",
            email: "john@example.com",
            role: "user",
        };

        ui.userName.textContent = userData.name || "Not set";
        ui.userEmail.textContent = userData.email || "Not set";
        ui.memberSince.textContent = "January 2024";
        ui.userRole.textContent = userData.role === "admin" ? "Administrator" : "User";

        // Default preferences
        ui.favoriteGenres.textContent = "Not set";
        ui.notifications.textContent = "Email enabled";
        ui.readingGoal.textContent = "12 books/year";
    } catch (error) {
        console.error("Error loading profile:", error);
    }
}

// Setup event listeners
function setupEventListeners() {
    // Personal Info
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
        // TODO: Make API call to update profile
        ui.userName.textContent = ui.editNameInput.value;
        ui.userEmail.textContent = ui.editEmailInput.value;
        ui.personalInfo.style.display = "block";
        ui.editPersonalForm.style.display = "none";
        alert("Profile updated successfully!");
    });

    // Change Password
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

        // TODO: Make API call to change password
        alert("Password changed successfully!");
        ui.changePasswordForm.style.display = "none";
        ui.oldPasswordInput.value = "";
        ui.newPasswordInput.value = "";
        ui.confirmPasswordInput.value = "";
    });

    // Preferences
    ui.editPreferencesBtn?.addEventListener("click", () => {
        ui.preferencesInfo.style.display = "none";
        ui.editPreferencesForm.style.display = "flex";
        ui.genresInput.value = "Science Fiction, Mystery";
        ui.readingGoalInput.value = "12";
    });

    ui.cancelPreferences?.addEventListener("click", () => {
        ui.preferencesInfo.style.display = "block";
        ui.editPreferencesForm.style.display = "none";
    });

    ui.editPreferencesForm?.addEventListener("submit", async (e) => {
        e.preventDefault();
        ui.favoriteGenres.textContent = ui.genresInput.value || "Not set";
        ui.readingGoal.textContent = `${ui.readingGoalInput.value} books/year` || "Not set";
        ui.notifications.textContent = ui.emailNotifications.checked ? "Email enabled" : "Email disabled";
        ui.preferencesInfo.style.display = "block";
        ui.editPreferencesForm.style.display = "none";
        // TODO: Make API call to save preferences
        alert("Preferences saved successfully!");
    });

    // 2FA
    ui.enable2FABtn?.addEventListener("click", () => {
        alert("Two-factor authentication setup coming soon!");
    });

    // Delete Account
    ui.deleteAccountBtn?.addEventListener("click", () => {
        if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
            if (confirm("This is your final warning. Your account and all data will be permanently deleted.")) {
                // TODO: Make API call to delete account
                Auth.logout();
                window.location.href = "loginPage.html";
            }
        }
    });
}
