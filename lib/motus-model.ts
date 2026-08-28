export const PROJECT_SCHEMA_VERSION = 4 as const;
export const MOTION_SCHEMA_VERSION = 1 as const;
export const CANVAS_WIDTH = 1_080;
export const CANVAS_HEIGHT = 1_440;
export const MIN_ELEMENT_WIDTH = 60;
export const MIN_ELEMENT_HEIGHT = 50;

export type ElementType = 'shape' | 'text' | 'speech' | 'image';
export type Easing = 'linear' | 'ease-out' | 'ease-in-out';
export type ContentRating = 'all-ages' | 'teen' | 'mature';
export type PublicationVisibility = 'private' | 'public';
export type SupportedImageMime = 'image/png' | 'image/webp';

export const MAX_IMAGE_BYTES = 750_000;
export const MAX_IMAGE_DIMENSION = 4_096;
export const MAX_IMAGE_PIXELS = 12_000_000;

export type ImageAssetMetadata = {
  mime: string;
  size: number;
  width?: number;
  height?: number;
};

export function detectImageFormat(bytes: Uint8Array): SupportedImageMime | null {
  const isPng =
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a;
  if (isPng) return 'image/png';

  const isWebp =
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
    String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
  return isWebp ? 'image/webp' : null;
}

export function validateImageAsset(metadata: ImageAssetMetadata): string | null {
  if (metadata.mime !== 'image/png' && metadata.mime !== 'image/webp') {
    return 'Use a PNG or WebP image';
  }
  if (!Number.isFinite(metadata.size) || metadata.size <= 0) {
    return 'The image file is empty';
  }
  if (metadata.size > MAX_IMAGE_BYTES) {
    return 'Images must be under 750 KB';
  }
  if (metadata.width === undefined || metadata.height === undefined) return null;
  if (
    !Number.isInteger(metadata.width) ||
    !Number.isInteger(metadata.height) ||
    metadata.width <= 0 ||
    metadata.height <= 0
  ) {
    return 'The image dimensions are invalid';
  }
  if (
    metadata.width > MAX_IMAGE_DIMENSION ||
    metadata.height > MAX_IMAGE_DIMENSION ||
    metadata.width * metadata.height > MAX_IMAGE_PIXELS
  ) {
    return 'Images must be at most 4096px per side and 12 megapixels';
  }
  return null;
}

export type ElementMotion = {
  schemaVersion: typeof MOTION_SCHEMA_VERSION;
  event: 'scene-enter';
  moveX: number;
  moveY: number;
  durationMs: number;
  delayMs: number;
  fromOpacity: number;
  fromScale: number;
  fromRotation: number;
  easing: Easing;
};

export type CompiledElementMotion = {
  schemaVersion: typeof MOTION_SCHEMA_VERSION;
  event: 'scene-enter';
  durationMs: number;
  delayMs: number;
  easing: Easing;
  from: {
    translateX: number;
    translateY: number;
    opacity: number;
    scale: number;
    rotation: number;
  };
  to: {
    translateX: 0;
    translateY: 0;
    opacity: number;
    scale: 1;
    rotation: number;
  };
};

export type MotusElement = {
  id: string;
  name: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  fill: string;
  text?: string;
  src?: string;
  visible: boolean;
  locked: boolean;
  motion: ElementMotion;
};

export type MotusScene = {
  id: string;
  name: string;
  background: string;
  elements: MotusElement[];
};

export type MotusPublicationRevision = {
  id: string;
  revision: number;
  createdAt: string;
  title: string;
  description: string;
  tags: string[];
  language: string;
  contentRating: ContentRating;
  visibility: PublicationVisibility;
  scenes: MotusScene[];
};

export type MotusProject = {
  schemaVersion: typeof PROJECT_SCHEMA_VERSION;
  id: string;
  title: string;
  description: string;
  tags: string[];
  language: string;
  contentRating: ContentRating;
  visibility: PublicationVisibility;
  publishedRevision: number;
  publications: MotusPublicationRevision[];
  scenes: MotusScene[];
  updatedAt: string;
};

