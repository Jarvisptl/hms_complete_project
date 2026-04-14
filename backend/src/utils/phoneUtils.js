export function normalizeUSPhone(phone) {
  const digitsOnly = String(phone || "").replace(/\D/g, "");
  if (!digitsOnly) return "";

  const localDigits =
    digitsOnly.length === 11 && digitsOnly.startsWith("1")
      ? digitsOnly.slice(1)
      : digitsOnly;

  if (!/^\d{10}$/.test(localDigits)) {
    return null;
  }

  return `+1${localDigits}`;
}

export function getPhoneLookupVariants(phone) {
  if (!phone) return [];

  const normalized = normalizeUSPhone(phone);
  if (!normalized) return [];

  const localDigits = normalized.slice(2);
  return Array.from(
    new Set([phone, normalized, localDigits, `1${localDigits}`]),
  );
}
