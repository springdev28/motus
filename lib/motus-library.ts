import {
  createDefaultProject,
  createWorkMetadata,
  replaceMotionEvent,
  type ContentRating,
  type MotusProject,
  type MotionEventBlockKind,
} from './motus-model.ts';

export const LIBRARY_WORK_FORMATS = [
  'Vertical scroll',
  'Page',
  'Spread',
  'Motion comic',
  'Hybrid',
] as const;

export const LIBRARY_WORK_STATUSES = [
  'Ongoing',
  'Completed',
  'Hiatus',
] as const;

export const LIBRARY_WORK_RATINGS = [
  'General',
  'Teen',
  'Mature',
  'Adults only',
] as const;

export const LIBRARY_WORK_GENRES = [
  'Action',
  'Drama',
  'Fantasy',
  'Horror',
  'Mystery',
  'Romance',
  'Science fiction',
] as const;

export const LIBRARY_WORK_ORIGINS = ['original', 'fanwork'] as const;

export const LIBRARY_COMMUNITY_SLUGS: readonly string[] = [];

export const LIBRARY_ENTITY_TYPES = [
  'works',
  'creators',
  'communities',
  'tags',
  'fandoms',
  'characters',
] as const;

export const LIBRARY_CREATOR_IDS: readonly string[] = [];

export const LIBRARY_CONTENT_WARNING_IDS = [
  'violence',
  'horror-imagery',
  'distressing-themes',
  'substance-use',
  'sexual-content',
] as const;

export const LIBRARY_CONTENT_WARNING_LABELS = {
  violence: 'Violence',
  'horror-imagery': 'Horror imagery',
  'distressing-themes': 'Distressing themes',
  'substance-use': 'Substance use',
  'sexual-content': 'Sexual content',
} as const;

export type LibraryWorkFormat = (typeof LIBRARY_WORK_FORMATS)[number];
export type LibraryWorkStatus = (typeof LIBRARY_WORK_STATUSES)[number];
export type LibraryWorkRating = (typeof LIBRARY_WORK_RATINGS)[number];
export type LibraryWorkGenre = (typeof LIBRARY_WORK_GENRES)[number];
export type LibraryEntityType = (typeof LIBRARY_ENTITY_TYPES)[number];
export type LibraryCreatorId = (typeof LIBRARY_CREATOR_IDS)[number];
export type LibraryWorkOrigin = (typeof LIBRARY_WORK_ORIGINS)[number];
export type LibraryCommunitySlug = (typeof LIBRARY_COMMUNITY_SLUGS)[number];
export type LibraryContentWarningId =
  (typeof LIBRARY_CONTENT_WARNING_IDS)[number];

export type CatalogPreviewLayout = {
  projectFormat: MotusProject['format'];
  label: 'Page' | 'Spread' | 'Vertical';
  native: boolean;
};

export function getCatalogPreviewLayout(
  format: LibraryWorkFormat,
): CatalogPreviewLayout {
  if (format === 'Page') {
    return { projectFormat: 'page', label: 'Page', native: true };
  }
  if (format === 'Spread') {
    return { projectFormat: 'spread', label: 'Spread', native: true };
  }
  return {
    projectFormat: 'vertical-scroll',
    label: 'Vertical',
    native: format === 'Vertical scroll',
  };
}

export type LibraryCreator = {
  id: LibraryCreatorId;
  routeHandle: string;
  displayHandle: string;
  name: string;
  bio: string;
  banner: string;
  accent: string;
  communitySlugs: readonly LibraryCommunitySlug[];
  featuredWorkSlug: string;
};

export type LibraryWork = {
  slug: string;
  title: string;
  creatorId: LibraryCreatorId;
  creator: string;
  creatorHandle: string;
  origin: LibraryWorkOrigin;
  contentWarningIds: readonly LibraryContentWarningId[];
  genre: LibraryWorkGenre;
  communitySlugs: readonly LibraryCommunitySlug[];
  format: LibraryWorkFormat;
  status: LibraryWorkStatus;
  rating: LibraryWorkRating;
  language: string;
  chapterCount: number;
  description: string;
  tags: readonly string[];
  characters: readonly string[];
  fandom: string | null;
  palette: string;
  accent: string;
  updatedLabel: string;
  popularity: number;
  staffPick?: boolean;
};

export type LibraryCommunity = {
  slug: LibraryCommunitySlug;
  name: string;
  description: string;
  members: number;
  works: number;
  privacy: 'Public' | 'Private';
  tags: readonly string[];
  palette: string;
};

export const MOTUS_LIBRARY_CREATORS: readonly LibraryCreator[] = [];

