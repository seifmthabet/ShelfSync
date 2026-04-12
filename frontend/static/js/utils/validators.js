export const validators = {
  email: (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  },
  password: (value) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return passwordRegex.test(value);
  },
  required: (value) => {
    return value && value.toString().trim() !== '';
  },
  minLength: (value, length) => {
    return value && value.toString().length >= length;
  },
  maxLength: (value, length) => {
    return value && value.toString().length <= length;
  },
  rating: (value) => {
    const num = Number(value);
    return !isNaN(num) && num >= 1 && num <= 5;
  },
  url: (value) => {
    try {
      new URL(value);
      return true;
    } catch (e) {
      return false;
    }
  },
  number: (value) => {
    return !isNaN(value) && value.toString().trim() !== '';
  },
  username: (value) => {
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return usernameRegex.test(value);
  },
  validateForm: (data, rules) => {
    const errors = {};
    for (const [field, fieldRules] of Object.entries(rules)) {
      const value = data[field];
      for (const rule of fieldRules) {
        if (!rule.validate(value)) {
          errors[field] = rule.message;
          break;
        }
      }
    }
    return errors;
  },
  rule: (message, validate) => {
    return { message, validate };
  },
  rules: {
    required: (fieldName) =>
      validators.rule(`${fieldName} is required`, (v) => validators.required(v)),

    email: () =>
      validators.rule('Invalid email address', (v) => validators.required(v) ? validators.email(v) : true),

    minLength: (min, fieldName) =>
      validators.rule(`${fieldName} must be at least ${min} characters`, (v) => validators.minLength(v, min)),

    maxLength: (max, fieldName) =>
      validators.rule(`${fieldName} must not exceed ${max} characters`, (v) => validators.maxLength(v, max)),

    password: () =>
      validators.rule('Password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, and one digit', (v) => validators.password(v)),

    rating: () =>
      validators.rule('Rating must be between 1 and 5', (v) => validators.rating(v)),

    username: () =>
      validators.rule('Username must be 3-20 characters (alphanumeric, _, -)', (v) => validators.username(v)),

    url: () =>
      validators.rule('Invalid URL', (v) => validators.required(v) ? validators.url(v) : true),

    number: () =>
      validators.rule('Must be a valid number', (v) => validators.number(v)),
  }
};