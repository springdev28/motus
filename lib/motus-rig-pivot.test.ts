import assert from 'node:assert/strict';
import test from 'node:test';

import { createImageRigMesh } from './motus-mesh-warp.ts';
import {
  CANVAS_WIDTH,
  MAX_ELEMENT_RIG_DEPTH,
  compileElementMotion,
  createBlankProject,
  createElement,
  getElementRigPivotForRenderedCanvasPoint,
  getElementRigRenderedVisualBounds,
  restoreProject,
  setElementRigPivotPreservingPose,
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
    x: 300,
    y: 300,
    width: 200,
    height: 500,
    ...overrides,
  });
}

function assertClose(actual: number, expected: number, tolerance = 1e-9) {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `expected ${expected}, received ${actual}`,
  );
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
    assertClose(actual[field], expected[field], 1e-6);
  }
}

function renderRigPoint(
  elements: readonly MotusElement[],
  elementId: string,
  point: { x: number; y: number },
) {
  const byId = new Map(elements.map((element) => [element.id, element]));
  const visited = new Set<string>();
  let current = byId.get(elementId);
  let rendered = point;
  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    const pivot = {
      x: current.x + (current.width * current.pivotX) / 100,
      y: current.y + (current.height * current.pivotY) / 100,
    };
    const radians = (current.rotation * Math.PI) / 180;
    const deltaX = rendered.x - pivot.x;
    const deltaY = rendered.y - pivot.y;
    rendered = {
      x: pivot.x + deltaX * Math.cos(radians) - deltaY * Math.sin(radians),
      y: pivot.y + deltaX * Math.sin(radians) + deltaY * Math.cos(radians),
    };
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }
  return rendered;
}

void test('applies exact pivot compensation to a full rig branch', () => {
  const body = layer('body', null, {
    rotation: 30,
    pivotX: 50,
    pivotY: 50,
  });
  const detail = layer('detail', 'body', {
    x: 360,
    y: 420,
    width: 90,
    height: 120,
    rotation: -17,
  });
  const unrelated = layer('unrelated', null, { x: 700, y: 900 });
  const source = [body, detail, unrelated];
  const expectedBody = getElementRigRenderedVisualBounds(source, 'body');
  const expectedDetail = getElementRigRenderedVisualBounds(source, 'detail');

  const result = setElementRigPivotPreservingPose(source, 'body', 10, 15);

  assert.equal(result.issue, null);
  assert.equal(result.changed, true);
  const nextBody = result.elements[0];
  const nextDetail = result.elements[1];
  assertClose(nextBody.x, 398.2179676972449);
  assertClose(nextBody.y, 283.4455543377232);
  assertClose(nextDetail.x - detail.x, 98.21796769724489);
  assertClose(nextDetail.y - detail.y, -16.554445662276777);
  assert.equal(nextBody.pivotX, 10);
  assert.equal(nextBody.pivotY, 15);
  assert.equal(nextDetail.pivotX, detail.pivotX);
  assert.equal(nextDetail.pivotY, detail.pivotY);
  assert.equal(result.elements[2], unrelated);
  assertBoundsClose(
    getElementRigRenderedVisualBounds(result.elements, 'body'),
    expectedBody,
  );
  assertBoundsClose(
    getElementRigRenderedVisualBounds(result.elements, 'detail'),
    expectedDetail,
  );
});

