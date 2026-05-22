import { format, parseISO } from "date-fns";

export function todayKey(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function formatDateKey(dateKey: string): string {
  return format(parseISO(dateKey), "M월 d일");
}

export function toDateKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}
