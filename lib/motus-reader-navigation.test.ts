import assert from 'node:assert/strict';
import test from 'node:test';

import { READER_DIRECTIONS, READER_TRANSITION_STYLES } from './motus-model.ts';
import {
  getAdjacentReaderPosition,
  getReaderControlIntent,
  getReaderNavigationPresentation,
  getReaderPageStep,
  getReaderTransitionPresentation,
  getReaderVisibleSceneIndexes,
  normalizeReaderPageIndex,
  type ReaderNavigationIntent,
} from './motus-reader-navigation.ts';

const navigationPresentations = {
  ltr: {
    previous: {
      controlEdge: 'left',
      entryEdge: 'left',
      motionSign: -1,
      bookOrigin: 'right',
    },
    next: {
      controlEdge: 'right',
      entryEdge: 'right',
      motionSign: 1,
      bookOrigin: 'left',
    },
  },
  rtl: {
    previous: {
      controlEdge: 'right',
      entryEdge: 'right',
      motionSign: 1,
      bookOrigin: 'left',
    },
    next: {
      controlEdge: 'left',
      entryEdge: 'left',
      motionSign: -1,
      bookOrigin: 'right',
    },
  },
} as const;

void test('page steps and page-index normalization respect page and spread layouts', () => {
  assert.equal(getReaderPageStep('page'), 1);
  assert.equal(getReaderPageStep('spread'), 2);

  const cases = [
    { sceneCount: 0, pageIndex: 10, layout: 'page', expected: 0 },
    { sceneCount: -3, pageIndex: 1, layout: 'spread', expected: 0 },
    { sceneCount: Number.NaN, pageIndex: 1, layout: 'page', expected: 0 },
    { sceneCount: 4, pageIndex: -10, layout: 'page', expected: 0 },
    { sceneCount: 4, pageIndex: 2.9, layout: 'page', expected: 2 },
    { sceneCount: 4, pageIndex: 99, layout: 'page', expected: 3 },
    { sceneCount: 4, pageIndex: Number.NaN, layout: 'page', expected: 0 },
    {
      sceneCount: 4,
      pageIndex: Number.POSITIVE_INFINITY,
      layout: 'page',
      expected: 0,
    },
    { sceneCount: 3.9, pageIndex: 3, layout: 'page', expected: 2 },
    { sceneCount: 6, pageIndex: 3, layout: 'spread', expected: 2 },
    { sceneCount: 6, pageIndex: 5, layout: 'spread', expected: 4 },
    { sceneCount: 4, pageIndex: 99, layout: 'spread', expected: 2 },
    { sceneCount: 1, pageIndex: 99, layout: 'spread', expected: 0 },
  ] as const;

  for (const { sceneCount, pageIndex, layout, expected } of cases) {
    assert.equal(
      normalizeReaderPageIndex(sceneCount, pageIndex, layout),
      expected,
      `${layout}: ${sceneCount} scenes at index ${pageIndex}`,
    );
  }
});

void test('visible scene indexes are normalized and omit missing spread partners', () => {
  assert.deepEqual(getReaderVisibleSceneIndexes(0, 0, 'page'), []);
  assert.deepEqual(getReaderVisibleSceneIndexes(-2, 0, 'spread'), []);
  assert.deepEqual(getReaderVisibleSceneIndexes(Number.NaN, 0, 'page'), []);

  assert.deepEqual(getReaderVisibleSceneIndexes(4, 2.9, 'page'), [2]);
  assert.deepEqual(getReaderVisibleSceneIndexes(4, 99, 'page'), [3]);
  assert.deepEqual(getReaderVisibleSceneIndexes(6, 3, 'spread'), [2, 3]);
  assert.deepEqual(getReaderVisibleSceneIndexes(4, 99, 'spread'), [2, 3]);
  assert.deepEqual(getReaderVisibleSceneIndexes(5, 4, 'spread'), [4]);
  assert.deepEqual(getReaderVisibleSceneIndexes(1, 99, 'spread'), [0]);
  assert.deepEqual(getReaderVisibleSceneIndexes(3.9, 2, 'spread'), [2]);
});

