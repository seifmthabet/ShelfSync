import { usersService } from "../services/usersService.js";
import { ROUTES } from "../core/config.js";
import { Auth } from "../core/auth.js";

import { validators } from "../utils/validators.js"
import { domHelper } from "../utils/domHelper.js"

domHelper.ready(() => {
  const form = domHelper.id('loginForm');
  const loginMessage = domHelper.id('loginMessage');

  domHelper.on(form, 'submit', async (e) => {
    e.preventDefault();

    const data = domHelper.getFormData(form);
    const rules = {
      email: [
        validators.rules.required("Email"),
        validators.rules.email()
      ],
      password: [
        validators.rules.required("Password"),
      ]
    }

    const errors = validators.validateForm(data, rules);

    if (Object.keys(errors).length > 0) {
      domHelper.setText(loginMessage, errors.email || errors.password);
      domHelper.css(loginMessage, { color: 'red' });
      return;
    }

    try {
      domHelper.setText(loginMessage, "Authenticating...");
      domHelper.css(loginMessage, { color: 'green' });

      const response = await usersService.login({ email: data.email, password: data.password });

      if (response.access) {
        domHelper.setText(loginMessage, 'Login successful! Redirecting...');
        domHelper.css(loginMessage, { color: 'green' });
        setTimeout(() => {
          const user = response.user || Auth.getCurrentUser();
          const role = user?.role;
          const isAdmin = role === "ADMIN" || role === "admin";
          window.location.href = isAdmin ? ROUTES.adminDashboard : ROUTES.userDashboard;
        }, 1500);
      } else {
        domHelper.setText(loginMessage, response.message || 'Login failed. Please check your credentials.');
        domHelper.css(loginMessage, { color: 'red' });
      }

    } catch (error) {
      domHelper.setText(loginMessage, 'An error occurred while logging in.');
      domHelper.css(loginMessage, { color: 'red' });
      console.error('Login error:', error.message);
    }

  })
})

