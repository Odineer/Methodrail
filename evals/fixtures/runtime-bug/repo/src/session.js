/** @param {{ token?: string, expiresAt: string | number } | undefined} session expiresAt is an ISO-8601 string or epoch milliseconds. */
export function landingPath(session) {
  if (!session?.token) return "/login";
  return "/dashboard";
}
