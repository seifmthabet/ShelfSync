const KEYS = {
  accessToken: "accessToken",
	refreshToken: "refreshToken",
	user: "user",
};

const safeParse = (json) => {
	try {
		return JSON.parse(json);
	} catch (error) {
		return null;
	}
};

export const Storage = {
	setAccessToken : (token) => {
		localStorage.setItem(KEYS.accessToken, token || "");
	},
	getAccessToken : () => {
		return localStorage.getItem(KEYS.accessToken) || "";
	},
	setRefreshToken : (token) => {
		localStorage.setItem(KEYS.refreshToken, token || "");
	},
	getRefreshToken : () => {
		return localStorage.getItem(KEYS.refreshToken) || "";
	},
	setUser : (user) => {
		localStorage.setItem(KEYS.user, JSON.stringify(user || {}));
	},
	getUser : () => {
		const userJson = localStorage.getItem(KEYS.user);
		if (!userJson) return null;
		return safeParse(userJson);
	},
	clearSession : () => {
		localStorage.removeItem(KEYS.accessToken);
		localStorage.removeItem(KEYS.refreshToken);
		localStorage.removeItem(KEYS.user);
	}
};