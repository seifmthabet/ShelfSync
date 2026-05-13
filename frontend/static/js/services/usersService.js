import { apiClient } from "../core/apiClient.js"
import { Auth } from "../core/auth.js"
import { Storage } from "../core/storage.js"

export const usersService = {
  register: (payload) => {
    return apiClient.post("auth/register/", payload, { authRequired: false });
  },

  login: async (payload) => {
    const data = await apiClient.post("auth/login/", payload, { authRequired: false });

    Auth.saveSession({
      accessToken: data?.access,
      refreshToken: data?.refresh,
      user: data?.user || null,
    });

    return data;
  },
  refresh: async () => {
    const refresh = Storage.getRefreshToken();
    const data = await apiClient.post(
      "auth/token/refresh/",
      { refresh },
      { authRequired: false }
    );

    if (data?.access) {
      Storage.setAccessToken(data.access);
    }

    return data;
  },

  logout: async () => {
    try {
      const refresh = Storage.getRefreshToken();
      if (refresh) {
        await apiClient.post("auth/logout/", { refresh });
      }
    } finally {
      Auth.logout({ redirect: false });
    }
  },
  getProfile: () => {
    return apiClient.get("users/me/");
  },
  updateProfile: (payload) => {
    return apiClient.patch("users/me/", payload);
  },
  listAdminUsers: (query = {}) => {
    return apiClient.get("admin/users/", query);
  },
  adminDashboard: () => {
    return apiClient.get("admin/dashboard/");
  },
  getAllUsers : () => {
    return apiClient.get("admin/users/");
  },
  userDashboard: () => {
    return apiClient.get("users/me/dashboard/");
  },

  changePassword: (payload) => {
    return apiClient.post("users/me/change-password/", payload, { authRequired: true });
  },

  deleteAccount: () => {
    return apiClient.delete("users/me/", {}, { authRequired: true });
  },

  patchAdminUser: (id, payload) => {
    return apiClient.patch(`admin/users/${id}/`, payload, { authRequired: true });
  },
}
