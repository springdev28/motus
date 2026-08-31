import assert from 'node:assert/strict';
import test from 'node:test';

import {
  MAX_ELEMENT_RIG_DEPTH,
  createElement,
  getElementRigRenderedVisualBounds,
  reorderElementRigSibling,
  reparentElementRigBranchPreservingPose,
  type MotusElement,
} from './motus-model.ts';

function layer(
  id: string,
  parentId: string | null,
  overrides: Partial<MotusElement> = {},
) {
  return createElement('shape', 1, {
    id,
    name: id,
    parentId,
    x: 120,
    y: 160,
    width: 180,
    height: 140,
    ...overrides,
  });
}

function assertBoundsClose(
  actual: ReturnType<typeof getElementRigRenderedVisualBounds>,
  expected: ReturnType<typeof getElementRigRenderedVisualBounds>,
) {
  assert.ok(actual);
  assert.ok(expected);
  for (const field of [
    'left',
    'top',
    'right',
    'bottom',
    'centerX',
    'centerY',
  ] as const) {
    assert.ok(
      Math.abs(actual[field] - expected[field]) < 0.000_001,
      `${field}: expected ${expected[field]}, received ${actual[field]}`,
    );
  }
}

void test('reorders only the slots owned by one rig sibling stack', () => {
  const rootA = layer('root-a', null);
  const childA = layer('child-a', 'root-a');
  const rootB = layer('root-b', null);
  const childB = layer('child-b', 'root-b');
  const rootC = layer('root-c', null);
  const source = [rootA, childA, rootB, childB, rootC];

  const result = reorderElementRigSibling(source, 'root-a', 'root-c');

  assert.equal(result.outcome, 'moved');
  assert.deepEqual(
    result.elements.map((element) => element.id),
    ['root-b', 'child-a', 'root-c', 'child-b', 'root-a'],
  );
  assert.equal(result.elements[1], childA);
  assert.equal(result.elements[3], childB);
  assert.equal(
    result.elements.find((item) => item.id === 'child-a')?.parentId,
    'root-a',
  );
  assert.equal(
    result.elements.find((item) => item.id === 'child-b')?.parentId,
    'root-b',
  );
});

void test('places layers before or after a target in visible stack order', () => {
  const source = [
    layer('back', null),
    layer('middle', null),
    layer('front', null),
  ];

  const before = reorderElementRigSibling(source, 'back', 'front', 'before');
  assert.deepEqual(
    before.elements.map((element) => element.id),
    ['middle', 'front', 'back'],
  );

  const after = reorderElementRigSibling(source, 'back', 'front', 'after');
  assert.deepEqual(
    after.elements.map((element) => element.id),
    ['middle', 'back', 'front'],
  );
});

void test('rejects sibling reorders across parents and missing layers', () => {
  const source = [
    layer('root-a', null),
    layer('child-a', 'root-a'),
    layer('root-b', null),
  ];

  const crossParent = reorderElementRigSibling(source, 'child-a', 'root-b');
  assert.equal(crossParent.outcome, 'different-parent');
  assert.deepEqual(crossParent.elements, source);

  const missing = reorderElementRigSibling(source, 'missing', 'root-b');
  assert.equal(missing.outcome, 'missing-layer');
  assert.deepEqual(missing.elements, source);

  const unchanged = reorderElementRigSibling(source, 'root-a', 'root-a');
  assert.equal(unchanged.outcome, 'unchanged');
  assert.deepEqual(unchanged.elements, source);
});

void test('reparents a nested branch under a rotated parent without a pose jump', () => {
  const body = layer('body', null, {
    x: 250,
    y: 260,
    width: 420,
    height: 680,
    pivotX: 48,
    pivotY: 54,
    rotation: 90,
  });
  const head = layer('head', null, {
    x: 470,
    y: 170,
    width: 230,
    height: 240,
    pivotX: 42,
    pivotY: 70,
    rotation: 17,
  });
  const hair = layer('hair', 'head', {
    x: 500,
    y: 140,
    width: 260,
    height: 200,
    pivotX: 30,
    pivotY: 82,
    rotation: -11,
  });
  const source = [body, head, hair];
  const expectedHead = getElementRigRenderedVisualBounds(source, 'head');
  const expectedHair = getElementRigRenderedVisualBounds(source, 'hair');
  const originalHeadMotion = head.motion;
  const originalHairMotion = hair.motion;

  const attached = reparentElementRigBranchPreservingPose(
    source,
    'head',
    'body',
  );

  assert.equal(attached.issue, null);
  assert.equal(attached.changed, true);
  assert.equal(
    attached.elements.find((element) => element.id === 'head')?.parentId,
    'body',
  );
  assert.equal(
    attached.elements.find((element) => element.id === 'hair')?.parentId,
    'head',
  );
  assertBoundsClose(
    getElementRigRenderedVisualBounds(attached.elements, 'head'),
    expectedHead,
  );
  assertBoundsClose(
    getElementRigRenderedVisualBounds(attached.elements, 'hair'),
    expectedHair,
  );
  assert.equal(
    attached.elements.find((element) => element.id === 'head')?.motion,
    originalHeadMotion,
  );
  assert.equal(
    attached.elements.find((element) => element.id === 'hair')?.motion,
    originalHairMotion,
  );

  const detached = reparentElementRigBranchPreservingPose(
    attached.elements,
    'head',
    null,
  );
  assert.equal(detached.issue, null);
  assert.equal(detached.changed, true);
  assertBoundsClose(
    getElementRigRenderedVisualBounds(detached.elements, 'head'),
    expectedHead,
  );
  assertBoundsClose(
    getElementRigRenderedVisualBounds(detached.elements, 'hair'),
    expectedHair,
  );
});

void test('rejects cyclic and over-depth rig reparenting without mutation', () => {
  const cycleSource = [
    layer('body', null),
    layer('head', 'body'),
    layer('hair', 'head'),
  ];
  const cycle = reparentElementRigBranchPreservingPose(
    cycleSource,
    'body',
    'hair',
  );
  assert.equal(cycle.issue, 'cycle');
  assert.equal(cycle.changed, false);
  assert.deepEqual(cycle.elements, cycleSource);

  const deepSource = Array.from(
    { length: MAX_ELEMENT_RIG_DEPTH + 1 },
    (_, index) =>
      layer(`level-${index}`, index === 0 ? null : `level-${index - 1}`),
  );
  deepSource.push(
    layer('branch-root', null),
    layer('branch-child', 'branch-root'),
  );
  const tooDeep = reparentElementRigBranchPreservingPose(
    deepSource,
    'branch-root',
    `level-${MAX_ELEMENT_RIG_DEPTH}`,
  );
  assert.equal(tooDeep.issue, 'depth-limit');
  assert.equal(tooDeep.changed, false);
  assert.deepEqual(tooDeep.elements, deepSource);
});
