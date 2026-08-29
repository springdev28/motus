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
export const MAX_PROJECT_FILE_BYTES = 12_000_000;
export const MAX_PROJECT_TAGS = 8;
export const MAX_PROJECT_TAG_LENGTH = 40;
const MAX_PROJECT_SCENES = 100;
const MAX_SCENE_ELEMENTS = 500;
const MAX_ELEMENT_TEXT_LENGTH = 50_000;

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

export function describeElementForAccessibility(element: MotusElement): string {
  if (element.type !== 'text' && element.type !== 'speech') return element.name;
  const content = element.text?.trim().replace(/\s+/g, ' ') ?? '';
  if (!content) return element.name;
  const summary = content.length > 240 ? `${content.slice(0, 239)}…` : content;
  return `${element.name}: ${summary}`;
}

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

export type MotusReaderSource = {
  mode: 'draft' | 'revision';
  revision: number | null;
  title: string;
  visibility: PublicationVisibility;
  scenes: MotusScene[];
};

export function resolveReaderSource(
  project: MotusProject,
  revision: MotusPublicationRevision | null = null,
): MotusReaderSource {
  return revision
    ? {
        mode: 'revision',
        revision: revision.revision,
        title: revision.title,
        visibility: revision.visibility,
        scenes: revision.scenes,
      }
    : {
        mode: 'draft',
        revision: null,
        title: project.title,
        visibility: project.visibility,
        scenes: project.scenes,
      };
}

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

function sanitizeProjectTags(values: unknown[]): string[] {
  const tags: string[] = [];
  const seen = new Set<string>();

  for (const value of values) {
    if (typeof value !== 'string') continue;
    const tag = value.trim().replace(/\s+/g, ' ').slice(0, MAX_PROJECT_TAG_LENGTH);
    const key = tag.toLocaleLowerCase();
    if (!tag || seen.has(key)) continue;
    tags.push(tag);
    seen.add(key);
    if (tags.length === MAX_PROJECT_TAGS) break;
  }

  return tags;
}

export function parseProjectTags(value: string): string[] {
  return sanitizeProjectTags(value.split(','));
}

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

export type EditorSelection = {
  sceneId: string;
  elementId: string;
};

export type ProjectHistoryEntry = {
  project: MotusProject;
  selection: EditorSelection;
};

export type ProjectHistoryState = {
  undoStack: ProjectHistoryEntry[];
  transactionKey: string | null;
};

export function createProjectHistoryEntry(
  project: MotusProject,
  selection: EditorSelection,
): ProjectHistoryEntry {
  return {
    project: cloneProject(project),
    selection: resolveEditorSelection(
      project,
      selection.sceneId,
      selection.elementId,
    ),
  };
}

export function recordProjectHistory(
  history: ProjectHistoryState,
  project: MotusProject,
  selection: EditorSelection,
  transactionKey: string | null = null,
  limit = 50,
): ProjectHistoryState {
  const shouldCapture =
    transactionKey === null || history.transactionKey !== transactionKey;
  return {
    undoStack: shouldCapture
      ? [...history.undoStack, createProjectHistoryEntry(project, selection)].slice(
          -Math.max(1, limit),
        )
      : history.undoStack,
    transactionKey,
  };
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
  candidates: Array<{ source: string; value: string | null; priority?: number }>,
): RestoredDraft | null {
  const restored = candidates.flatMap(({ source, value, priority = 0 }) => {
    const project = restoreProject(value);
    return project ? [{ source, project, priority }] : [];
  });

  const winner = restored.sort((left, right) => {
    const leftTime = Date.parse(left.project.updatedAt);
    const rightTime = Date.parse(right.project.updatedAt);
    const timeDifference =
      (Number.isFinite(rightTime) ? rightTime : 0) -
      (Number.isFinite(leftTime) ? leftTime : 0);
    return timeDifference || right.priority - left.priority;
  })[0];
  return winner ? { source: winner.source, project: winner.project } : null;
}

