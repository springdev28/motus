import {
  createDefaultProject,
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

export const LIBRARY_ENTITY_TYPES = [
  'works',
  'creators',
  'communities',
  'tags',
  'fandoms',
  'characters',
] as const;

export type LibraryWorkFormat = (typeof LIBRARY_WORK_FORMATS)[number];
export type LibraryWorkStatus = (typeof LIBRARY_WORK_STATUSES)[number];
export type LibraryWorkRating = (typeof LIBRARY_WORK_RATINGS)[number];
export type LibraryEntityType = (typeof LIBRARY_ENTITY_TYPES)[number];

export type LibraryWork = {
  slug: string;
  title: string;
  creator: string;
  creatorHandle: string;
  genre: string;
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
  slug: string;
  name: string;
  description: string;
  members: number;
  works: number;
  privacy: 'Public' | 'Private';
  tags: readonly string[];
  palette: string;
};

export const MOTUS_LIBRARY_WORKS: readonly LibraryWork[] = [
  {
    slug: 'the-last-signal',
    title: 'The Last Signal',
    creator: 'Mira Vale',
    creatorHandle: '@miravale',
    genre: 'Science fiction',
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
    creator: 'Juniper Moss',
    creatorHandle: '@junipermoss',
    genre: 'Fantasy',
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
    creator: 'Aya North',
    creatorHandle: '@ayanorth',
    genre: 'Romance',
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
    creator: 'Tomas Grey',
    creatorHandle: '@tomasgrey',
    genre: 'Horror',
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
    creator: 'Emi Hoshino',
    creatorHandle: '@emihoshino',
    genre: 'Drama',
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
    creator: 'Sol Mercer',
    creatorHandle: '@solmercer',
    genre: 'Fantasy',
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
    creator: 'Rin Calder',
    creatorHandle: '@rincalder',
    genre: 'Action',
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
    creator: 'Noor Static',
    creatorHandle: '@noorstatic',
    genre: 'Mystery',
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
    sceneIndex: number;
    updatedAt: string;
  }
>;

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
      if (
        typeof entry.sceneIndex !== 'number' ||
        !Number.isFinite(entry.sceneIndex) ||
        !Number.isInteger(entry.sceneIndex) ||
        entry.sceneIndex < 0 ||
        typeof entry.updatedAt !== 'string' ||
        !Number.isFinite(Date.parse(entry.updatedAt))
      ) {
        continue;
      }
      progress[slug] = {
        sceneIndex: entry.sceneIndex,
        updatedAt: entry.updatedAt,
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
  preview.chapterTitle = `Chapter 1 of ${work.chapterCount}`;
  preview.description = work.description;
  preview.tags = [...work.tags];
  preview.visibility = 'public';
  const ratings: Record<LibraryWorkRating, ContentRating> = {
    General: 'all-ages',
    Teen: 'teen',
    Mature: 'mature',
    'Adults only': 'adults-only',
  };
  preview.contentRating = ratings[work.rating];
  preview.publishedRevision = 1;
  preview.publications = [];
  preview.updatedAt = '2026-08-29T00:00:00.000Z';
  const previewEvents: readonly (readonly MotionEventBlockKind[])[] = [
    ['page-open', 'scene-enter', 'animation-finish'],
    ['element-appear', 'element-hover', 'scene-enter'],
    ['scene-enter', 'element-tap', 'element-hover'],
  ];
  preview.scenes = preview.scenes.slice(0, 3).map((scene, sceneIndex) => ({
    ...scene,
    id: `${preview.id}-scene-${sceneIndex + 1}`,
    name:
      sceneIndex === 0
        ? 'Opening beat'
        : sceneIndex === 1
          ? 'Turning point'
          : 'Last signal',
    background: work.palette,
    elements: scene.elements.map((element, elementIndex) => {
      const eventKind =
        previewEvents[sceneIndex]?.[elementIndex] ?? 'scene-enter';
      const blocks = replaceMotionEvent(element.motion.blocks, eventKind);
      if (eventKind === 'animation-finish' && blocks[0]) {
        blocks[0].sourceElementId = `${preview.id}-scene-${sceneIndex + 1}-${Math.max(elementIndex, 1)}`;
      }
      return {
        ...element,
        id: `${preview.id}-scene-${sceneIndex + 1}-${elementIndex + 1}`,
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
                    : `Continue with ${work.chapterCount} chapters.`,
            }
          : {}),
      };
    }),
  }));
  preview.coverSceneId = preview.scenes[0].id;
  return preview;
}
