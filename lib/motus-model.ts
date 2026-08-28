export const PROJECT_SCHEMA_VERSION = 2 as const;

export type ElementType = 'shape' | 'text' | 'speech' | 'image';
export type Easing = 'linear' | 'ease-out' | 'ease-in-out';

export type ElementMotion = {
  moveX: number;
  moveY: number;
  durationMs: number;
  fromOpacity: number;
  easing: Easing;
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

export type MotusProject = {
  schemaVersion: typeof PROJECT_SCHEMA_VERSION;
  id: string;
  title: string;
  publishedRevision: number;
  scenes: MotusScene[];
  updatedAt: string;
};

const motion = (
  moveX = 0,
  moveY = 0,
  durationMs = 900,
  fromOpacity = 1,
): ElementMotion => ({
  moveX,
  moveY,
  durationMs,
  fromOpacity,
  easing: 'ease-out',
});

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

  return {
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
  };
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
  publishedRevision: 0,
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

export function cloneProject(project: MotusProject): MotusProject {
  return structuredClone(project);
}

export function restoreProject(value: string | null): MotusProject | null {
  if (!value) return null;

  try {
    const candidate = JSON.parse(value) as Partial<MotusProject>;
    if (
      candidate.schemaVersion !== PROJECT_SCHEMA_VERSION ||
      typeof candidate.title !== 'string' ||
      !Array.isArray(candidate.scenes) ||
      candidate.scenes.length === 0 ||
      candidate.scenes.some((item) => !Array.isArray(item.elements))
    ) {
      return null;
    }

    return candidate as MotusProject;
  } catch {
    return null;
  }
}
