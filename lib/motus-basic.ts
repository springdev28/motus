export const BASIC_DB = 'motus-basic-v1';
export const EFFECTS = [
  'none',
  'fade',
  'fly-left',
  'fly-up',
  'zoom',
  'pulse',
  'spin',
  'fade-out',
] as const;
export type BasicEffect = (typeof EFFECTS)[number];
export type BasicLayer = {
  id: string;
  name: string;
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  effect: BasicEffect;
  duration: number;
  delay: number;
  trigger: 'enter' | 'click';
};
export type BasicPage = {
  id: string;
  background: string;
  width: number;
  height: number;
  layers: BasicLayer[];
};
export type BasicComic = {
  version: 1;
  id: string;
  title: string;
  author: string;
  summary: string;
  tags: string;
  language: string;
  rating: string;
  status: 'Ongoing' | 'Complete';
  format: 'scroll' | 'page' | 'spread';
  direction: 'ltr' | 'rtl';
  transition: 'cut' | 'slide' | 'book';
  pages: BasicPage[];
  archived: boolean;
  updatedAt: string;
};
export function blankComic(): BasicComic {
  return {
    version: 1,
    id: crypto.randomUUID(),
    title: '',
    author: '',
    summary: '',
    tags: '',
    language: 'English',
    rating: 'General',
    status: 'Ongoing',
    format: 'scroll',
    direction: 'ltr',
    transition: 'book',
    pages: [],
    archived: false,
    updatedAt: new Date().toISOString(),
  };
}
export function effectFrames(effect: BasicEffect): Keyframe[] {
  switch (effect) {
    case 'fade':
      return [{ opacity: 0 }, { opacity: 1 }];
    case 'fly-left':
      return [
        { transform: 'translateX(-35%)', opacity: 0 },
        { transform: 'translateX(0)', opacity: 1 },
      ];
    case 'fly-up':
      return [
        { transform: 'translateY(25%)', opacity: 0 },
        { transform: 'translateY(0)', opacity: 1 },
      ];
    case 'zoom':
      return [
        { transform: 'scale(.65)', opacity: 0 },
        { transform: 'scale(1)', opacity: 1 },
      ];
    case 'pulse':
      return [
        { transform: 'scale(1)' },
        { transform: 'scale(1.08)' },
        { transform: 'scale(1)' },
      ];
    case 'spin':
      return [{ transform: 'rotate(-15deg)' }, { transform: 'rotate(0)' }];
    case 'fade-out':
      return [{ opacity: 1 }, { opacity: 0 }];
    default:
      return [];
  }
}
const numberIn = (n: unknown, min: number, max: number) =>
  typeof n === 'number' && Number.isFinite(n) && n >= min && n <= max;
export function parseBasicComic(text: string): BasicComic {
  if (text.length > 80_000_000)
    throw new Error('Comic files must be under 80 MB.');
  const c = JSON.parse(text) as BasicComic;
  const string = (s: unknown, max = 5000) =>
    typeof s === 'string' && s.length <= max;
  if (
    !c ||
    c.version !== 1 ||
    !string(c.id, 100) ||
    !c.id ||
    ![
      'title',
      'author',
      'summary',
      'tags',
      'language',
      'rating',
      'updatedAt',
    ].every((k) => string(c[k as keyof BasicComic])) ||
    !['General', 'Teen', 'Mature', 'Explicit'].includes(c.rating) ||
    !['Ongoing', 'Complete'].includes(c.status) ||
    !['scroll', 'page', 'spread'].includes(c.format) ||
    !['ltr', 'rtl'].includes(c.direction) ||
    !['cut', 'slide', 'book'].includes(c.transition) ||
    typeof c.archived !== 'boolean' ||
    !Array.isArray(c.pages) ||
    c.pages.length > 100
  )
    throw new Error('This is not a supported Motus Basic comic.');
  const ids = new Set<string>();
  for (const p of c.pages) {
    if (
      !p ||
      !string(p.id, 100) ||
      ids.has(p.id) ||
      !/^#[\da-f]{6}$/i.test(p.background) ||
      !numberIn(p.width, 1, 12000) ||
      !numberIn(p.height, 1, 12000) ||
      !Array.isArray(p.layers) ||
      p.layers.length > 30
    )
      throw new Error('The comic contains an invalid page.');
    ids.add(p.id);
    for (const l of p.layers) {
      if (
        !l ||
        !string(l.id, 100) ||
        ids.has(l.id) ||
        !string(l.name, 500) ||
        !string(l.src, 15_000_000) ||
        !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/.test(l.src) ||
        !numberIn(l.x, 0, 100) ||
        !numberIn(l.y, 0, 100) ||
        !numberIn(l.width, 1, 100) ||
        !numberIn(l.height, 1, 100) ||
        l.x + l.width > 100.01 ||
        l.y + l.height > 100.01 ||
        !EFFECTS.includes(l.effect) ||
        !numberIn(l.duration, 0.1, 10) ||
        !numberIn(l.delay, 0, 10) ||
        !['enter', 'click'].includes(l.trigger)
      )
        throw new Error('The comic contains an invalid image or animation.');
      ids.add(l.id);
    }
  }
  return c;
}
export async function basicStore(action: 'list'): Promise<BasicComic[]>;
export async function basicStore(
  action: 'save',
  comic: BasicComic,
): Promise<BasicComic[]>;
export async function basicStore(
  action: 'list' | 'save',
  comic?: BasicComic,
): Promise<BasicComic[]> {
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(BASIC_DB, 1);
    request.onupgradeneeded = () =>
      request.result.createObjectStore('comics', { keyPath: 'id' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(
        new Error(
          'Browser storage is unavailable. Download your comic to keep a copy.',
        ),
      );
  });
  return new Promise((resolve, reject) => {
    const tx = db.transaction(
      'comics',
      action === 'save' ? 'readwrite' : 'readonly',
    );
    const store = tx.objectStore('comics');
    if (comic) store.put(comic);
    const request = store.getAll();
    tx.oncomplete = () => {
      db.close();
      resolve(request.result as BasicComic[]);
    };
    tx.onabort = tx.onerror = () => {
      db.close();
      reject(
        new Error(
          'Could not save to this browser. Download your comic to keep a copy.',
        ),
      );
    };
  });
}

// Serialize autosaves and explicit saves so an older write cannot replace a newer one.
export function createBasicSaveQueue<T>(
  write: (comic: BasicComic) => Promise<T>,
) {
  let pending: Promise<void> = Promise.resolve();
  return (comic: BasicComic): Promise<T> => {
    const result = pending.then(() => write(comic));
    pending = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  };
}