const motion = (
  moveX = 0,
  moveY = 0,
  durationMs = 900,
  fromOpacity = 1,
): ElementMotion => ({
  schemaVersion: MOTION_SCHEMA_VERSION,
  event: 'scene-enter',
  moveX,
  moveY,
  durationMs,
  delayMs: 0,
  fromOpacity,
  fromScale: 1,
  fromRotation: 0,
  easing: 'ease-out',
});

const finite = (value: unknown, fallback: number) =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value));

function migrateMotion(value: Partial<ElementMotion> | undefined): ElementMotion {
  return {
    schemaVersion: MOTION_SCHEMA_VERSION,
    event: 'scene-enter',
    moveX: finite(value?.moveX, 0),
    moveY: finite(value?.moveY, 0),
    durationMs: finite(value?.durationMs, 900),
    delayMs: finite(value?.delayMs, 0),
    fromOpacity: finite(value?.fromOpacity, 1),
    fromScale: finite(value?.fromScale, 1),
    fromRotation: finite(value?.fromRotation, 0),
    easing:
      value?.easing === 'linear' || value?.easing === 'ease-in-out'
        ? value.easing
        : 'ease-out',
  };
}

export function constrainElementToCanvas(
  element: MotusElement,
  canvasWidth = CANVAS_WIDTH,
  canvasHeight = CANVAS_HEIGHT,
): MotusElement {
  const safeCanvasWidth = Math.max(MIN_ELEMENT_WIDTH, finite(canvasWidth, CANVAS_WIDTH));
  const safeCanvasHeight = Math.max(MIN_ELEMENT_HEIGHT, finite(canvasHeight, CANVAS_HEIGHT));
  const width = clamp(finite(element.width, MIN_ELEMENT_WIDTH), MIN_ELEMENT_WIDTH, safeCanvasWidth);
  const height = clamp(finite(element.height, MIN_ELEMENT_HEIGHT), MIN_ELEMENT_HEIGHT, safeCanvasHeight);

  return {
    ...element,
    x: clamp(finite(element.x, 0), 0, safeCanvasWidth - width),
    y: clamp(finite(element.y, 0), 0, safeCanvasHeight - height),
    width,
    height,
    rotation: clamp(finite(element.rotation, 0), -180, 180),
    opacity: clamp(finite(element.opacity, 1), 0, 1),
  };
}

export function compileElementMotion(element: MotusElement): CompiledElementMotion {
  const instruction = migrateMotion(element.motion);
  return {
    schemaVersion: MOTION_SCHEMA_VERSION,
    event: 'scene-enter',
    durationMs: clamp(Math.round(instruction.durationMs), 200, 10_000),
    delayMs: clamp(Math.round(instruction.delayMs), 0, 5_000),
    easing: instruction.easing,
    from: {
      translateX: clamp(-instruction.moveX, -2_000, 2_000),
      translateY: clamp(-instruction.moveY, -2_000, 2_000),
      opacity: clamp(instruction.fromOpacity, 0, 1),
      scale: clamp(instruction.fromScale, 0.1, 3),
      rotation: clamp(element.rotation + instruction.fromRotation, -720, 720),
    },
    to: {
      translateX: 0,
      translateY: 0,
      opacity: clamp(element.opacity, 0, 1),
      scale: 1,
      rotation: clamp(element.rotation, -360, 360),
    },
  };
}

export function createElement(
  type: ElementType,
  index: number,
  overrides: Partial<MotusElement> = {},
): MotusElement {
  const labels: Record<ElementType, string> = {
    shape: 'Shape',
    text: 'Text',
    speech: 'Speech bubble',
    image: 'Image',
  };

  return constrainElementToCanvas({
    id: `${type}-${Date.now()}-${index}`,
    name: `${labels[type]} ${index}`,
    type,
    x: 350,
    y: 560,
    width: type === 'text' ? 440 : 260,
    height: type === 'text' ? 120 : 220,
    rotation: 0,
    opacity: 1,
    fill: type === 'speech' ? '#fffaf0' : '#8c74ff',
    text:
      type === 'speech'
        ? 'Add your dialogue…'
        : type === 'text'
          ? 'A new moment'
          : undefined,
    visible: true,
    locked: false,
    motion: motion(80, 0, 900, 0.15),
    ...overrides,
  });
}

