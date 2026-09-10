import {
  LIBRARY_ENTITY_TYPES,
  LIBRARY_COMMUNITY_SLUGS,
  LIBRARY_WORK_FORMATS,
  LIBRARY_WORK_STATUSES,
  LIBRARY_WORK_RATINGS,
  LIBRARY_WORK_GENRES,
  LIBRARY_WORK_ORIGINS,
} from './motus-library.ts';

import { MOTUS_LANGUAGES } from './motus-languages.ts';

export const DISCOVERY_LANGUAGES: readonly string[] = MOTUS_LANGUAGES.map(
  (language) => language[1],
);
export const DISCOVERY_SORTS = ['featured', 'title', 'chapters'] as const;
function choice<T extends string>(
  value: string | null,
  choices: readonly T[],
  fallback: T,
): T {
  return choices.includes(value as T) ? (value as T) : fallback;
}
export function readDiscoveryFilters(params: URLSearchParams) {
  return {
    entity: choice(params.get('entity'), LIBRARY_ENTITY_TYPES, 'works'),
    query: (params.get('q') ?? params.get('creator') ?? '').slice(0, 300),
    format: choice(
      params.get('format'),
      ['All', ...LIBRARY_WORK_FORMATS] as const,
      'All',
    ),
    status: choice(
      params.get('status'),
      ['All', ...LIBRARY_WORK_STATUSES] as const,
      'All',
    ),
    rating: choice(
      params.get('rating'),
      ['All', ...LIBRARY_WORK_RATINGS] as const,
      'All',
    ),
    genre: choice(
      params.get('genre'),
      ['All', ...LIBRARY_WORK_GENRES] as const,
      'All',
    ),
    origin: choice(
      params.get('origin'),
      ['All', ...LIBRARY_WORK_ORIGINS] as const,
      'All',
    ),
    communitySlug: choice(
      params.get('community'),
      ['All', ...LIBRARY_COMMUNITY_SLUGS] as const,
      'All',
    ),
    language: choice(
      params.get('language'),
      ['All', ...DISCOVERY_LANGUAGES],
      'All',
    ),
    sort: choice(params.get('sort'), DISCOVERY_SORTS, 'featured'),
    followedOnly: params.get('view') === 'following',
  };
}
export type DiscoveryFilters = ReturnType<typeof readDiscoveryFilters>;
export function discoverySearch(filters: DiscoveryFilters) {
  const params = new URLSearchParams();
  if (filters.entity !== 'works') params.set('entity', filters.entity);
  if (filters.query) params.set('q', filters.query);
  for (const key of [
    'format',
    'status',
    'rating',
    'genre',
    'origin',
    'language',
  ] as const) {
    if (filters[key] !== 'All') params.set(key, filters[key]);
  }
  if (filters.communitySlug !== 'All')
    params.set('community', filters.communitySlug);
  if (filters.sort !== 'featured') params.set('sort', filters.sort);
  if (filters.followedOnly) params.set('view', 'following');
  return params.size ? `?${params}` : '';
}