export function resolveEditorSelection(
  project: MotusProject,
  requestedSceneId: string,
  requestedElementId: string,
): EditorSelection {
  const scene =
    project.scenes.find((item) => item.id === requestedSceneId) ?? project.scenes[0];
  const elementId = scene.elements.some((item) => item.id === requestedElementId)
    ? requestedElementId
    : (scene.elements.at(-1)?.id ?? '');
  return { sceneId: scene.id, elementId };
}

export type DraftConflictChoice = 'keep-current' | 'load-saved';

export function resolveDraftConflict(
  currentProject: MotusProject,
  savedProject: MotusProject,
  choice: DraftConflictChoice,
  updatedAt = new Date().toISOString(),
): MotusProject {
  const resolved = cloneProject(
    choice === 'keep-current' ? currentProject : savedProject,
  );
  if (choice === 'keep-current') resolved.updatedAt = updatedAt;
  return resolved;
}

export type DraftAutosaveState = {
  hydrated: boolean;
  dirty: boolean;
  externalChange: boolean;
};

export function shouldAutosaveDraft(state: DraftAutosaveState): boolean {
  return state.hydrated && state.dirty && !state.externalChange;
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

export function hasUnpublishedChanges(project: MotusProject): boolean {
  const published =
    project.publications.find(
      (revision) => revision.revision === project.publishedRevision,
    ) ?? project.publications.at(-1);
  if (!published) return true;

  return (
    published.title !== project.title ||
    published.description !== project.description ||
    JSON.stringify(published.tags) !== JSON.stringify(project.tags) ||
    published.language !== project.language ||
    published.contentRating !== project.contentRating ||
    published.visibility !== project.visibility ||
    JSON.stringify(published.scenes) !== JSON.stringify(project.scenes)
  );
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

type UnknownRecord = Record<string, unknown>;

export type ProjectRestoreResult =
  | { project: MotusProject; error: null }
  | { project: null; error: string };

const defaultSceneBackground =
  'linear-gradient(155deg, #24203b 0%, #151626 54%, #332b46 100%)';

const isRecord = (value: unknown): value is UnknownRecord =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const isElementType = (value: unknown): value is ElementType =>
  value === 'shape' || value === 'text' || value === 'speech' || value === 'image';

const isSafeColor = (value: unknown): value is string =>
  typeof value === 'string' &&
  /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value);

const isSafeSceneBackground = (value: unknown): value is string =>
  typeof value === 'string' &&
  (/^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value) ||
    (value.length <= 500 && /^linear-gradient\([^;{}]+\)$/i.test(value)));

const isSafeImageSource = (value: unknown): value is string =>
  typeof value === 'string' &&
  value.length <= Math.ceil((MAX_IMAGE_BYTES * 4) / 3) + 128 &&
  /^data:image\/(?:png|webp);base64,[a-z0-9+/=\s]+$/i.test(value);

function validateMotion(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  if (!isRecord(value)) return 'Project contains invalid motion instructions';
  if (
    value.schemaVersion !== undefined &&
    value.schemaVersion !== MOTION_SCHEMA_VERSION
  ) {
    return 'Project uses an unsupported motion version';
  }
  if (value.event !== undefined && value.event !== 'scene-enter') {
    return 'Project uses an unsupported motion trigger';
  }
  return null;
}

