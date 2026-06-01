export function getAllowedEmails() {
  return new Set(
    (process.env.ALLOWED_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function hasAllowedEmailList() {
  return getAllowedEmails().size > 0;
}

export function isEmailAllowed(email?: string | null) {
  const allowedEmails = getAllowedEmails();

  if (allowedEmails.size === 0) {
    return true;
  }

  return Boolean(email && allowedEmails.has(email.toLowerCase()));
}

export function isExplicitlyAllowedEmail(email?: string | null) {
  return Boolean(email && getAllowedEmails().has(email.toLowerCase()));
}
