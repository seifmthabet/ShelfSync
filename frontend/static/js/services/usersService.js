import { apiClient } from "../core/apiClient.js"
import { Auth } from "../core/auth.js"
import { Storage } from "../core/storage.js"

export const usersService = {
  register: (payload) => {
    return apiClient.post("/api/v1/auth/register/", payload, { authRequired: false });
  },

  login: async (payload) => {
    const data = await apiClient.post("/api/v1/auth/login/", payload, { authRequired: false });

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
      "/api/v1/auth/token/refresh/",
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
        await apiClient.post("/api/v1/auth/logout/", { refresh });
      }
    } finally {
      Auth.logout({ redirect: false });
    }
  },
  getProfile: () => {
    return apiClient.get("/api/v1/users/me/");
  },
  updateProfile: (payload) => {
    return apiClient.patch("/api/v1/users/me/", payload);
  },
  listAdminUsers: (query = {}) => {
    return apiClient.get("/api/v1/admin/users/", query);
  },
  adminDashboard: () => {
    return apiClient.get("/api/v1/admin/dashboard/")
  },
  getAllUsers : () => {
    return apiClient.get("/api/v1/admin/users/");
  }
}