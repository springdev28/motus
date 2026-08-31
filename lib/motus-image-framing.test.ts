import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getFramedCanvasSize,
  getFramedImageDrawRect,
} from './motus-image-framing.ts';

void test('framed canvas sizing preserves landscape and portrait aspects', () => {
  assert.deepEqual(getFramedCanvasSize(2, 1_000), {
    width: 1_000,
    height: 500,
  });
  assert.deepEqual(getFramedCanvasSize(0.5, 1_000), {
    width: 500,
    height: 1_000,
  });
});

void test('cover and contain match centered CSS object fitting', () => {
  assert.deepEqual(
    getFramedImageDrawRect(200, 100, 100, 100, 'cover', 50, 50),
    { x: -50, y: 0, width: 200, height: 100 },
  );
  assert.deepEqual(
    getFramedImageDrawRect(200, 100, 100, 100, 'contain', 50, 50),
    { x: 0, y: 25, width: 100, height: 50 },
  );
});

void test('focal percentages choose the available overflow or free space', () => {
  assert.deepEqual(
    getFramedImageDrawRect(200, 100, 100, 100, 'cover', 100, 0),
    { x: -100, y: 0, width: 200, height: 100 },
  );
  assert.deepEqual(
    getFramedImageDrawRect(200, 100, 100, 100, 'contain', 0, 100),
    { x: 0, y: 50, width: 100, height: 50 },
  );
});
