export const formatters = {
  date: (dateString, options = {}) => {
    const date = new Date(dateString);
    if (isNaN(date)) return dateString;

    const { locale = 'en-US', style = 'short' } = options;
    if (style === 'full') return date.toLocaleDateString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    if (style === 'long') return date.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });
    return date.toLocaleDateString(locale);
  },

  time: (dateString, options = {}) => {
    const date = new Date(dateString);
    if (isNaN(date)) return dateString;
    const { locale = 'en-US', format = 'short' } = options;
    return date.toLocaleTimeString(locale, format === 'short' ? {} : { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  },

  currency: (amount, options = {}) => {
    const { currency = 'USD', locale = 'en-US' } = options;
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
  },

  rating: (value) => {
    const num = Number(value);
    return isNaN(num) ? 'N/A' : `${num.toFixed(1)}/5`;
  },

  truncate: (text, length = 50, suffix = '...') => {
    if (!text) return '';
    if (text.length <= length) return text;
    return text.substring(0, length - suffix.length) + suffix;
  },

  capitalize: (text) => {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  },

  capitalizeWords: (text) => {
    if (!text) return '';
    return text.split(' ').map(word => formatters.capitalize(word)).join(' ');
  },

  slug: (text) => {
    if (!text) return '';
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/^-+|-+$/g, '');
  },

  statusBadge: (status) => {
    const badges = {
      pending: { text: 'Pending', class: 'badge-warning' },
      approved: { text: 'Approved', class: 'badge-success' },
      rejected: { text: 'Rejected', class: 'badge-danger' },
      active: { text: 'Active', class: 'badge-success' },
      inactive: { text: 'Inactive', class: 'badge-secondary' },
      borrowed: { text: 'Borrowed', class: 'badge-info' },
      available: { text: 'Available', class: 'badge-success' }
    };
    return badges[status] || { text: status, class: 'badge-secondary' };
  },

  percentage: (value, total) => {
    if (total === 0) return '0%';
    return `${((value / total) * 100).toFixed(1)}%`;
  },

  toInitials: (name) => {
    if (!name) return '';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  },

  pluralize: (word, count) => {
    return count === 1 ? word : `${word}s`;
  },

  fileSize: (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
};