function validateScenes(value: unknown, context: string): string | null {
  if (!Array.isArray(value) || value.length === 0) {
    return `${context} needs at least one scene`;
  }
  if (value.length > MAX_PROJECT_SCENES) {
    return `${context} has more than ${MAX_PROJECT_SCENES} scenes`;
  }

  const sceneIds = new Set<string>();
  for (const sceneValue of value) {
    if (!isRecord(sceneValue) || typeof sceneValue.id !== 'string' || !sceneValue.id) {
      return `${context} contains an invalid scene`;
    }
    if (sceneIds.has(sceneValue.id)) return `${context} has duplicate scene IDs`;
    sceneIds.add(sceneValue.id);
    if (!Array.isArray(sceneValue.elements)) {
      return `${context} contains a scene with invalid layers`;
    }
    if (sceneValue.elements.length > MAX_SCENE_ELEMENTS) {
      return `${context} has a scene with more than ${MAX_SCENE_ELEMENTS} layers`;
    }

    const elementIds = new Set<string>();
    for (const elementValue of sceneValue.elements) {
      if (
        !isRecord(elementValue) ||
        typeof elementValue.id !== 'string' ||
        !elementValue.id
      ) {
        return `${context} contains an invalid layer`;
      }
      if (elementIds.has(elementValue.id)) return `${context} has duplicate layer IDs`;
      elementIds.add(elementValue.id);
      if (!isElementType(elementValue.type)) {
        return `${context} contains an unsupported layer type`;
      }
      const motionError = validateMotion(elementValue.motion);
      if (motionError) return motionError;
      if (
        elementValue.text !== undefined &&
        (typeof elementValue.text !== 'string' ||
          elementValue.text.length > MAX_ELEMENT_TEXT_LENGTH)
      ) {
        return `${context} contains invalid or oversized text`;
      }
      if (
        elementValue.type === 'image' &&
        elementValue.src !== undefined &&
        !isSafeImageSource(elementValue.src)
      ) {
        return `${context} contains an unsafe or oversized image source`;
      }
    }
  }
  return null;
}

function normalizeScenes(value: unknown[]): MotusScene[] {
  return value.map((sceneValue) => {
    const item = sceneValue as UnknownRecord;
    return {
      id: item.id as string,
      name: typeof item.name === 'string' ? item.name : 'Untitled scene',
      background: isSafeSceneBackground(item.background)
        ? item.background
        : defaultSceneBackground,
      elements: (item.elements as UnknownRecord[]).map((elementValue) => {
        const type = elementValue.type as ElementType;
        const defaults = {
          width: type === 'text' ? 440 : 260,
          height: type === 'text' ? 120 : 220,
          fill: type === 'speech' ? '#fffaf0' : '#8c74ff',
        };
        return constrainElementToCanvas({
          id: elementValue.id as string,
          name:
            typeof elementValue.name === 'string'
              ? elementValue.name
              : `${type[0].toUpperCase()}${type.slice(1)}`,
          type,
          x: finite(elementValue.x, 0),
          y: finite(elementValue.y, 0),
          width: finite(elementValue.width, defaults.width),
          height: finite(elementValue.height, defaults.height),
          rotation: finite(elementValue.rotation, 0),
          opacity: finite(elementValue.opacity, 1),
          fill: isSafeColor(elementValue.fill) ? elementValue.fill : defaults.fill,
          text:
            typeof elementValue.text === 'string' ? elementValue.text : undefined,
          src:
            type === 'image' && isSafeImageSource(elementValue.src)
              ? elementValue.src
              : undefined,
          visible: elementValue.visible !== false,
          locked: Boolean(elementValue.locked),
          motion: migrateMotion(
            isRecord(elementValue.motion)
              ? (elementValue.motion as Partial<ElementMotion>)
              : undefined,
          ),
        });
      }),
    };
  });
}

function normalizeTags(value: unknown): string[] {
  return Array.isArray(value) ? sanitizeProjectTags(value) : [];
}

function normalizeContentRating(value: unknown): ContentRating {
  return value === 'teen' || value === 'mature' ? value : 'all-ages';
}

function normalizeVisibility(value: unknown): PublicationVisibility {
  return value === 'public' ? 'public' : 'private';
}

