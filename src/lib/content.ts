import type { CollectionEntry } from "astro:content";

export function sortByDateDesc<T extends { data: { date: Date } }>(items: T[]): T[] {
  return [...items].sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("es", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(date);
}

export type BlogPost = CollectionEntry<"blog">;
export type Project = CollectionEntry<"projects">;
