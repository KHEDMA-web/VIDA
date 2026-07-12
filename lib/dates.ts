export function localDate(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export const today = (): string => localDate();

export function lastNDays(n: number): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push(localDate(d));
  }
  return out;
}

export const monthKey = (): string => today().slice(0, 7);

export function previousMonthKey(): string {
  const d = new Date();
  d.setDate(1); // évite les débordements de fin de mois (ex : 31 mars - 1 mois)
  d.setMonth(d.getMonth() - 1);
  return localDate(d).slice(0, 7);
}

export function daysSince(dateStr: string): number {
  return Math.floor((new Date(today()).getTime() - new Date(dateStr).getTime()) / 86400000);
}
