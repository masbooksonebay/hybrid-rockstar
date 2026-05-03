const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function daysUntil(iso: string): number {
  const target = startOfDay(new Date(iso));
  const today = startOfDay(new Date());
  const ms = target.getTime() - today.getTime();
  return Math.round(ms / 86400000);
}

export function formatRelativeDate(iso: string): string {
  const target = startOfDay(new Date(iso));
  const today = startOfDay(new Date());
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === -1) return "Yesterday";
  return `${MONTHS[target.getMonth()]} ${target.getDate()}`;
}