void test('page navigation advances, retreats, normalizes, and stops at book boundaries', () => {
  const sceneCounts = [5] as const;

  assert.deepEqual(
    getAdjacentReaderPosition(
      sceneCounts,
      { chapterIndex: 0, pageIndex: 2.9 },
      'page',
      'previous',
    ),
    { chapterIndex: 0, pageIndex: 1 },
  );
  assert.deepEqual(
    getAdjacentReaderPosition(
      sceneCounts,
      { chapterIndex: 0, pageIndex: 2.9 },
      'page',
      'next',
    ),
    { chapterIndex: 0, pageIndex: 3 },
  );
  assert.equal(
    getAdjacentReaderPosition(
      sceneCounts,
      { chapterIndex: 0, pageIndex: -5 },
      'page',
      'previous',
    ),
    null,
  );
  assert.equal(
    getAdjacentReaderPosition(
      sceneCounts,
      { chapterIndex: 0, pageIndex: 99 },
      'page',
      'next',
    ),
    null,
  );
});

void test('spread navigation moves by pairs and handles an unpaired final scene', () => {
  assert.deepEqual(
    getAdjacentReaderPosition(
      [6],
      { chapterIndex: 0, pageIndex: 3 },
      'spread',
      'previous',
    ),
    { chapterIndex: 0, pageIndex: 0 },
  );
  assert.deepEqual(
    getAdjacentReaderPosition(
      [6],
      { chapterIndex: 0, pageIndex: 3 },
      'spread',
      'next',
    ),
    { chapterIndex: 0, pageIndex: 4 },
  );
  assert.deepEqual(
    getAdjacentReaderPosition(
      [5],
      { chapterIndex: 0, pageIndex: 4 },
      'spread',
      'previous',
    ),
    { chapterIndex: 0, pageIndex: 2 },
  );
  assert.equal(
    getAdjacentReaderPosition(
      [5],
      { chapterIndex: 0, pageIndex: 4 },
      'spread',
      'next',
    ),
    null,
  );
  assert.equal(
    getAdjacentReaderPosition(
      [4],
      { chapterIndex: 0, pageIndex: 99 },
      'spread',
      'next',
    ),
    null,
  );
});

void test('chapter navigation enters the first page and leaves from the final normalized page', () => {
  const sceneCounts = [2, 3, 4] as const;

  assert.deepEqual(
    getAdjacentReaderPosition(
      sceneCounts,
      { chapterIndex: 1, pageIndex: 0 },
      'page',
      'previous',
    ),
    { chapterIndex: 0, pageIndex: 1 },
  );
  assert.deepEqual(
    getAdjacentReaderPosition(
      sceneCounts,
      { chapterIndex: 1, pageIndex: 2 },
      'page',
      'next',
    ),
    { chapterIndex: 2, pageIndex: 0 },
  );
  assert.deepEqual(
    getAdjacentReaderPosition(
      sceneCounts,
      { chapterIndex: 2, pageIndex: 0 },
      'spread',
      'previous',
    ),
    { chapterIndex: 1, pageIndex: 2 },
  );
  assert.deepEqual(
    getAdjacentReaderPosition(
      sceneCounts,
      { chapterIndex: 0, pageIndex: 0 },
      'spread',
      'next',
    ),
    { chapterIndex: 1, pageIndex: 0 },
  );
});

