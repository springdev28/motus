import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createImageRigMesh,
  getImageRigMeshPoint,
  getImageRigMeshPositions,
  isIdentityImageRigMesh,
  isValidElementImageRigMesh,
  normalizeElementImageRigMesh,
  updateImageRigMeshPoint,
} from './motus-mesh-warp.ts';

void test('identity mesh exposes a regular 3 by 3 position buffer', () => {
  const mesh = createImageRigMesh();
  assert.equal(isIdentityImageRigMesh(mesh), true);
  assert.deepEqual(
    Array.from(getImageRigMeshPositions(mesh, 200, 100)),
    [0, 0, 100, 0, 200, 0, 0, 50, 100, 50, 200, 50, 0, 100, 100, 100, 200, 100],
  );
});

void test('presets and direct edits remain bounded inside the part', () => {
  const wind = createImageRigMesh('wind-left');
  assert.equal(isValidElementImageRigMesh(wind), true);
  assert.equal(isIdentityImageRigMesh(wind), false);

  const movedCenter = updateImageRigMeshPoint(wind, 4, {
    x: 10_000,
    y: -10_000,
  });
  assert.deepEqual(getImageRigMeshPoint(movedCenter, 4), { x: 70, y: 30 });

  const movedCorner = updateImageRigMeshPoint(wind, 0, { x: 50, y: 50 });
  assert.deepEqual(getImageRigMeshPoint(movedCorner, 0), { x: 20, y: 20 });
  assert.equal(isValidElementImageRigMesh(movedCorner), true);
});

void test('mesh validation rejects malformed, nonfinite, and out-of-range data', () => {
  const valid = createImageRigMesh('s-curve');
  const invalid: unknown[] = [
    null,
    { ...valid, columns: 4 },
    { ...valid, rows: 2 },
    { ...valid, offsets: valid.offsets.slice(0, 8) },
    {
      ...valid,
      offsets: valid.offsets.map((point, index) =>
        index === 4 ? { x: Number.NaN, y: point.y } : point,
      ),
    },
    {
      ...valid,
      offsets: valid.offsets.map((point, index) =>
        index === 4 ? { x: 21, y: point.y } : point,
      ),
    },
    {
      ...valid,
      offsets: valid.offsets.map((point, index) =>
        index === 0 ? { x: -1, y: point.y } : point,
      ),
    },
  ];

  for (const candidate of invalid) {
    assert.equal(isValidElementImageRigMesh(candidate), false);
    assert.equal(normalizeElementImageRigMesh(candidate), undefined);
  }
});

void test('mesh updates do not mutate the previous value', () => {
  const mesh = createImageRigMesh();
  const next = updateImageRigMeshPoint(mesh, 4, { x: 58, y: 44 });
  assert.deepEqual(getImageRigMeshPoint(mesh, 4), { x: 50, y: 50 });
  assert.deepEqual(getImageRigMeshPoint(next, 4), { x: 58, y: 44 });
  assert.notEqual(next.offsets, mesh.offsets);
});
