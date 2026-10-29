export function beginClaim(lease, id) {
  lease.intent = id;
  return true;
}

export function finishClaim(lease, id) {
  if (lease.intent !== id) return false;
  lease.holders.push(id);
  lease.intent = null;
  return true;
}

export function release(lease, id) {
  const at = lease.holders.indexOf(id);
  if (at < 0) return false;
  lease.holders.splice(at, 1);
  return true;
}

export function use(lease, id) {
  return lease.holders.includes(id);
}