export const MOTUS_LIBRARY_WORKS: readonly LibraryWork[] = [];

export const MOTUS_LIBRARY_COMMUNITIES: readonly LibraryCommunity[] = [];

export type LibraryWorkFilters = {
  query?: string;
  language?: string;
  format?: LibraryWorkFormat | 'All';
  status?: LibraryWorkStatus | 'All';
  rating?: LibraryWorkRating | 'All';
  genre?: LibraryWorkGenre | 'All';
  origin?: LibraryWorkOrigin | 'All';
  communitySlug?: LibraryCommunitySlug;
  followedSlugs?: ReadonlySet<string>;
  followedOnly?: boolean;
};

const normalizeSearch = (value: string) =>
  value.trim().toLocaleLowerCase().replace(/\s+/g, ' ');

export function filterLibraryWorks(
  works: readonly LibraryWork[],
  filters: LibraryWorkFilters,
): LibraryWork[] {
  const query = normalizeSearch(filters.query ?? '');
  return works.filter((work) => {
    if (
      filters.language &&
      filters.language !== 'All' &&
      work.language !== filters.language
    )
      return false;
    if (
      filters.format &&
      filters.format !== 'All' &&
      work.format !== filters.format
    )
      return false;
    if (
      filters.status &&
      filters.status !== 'All' &&
      work.status !== filters.status
    )
      return false;
    if (
      filters.rating &&
      filters.rating !== 'All' &&
      work.rating !== filters.rating
    )
      return false;
    if (
      filters.genre &&
      filters.genre !== 'All' &&
      work.genre !== filters.genre
    )
      return false;
    if (
      filters.origin &&
      filters.origin !== 'All' &&
      work.origin !== filters.origin
    )
      return false;
    if (
      filters.communitySlug &&
      filters.communitySlug !== 'All' &&
      !work.communitySlugs.includes(filters.communitySlug)
    )
      return false;
    if (filters.followedOnly && !filters.followedSlugs?.has(work.slug))
      return false;
    if (!query) return true;
    return [
      work.title,
      work.description,
      work.creator,
      work.creatorHandle,
      work.genre,
      work.format,
      work.status,
      work.rating,
      work.language,
      work.fandom ?? '',
      ...work.communitySlugs.map(
        (slug) => getLibraryCommunityBySlug(slug)?.name ?? '',
      ),
      ...work.tags,
      ...work.characters,
    ]
      .join(' ')
      .toLocaleLowerCase()
      .includes(query);
  });
}

export function getLibraryWork(slug: string): LibraryWork | null {
  return MOTUS_LIBRARY_WORKS.find((work) => work.slug === slug) ?? null;
}

export function getLibraryCommunityBySlug(
  slug: string,
): LibraryCommunity | null {
  return (
    MOTUS_LIBRARY_COMMUNITIES.find((community) => community.slug === slug) ??
    null
  );
}

export function getLibraryWorksForCommunity(
  slug: LibraryCommunitySlug,
): LibraryWork[] {
  return MOTUS_LIBRARY_WORKS.filter((work) =>
    work.communitySlugs.includes(slug),
  );
}

export function getLibraryCreatorByHandle(
  handle: string,
): LibraryCreator | null {
  const normalized = handle.trim().toLocaleLowerCase().replace(/^@/, '');
  return (
    MOTUS_LIBRARY_CREATORS.find(
      (creator) => creator.routeHandle.toLocaleLowerCase() === normalized,
    ) ?? null
  );
}

export function getLibraryCreatorById(
  id: LibraryCreatorId,
): LibraryCreator | null {
  return MOTUS_LIBRARY_CREATORS.find((creator) => creator.id === id) ?? null;
}

export function getLibraryWorksForCreator(id: LibraryCreatorId): LibraryWork[] {
  return MOTUS_LIBRARY_WORKS.filter((work) => work.creatorId === id).sort(
    (left, right) =>
      Number(right.staffPick ?? false) - Number(left.staffPick ?? false) ||
      right.popularity - left.popularity ||
      left.title.localeCompare(right.title),
  );
}

