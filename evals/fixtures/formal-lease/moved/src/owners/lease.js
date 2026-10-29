export function claim(lease, id) {
  if (lease.holders.length !== 0) return false;
  lease.holders.push(id);
  return true;
}

export function release(lease, id) {
  const at = lease.holders.indexOf(id);
  if (at < 0) return false;
  lease.holders.splice(at, 1);
  return true;
}

export function use(lease, id) {
  return lease.holders.length === 1 && lease.holders[0] === id;
}
