export function landingPath(session, now = Date.now()) {
  if (!session?.token) return "/login";
  const { expiresAt } = session;
  if (!Number.isFinite(expiresAt) || expiresAt <= now) return "/login";
  return "/dashboard";
}
