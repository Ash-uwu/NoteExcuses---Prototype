const UNITS = [
  { ms: 86400000, label: "day" },
  { ms: 3600000, label: "hour" },
  { ms: 60000, label: "minute" },
] as const;

export function formatRelativeTime(timestamp: number, now = Date.now()): string {
  const diff = Math.max(0, now - timestamp);
  if (diff < 60000) return "just now";
  for (const { ms, label } of UNITS) {
    const n = Math.floor(diff / ms);
    if (n >= 1) {
      return `${n} ${label}${n === 1 ? "" : "s"} ago`;
    }
  }
  return "just now";
}