void test('uses only local rotation beneath rotated ancestors', () => {
  const body = layer('body', null, {
    x: 240,
    y: 280,
    width: 500,
    height: 700,
    rotation: 47,
  });
  const shoulder = layer('shoulder', 'body', {
    x: 320,
    y: 410,
    width: 300,
    height: 280,
    rotation: -31,
  });
  const arm = layer('arm', 'shoulder', {
    x: 440,
    y: 520,
    width: 160,
    height: 420,
    rotation: 64,
    pivotX: 25,
    pivotY: 20,
  });
  const hand = layer('hand', 'arm', {
    x: 500,
    y: 850,
    width: 130,
    height: 150,
    rotation: -22,
    locked: true,
    visible: false,
  });
  const sibling = layer('other-arm', 'shoulder', { x: 180, y: 510 });
  const source = [body, shoulder, arm, hand, sibling];
  const expectedArm = getElementRigRenderedVisualBounds(source, 'arm');
  const expectedHand = getElementRigRenderedVisualBounds(source, 'hand');

  const result = setElementRigPivotPreservingPose(source, 'arm', 100, 0);

  assert.equal(result.issue, null);
  const nextArm = result.elements[2];
  const nextHand = result.elements[3];
  assertClose(nextArm.x - arm.x, 8.103237503819344);
  assertClose(nextArm.y - arm.y, 155.03210922561755);
  assertClose(nextHand.x - hand.x, 8.103237503819344);
  assertClose(nextHand.y - hand.y, 155.03210922561755);
  assert.equal(result.elements[0], body);
  assert.equal(result.elements[1], shoulder);
  assert.equal(result.elements[4], sibling);
  assert.equal(nextHand.parentId, 'arm');
  assert.equal(nextHand.rotation, hand.rotation);
  assert.equal(nextHand.locked, true);
  assert.equal(nextHand.visible, false);
  assertBoundsClose(
    getElementRigRenderedVisualBounds(result.elements, 'arm'),
    expectedArm,
  );
  assertBoundsClose(
    getElementRigRenderedVisualBounds(result.elements, 'hand'),
    expectedHand,
  );
});

void test('zero local rotation changes a pivot without translating the branch', () => {
  const parent = layer('parent', null, { rotation: 90 });
  const target = layer('target', 'parent', {
    rotation: 0,
    pivotX: 0,
    pivotY: 0,
  });
  const child = layer('child', 'target', { x: 420, y: 520 });
  const source = [parent, target, child];

  const result = setElementRigPivotPreservingPose(source, 'target', 100, 100);

  assert.equal(result.issue, null);
  assert.deepEqual(
    result.elements.slice(1).map(({ x, y }) => ({ x, y })),
    source.slice(1).map(({ x, y }) => ({ x, y })),
  );
  assert.equal(result.elements[1].pivotX, 100);
  assert.equal(result.elements[1].pivotY, 100);
});

void test('supports inclusive 0 and 100 pivot boundaries without rounding', () => {
  const cases = [
    { rotation: 0, deltaX: 0, deltaY: 0 },
    { rotation: 90, deltaX: -600, deltaY: -120 },
    { rotation: -90, deltaX: 120, deltaY: -600 },
    { rotation: 180, deltaX: -480, deltaY: -720 },
  ];
  for (const candidate of cases) {
    const parent = layer(`parent-${candidate.rotation}`, null);
    const target = layer(`target-${candidate.rotation}`, parent.id, {
      x: 900,
      y: 900,
      width: 240,
      height: 360,
      rotation: candidate.rotation,
      pivotX: 0,
      pivotY: 0,
    });
    const child = layer(`child-${candidate.rotation}`, target.id, {
      x: 960,
      y: 1040,
    });
    const source = [parent, target, child];
    const expectedTarget = getElementRigRenderedVisualBounds(source, target.id);
    const expectedChild = getElementRigRenderedVisualBounds(source, child.id);

    const result = setElementRigPivotPreservingPose(
      source,
      target.id,
      100,
      100,
    );

    assert.equal(result.issue, null, `${candidate.rotation} degrees`);
    assertClose(result.elements[1].x - target.x, candidate.deltaX);
    assertClose(result.elements[1].y - target.y, candidate.deltaY);
    assert.equal(result.elements[1].pivotX, 100);
    assert.equal(result.elements[1].pivotY, 100);
    assertBoundsClose(
      getElementRigRenderedVisualBounds(result.elements, target.id),
      expectedTarget,
    );
    assertBoundsClose(
      getElementRigRenderedVisualBounds(result.elements, child.id),
      expectedChild,
    );
  }
});

