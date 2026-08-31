import type { ReaderDirection, ReaderTransitionStyle } from './motus-model.ts';

export type ReaderPagedLayout = 'page' | 'spread';
export type ReaderNavigationIntent = 'previous' | 'next';
export type ReaderControlEdge = 'left' | 'right';
export type ReaderPosition = {
  chapterIndex: number;
  pageIndex: number;
};

export type ReaderNavigationPresentation = {
  controlEdge: ReaderControlEdge;
  entryEdge: ReaderControlEdge;
  motionSign: -1 | 1;
  bookOrigin: ReaderControlEdge;
};

export type ReaderTransitionPresentation = ReaderNavigationPresentation & {
  selectedStyle: ReaderTransitionStyle;
  effectiveStyle: ReaderTransitionStyle;
  shouldAnimate: boolean;
  intent: ReaderNavigationIntent | null;
};

export function getReaderPageStep(layout: ReaderPagedLayout): 1 | 2 {
  return layout === 'spread' ? 2 : 1;
}

export function normalizeReaderPageIndex(
  sceneCount: number,
  pageIndex: number,
  layout: ReaderPagedLayout,
): number {
  const safeCount = Math.max(0, Math.floor(Number(sceneCount) || 0));
  if (safeCount === 0) return 0;
  const safeIndex = Number.isFinite(pageIndex) ? Math.floor(pageIndex) : 0;
  const boundedIndex = Math.min(Math.max(safeIndex, 0), safeCount - 1);
  return layout === 'spread' ? boundedIndex - (boundedIndex % 2) : boundedIndex;
}

export function getReaderVisibleSceneIndexes(
  sceneCount: number,
  pageIndex: number,
  layout: ReaderPagedLayout,
): number[] {
  const safeCount = Math.max(0, Math.floor(Number(sceneCount) || 0));
  if (safeCount === 0) return [];
  const start = normalizeReaderPageIndex(safeCount, pageIndex, layout);
  const length = Math.min(getReaderPageStep(layout), safeCount - start);
  return Array.from({ length }, (_, offset) => start + offset);
}

export function getAdjacentReaderPosition(
  sceneCounts: readonly number[],
  current: ReaderPosition,
  layout: ReaderPagedLayout,
  intent: ReaderNavigationIntent,
): ReaderPosition | null {
  if (sceneCounts.length === 0) return null;
  const chapterIndex = Math.min(
    Math.max(Math.floor(current.chapterIndex) || 0, 0),
    sceneCounts.length - 1,
  );
  const currentCount = Math.max(
    0,
    Math.floor(Number(sceneCounts[chapterIndex]) || 0),
  );
  const pageIndex = normalizeReaderPageIndex(
    currentCount,
    current.pageIndex,
    layout,
  );
  const pageStep = getReaderPageStep(layout);

  if (intent === 'previous') {
    if (currentCount > 0 && pageIndex > 0) {
      return {
        chapterIndex,
        pageIndex: normalizeReaderPageIndex(
          currentCount,
          pageIndex - pageStep,
          layout,
        ),
      };
    }
    for (let index = chapterIndex - 1; index >= 0; index -= 1) {
      const sceneCount = Math.max(
        0,
        Math.floor(Number(sceneCounts[index]) || 0),
      );
      if (sceneCount === 0) continue;
      return {
        chapterIndex: index,
        pageIndex: normalizeReaderPageIndex(sceneCount, sceneCount - 1, layout),
      };
    }
    return null;
  }

  if (currentCount > 0 && pageIndex + pageStep < currentCount) {
    return { chapterIndex, pageIndex: pageIndex + pageStep };
  }
  for (let index = chapterIndex + 1; index < sceneCounts.length; index += 1) {
    if (Math.max(0, Math.floor(Number(sceneCounts[index]) || 0)) === 0) {
      continue;
    }
    return { chapterIndex: index, pageIndex: 0 };
  }
  return null;
}

export function getReaderNavigationPresentation(
  direction: ReaderDirection,
  intent: ReaderNavigationIntent,
): ReaderNavigationPresentation {
  const controlEdge: ReaderControlEdge =
    (direction === 'ltr' && intent === 'next') ||
    (direction === 'rtl' && intent === 'previous')
      ? 'right'
      : 'left';
  return {
    controlEdge,
    entryEdge: controlEdge,
    motionSign: controlEdge === 'right' ? 1 : -1,
    bookOrigin: controlEdge === 'right' ? 'left' : 'right',
  };
}

export function getReaderControlIntent(
  direction: ReaderDirection,
  edge: ReaderControlEdge,
): ReaderNavigationIntent {
  if (direction === 'ltr') return edge === 'left' ? 'previous' : 'next';
  return edge === 'left' ? 'next' : 'previous';
}

export function getReaderTransitionPresentation(
  selectedStyle: ReaderTransitionStyle,
  direction: ReaderDirection,
  intent: ReaderNavigationIntent | null,
  reducedMotion: boolean,
): ReaderTransitionPresentation {
  const navigation = getReaderNavigationPresentation(
    direction,
    intent ?? 'next',
  );
  const effectiveStyle =
    reducedMotion || intent === null ? 'cut' : selectedStyle;
  return {
    ...navigation,
    selectedStyle,
    effectiveStyle,
    shouldAnimate: effectiveStyle !== 'cut',
    intent,
  };
}
