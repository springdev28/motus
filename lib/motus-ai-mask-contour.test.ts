import assert from 'node:assert/strict';
import test from 'node:test';

import {
  EmptySegmentationMaskError,
  confidenceMaskToPolygon,
} from './motus-ai/mask-contour.ts';

function createMask(
  width: number,
  height: number,
  selected: (x: number, y: number) => boolean,
): Float32Array {
  return Float32Array.from({ length: width * height }, (_, index) => {
    const x = index % width;
    const y = Math.floor(index / width);
    return selected(x, y) ? 1 : 0;
  });
}

function assertApproximatelyEqual(
  actual: number,
  expected: number,
  tolerance = 1e-9,
): void {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `Expected ${actual} to be within ${tolerance} of ${expected}.`,
  );
}

void test('mask contour keeps only the largest connected component', () => {
  const width = 8;
  const height = 6;
  const confidence = createMask(
    width,
    height,
    (x, y) => (y === 0 && x < 2) || (x >= 3 && x <= 6 && y >= 2 && y <= 4),
  );

  const result = confidenceMaskToPolygon(
    confidence,
    width,
    height,
    0.5,
    512,
    'cpu',
  );

  assert.equal(result.mask.foregroundPixels, 12);
  assert.equal(result.backend, 'cpu');
  assert.ok(result.polygon.length >= 3);
  assert.ok(result.polygon.every(({ x }) => x >= 37.5 && x <= 87.5));
  assert.ok(
    result.polygon.every(
      ({ y }) => y >= 100 / 3 - 1e-9 && y <= 100 * (5 / 6) + 1e-9,
    ),
  );
  assertApproximatelyEqual(result.cropBounds.x, 37.5);
  assertApproximatelyEqual(result.cropBounds.y, 100 / 3);
  assertApproximatelyEqual(result.cropBounds.width, 50);
  assertApproximatelyEqual(result.cropBounds.height, 50);
});

void test('complex outer contours are simplified to the requested point cap', () => {
  const width = 700;
  const height = 8;
  const confidence = createMask(
    width,
    height,
    (x, y) => y === 4 || (x % 2 === 0 && y >= 1 && y <= 3),
  );

  const result = confidenceMaskToPolygon(
    confidence,
    width,
    height,
    0.5,
    512,
    'gpu',
  );

  assert.ok(result.polygon.length >= 3);
  assert.ok(result.polygon.length <= 512);
  assert.equal(result.backend, 'gpu');
  assert.equal(result.mask.foregroundPixels, width + Math.ceil(width / 2) * 3);
  for (const point of result.polygon) {
    assert.ok(Number.isFinite(point.x));
    assert.ok(Number.isFinite(point.y));
    assert.ok(point.x >= 0 && point.x <= 100);
    assert.ok(point.y >= 0 && point.y <= 100);
  }
});

void test('empty and below-threshold masks raise the dedicated empty error', () => {
  const confidence = new Float32Array([0, 0.49, Number.NaN, -1]);
  assert.throws(
    () => confidenceMaskToPolygon(confidence, 2, 2, 0.5, 512, 'cpu'),
    EmptySegmentationMaskError,
  );
});

void test('confidence values equal to the threshold are foreground', () => {
  const confidence = new Float32Array([0.5, 0.499, 0]);
  const result = confidenceMaskToPolygon(confidence, 3, 1, 0.5, 512, 'cpu');

  assert.equal(result.mask.foregroundPixels, 1);
  assert.equal(result.mask.threshold, 0.5);
  assert.equal(result.cropBounds.x, 0);
  assert.equal(result.cropBounds.y, 0);
  assertApproximatelyEqual(result.cropBounds.width, 100 / 3);
  assert.equal(result.cropBounds.height, 100);
  assert.throws(
    () => confidenceMaskToPolygon(confidence, 3, 1, 0.500_001, 512, 'cpu'),
    EmptySegmentationMaskError,
  );
});

void test('mask contour rejects impossible mask shapes before tracing', () => {
  const invalidCases: Array<{
    confidence: Float32Array;
    width: number;
    height: number;
  }> = [
    { confidence: new Float32Array(3), width: 2, height: 2 },
    { confidence: new Float32Array(4), width: 1.5, height: 2 },
    { confidence: new Float32Array(0), width: 0, height: 1 },
    { confidence: new Float32Array(0), width: 1, height: -1 },
  ];

  for (const { confidence, width, height } of invalidCases) {
    assert.throws(
      () => confidenceMaskToPolygon(confidence, width, height, 0.5, 512, 'cpu'),
      /Invalid confidence mask dimensions/,
    );
  }
});