void test('chapter navigation skips empty counts and normalizes the current chapter', () => {
  const sparseSceneCounts = [2, 0, -3, Number.NaN, 3] as const;

  assert.deepEqual(
    getAdjacentReaderPosition(
      sparseSceneCounts,
      { chapterIndex: 0, pageIndex: 1 },
      'page',
      'next',
    ),
    { chapterIndex: 4, pageIndex: 0 },
  );
  assert.deepEqual(
    getAdjacentReaderPosition(
      sparseSceneCounts,
      { chapterIndex: 4, pageIndex: 0 },
      'page',
      'previous',
    ),
    { chapterIndex: 0, pageIndex: 1 },
  );
  assert.deepEqual(
    getAdjacentReaderPosition(
      [2, 0, 3],
      { chapterIndex: 1, pageIndex: 99 },
      'spread',
      'previous',
    ),
    { chapterIndex: 0, pageIndex: 0 },
  );
  assert.deepEqual(
    getAdjacentReaderPosition(
      [2, 0, 3],
      { chapterIndex: 1, pageIndex: 99 },
      'spread',
      'next',
    ),
    { chapterIndex: 2, pageIndex: 0 },
  );
  assert.deepEqual(
    getAdjacentReaderPosition(
      [2, 3],
      { chapterIndex: -10, pageIndex: 1 },
      'page',
      'next',
    ),
    { chapterIndex: 1, pageIndex: 0 },
  );
  assert.deepEqual(
    getAdjacentReaderPosition(
      [2, 3],
      { chapterIndex: 99, pageIndex: 0 },
      'page',
      'previous',
    ),
    { chapterIndex: 0, pageIndex: 1 },
  );
  assert.deepEqual(
    getAdjacentReaderPosition(
      [2, 3],
      { chapterIndex: Number.NaN, pageIndex: 1 },
      'page',
      'next',
    ),
    { chapterIndex: 1, pageIndex: 0 },
  );
  assert.deepEqual(
    getAdjacentReaderPosition(
      [2, 3],
      { chapterIndex: 1.9, pageIndex: 0 },
      'page',
      'previous',
    ),
    { chapterIndex: 0, pageIndex: 1 },
  );

  assert.equal(
    getAdjacentReaderPosition(
      [],
      { chapterIndex: 0, pageIndex: 0 },
      'page',
      'next',
    ),
    null,
  );
  assert.equal(
    getAdjacentReaderPosition(
      [0, -1, Number.NaN],
      { chapterIndex: 1, pageIndex: 0 },
      'spread',
      'previous',
    ),
    null,
  );
  assert.equal(
    getAdjacentReaderPosition(
      [0, -1, Number.NaN],
      { chapterIndex: 1, pageIndex: 0 },
      'spread',
      'next',
    ),
    null,
  );
});

void test('LTR and RTL navigation map logical intent to physical presentation and controls', () => {
  for (const direction of READER_DIRECTIONS) {
    for (const intent of ['previous', 'next'] as const) {
      const expected = navigationPresentations[direction][intent];
      assert.deepEqual(
        getReaderNavigationPresentation(direction, intent),
        expected,
        `${direction} ${intent}`,
      );
      assert.equal(
        getReaderControlIntent(direction, expected.controlEdge),
        intent,
        `${direction} ${expected.controlEdge}`,
      );
    }
  }
});

void test('transition presentation covers every style, direction, intent, and reduced-motion state', () => {
  const intents = ['previous', 'next', null] as const;

  for (const selectedStyle of READER_TRANSITION_STYLES) {
    for (const direction of READER_DIRECTIONS) {
      for (const intent of intents) {
        for (const reducedMotion of [false, true]) {
          const physicalIntent: ReaderNavigationIntent = intent ?? 'next';
          const expectedNavigation =
            navigationPresentations[direction][physicalIntent];
          const effectiveStyle =
            reducedMotion || intent === null ? 'cut' : selectedStyle;

          assert.deepEqual(
            getReaderTransitionPresentation(
              selectedStyle,
              direction,
              intent,
              reducedMotion,
            ),
            {
              ...expectedNavigation,
              selectedStyle,
              effectiveStyle,
              shouldAnimate: effectiveStyle !== 'cut',
              intent,
            },
            `${selectedStyle} ${direction} ${String(intent)} reducedMotion=${reducedMotion}`,
          );
        }
      }
    }
  }
});

void test('null transition intent is a non-animated cut with next-facing physical defaults', () => {
  for (const direction of READER_DIRECTIONS) {
    const presentation = getReaderTransitionPresentation(
      'book',
      direction,
      null,
      false,
    );
    assert.equal(presentation.intent, null);
    assert.equal(presentation.effectiveStyle, 'cut');
    assert.equal(presentation.shouldAnimate, false);
    assert.deepEqual(
      {
        controlEdge: presentation.controlEdge,
        entryEdge: presentation.entryEdge,
        motionSign: presentation.motionSign,
        bookOrigin: presentation.bookOrigin,
      },
      navigationPresentations[direction].next,
    );
  }
});

void test('navigation helpers leave caller-owned position and count data unchanged', () => {
  const sceneCounts = [2, 0, 3];
  const current = { chapterIndex: 0, pageIndex: 1 };

  getAdjacentReaderPosition(sceneCounts, current, 'page', 'next');

  assert.deepEqual(sceneCounts, [2, 0, 3]);
  assert.deepEqual(current, { chapterIndex: 0, pageIndex: 1 });
});
