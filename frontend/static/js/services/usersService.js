import { apiClient } from "../core/apiClient.js"
import { Auth } from "../core/auth.js"
import { Storage } from "../core/storage.js"

export const usersService = {
  register: (payload) => {
    return apiClient.post("/auth/register/", payload, { authRequired: false });
  },

  login: async (payload) => {
    const data = await apiClient.post("/auth/login/", payload, { authRequired: false });

    Auth.saveSession({
      access: data?.access,
      refresh: data?.refresh,
      user: data?.user || null,
    });

    return data;
  },
  refresh: async () => {
    const refresh = Storage.getRefreshToken();
    const data = await apiClient.post(
      "/auth/refresh/",
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
        await apiClient.post("/auth/logout/", { refresh });
      }
    } finally {
      Auth.logout({ redirect: false });
    }
  },
  getProfile: () => {
    return apiClient.get("/users/me/");
  },
  updateProfile: (payload) => {
    return apiClient.patch("/users/me/", payload);
  },
  listAdminUsers: (query = {}) => {
    return apiClient.get("/admin/users/", query);
  },
  adminDashboard: () => {
    return apiClient.get("/admin/dashboard/")
  },
  getAllUsers : () => {
    return apiClient.get("/admin/users/");
  }
}