// Reads the MachineFields values (count, d_<machine>_0, d_<machine>_1) from submitted form data
// → [{ discounts: [...] }, …]. The database checks the values again.
export function machineItems(fd) {
  const count = Math.min(5, Math.max(1, Number(fd.get('count')) || 1));
  return Array.from({ length: count }, (_, i) => ({
    discounts: [String(fd.get(`d_${i}_0`) || ''), String(fd.get(`d_${i}_1`) || '')]
      .filter(Boolean)
      .filter((v, k, x) => x.indexOf(v) === k),
  }));
}