void test('is idempotent and reverses without coordinate drift', () => {
  const target = layer('target', null, {
    x: 400,
    y: 500,
    width: 260,
    height: 390,
    rotation: 27.5,
    pivotX: 33.25,
    pivotY: 66.75,
  });
  const child = layer('child', 'target', { x: 470, y: 680 });
  const source = [target, child];

  const first = setElementRigPivotPreservingPose(
    source,
    'target',
    72.5,
    14.125,
  );
  const second = setElementRigPivotPreservingPose(
    first.elements,
    'target',
    72.5,
    14.125,
  );
  const reversed = setElementRigPivotPreservingPose(
    first.elements,
    'target',
    33.25,
    66.75,
  );

  assert.equal(first.issue, null);
  assert.equal(second.changed, false);
  assert.equal(second.issue, null);
  assert.deepEqual(second.elements, first.elements);
  assert.equal(second.elements[0], first.elements[0]);
  assertClose(reversed.elements[0].x, target.x);
  assertClose(reversed.elements[0].y, target.y);
  assertClose(reversed.elements[1].x, child.x);
  assertClose(reversed.elements[1].y, child.y);
});

void test('preserves motion, masks, meshes, and source dependencies', () => {
  const sourceImage = createElement('image', 1, {
    id: 'source',
    name: 'source',
    src: 'data:image/png;base64,iVBORw0KGgo=',
  });
  const mesh = createImageRigMesh('wind-left');
  const part = createElement('image', 2, {
    id: 'part',
    name: 'part',
    parentId: sourceImage.id,
    x: 350,
    y: 480,
    width: 220,
    height: 300,
    rotation: 38,
    imageRigPart: {
      sourceElementId: sourceImage.id,
      cropX: 10,
      cropY: 15,
      cropWidth: 35,
      cropHeight: 45,
      maskPoints: [
        { x: 10, y: 15 },
        { x: 45, y: 15 },
        { x: 45, y: 60 },
      ],
      mesh,
    },
  });
  const detail = createElement('image', 3, {
    id: 'detail',
    name: 'detail',
    parentId: part.id,
    x: 390,
    y: 520,
    width: 100,
    height: 130,
    rotation: -12,
    imageRigPart: {
      sourceElementId: sourceImage.id,
      cropX: 20,
      cropY: 20,
      cropWidth: 20,
      cropHeight: 25,
    },
  });
  const source = [sourceImage, part, detail];
  const before = structuredClone(source);
  const partMotion = part.motion;
  const detailMotion = detail.motion;
  const partRigData = part.imageRigPart;
  const detailRigData = detail.imageRigPart;
  const compiledPart = compileElementMotion(part);
  const compiledDetail = compileElementMotion(detail);

  const result = setElementRigPivotPreservingPose(source, 'part', 12, 88);

  assert.equal(result.issue, null);
  assert.deepEqual(source, before);
  assert.equal(result.elements[1].motion, partMotion);
  assert.equal(result.elements[2].motion, detailMotion);
  assert.equal(result.elements[1].imageRigPart, partRigData);
  assert.equal(result.elements[2].imageRigPart, detailRigData);
  assert.equal(result.elements[1].imageRigPart?.mesh, partRigData?.mesh);
  assert.equal(result.elements[1].imageRigPart?.sourceElementId, 'source');
  assert.equal(result.elements[2].imageRigPart?.sourceElementId, 'source');
  assert.deepEqual(compileElementMotion(result.elements[1]), compiledPart);
  assert.deepEqual(compileElementMotion(result.elements[2]), compiledDetail);
});