export function restoreProjectWithError(value: string | null): ProjectRestoreResult {
  if (!value) return { project: null, error: 'Project file is empty' };

  let candidate: UnknownRecord;
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!isRecord(parsed)) {
      return { project: null, error: 'Project file must contain one Motus project' };
    }
    candidate = parsed;
  } catch {
    return { project: null, error: 'Project file is not valid JSON' };
  }

  if (
    candidate.schemaVersion !== 2 &&
    candidate.schemaVersion !== 3 &&
    candidate.schemaVersion !== PROJECT_SCHEMA_VERSION
  ) {
    return { project: null, error: 'Project uses an unsupported schema version' };
  }
  if (typeof candidate.title !== 'string') {
    return { project: null, error: 'Project title is missing' };
  }

  const sceneError = validateScenes(candidate.scenes, 'Project');
  if (sceneError) return { project: null, error: sceneError };

  const publicationValues = candidate.publications ?? [];
  if (!Array.isArray(publicationValues)) {
    return { project: null, error: 'Project publication history is invalid' };
  }
  const publicationIds = new Set<string>();
  const publicationNumbers = new Set<number>();
  for (const publicationValue of publicationValues) {
    if (
      !isRecord(publicationValue) ||
      typeof publicationValue.id !== 'string' ||
      !publicationValue.id ||
      !Number.isInteger(publicationValue.revision) ||
      (publicationValue.revision as number) <= 0 ||
      typeof publicationValue.createdAt !== 'string' ||
      typeof publicationValue.title !== 'string'
    ) {
      return { project: null, error: 'Project publication history is invalid' };
    }
    const revision = publicationValue.revision as number;
    if (publicationIds.has(publicationValue.id) || publicationNumbers.has(revision)) {
      return { project: null, error: 'Project has duplicate publication revisions' };
    }
    publicationIds.add(publicationValue.id);
    publicationNumbers.add(revision);
    const revisionError = validateScenes(
      publicationValue.scenes,
      `Publication revision ${revision}`,
    );
    if (revisionError) return { project: null, error: revisionError };
  }

  const publications: MotusPublicationRevision[] = publicationValues.map(
    (publicationValue) => {
      const revision = publicationValue as UnknownRecord;
      return {
        id: revision.id as string,
        revision: revision.revision as number,
        createdAt: revision.createdAt as string,
        title: revision.title as string,
        description:
          typeof revision.description === 'string' ? revision.description : '',
        tags: normalizeTags(revision.tags),
        language: typeof revision.language === 'string' ? revision.language : 'en',
        contentRating: normalizeContentRating(revision.contentRating),
        visibility: normalizeVisibility(revision.visibility),
        scenes: normalizeScenes(revision.scenes as unknown[]),
      };
    },
  );
  const publishedRevision = Math.floor(
    Math.max(
      0,
      finite(candidate.publishedRevision, 0),
      ...publications.map((revision) => revision.revision),
    ),
  );
  const updatedAt =
    typeof candidate.updatedAt === 'string' &&
    Number.isFinite(Date.parse(candidate.updatedAt))
      ? candidate.updatedAt
      : new Date(0).toISOString();
  const fallbackId = createProjectBackupFileName({
    id: 'imported-work',
    title: candidate.title,
  }).replace(/\.motus\.json$/, '');

  return {
    error: null,
    project: {
      schemaVersion: PROJECT_SCHEMA_VERSION,
      id:
        typeof candidate.id === 'string' && candidate.id.trim()
          ? candidate.id
          : fallbackId,
      title: candidate.title,
      description:
        typeof candidate.description === 'string' ? candidate.description : '',
      tags: normalizeTags(candidate.tags),
      language: typeof candidate.language === 'string' ? candidate.language : 'en',
      contentRating: normalizeContentRating(candidate.contentRating),
      visibility: normalizeVisibility(candidate.visibility),
      publishedRevision,
      publications,
      scenes: normalizeScenes(candidate.scenes as unknown[]),
      updatedAt,
    },
  };
}

export function restoreProject(value: string | null): MotusProject | null {
  return restoreProjectWithError(value).project;
}
