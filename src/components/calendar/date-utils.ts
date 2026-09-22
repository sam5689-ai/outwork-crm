import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  startOfDay,
  endOfDay,
  addDays,
  addWeeks,
  addMonths,
  format,
} from "date-fns";
import type { CalendarView } from "./types";

export function getRangeForView(
  view: CalendarView,
  anchor: Date
): { start: Date; end: Date } {
  switch (view) {
    case "month": {
      const start = startOfWeek(startOfMonth(anchor), { weekStartsOn: 0 });
      const end = endOfWeek(endOfMonth(anchor), { weekStartsOn: 0 });
      return { start, end: endOfDay(end) };
    }
    case "week": {
      const start = startOfWeek(anchor, { weekStartsOn: 0 });
      const end = endOfWeek(anchor, { weekStartsOn: 0 });
      return { start: startOfDay(start), end: endOfDay(end) };
    }
    case "day":
      return { start: startOfDay(anchor), end: endOfDay(anchor) };
    case "agenda":
      return { start: startOfDay(anchor), end: endOfDay(addDays(anchor, 30)) };
  }
}

export function navigateAnchor(
  view: CalendarView,
  anchor: Date,
  direction: 1 | -1
): Date {
  switch (view) {
    case "month":
      return addMonths(anchor, direction);
    case "week":
      return addWeeks(anchor, direction);
    case "day":
      return addDays(anchor, direction);
    case "agenda":
      return addDays(anchor, direction * 30);
  }
}

export function rangeLabel(view: CalendarView, anchor: Date): string {
  switch (view) {
    case "month":
      return format(anchor, "MMMM yyyy");
    case "week": {
      const start = startOfWeek(anchor, { weekStartsOn: 0 });
      const end = endOfWeek(anchor, { weekStartsOn: 0 });
      return `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`;
    }
    case "day":
      return format(anchor, "EEEE, MMMM d, yyyy");
    case "agenda":
      return `Next 30 days from ${format(anchor, "MMM d, yyyy")}`;
  }
}

/** Formats a Date for a `datetime-local` input value, in local time. */
export function toDatetimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

/** Formats a Date for a `date` input value, in local time. */
export function toDateValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