void test('fails atomically for missing, invalid, and unpersistable pivots', () => {
  const root = layer('root', null, {
    x: 300,
    y: 500,
    width: 240,
    height: 360,
    rotation: 180,
    pivotX: 0,
    pivotY: 0,
  });
  const source = [root];
  const failures = [
    setElementRigPivotPreservingPose(source, 'missing', 50, 50),
    setElementRigPivotPreservingPose(source, 'root', Number.NaN, 50),
    setElementRigPivotPreservingPose(
      source,
      'root',
      50,
      Number.POSITIVE_INFINITY,
    ),
    setElementRigPivotPreservingPose(source, 'root', -0.001, 50),
    setElementRigPivotPreservingPose(source, 'root', 50, 100.001),
  ];
  assert.equal(failures[0].issue, 'missing-layer');
  failures
    .slice(1)
    .forEach((result) => assert.equal(result.issue, 'invalid-pivot'));
  for (const result of failures) {
    assert.equal(result.changed, false);
    assert.notEqual(result.elements, source);
    assert.equal(result.elements[0], root);
  }

  const limited = setElementRigPivotPreservingPose(source, 'root', 100, 100);
  assert.equal(limited.issue, 'coordinate-limit');
  assert.equal(limited.changed, false);
  assert.equal(limited.elements[0], root);

  const parent = layer('parent', null);
  const parented = { ...root, parentId: parent.id };
  const allowed = setElementRigPivotPreservingPose(
    [parent, parented],
    'root',
    100,
    100,
  );
  assert.equal(allowed.issue, null);
  assert.equal(allowed.changed, true);
});

void test('preflights every descendant and survives a restore round trip', () => {
  const parent = layer('parent', null);
  const target = layer('target', parent.id, {
    x: 900,
    y: 1000,
    width: 240,
    height: 360,
    rotation: 180,
    pivotX: 0,
    pivotY: 0,
  });
  const descendant = layer('descendant', target.id, {
    x: -CANVAS_WIDTH * MAX_ELEMENT_RIG_DEPTH + 100,
    y: 900,
  });
  const limited = setElementRigPivotPreservingPose(
    [parent, target, descendant],
    'target',
    100,
    100,
  );
  assert.equal(limited.issue, 'coordinate-limit');
  assert.equal(limited.elements[2], descendant);

  const safeDescendant = { ...descendant, x: 500, y: 900 };
  const safe = setElementRigPivotPreservingPose(
    [parent, target, safeDescendant],
    'target',
    100,
    100,
  );
  assert.equal(safe.issue, null);
  const expectedTarget = getElementRigRenderedVisualBounds(
    safe.elements,
    'target',
  );
  const expectedDescendant = getElementRigRenderedVisualBounds(
    safe.elements,
    'descendant',
  );
  const project = createBlankProject('pivot-round-trip');
  project.chapters[0].scenes[0].elements = safe.elements;
  const restored = restoreProject(JSON.stringify(project));
  assert.ok(restored);
  const restoredElements = restored.chapters[0].scenes[0].elements;
  assert.deepEqual(
    restoredElements.map(({ id, parentId, pivotX, pivotY, x, y }) => ({
      id,
      parentId,
      pivotX,
      pivotY,
      x,
      y,
    })),
    safe.elements.map(({ id, parentId, pivotX, pivotY, x, y }) => ({
      id,
      parentId,
      pivotX,
      pivotY,
      x,
      y,
    })),
  );
  assertBoundsClose(
    getElementRigRenderedVisualBounds(restoredElements, 'target'),
    expectedTarget,
  );
  assertBoundsClose(
    getElementRigRenderedVisualBounds(restoredElements, 'descendant'),
    expectedDescendant,
  );
});

void test('maps an unrotated canvas point to authored pivot percentages', () => {
  const target = layer('target', null);

  assert.deepEqual(
    getElementRigPivotForRenderedCanvasPoint([target], target.id, {
      x: 350,
      y: 700,
    }),
    { pivotX: 25, pivotY: 80 },
  );
});

void test('inverts the selected layer rotation before placing its pivot', () => {
  const target = layer('target', null, { rotation: 90 });
  const desiredAuthoredPoint = { x: 300, y: 800 };
  const renderedPoint = renderRigPoint(
    [target],
    target.id,
    desiredAuthoredPoint,
  );

  const pivot = getElementRigPivotForRenderedCanvasPoint(
    [target],
    target.id,
    renderedPoint,
  );

  assert.ok(pivot);
  assertClose(pivot.pivotX, 0);
  assertClose(pivot.pivotY, 100);
});

