function isExpired(session, now = Date.now()) {
  if (session.expiresAt == null) return false;
  const expiresAt = new Date(session.expiresAt).getTime();
  // Treat unparseable expiry values as expired (fail closed).
  return Number.isNaN(expiresAt) || expiresAt <= now;
}

export function landingPath(session, now = Date.now()) {
  if (!session?.token || isExpired(session, now)) return "/login";
  return "/dashboard";
}
