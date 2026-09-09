const TZ = "America/Sao_Paulo";

export function todayISO(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
}

export function toDate(iso: string): Date {
  return new Date(`${iso}T12:00:00`);
}

export function toISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDays(iso: string, days: number): string {
  const d = toDate(iso);
  d.setDate(d.getDate() + days);
  return toISO(d);
}

/** Segunda-feira da semana do ISO informado. */
export function startOfWeek(iso: string): string {
  const d = toDate(iso);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return toISO(d);
}

export function startOfMonth(iso: string): string {
  const d = toDate(iso);
  d.setDate(1);
  return toISO(d);
}

export function addMonths(iso: string, months: number): string {
  const d = toDate(iso);
  d.setDate(1);
  d.setMonth(d.getMonth() + months);
  return toISO(d);
}

export function formatDate(iso: string | null | undefined, opts?: Intl.DateTimeFormatOptions) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat(
    "pt-BR",
    opts ?? { day: "2-digit", month: "2-digit", year: "numeric" },
  ).format(toDate(iso));
}

export function formatDayLabel(iso: string) {
  const label = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "short",
  }).format(toDate(iso));
  return label.replace(".", "").toUpperCase();
}

export function formatShortDay(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(toDate(iso));
}

export function monthLabel(iso: string) {
  const s = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(toDate(iso));
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function relativeDeadline(iso: string | null, today: string) {
  if (!iso) return "Sem prazo";
  if (iso === today) return "Hoje";
  if (iso === addDays(today, 1)) return "Amanhã";
  if (iso === addDays(today, -1)) return "Ontem";
  const diff = Math.round((toDate(iso).getTime() - toDate(today).getTime()) / 86400000);
  if (diff < 0) return `${Math.abs(diff)} dias atrás`;
  return `em ${diff} dias`;
}

export function timeRange(start: string | null, end: string | null, allDay: boolean) {
  if (allDay) return "Dia inteiro";
  if (start && end) return `${start} às ${end}`;
  if (start) return start;
  return "Sem horário";
}
