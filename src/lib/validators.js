// src/lib/validators.js

export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function isValidPhone(value) {
  const digits = value.replace(/[\s\-\+\(\)]/g, "");
  return /^\d{7,15}$/.test(digits);
}

export function isRequired(value) {
  return value !== null && value !== undefined && value.trim().length > 0;
}

export function validateResidentForm({ name, email, phone, houseNumber }) {
  const errors = {};

  if (!isRequired(name)) errors.name = "Name is required.";
  if (!isRequired(houseNumber))
    errors.houseNumber = "House number is required.";

  if (!isRequired(email)) errors.email = "Email is required.";
  else if (!isValidEmail(email)) errors.email = "Enter a valid email address.";

  if (!isRequired(phone)) errors.phone = "Phone number is required.";
  else if (!isValidPhone(phone))
    errors.phone = "Enter a valid phone number (7–15 digits).";

  return errors; // empty object = valid
}

export function validatePasswordForm({ current, next, confirm }) {
  const errors = {};

  if (!isRequired(current)) errors.current = "Current password is required.";

  if (!isRequired(next)) {
    errors.next = "New password is required.";
  } else if (next.length < 8) {
    errors.next = "Password must be at least 8 characters.";
  }

  if (!isRequired(confirm)) {
    errors.confirm = "Please confirm your new password.";
  } else if (next !== confirm) {
    errors.confirm = "Passwords do not match.";
  }

  return errors;
}
