import {
  MOTION_BLOCK_CATALOG,
  compileElementMotion,
  type CompiledMotionStep,
  type MotionBlockCategory,
  type MotusElement,
} from './motus-model.ts';

export type MotionTimelineScope = 'selected' | 'scene';

export type MotionTimelineSpan = {
  blockId: string;
  category: MotionBlockCategory;
  durationMs: number;
  easing: CompiledMotionStep['easing'];
  endMs: number;
  instanceId: string;
  kind: CompiledMotionStep['kind'];
  label: string;
  lane: number;
  startsAtMs: number;
};

export type MotionTimelineTrack = {
  durationMs: number;
  elementId: string;
  elementName: string;
  laneCount: number;
  spans: MotionTimelineSpan[];
};

const CATALOG_BY_KIND = new Map(
  MOTION_BLOCK_CATALOG.map((entry) => [entry.kind, entry]),
);

export function clampMotionTimelineTime(
  value: number,
  durationMs: number,
): number {
  if (!Number.isFinite(value) || !Number.isFinite(durationMs)) return 0;
  return Math.min(Math.max(value, 0), Math.max(durationMs, 0));
}

export function getMotionTimelineSpanPercentages(
  span: Pick<MotionTimelineSpan, 'startsAtMs' | 'durationMs'>,
  durationMs: number,
): { left: number; width: number } {
  if (!Number.isFinite(durationMs) || durationMs <= 0) {
    return { left: 0, width: 0 };
  }
  const start = clampMotionTimelineTime(span.startsAtMs, durationMs);
  const end = clampMotionTimelineTime(
    span.startsAtMs + Math.max(0, span.durationMs),
    durationMs,
  );
  return {
    left: (start / durationMs) * 100,
    width: (Math.max(end - start, 0) / durationMs) * 100,
  };
}

export function getMotionTimelineTicks(
  durationMs: number,
  divisions = 5,
): number[] {
  const safeDuration = Math.max(
    0,
    Number.isFinite(durationMs) ? durationMs : 0,
  );
  const safeDivisions = Math.min(
    10,
    Math.max(1, Math.round(Number.isFinite(divisions) ? divisions : 5)),
  );
  return Array.from(
    { length: safeDivisions + 1 },
    (_, index) => (safeDuration * index) / safeDivisions,
  );
}

function createTimelineSpans(steps: readonly CompiledMotionStep[]): {
  laneCount: number;
  spans: MotionTimelineSpan[];
} {
  const laneEnds: number[] = [];
  const spans = [...steps]
    .sort(
      (left, right) =>
        left.startsAtMs - right.startsAtMs ||
        left.durationMs - right.durationMs ||
        left.instanceId.localeCompare(right.instanceId),
    )
    .map((step) => {
      const endMs = step.startsAtMs + step.durationMs;
      let lane = laneEnds.findIndex((laneEnd) => laneEnd <= step.startsAtMs);
      if (lane === -1) {
        lane = laneEnds.length;
        laneEnds.push(endMs);
      } else {
        laneEnds[lane] = endMs;
      }
      const catalogEntry = CATALOG_BY_KIND.get(step.kind);
      return {
        blockId: step.blockId,
        category: catalogEntry?.category ?? 'motion',
        durationMs: step.durationMs,
        easing: step.easing,
        endMs,
        instanceId: step.instanceId,
        kind: step.kind,
        label: catalogEntry?.label ?? step.kind,
        lane,
        startsAtMs: step.startsAtMs,
      };
    });
  return { laneCount: Math.max(1, laneEnds.length), spans };
}

export function buildMotionTimelineTracks(
  elements: readonly MotusElement[],
  scope: MotionTimelineScope,
  selectedElementId?: string,
): MotionTimelineTrack[] {
  const candidates =
    scope === 'selected'
      ? elements.filter((element) => element.id === selectedElementId)
      : elements;
  return candidates.flatMap((element) => {
    if (!element.visible) return [];
    const compiled = compileElementMotion(element);
    if (!compiled.steps.some((step) => step.kind !== 'wait')) return [];
    const { laneCount, spans } = createTimelineSpans(compiled.steps);
    return [
      {
        durationMs: compiled.sequenceDurationMs,
        elementId: element.id,
        elementName: element.name,
        laneCount,
        spans,
      },
    ];
  });
}

export function getMotionTimelineDuration(
  tracks: readonly MotionTimelineTrack[],
): number {
  return tracks.reduce(
    (longest, track) => Math.max(longest, track.durationMs),
    0,
  );
}
