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

export const LIBRARY_COMMUNITY_SLUGS = [
  'motion-makers',
  'quiet-panels',
  'midnight-archive',
] as const;

export const LIBRARY_ENTITY_TYPES = [
  'works',
  'creators',
  'communities',
  'tags',
  'fandoms',
  'characters',
] as const;

export const LIBRARY_CREATOR_IDS = [
  'creator-miravale',
  'creator-junipermoss',
  'creator-ayanorth',
  'creator-tomasgrey',
  'creator-emihoshino',
  'creator-solmercer',
  'creator-rincalder',
  'creator-noorstatic',
] as const;

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

export const MOTUS_LIBRARY_CREATORS: readonly LibraryCreator[] = [
  {
    id: 'creator-miravale',
    routeHandle: 'miravale',
    displayHandle: '@miravale',
    name: 'Mira Vale',
    bio: 'Science-fiction cartoonist building quiet mysteries from maps, light, and impossible signals.',
    banner: 'linear-gradient(125deg, #18192a, #45326e 52%, #365f70)',
    accent: '#a7eef2',
    communitySlugs: ['motion-makers'],
    featuredWorkSlug: 'the-last-signal',
  },
  {
    id: 'creator-junipermoss',
    routeHandle: 'junipermoss',
    displayHandle: '@junipermoss',
    name: 'Juniper Moss',
    bio: 'Illustrator of cozy fantasy, practical magic, and the meals that turn strangers into family.',
    banner: 'linear-gradient(125deg, #263a35, #5e412d 58%, #9a7047)',
    accent: '#ffd693',
    communitySlugs: ['quiet-panels'],
    featuredWorkSlug: 'tea-at-the-edge-of-magic',
  },
  {
    id: 'creator-ayanorth',
    routeHandle: 'ayanorth',
    displayHandle: '@ayanorth',
    name: 'Aya North',
    bio: 'Motion-comic director pairing romance, performance, and electric color with rhythm-led animation.',
    banner: 'linear-gradient(125deg, #25152c, #803158 56%, #365f9b)',
    accent: '#ff9bd1',
    communitySlugs: ['motion-makers'],
    featuredWorkSlug: 'neon-hearts-club',
  },
  {
    id: 'creator-tomasgrey',
    routeHandle: 'tomasgrey',
    displayHandle: '@tomasgrey',
    name: 'Tomas Grey',
    bio: 'Horror artist interested in unreliable architecture, inherited memory, and weather with motives.',
    banner: 'linear-gradient(125deg, #111719, #2e4042 55%, #625847)',
    accent: '#a9c7c4',
    communitySlugs: ['midnight-archive'],
    featuredWorkSlug: 'the-house-below-rain',
  },
  {
    id: 'creator-emihoshino',
    routeHandle: 'emihoshino',
    displayHandle: '@emihoshino',
    name: 'Emi Hoshino',
    bio: 'Page-comic author drawing family dramas through paper craft, letters, and small acts of repair.',
    banner: 'linear-gradient(125deg, #34273b, #875b66 56%, #c29f77)',
    accent: '#ffe1bb',
    communitySlugs: ['quiet-panels'],
    featuredWorkSlug: 'paper-moons-of-kyoto',
  },
  {
    id: 'creator-solmercer',
    routeHandle: 'solmercer',
    displayHandle: '@solmercer',
    name: 'Sol Mercer',
    bio: 'Fantasy cartoonist making hopeful machines, rebellious gardens, and stories about shared stewardship.',
    banner: 'linear-gradient(125deg, #192723, #53663a 55%, #97633b)',
    accent: '#e8ff82',
    communitySlugs: ['motion-makers'],
    featuredWorkSlug: 'iron-orchard',
  },
  {
    id: 'creator-rincalder',
    routeHandle: 'rincalder',
    displayHandle: '@rincalder',
    name: 'Rin Calder',
    bio: 'Action artist choreographing sky cities, courier routes, and character-driven motion in Spanish and English.',
    banner: 'linear-gradient(125deg, #172c43, #285f79 54%, #c47742)',
    accent: '#8ce8ff',
    communitySlugs: ['motion-makers'],
    featuredWorkSlug: 'cloudbreak-courier',
  },
  {
    id: 'creator-noorstatic',
    routeHandle: 'noorstatic',
    displayHandle: '@noorstatic',
    name: 'Noor Static',
    bio: 'Archive-fiction creator exploring damaged images, haunted preservation, and transformative fanwork.',
    banner: 'linear-gradient(125deg, #171722, #514365 54%, #406362)',
    accent: '#c7bcff',
    communitySlugs: ['midnight-archive'],
    featuredWorkSlug: 'afterimage-archive',
  },
];

