import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ============================================================
// Date / time formatting utilities
// ============================================================

/** Format a date string to "3:30 PM" */
export function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Format a date string to "Mar 15" */
export function formatShortDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
}

/** Format a date string to "Saturday, March 15" */
export function formatLongDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

/** Get day of week name from a date string */
export function getDayOfWeek(dateString: string): string {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[new Date(dateString).getDay()];
}

// ============================================================
// Map utilities
// ============================================================

/** Calculate zoom level from commute radius in miles */
export function getZoomFromRadius(radiusMiles: number): number {
  return Math.max(9, Math.min(14, Math.round(13 - Math.log2(radiusMiles / 2.5))));
}
