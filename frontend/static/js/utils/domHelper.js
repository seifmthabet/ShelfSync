export const domHelper = {
  // Element selection
  id: (selector) => document.getElementById(selector),

  query: (selector) => document.querySelector(selector),

  queryAll: (selector) => document.querySelectorAll(selector),

  // Element creation
  create: (tag, options = {}) => {
    const element = document.createElement(tag);
    if (options.id) element.id = options.id;
    if (options.class) element.className = options.class;
    if (options.text) element.textContent = options.text;
    if (options.html) element.innerHTML = options.html;
    if (options.attributes) {
      Object.entries(options.attributes).forEach(([key, value]) => {
        element.setAttribute(key, value);
      });
    }
    return element;
  },

  // Text and HTML
  setText: (selector, text) => {
    const element = typeof selector === 'string' ? domHelper.query(selector) : selector;
    if (element) element.textContent = text;
  },

  getText: (selector) => {
    const element = typeof selector === 'string' ? domHelper.query(selector) : selector;
    return element ? element.textContent : '';
  },

  setHtml: (selector, html) => {
    const element = typeof selector === 'string' ? domHelper.query(selector) : selector;
    if (element) element.innerHTML = html;
  },

  getHtml: (selector) => {
    const element = typeof selector === 'string' ? domHelper.query(selector) : selector;
    return element ? element.innerHTML : '';
  },

  // Classes
  addClass: (selector, className) => {
    const element = typeof selector === 'string' ? domHelper.query(selector) : selector;
    if (element) element.classList.add(className);
  },

  removeClass: (selector, className) => {
    const element = typeof selector === 'string' ? domHelper.query(selector) : selector;
    if (element) element.classList.remove(className);
  },

  toggleClass: (selector, className) => {
    const element = typeof selector === 'string' ? domHelper.query(selector) : selector;
    if (element) element.classList.toggle(className);
  },

  hasClass: (selector, className) => {
    const element = typeof selector === 'string' ? domHelper.query(selector) : selector;
    return element ? element.classList.contains(className) : false;
  },

  // Attributes
  attr: (selector, name, value = null) => {
    const element = typeof selector === 'string' ? domHelper.query(selector) : selector;
    if (!element) return null;
    if (value === null) return element.getAttribute(name);
    element.setAttribute(name, value);
  },

  removeAttr: (selector, name) => {
    const element = typeof selector === 'string' ? domHelper.query(selector) : selector;
    if (element) element.removeAttribute(name);
  },

  // Styles
  css: (selector, properties) => {
    const element = typeof selector === 'string' ? domHelper.query(selector) : selector;
    if (element) {
      Object.entries(properties).forEach(([key, value]) => {
        element.style[key] = value;
      });
    }
  },

  show: (selector) => {
    const element = typeof selector === 'string' ? domHelper.query(selector) : selector;
    if (element) element.style.display = '';
  },

  hide: (selector) => {
    const element = typeof selector === 'string' ? domHelper.query(selector) : selector;
    if (element) element.style.display = 'none';
  },

  // Events
  on: (selector, event, handler) => {
    const element = typeof selector === 'string' ? domHelper.query(selector) : selector;
    if (element) element.addEventListener(event, handler);
  },

  off: (selector, event, handler) => {
    const element = typeof selector === 'string' ? domHelper.query(selector) : selector;
    if (element) element.removeEventListener(event, handler);
  },

  once: (selector, event, handler) => {
    const element = typeof selector === 'string' ? domHelper.query(selector) : selector;
    if (element) element.addEventListener(event, handler, { once: true });
  },

  // Form helpers
  getFormData: (selector) => {
    const form = typeof selector === 'string' ? domHelper.query(selector) : selector;
    if (!form) return {};
    const formData = new FormData(form);
    const data = {};
    formData.forEach((value, key) => {
      data[key] = value;
    });
    return data;
  },

  setFormData: (selector, data) => {
    const form = typeof selector === 'string' ? domHelper.query(selector) : selector;
    if (!form) return;
    Object.entries(data).forEach(([key, value]) => {
      const field = form.elements[key];
      if (field) field.value = value;
    });
  },

  clearForm: (selector) => {
    const form = typeof selector === 'string' ? domHelper.query(selector) : selector;
    if (form) form.reset();
  },

  disableForm: (selector, disabled = true) => {
    const form = typeof selector === 'string' ? domHelper.query(selector) : selector;
    if (form) {
      Array.from(form.elements).forEach(field => {
        field.disabled = disabled;
      });
    }
  },

  // DOM manipulation
  append: (parent, child) => {
    const parentEl = typeof parent === 'string' ? domHelper.query(parent) : parent;
    const childEl = typeof child === 'string' ? domHelper.query(child) : child;
    if (parentEl && childEl) parentEl.appendChild(childEl);
  },

  prepend: (parent, child) => {
    const parentEl = typeof parent === 'string' ? domHelper.query(parent) : parent;
    const childEl = typeof child === 'string' ? domHelper.query(child) : child;
    if (parentEl && childEl) parentEl.insertBefore(childEl, parentEl.firstChild);
  },

  remove: (selector) => {
    const element = typeof selector === 'string' ? domHelper.query(selector) : selector;
    if (element) element.remove();
  },

  // Scrolling
  scrollTo: (selector, smooth = true) => {
    const element = typeof selector === 'string' ? domHelper.query(selector) : selector;
    if (element) {
      element.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    }
  },

  // Utilities
  ready: (callback) => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback);
    } else {
      callback();
    }
  },

  closest: (selector, targetSelector) => {
    const element = typeof selector === 'string' ? domHelper.query(selector) : selector;
    return element ? element.closest(targetSelector) : null;
  }
};