export const MOTUS_LIBRARY_WORKS: readonly LibraryWork[] = [
  {
    slug: 'the-last-signal',
    title: 'The Last Signal',
    creatorId: 'creator-miravale',
    creator: 'Mira Vale',
    creatorHandle: '@miravale',
    origin: 'original',
    contentWarningIds: [],
    genre: 'Science fiction',
    communitySlugs: ['motion-makers'],
    format: 'Vertical scroll',
    status: 'Ongoing',
    rating: 'Teen',
    language: 'English',
    chapterCount: 12,
    description:
      'A cartographer follows a light that should not exist across a flooded satellite city.',
    tags: ['mystery', 'space', 'slow burn'],
    characters: ['Mira', 'The Signal'],
    fandom: null,
    palette: 'linear-gradient(145deg, #3e2e67, #151624 62%, #4f7182)',
    accent: '#a7eef2',
    updatedLabel: 'Updated today',
    popularity: 98,
    staffPick: true,
  },
  {
    slug: 'tea-at-the-edge-of-magic',
    title: 'Tea at the Edge of Magic',
    creatorId: 'creator-junipermoss',
    creator: 'Juniper Moss',
    creatorHandle: '@junipermoss',
    origin: 'original',
    contentWarningIds: [],
    genre: 'Fantasy',
    communitySlugs: ['quiet-panels'],
    format: 'Hybrid',
    status: 'Completed',
    rating: 'General',
    language: 'English',
    chapterCount: 18,
    description:
      'A quiet tea shop serves every realm except the one its owner needs to reach.',
    tags: ['cozy', 'found family', 'witches'],
    characters: ['Juniper', 'Mallow'],
    fandom: null,
    palette: 'linear-gradient(145deg, #60432e, #263a35 58%, #ad8050)',
    accent: '#ffd693',
    updatedLabel: 'Complete series',
    popularity: 92,
  },
  {
    slug: 'neon-hearts-club',
    title: 'Neon Hearts Club',
    creatorId: 'creator-ayanorth',
    creator: 'Aya North',
    creatorHandle: '@ayanorth',
    origin: 'original',
    contentWarningIds: [],
    genre: 'Romance',
    communitySlugs: ['motion-makers'],
    format: 'Motion comic',
    status: 'Ongoing',
    rating: 'Teen',
    language: 'English',
    chapterCount: 9,
    description:
      'Two rival musicians inherit the same midnight stage and a song neither remembers writing.',
    tags: ['music', 'rivals', 'city nights'],
    characters: ['Aya', 'Niko'],
    fandom: null,
    palette: 'linear-gradient(145deg, #8a315c, #24162d 60%, #3f67a6)',
    accent: '#ff9bd1',
    updatedLabel: 'Updated 2 days ago',
    popularity: 96,
    staffPick: true,
  },
  {
    slug: 'the-house-below-rain',
    title: 'The House Below Rain',
    creatorId: 'creator-tomasgrey',
    creator: 'Tomas Grey',
    creatorHandle: '@tomasgrey',
    origin: 'original',
    contentWarningIds: ['horror-imagery', 'distressing-themes'],
    genre: 'Horror',
    communitySlugs: ['midnight-archive'],
    format: 'Vertical scroll',
    status: 'Hiatus',
    rating: 'Mature',
    language: 'English',
    chapterCount: 7,
    description:
      'Every storm reveals one more room beneath a house that has no cellar.',
    tags: ['folk horror', 'rain', 'memory'],
    characters: ['Ivo', 'Mother Rain'],
    fandom: null,
    palette: 'linear-gradient(145deg, #28383a, #111719 58%, #665c4c)',
    accent: '#a9c7c4',
    updatedLabel: 'On hiatus',
    popularity: 86,
  },
  {
    slug: 'paper-moons-of-kyoto',
    title: 'Paper Moons of Kyoto',
    creatorId: 'creator-emihoshino',
    creator: 'Emi Hoshino',
    creatorHandle: '@emihoshino',
    origin: 'original',
    contentWarningIds: [],
    genre: 'Drama',
    communitySlugs: ['quiet-panels'],
    format: 'Page',
    status: 'Completed',
    rating: 'Teen',
    language: 'Japanese',
    chapterCount: 24,
    description:
      'A letterpress apprentice folds unsent apologies into moons that refuse to stay still.',
    tags: ['family', 'letters', 'coming of age'],
    characters: ['Emi', 'Ren'],
    fandom: null,
    palette: 'linear-gradient(145deg, #8c5d67, #35283c 58%, #cfad83)',
    accent: '#ffe1bb',
    updatedLabel: 'Complete series',
    popularity: 90,
    staffPick: true,
  },
  {
    slug: 'iron-orchard',
    title: 'Iron Orchard',
    creatorId: 'creator-solmercer',
    creator: 'Sol Mercer',
    creatorHandle: '@solmercer',
    origin: 'original',
    contentWarningIds: ['violence'],
    genre: 'Fantasy',
    communitySlugs: ['motion-makers'],
    format: 'Spread',
    status: 'Ongoing',
    rating: 'Teen',
    language: 'English',
    chapterCount: 15,
    description:
      'Mechanical fruit grows only for the village exile who was forbidden to harvest it.',
    tags: ['solarpunk', 'machines', 'rebellion'],
    characters: ['Sol', 'Pip'],
    fandom: null,
    palette: 'linear-gradient(145deg, #5c6e3f, #1a2724 58%, #a46c3f)',
    accent: '#e8ff82',
    updatedLabel: 'Updated this week',
    popularity: 88,
  },
  {
    slug: 'cloudbreak-courier',
    title: 'Cloudbreak Courier',
    creatorId: 'creator-rincalder',
    creator: 'Rin Calder',
    creatorHandle: '@rincalder',
    origin: 'original',
    contentWarningIds: [],
    genre: 'Action',
    communitySlugs: ['motion-makers'],
    format: 'Vertical scroll',
    status: 'Ongoing',
    rating: 'General',
    language: 'Spanish',
    chapterCount: 6,
    description:
      'A rooftop courier races weather itself to deliver one impossible blue envelope.',
    tags: ['adventure', 'sky city', 'friendship'],
    characters: ['Rin', 'Kite'],
    fandom: null,
    palette: 'linear-gradient(145deg, #2e6681, #172c43 58%, #d8894b)',
    accent: '#8ce8ff',
    updatedLabel: 'New release',
    popularity: 82,
  },
  {
    slug: 'afterimage-archive',
    title: 'Afterimage Archive',
    creatorId: 'creator-noorstatic',
    creator: 'Noor Static',
    creatorHandle: '@noorstatic',
    origin: 'fanwork',
    contentWarningIds: ['horror-imagery', 'distressing-themes'],
    genre: 'Mystery',
    communitySlugs: ['midnight-archive'],
    format: 'Motion comic',
    status: 'Completed',
    rating: 'Adults only',
    language: 'English',
    chapterCount: 11,
    description:
      'A conservator discovers that damaged photographs remember what happened outside their frames.',
    tags: ['archive', 'ghosts', 'analog'],
    characters: ['Noor', 'Frame 17'],
    fandom: 'The Static Room',
    palette: 'linear-gradient(145deg, #564768, #171722 58%, #486a69)',
    accent: '#c7bcff',
    updatedLabel: 'Complete series',
    popularity: 89,
  },
];

