// Pure date helpers for DateInput.
// All ISO strings are LOCAL yyyy-mm-dd (no timezone shift) to match the native
// <input type="date"> value format the backend already expects.

export function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function fromISO(s: string | undefined | null): Date | null {
  if (!s) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return isNaN(d.getTime()) ? null : d;
}

// 6x7 grid of Dates covering the month of `viewDate`, padded with adjacent-month
// days so the first cell is always a Sunday. 42 cells = stable layout.
export function buildMonthGrid(viewDate: Date): Date[] {
  const first = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const start = new Date(first);
  start.setDate(1 - first.getDay()); // back up to the Sunday on/before the 1st
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}