const scene = (
  id: string,
  name: string,
  background: string,
  title: string,
  speech: string,
  glow: string,
): MotusScene => ({
  id,
  name,
  background,
  elements: [
    createElement('text', 1, {
      id: `${id}-title`,
      name: 'Scene title',
      x: 95,
      y: 150,
      width: 620,
      height: 190,
      fill: '#ffffff',
      text: title,
      locked: false,
      motion: motion(0, 34, 700, 0),
    }),
    createElement('shape', 2, {
      id: `${id}-orb`,
      name: 'Signal orb',
      x: 670,
      y: 580,
      width: 150,
      height: 150,
      fill: glow,
      motion: motion(140, -20, 1200, 0.08),
    }),
    createElement('speech', 3, {
      id: `${id}-speech`,
      name: 'Speech bubble',
      x: 560,
      y: 1020,
      width: 390,
      height: 170,
      text: speech,
      fill: '#fffaf0',
      rotation: -2,
      motion: motion(0, 28, 650, 0),
    }),
  ],
});

export const createDefaultProject = (): MotusProject => ({
  schemaVersion: PROJECT_SCHEMA_VERSION,
  id: 'signal-in-the-fog',
  title: 'Signal in the Fog',
  description: 'Three signals answer one another across a silent, shifting landscape.',
  tags: ['science fiction', 'mystery'],
  language: 'en',
  contentRating: 'all-ages',
  visibility: 'private',
  publishedRevision: 0,
  publications: [],
  updatedAt: new Date().toISOString(),
  scenes: [
    scene(
      'scene-1',
      'The signal',
      'linear-gradient(155deg, #24203b 0%, #151626 54%, #332b46 100%)',
      'Something moved beyond the fog.',
      'Did you see that?',
      '#8d71ff',
    ),
    scene(
      'scene-2',
      'The crossing',
      'linear-gradient(155deg, #38284c 0%, #1c1729 54%, #7d4e61 100%)',
      'The light waited on the other side.',
      'It knows we are here.',
      '#ff8ca6',
    ),
    scene(
      'scene-3',
      'The answer',
      'linear-gradient(155deg, #22293b 0%, #101d28 54%, #315a63 100%)',
      'A second pulse answered from below.',
      'That was not an echo.',
      '#67d6df',
    ),
  ],
});

export function createBlankProject(
  id: string,
  updatedAt = new Date().toISOString(),
): MotusProject {
  const projectId = id.trim() || 'untitled-work';
  return {
    schemaVersion: PROJECT_SCHEMA_VERSION,
    id: projectId,
    title: 'Untitled work',
    description: '',
    tags: [],
    language: 'en',
    contentRating: 'all-ages',
    visibility: 'private',
    publishedRevision: 0,
    publications: [],
    updatedAt,
    scenes: [
      {
        id: `${projectId}-scene-1`,
        name: 'Opening scene',
        background: 'linear-gradient(155deg, #24203b 0%, #151626 54%, #332b46 100%)',
        elements: [],
      },
    ],
  };
}

export function createProjectBackupFileName(project: Pick<MotusProject, 'id' | 'title'>) {
  const fallback = project.id.trim() || 'untitled-work';
  const stem = (project.title.trim() || fallback)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
  return `${stem || 'untitled-work'}.motus.json`;
}

export function cloneProject(project: MotusProject): MotusProject {
  return structuredClone(project);
}

export function reorderScenes(
  scenes: MotusScene[],
  sceneId: string,
  direction: -1 | 1,
): MotusScene[] {
  const ordered = [...scenes];
  const index = ordered.findIndex((scene) => scene.id === sceneId);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= ordered.length) return ordered;
  [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
  return ordered;
}

export type RestoredDraft = {
  source: string;
  project: MotusProject;
};