export const MOTUS_LIBRARY_COMMUNITIES: readonly LibraryCommunity[] = [
  {
    slug: 'motion-makers',
    name: 'Motion Makers',
    description:
      'Editable motion studies, block recipes, and creator critique.',
    members: 1842,
    works: 386,
    privacy: 'Public',
    tags: ['animation', 'blocks', 'critique'],
    palette: 'linear-gradient(135deg, #2a2450, #7655c6)',
  },
  {
    slug: 'quiet-panels',
    name: 'Quiet Panels',
    description: 'Slow comics, visual essays, and deliberate page rhythm.',
    members: 967,
    works: 214,
    privacy: 'Public',
    tags: ['slice of life', 'essays', 'pacing'],
    palette: 'linear-gradient(135deg, #304d49, #8b7054)',
  },
  {
    slug: 'midnight-archive',
    name: 'Midnight Archive',
    description: 'A moderated home for horror, mystery, and uncanny fiction.',
    members: 731,
    works: 149,
    privacy: 'Private',
    tags: ['horror', 'mystery', 'moderated'],
    palette: 'linear-gradient(135deg, #242837, #585168)',
  },
];

export type LibraryWorkFilters = {
  query?: string;
  format?: LibraryWorkFormat | 'All';
  status?: LibraryWorkStatus | 'All';
  rating?: LibraryWorkRating | 'All';
  genre?: LibraryWorkGenre | 'All';
  origin?: LibraryWorkOrigin | 'All';
  communitySlug?: LibraryCommunitySlug | 'All';
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
