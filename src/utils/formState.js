"use strict";

const SENSITIVE_FIELD_NAMES = new Set([
  "_csrf",
  "csrf",
  "cvc",
  "cvv",
  "card_number",
  "iban",
]);
const PASSWORD_FIELD_PATTERN = /(^|_)password$/i;

function isPlainObject(value) {
  return Object.prototype.toString.call(value) === "[object Object]";
}

function isSensitiveFieldName(name) {
  const normalizedName = String(name || "").toLowerCase();
  return (
    SENSITIVE_FIELD_NAMES.has(normalizedName) ||
    PASSWORD_FIELD_PATTERN.test(normalizedName)
  );
}

export function sanitizeOldInput(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => sanitizeOldInput(item))
      .filter((item) => item !== undefined);
  }

  if (isPlainObject(value)) {
    return Object.entries(value).reduce((accumulator, [key, entryValue]) => {
      if (isSensitiveFieldName(key)) {
        return accumulator;
      }

      const sanitizedValue = sanitizeOldInput(entryValue);
      if (sanitizedValue !== undefined) {
        accumulator[key] = sanitizedValue;
      }

      return accumulator;
    }, {});
  }

  if (value === undefined) {
    return undefined;
  }

  return value;
}

export function getFirstValidationMessage(
  validation,
  fallback = "Formulaire invalide."
) {
  return validation?.issues?.[0]?.message || validation?.message || fallback;
}
