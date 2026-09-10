import type { BasicComic } from './motus-basic.ts';
export const READING_PREFERENCES_KEY = 'motus:reading-preferences:v1';
export type ReadingPreferences = {
  format: 'creator' | BasicComic['format'];
  direction: 'creator' | BasicComic['direction'];
  motion: boolean;
  rememberPosition: boolean;
};
export const DEFAULT_READING_PREFERENCES: ReadingPreferences = {
  format: 'creator',
  direction: 'creator',
  motion: true,
  rememberPosition: true,
};
export function parseReadingPreferences(value: unknown): ReadingPreferences {
  const p =
    value && typeof value === 'object'
      ? (value as Partial<ReadingPreferences>)
      : {};
  return {
    format: ['creator', 'scroll', 'page', 'spread'].includes(p.format ?? '')
      ? p.format!
      : 'creator',
    direction: ['creator', 'ltr', 'rtl'].includes(p.direction ?? '')
      ? p.direction!
      : 'creator',
    motion: typeof p.motion === 'boolean' ? p.motion : true,
    rememberPosition:
      typeof p.rememberPosition === 'boolean' ? p.rememberPosition : true,
  };
}
export function normalizeHandle(value: string) {
  return value.trim().toLowerCase();
}
export function validateHandle(value: string) {
  return /^[a-z][a-z0-9_]{2,29}$/.test(value)
    ? null
    : 'Use 3 to 30 lowercase letters, numbers, or underscores. Start with a letter.';
}
export type PlatformProfile = {
  id: string;
  handle: string;
  display_name: string;
  bio: string;
  created_at: string;
};
export type PlatformCommunity = {
  id: string;
  slug: string;
  name: string;
  description: string;
  rules: string;
  owner_id: string;
  created_at: string;
};
export type PlatformWork = {
  id: string;
  owner_id: string;
  title: string;
  summary: string;
  author: string;
  tags: string[];
  language: string;
  rating: string;
  status: string;
  format: BasicComic['format'];
  page_count: number;
  animated: boolean;
  cover: string;
  edition_path: string;
  community_id: string | null;
  published: boolean;
  updated_at: string;
};
export function filterPlatformWorks(
  works: PlatformWork[],
  query: string,
  rating: string,
  format: string,
  language: string,
) {
  const search = query.trim().toLocaleLowerCase();
  return works.filter(
    (work) =>
      (!search ||
        `${work.title} ${work.author} ${work.summary} ${work.tags.join(' ')}`
          .toLocaleLowerCase()
          .includes(search)) &&
      (rating === 'all' || work.rating === rating) &&
      (format === 'all' || work.format === format) &&
      (language === 'all' || work.language === language),
  );
}
