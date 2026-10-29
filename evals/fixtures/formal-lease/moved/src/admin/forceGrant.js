export function forceGrant(lease, id) {
  lease.holders.push(id);
  return true;
}
