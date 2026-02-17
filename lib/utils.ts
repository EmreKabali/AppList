import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("tr-TR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function generateEndDate(startDate: string | Date): string {
  const start = new Date(startDate);
  const end = new Date(start);
  end.setDate(end.getDate() + 14);
  return end.toISOString().split("T")[0];
}
