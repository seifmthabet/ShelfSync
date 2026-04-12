import { config } from './config.js'
import { Storage } from './storage.js'
import { Auth } from './auth.js'

const withTimeout = (promise, timeout) => {
  let time = null;
  const timeoutPromise = new Promise((_, reject) => {
    time = setTimeout(() => {
      reject(new Error("Request timed out"));
    }, timeout);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (time) clearTimeout(time);
  });
}

const buildUrl = (path, query) => {
  const url = new URL(path, config.apiBaseUrl.endsWith('/') ? config.apiBaseUrl : config.apiBaseUrl + '/');
  if (query && typeof query === 'object') {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
    });
  }
  return url.toString();
}

const parseResponse = async (res) => {
  const isJson = (res.headers.get('content-type') || '').includes('application/json');
  const body = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const message =
      (typeof body === 'object' && body?.error?.message) ||
      (typeof body === 'object' && body?.detail) ||
      `HTTP ${res.status}`;

    const error = new Error(message);
    error.status = res.status;
    error.body = body;
    throw error;
  }

  return body;
}

const refreshAccessToken = async () => {
  const refreshToken = Storage.getRefreshToken();
  if (!refreshToken) return false;

  const response = await fetch(buildUrl(config.tokenRefreshPath), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) return false;
  const data = await response.json();
  if (!data?.access) return false;

  Storage.setAccessToken(data.access);
  return true;
}


export const request = async (path, { method = "GET", body, query, headers = {}, authRequired = true, ...option } = {}) => {
  const token = Storage.getAccessToken();

  const makeFetch = () => {
    return withTimeout(
      fetch(buildUrl(path, query), {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(authRequired && token ? { Authorization: `Bearer ${token}` } : {}),
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
        ...option,
      }),
      config.requestTimeoute
    );
  }

  try {
    const response = await makeFetch();
    return await parseResponse(response);
  } catch (error) {
    if (error?.status === 401 && authRequired) {
      const refreshed = await refreshAccessToken();
      if (!refreshed) {
        Auth.logout();
        throw new Error("Session expired. Please log in again.");
      }

      const retryResponse = await withTimeout(fetch(buildUrl(path, query), {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Storage.getAccessToken()}`,
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
        ...option,
      }),
        config.requestTimeoute
      );

      return await parseResponse(retryResponse);
    }
    throw error;
  }
}

export const apiClient = {
  get : (path, query, options = {}) => {
    return request(path, {...options, method: "GET", query });
  },
  post : (path, body, options = {}) => {
    return request(path, {...options, method: "POST", body });
  },
  patch: (path, body, options = {}) => {
    return request(path, {...options, method: "PATCH", body });
  },
  put : (path, body, options = {}) => {
    return request(path, {...options, method: "PUT", body });
  },
  delete : (path, body, options = {}) => {
    return request(path, {...options, method: "DELETE", body });
  }
}