export const config = {
	apiBaseUrl: 'http://localhost:8000/api/v1/',
	requestTimeoute: 15000, // 15 seconds
	tokenRefreshPath: 'auth/token/refresh/',
};

export const ROUTES = {
	home: "/index.html",
	login: "/pages/loginPage.html",
	signup: "/pages/signUp.html",
	userDashboard: "/pages/userDashboard.html",
	adminDashboard: "/pages/adminDashboard.html",
};