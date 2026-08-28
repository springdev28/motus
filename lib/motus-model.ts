export const PROJECT_SCHEMA_VERSION = 1 as const;

export type ScenePalette = {
  from: string;
  to: string;
  glow: string;
};

export type EventBlock = {
  id: string;
  kind: 'event';
  trigger: 'scene-enter';
};

export type MoveBlock = {
  id: string;
  kind: 'move';
  deltaX: number;
  durationMs: number;
  easing: 'ease-out';
};

export type FadeBlock = {
  id: string;
  kind: 'fade';
  from: number;
  to: number;
  durationMs: number;
  withPrevious: boolean;
};

export type AnimationBlock = EventBlock | MoveBlock | FadeBlock;

export type MotusScene = {
  id: string;
  kicker: string;
  title: string;
  speech: string;
  palette: ScenePalette;
  blocks: AnimationBlock[];
  accentCount: number;
};

export type MotusProject = {
  schemaVersion: typeof PROJECT_SCHEMA_VERSION;
  id: string;
  title: string;
  publishedRevision: number;
  scenes: MotusScene[];
  updatedAt: string;
};

const scene = (
  id: string,
  kicker: string,
  title: string,
  speech: string,
  palette: ScenePalette,
  deltaX: number,
): MotusScene => ({
  id,
  kicker,
  title,
  speech,
  palette,
  accentCount: 0,
  blocks: [
    { id: `${id}-event`, kind: 'event', trigger: 'scene-enter' },
    {
      id: `${id}-move`,
      kind: 'move',
      deltaX,
      durationMs: 1200,
      easing: 'ease-out',
    },
    {
      id: `${id}-fade`,
      kind: 'fade',
      from: 0.1,
      to: 1,
      durationMs: 800,
      withPrevious: true,
    },
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
      'NIGHT 03 — THE SIGNAL',
      'Something moved beyond the fog.',
      'Did you see that?',
      { from: '#24203b', to: '#332b46', glow: '#8d71ff' },
      92,
    ),
    scene(
      'scene-2',
      'NIGHT 03 — THE CROSSING',
      'The light waited on the other side.',
      'It knows we are here.',
      { from: '#38284c', to: '#7d4e61', glow: '#ff8ca6' },
      64,
    ),
    scene(
      'scene-3',
      'NIGHT 03 — THE ANSWER',
      'A second pulse answered from below.',
      'That was not an echo.',
      { from: '#22293b', to: '#315a63', glow: '#67d6df' },
      118,
    ),
    scene(
      'scene-4',
      'DAWN 01 — THE DOOR',
      'By morning, the path had opened.',
      'We go together.',
      { from: '#30293c', to: '#806a78', glow: '#f1d086' },
      78,
    ),
  ],
});

export type CompiledMotion = {
  distancePx: number;
  durationMs: number;
  fromOpacity: number;
  toOpacity: number;
};

export function compileMotion(blocks: AnimationBlock[]): CompiledMotion {
  const move = blocks.find((block): block is MoveBlock => block.kind === 'move');
  const fade = blocks.find((block): block is FadeBlock => block.kind === 'fade');

  return {
    distancePx: move?.deltaX ?? 0,
    durationMs: Math.max(move?.durationMs ?? fade?.durationMs ?? 1, 1),
    fromOpacity: fade?.from ?? 1,
    toOpacity: fade?.to ?? 1,
  };
}

export function restoreProject(value: string | null): MotusProject | null {
  if (!value) return null;

  try {
    const candidate = JSON.parse(value) as Partial<MotusProject>;
    if (
      candidate.schemaVersion !== PROJECT_SCHEMA_VERSION ||
      typeof candidate.title !== 'string' ||
      !Array.isArray(candidate.scenes) ||
      candidate.scenes.length === 0
    ) {
      return null;
    }

    return candidate as MotusProject;
  } catch {
    return null;
  }
}

export function cloneProject(project: MotusProject): MotusProject {
  return structuredClone(project);
}
