import { ROUTES } from "./config.js";
import { Storage } from "./storage.js";

export const Auth = {
  isAuthenticated: () => {
    return !!Storage.getAccessToken();
  },
  getCurrentUser: () => {
    return Storage.getUser();
  },
  getRole: () => {
    const user = Storage.getUser();
    return user && user.role ? user.role : null;
  },
  isAdmin: () => {
    return this.getRole() === "admin";
  },
  saveSession: (payload) => {
    if (!payload) return;
    if (payload.accessToken) Storage.setAccessToken(payload.accessToken);
    if (payload.refreshToken) Storage.setRefreshToken(payload.refreshToken);
    if (payload.user) Storage.setUser(payload.user);
  },
  logout: (options = { redirect: true }) => {
    Storage.clearSession();
    if (options.redirect) {
      window.location.href = ROUTES.login;
    }
  },
  requireAuth: () => {
    if (!this.isAuthenticated()) {
      window.location.href = ROUTES.login;
      return false;
    }
    return true;
  },
  requireAdmin: () => {
    if (!this.isAuthenticated()) {
      window.location.href = ROUTES.login;
      return false;
    }
    if (!this.isAdmin()) {
      window.location.href = ROUTES.userDashboard;
      return false;
    }
    return true;
  }
}