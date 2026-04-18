const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function mondayOfWeek(d: Date = new Date()): Date {
  const x = startOfDay(d);
  const day = x.getDay();
  const diff = (day + 6) % 7;
  x.setDate(x.getDate() - diff);
  return x;
}

export function formatWeekRange(d: Date = new Date()): string {
  const mon = mondayOfWeek(d);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  const monLabel = `${MONTHS[mon.getMonth()]} ${mon.getDate()}`;
  const sunLabel =
    mon.getMonth() === sun.getMonth()
      ? `${sun.getDate()}`
      : `${MONTHS[sun.getMonth()]} ${sun.getDate()}`;
  return `${monLabel}\u2013${sunLabel}`;
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