export function restoreNewestProject(
  candidates: Array<{ source: string; value: string | null }>,
): RestoredDraft | null {
  const restored = candidates.flatMap(({ source, value }) => {
    const project = restoreProject(value);
    return project ? [{ source, project }] : [];
  });

  return (
    restored.sort((left, right) => {
      const leftTime = Date.parse(left.project.updatedAt);
      const rightTime = Date.parse(right.project.updatedAt);
      return (Number.isFinite(rightTime) ? rightTime : 0) -
        (Number.isFinite(leftTime) ? leftTime : 0);
    })[0] ?? null
  );
}

export function createPublicationRevision(
  project: MotusProject,
  createdAt = new Date().toISOString(),
): MotusPublicationRevision {
  const revision = project.publishedRevision + 1;
  return {
    id: `${project.id}-revision-${revision}`,
    revision,
    createdAt,
    title: project.title,
    description: project.description,
    tags: [...project.tags],
    language: project.language,
    contentRating: project.contentRating,
    visibility: project.visibility,
    scenes: structuredClone(project.scenes),
  };
}

export function restorePublicationToDraft(
  project: MotusProject,
  revisionId: string,
  updatedAt = new Date().toISOString(),
): MotusProject | null {
  const revision = project.publications.find((item) => item.id === revisionId);
  if (!revision) return null;

  const restored = cloneProject(project);
  restored.title = revision.title;
  restored.description = revision.description;
  restored.tags = [...revision.tags];
  restored.language = revision.language;
  restored.contentRating = revision.contentRating;
  restored.visibility = revision.visibility;
  restored.scenes = structuredClone(revision.scenes);
  restored.updatedAt = updatedAt;
  return restored;
}

export function restoreProject(value: string | null): MotusProject | null {
  if (!value) return null;

  try {
    const candidate = JSON.parse(value) as {
      schemaVersion?: number;
      title?: unknown;
      scenes?: MotusScene[];
      [key: string]: unknown;
    };
    if (
      (candidate.schemaVersion !== 2 &&
        candidate.schemaVersion !== 3 &&
        candidate.schemaVersion !== PROJECT_SCHEMA_VERSION) ||
      typeof candidate.title !== 'string' ||
      !Array.isArray(candidate.scenes) ||
      candidate.scenes.length === 0 ||
      candidate.scenes.some(
        (item) =>
          !item ||
          typeof item !== 'object' ||
          !Array.isArray(item.elements) ||
          item.elements.some(
            (element) =>
              !element ||
              typeof element !== 'object' ||
              typeof element.id !== 'string' ||
              typeof element.type !== 'string',
          ),
      )
    ) {
      return null;
    }

    const restored = candidate as unknown as MotusProject;
    const normalizeScenes = (scenes: MotusScene[]) =>
      scenes.map((item) => ({
        ...item,
        elements: item.elements.map((element) =>
          constrainElementToCanvas({
            ...element,
            visible: element.visible !== false,
            locked: Boolean(element.locked),
            motion: migrateMotion(element.motion),
          }),
        ),
      }));
    const publications = Array.isArray(restored.publications)
      ? restored.publications.filter(
          (revision) =>
            revision &&
            typeof revision.id === 'string' &&
            Number.isInteger(revision.revision) &&
            revision.revision > 0 &&
            typeof revision.createdAt === 'string' &&
            typeof revision.title === 'string' &&
            Array.isArray(revision.scenes),
        )
      : [];
    const publishedRevision = Math.max(
      0,
      finite(restored.publishedRevision, 0),
      ...publications.map((revision) => revision.revision),
    );
    return {
      ...restored,
      schemaVersion: PROJECT_SCHEMA_VERSION,
      description:
        typeof restored.description === 'string' ? restored.description : '',
      tags: Array.isArray(restored.tags)
        ? restored.tags.filter((tag): tag is string => typeof tag === 'string')
        : [],
      language: typeof restored.language === 'string' ? restored.language : 'en',
      contentRating:
        restored.contentRating === 'teen' || restored.contentRating === 'mature'
          ? restored.contentRating
          : 'all-ages',
      visibility: restored.visibility === 'public' ? 'public' : 'private',
      publishedRevision,
      publications: publications.map((revision) => ({
        ...structuredClone(revision),
        scenes: normalizeScenes(revision.scenes),
      })),
      scenes: normalizeScenes(restored.scenes),
    };
  } catch {
    return null;
  }
}