void test('inverts every nested rig rotation in outer-to-inner order', () => {
  const body = layer('body', null, {
    x: 180,
    y: 240,
    width: 620,
    height: 820,
    rotation: 37,
    pivotX: 44,
    pivotY: 59,
  });
  const shoulder = layer('shoulder', body.id, {
    x: 370,
    y: 430,
    width: 280,
    height: 260,
    rotation: -53,
    pivotX: 15,
    pivotY: 72,
  });
  const arm = layer('arm', shoulder.id, {
    x: 460,
    y: 520,
    width: 170,
    height: 430,
    rotation: 81,
    pivotX: 62,
    pivotY: 11,
  });
  const source = [body, shoulder, arm];
  const desired = { pivotX: 18.5, pivotY: 82.25 };
  const renderedPoint = renderRigPoint(source, arm.id, {
    x: arm.x + (arm.width * desired.pivotX) / 100,
    y: arm.y + (arm.height * desired.pivotY) / 100,
  });

  const pivot = getElementRigPivotForRenderedCanvasPoint(
    source,
    arm.id,
    renderedPoint,
  );

  assert.ok(pivot);
  assertClose(pivot.pivotX, desired.pivotX, 1e-8);
  assertClose(pivot.pivotY, desired.pivotY, 1e-8);
});

void test('clamps stage placement and rejects unusable canvas points', () => {
  const target = layer('target', null);

  assert.deepEqual(
    getElementRigPivotForRenderedCanvasPoint([target], target.id, {
      x: -500,
      y: 5_000,
    }),
    { pivotX: 0, pivotY: 100 },
  );
  assert.equal(
    getElementRigPivotForRenderedCanvasPoint([target], 'missing', {
      x: 300,
      y: 300,
    }),
    null,
  );
  assert.equal(
    getElementRigPivotForRenderedCanvasPoint([target], target.id, {
      x: Number.NaN,
      y: 300,
    }),
    null,
  );
});

void test('round-trips direct stage placement through pose compensation', () => {
  const body = layer('body', null, {
    x: 200,
    y: 260,
    width: 560,
    height: 780,
    rotation: -29,
  });
  const arm = layer('arm', body.id, {
    x: 420,
    y: 500,
    width: 180,
    height: 440,
    rotation: 46,
    pivotX: 50,
    pivotY: 50,
  });
  const hand = layer('hand', arm.id, {
    x: 455,
    y: 850,
    width: 125,
    height: 140,
  });
  const source = [body, arm, hand];
  const desiredAuthoredPoint = {
    x: arm.x + arm.width * 0.12,
    y: arm.y + arm.height * 0.2,
  };
  const renderedPoint = renderRigPoint(source, arm.id, desiredAuthoredPoint);
  const pivot = getElementRigPivotForRenderedCanvasPoint(
    source,
    arm.id,
    renderedPoint,
  );
  assert.ok(pivot);
  const expectedArmBounds = getElementRigRenderedVisualBounds(source, arm.id);
  const expectedHandBounds = getElementRigRenderedVisualBounds(source, hand.id);

  const result = setElementRigPivotPreservingPose(
    source,
    arm.id,
    pivot.pivotX,
    pivot.pivotY,
  );

  assert.equal(result.issue, null);
  const nextArm = result.elements[1];
  const nextRenderedPivot = renderRigPoint(result.elements, arm.id, {
    x: nextArm.x + (nextArm.width * nextArm.pivotX) / 100,
    y: nextArm.y + (nextArm.height * nextArm.pivotY) / 100,
  });
  assertClose(nextRenderedPivot.x, renderedPoint.x, 1e-7);
  assertClose(nextRenderedPivot.y, renderedPoint.y, 1e-7);
  assertBoundsClose(
    getElementRigRenderedVisualBounds(result.elements, arm.id),
    expectedArmBounds,
  );
  assertBoundsClose(
    getElementRigRenderedVisualBounds(result.elements, hand.id),
    expectedHandBounds,
  );
});