export function getLibraryCreatorProfile(handle: string): {
  creator: LibraryCreator;
  works: LibraryWork[];
  featuredWork: LibraryWork;
  communities: LibraryCommunity[];
  genres: string[];
  totalChapters: number;
} | null {
  const creator = getLibraryCreatorByHandle(handle);
  if (!creator) return null;
  const works = getLibraryWorksForCreator(creator.id);
  const featuredWork = works.find(
    (work) => work.slug === creator.featuredWorkSlug,
  );
  if (!featuredWork) return null;
  return {
    creator,
    works,
    featuredWork,
    communities: creator.communitySlugs
      .map((slug) =>
        MOTUS_LIBRARY_COMMUNITIES.find((community) => community.slug === slug),
      )
      .filter((community): community is LibraryCommunity => Boolean(community)),
    genres: [...new Set(works.map((work) => work.genre))].sort((left, right) =>
      left.localeCompare(right),
    ),
    totalChapters: works.reduce((total, work) => total + work.chapterCount, 0),
  };
}

export function parseStoredCreatorIdSet(
  value: string | null,
): Set<LibraryCreatorId> {
  if (!value) return new Set();
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return new Set();
    const validIds = new Set<string>(LIBRARY_CREATOR_IDS);
    return new Set(
      parsed.filter(
        (candidate): candidate is LibraryCreatorId =>
          typeof candidate === 'string' && validIds.has(candidate),
      ),
    );
  } catch {
    return new Set();
  }
}

export function migrateStoredCreatorHandles(
  value: string | null,
): Set<LibraryCreatorId> {
  if (!value) return new Set();
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return new Set();
    const aliases = new Map<string, LibraryCreatorId>();
    for (const creator of MOTUS_LIBRARY_CREATORS) {
      aliases.set(creator.routeHandle.toLocaleLowerCase(), creator.id);
      aliases.set(creator.displayHandle.toLocaleLowerCase(), creator.id);
    }
    const migrated = new Set<LibraryCreatorId>();
    for (const candidate of parsed.slice(0, 100)) {
      if (typeof candidate !== 'string') continue;
      const id = aliases.get(candidate.trim().toLocaleLowerCase());
      if (id) migrated.add(id);
    }
    return migrated;
  } catch {
    return new Set();
  }
}

export function parseStoredSlugSet(value: string | null): Set<string> {
  if (!value) return new Set();
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return new Set();
    const validSlugs = new Set(MOTUS_LIBRARY_WORKS.map((work) => work.slug));
    return new Set(
      parsed.filter(
        (candidate): candidate is string =>
          typeof candidate === 'string' && validSlugs.has(candidate),
      ),
    );
  } catch {
    return new Set();
  }
}

export type LibraryReadingProgress = Record<
  string,
  {
    chapterId: string;
    sceneId: string;
    updatedAt: string;
  }
>;

export function getCatalogChapterId(slug: string, chapterIndex: number) {
  return `catalog-preview-${slug}-chapter-${chapterIndex + 1}`;
}

export function getCatalogSceneId(
  slug: string,
  chapterIndex: number,
  sceneIndex: number,
) {
  return `${getCatalogChapterId(slug, chapterIndex)}-scene-${sceneIndex + 1}`;
}

export function parseStoredReadingProgress(
  value: string | null,
): LibraryReadingProgress {
  if (!value) return {};
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }
    const validSlugs = new Set(MOTUS_LIBRARY_WORKS.map((work) => work.slug));
    const progress: LibraryReadingProgress = {};
    for (const [slug, candidate] of Object.entries(parsed)) {
      if (
        !validSlugs.has(slug) ||
        !candidate ||
        typeof candidate !== 'object' ||
        Array.isArray(candidate)
      ) {
        continue;
      }
      const entry = candidate as Record<string, unknown>;
      const work = MOTUS_LIBRARY_WORKS.find((item) => item.slug === slug)!;
      const updatedAtValid =
        typeof entry.updatedAt === 'string' &&
        Number.isFinite(Date.parse(entry.updatedAt));
      if (!updatedAtValid) continue;
      if (
        typeof entry.chapterId === 'string' &&
        typeof entry.sceneId === 'string'
      ) {
        const chapterIndex = Array.from(
          { length: work.chapterCount },
          (_, index) => getCatalogChapterId(slug, index),
        ).indexOf(entry.chapterId);
        const validSceneIds =
          chapterIndex < 0
            ? []
            : Array.from({ length: 3 }, (_, sceneIndex) =>
                getCatalogSceneId(slug, chapterIndex, sceneIndex),
              );
        if (chapterIndex < 0 || !validSceneIds.includes(entry.sceneId)) {
          continue;
        }
        progress[slug] = {
          chapterId: entry.chapterId,
          sceneId: entry.sceneId,
          updatedAt: entry.updatedAt as string,
        };
        continue;
      }
      if (
        typeof entry.sceneIndex !== 'number' ||
        !Number.isFinite(entry.sceneIndex) ||
        !Number.isInteger(entry.sceneIndex) ||
        entry.sceneIndex < 0
      ) {
        continue;
      }
      progress[slug] = {
        chapterId: getCatalogChapterId(slug, 0),
        sceneId: getCatalogSceneId(slug, 0, Math.min(entry.sceneIndex, 2)),
        updatedAt: entry.updatedAt as string,
      };
    }
    return progress;
  } catch {
    return {};
  }
}

