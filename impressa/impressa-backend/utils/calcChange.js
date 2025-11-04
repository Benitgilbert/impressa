export default function calcChange(current, previous) {
  if (previous === 0) {
    if (current === 0) return "0%";
    return "New";
  }
  const change = ((current - previous) / previous) * 100;
  return `${change.toFixed(2)}%`;
}