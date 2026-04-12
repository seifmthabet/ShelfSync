// Buttons actions
const loginButton = document.getElementById('login-button');
const signupButton = document.getElementById('signup-button');

loginButton.addEventListener('click', () => {
  window.location.href = 'pages/loginPage.html';
});	

signupButton.addEventListener('click', () => {
	window.location.href = 'pages/signUp.html';
});

