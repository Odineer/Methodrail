export function landingPath(session, now = Date.now()) {
  if (!session?.token) return "/login";
  // Fail closed: a missing or unparseable expiry is treated as expired.
  const expiresAt = new Date(session.expiresAt).getTime();
  if (!Number.isFinite(expiresAt) || expiresAt <= now) return "/login";
  return "/dashboard";
}
