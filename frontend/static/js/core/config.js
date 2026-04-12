export const config = {
	apiBaseUrl: 'http://localhost:8000/api',
	requestTimeoute: 15000, // 15 seconds
	tokenRefreshPath: '/auth/refresh',
};

export const ROUTES = {
	home: "/index.html",
	login: "/pages/loginPage.html",
	signup: "/pages/signUp.html",
	userDashboard: "/pages/userDashboard.html",
	adminDashboard: "/pages/adminDashboard.html",
};