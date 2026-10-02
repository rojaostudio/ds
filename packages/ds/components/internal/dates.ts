// Date helpers for Calendar and DatePicker. Not exported. Dates travel as ISO strings (2026-09-30), local
// time, no hours: a day is a day wherever the person is.

export type IsoDate = string;

export function toIso(date: Date): IsoDate {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function fromIso(iso: IsoDate | undefined | null): Date | null {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.getMonth() === m - 1 && date.getDate() === d ? date : null;
}

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** Same day of the month in another month, clamped to its last day (31/01 + 1 month = 28 or 29/02). */
export function addMonths(date: Date, months: number) {
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const last = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(date.getDate(), last));
  return target;
}

/** dd/mm/aaaa → ISO, or null when the date does not exist (31/02). */
export function parseBr(text: string): IsoDate | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text.trim());
  if (!match) return null;
  const iso = `${match[3]}-${match[2]}-${match[1]}`;
  return fromIso(iso) ? iso : null;
}

export function formatBr(iso: IsoDate | undefined | null) {
  const date = fromIso(iso);
  if (!date) return '';
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
}

/** Keeps only digits and puts the slashes as the person types: 3009 → 30/09. */
export function maskBr(text: string) {
  const d = text.replace(/\D/g, '').slice(0, 8);
  if (d.length > 4) return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
  if (d.length > 2) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return d;
}

const longDate = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
const monthTitle = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' });

/** The full date in pt-BR words ("30 de setembro de 2026"): the name a screen reader hears for a day. */
export const dayName = (date: Date) => longDate.format(date);

/** "Setembro de 2026". */
export function monthName(date: Date) {
  const text = monthTitle.format(date);
  return text.charAt(0).toUpperCase() + text.slice(1);
}