export function createCatalogPreviewProject(
  work: LibraryWork,
  _catalogIndex?: number,
): MotusProject {
  const preview = createDefaultProject();
  preview.id = `catalog-preview-${work.slug}`;
  preview.title = work.title;
  preview.creatorName = work.creator;
  preview.description = work.description;
  preview.tags = [...work.tags];
  const languages: Record<string, string> = {
    English: 'en',
    Turkish: 'tr',
    Spanish: 'es',
    French: 'fr',
    Japanese: 'ja',
  };
  preview.language = languages[work.language] ?? 'en';
  preview.visibility = 'public';
  const statuses = {
    Ongoing: 'ongoing',
    Completed: 'completed',
    Hiatus: 'hiatus',
  } as const;
  preview.metadata = createWorkMetadata(
    {
      contributorNames: [work.creator],
      workStatus: statuses[work.status],
      origin: work.origin === 'original' ? 'original' : null,
      fandom: work.fandom,
      genres: [work.genre],
      characters: [...work.characters],
      contentWarnings: work.contentWarningIds.map(
        (warningId) => LIBRARY_CONTENT_WARNING_LABELS[warningId],
      ),
      communityLinks: work.communitySlugs.flatMap((slug) => {
        const community = getLibraryCommunityBySlug(slug);
        return community ? [community.name] : [];
      }),
    },
    work.creator,
  );
  const ratings: Record<LibraryWorkRating, ContentRating> = {
    General: 'all-ages',
    Teen: 'teen',
    Mature: 'mature',
    'Adults only': 'adults-only',
  };
  preview.contentRating = ratings[work.rating];
  preview.format = getCatalogPreviewLayout(work.format).projectFormat;
  preview.publishedRevision = 0;
  preview.publications = [];
  preview.updatedAt = '2026-08-29T00:00:00.000Z';
  const previewEvents: readonly (readonly MotionEventBlockKind[])[] = [
    ['page-open', 'scene-enter', 'animation-finish'],
    ['element-appear', 'element-hover', 'scene-enter'],
    ['scene-enter', 'element-tap', 'element-hover'],
  ];
  const sourceScenes = preview.chapters[0].scenes.slice(0, 3);
  preview.chapters = Array.from(
    { length: work.chapterCount },
    (_, chapterIndex) => ({
      id: getCatalogChapterId(work.slug, chapterIndex),
      title: `Chapter ${chapterIndex + 1} of ${work.chapterCount}`,
      scenes: sourceScenes.map((scene, sceneIndex) => {
        const sceneCopy = structuredClone(scene);
        const sceneId = getCatalogSceneId(work.slug, chapterIndex, sceneIndex);
        return {
          ...sceneCopy,
          id: sceneId,
          name:
            sceneIndex === 0
              ? 'Opening beat'
              : sceneIndex === 1
                ? 'Turning point'
                : 'Last signal',
          background: work.palette,
          elements: sceneCopy.elements.map((element, elementIndex) => {
            const eventKind =
              previewEvents[sceneIndex]?.[elementIndex] ?? 'scene-enter';
            const blocks = replaceMotionEvent(element.motion.blocks, eventKind);
            if (eventKind === 'animation-finish' && blocks[0]) {
              blocks[0].sourceElementId = `${sceneId}-${Math.max(elementIndex, 1)}`;
            }
            return {
              ...element,
              id: `${sceneId}-${elementIndex + 1}`,
              motion: {
                ...element.motion,
                event: eventKind,
                blocks,
              },
              ...(element.type === 'text'
                ? {
                    text:
                      sceneIndex === 0
                        ? work.title
                        : sceneIndex === 1
                          ? work.description
                          : `${work.genre} in motion`,
                  }
                : {}),
              ...(element.type === 'speech'
                ? {
                    text:
                      sceneIndex === 0
                        ? `A Motus work by ${work.creator}.`
                        : sceneIndex === 1
                          ? work.tags.map((tag) => `#${tag}`).join('  ')
                          : `Chapter ${chapterIndex + 1} of ${work.chapterCount}.`,
                  }
                : {}),
            };
          }),
        };
      }),
    }),
  );
  preview.coverSceneId = preview.chapters[0].scenes[0].id;
  return preview;
}
