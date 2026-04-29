import { ROUTES } from '../core/config.js';
import { usersService } from '../services/usersService.js';
import { validators } from '../utils/validators.js';
import { domHelper } from '../utils/domHelper.js';


domHelper.ready(() => {
  const form = domHelper.id('signUpForm');
  const signupMessage = domHelper.id('signupMessage');
  const roleButtons = domHelper.queryAll('[data-role]');
  const selectedRoleInput = domHelper.id('selectedRole');
  const signInButton = domHelper.id('signInButton');

  roleButtons.forEach((btn) => {
    domHelper.on(btn, 'click', (e) => {
      e.preventDefault();
      roleButtons.forEach((b) => domHelper.removeClass(b, 'active'));
      domHelper.addClass(btn, 'active');
      domHelper.attr(selectedRoleInput, 'value', domHelper.attr(btn, 'data-role'));
    });
  });

  if (signInButton) {
    domHelper.on(signInButton, 'click', () => {
      window.location.href = ROUTES.login;
    })
  }


  if (form) {
    domHelper.on(form, 'submit', async (e) => {
      e.preventDefault();

      const data = domHelper.getFormData(form);
      const rules = {
        fullName: [
          validators.rules.required("Full Name"),
        ],
        email: [
          validators.rules.required("Email"),
          validators.rules.email()
        ],
        password: [
          validators.rules.required("Password"),
          validators.rules.password(),
        ],
        confirmPassword: [
          validators.rules.required("Confirm Password"),
        ]
      }

      const errors = validators.validateForm(data, rules);

      if (data.password !== data.confirmPassword) {
        errors.confirmPassword = "Passwords do not match";
      }

      if (!selectedRoleInput.value) {
        errors.role = "Please select a role";
      }

      if (Object.keys(errors).length > 0) {
        const firstError = Object.values(errors)[0];
        domHelper.setText(signupMessage, firstError);
        domHelper.css(signupMessage, { color: 'red' });
        return;
      }

      try {
        domHelper.setText(signupMessage, "Registering...");
        domHelper.css(signupMessage, { color: 'green' });

        const response = await usersService.register({
          name: data.fullName,
          email: data.email,
          password: data.password,
          role: selectedRoleInput.value,
        });


        domHelper.setText(signupMessage, 'Registration successful! Redirecting...');
        domHelper.css(signupMessage, { color: 'green' });
        setTimeout(() => {
          window.location.href = ROUTES.login;
        }, 1500);


      } catch (error) {
        domHelper.setText(signupMessage, error.message || 'An error occurred while signing up.');
        domHelper.css(signupMessage, { color: 'red' });
        console.error('Signup error:', error.message);
      }
    })
  }
})