import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  ModelAssetError,
  parseModelChunkManifest,
} from './motus-ai/model-chunks.ts';
import {
  isMotusAiChunkManifest,
  isMotusAiModelManifest,
  type MotusAiChunkManifest,
} from './motus-ai/model-manifest.ts';

const MAGIC_TOUCH_MODEL_ID = 'mediapipe-magic-touch-int8';
const SHA_256_A = 'a'.repeat(64);
const SHA_256_B = 'b'.repeat(64);

function readPublicMagicTouchManifest(): unknown {
  return JSON.parse(
    readFileSync(
      new URL(
        '../public/models/mediapipe/magic-touch/manifest.json',
        import.meta.url,
      ),
      'utf8',
    ),
  ) as unknown;
}

function createChunkManifest(): MotusAiChunkManifest {
  return {
    schemaVersion: 1,
    id: MAGIC_TOUCH_MODEL_ID,
    label: 'MagicTouch Interactive Segmenter',
    format: 'mediapipe-task-chunks',
    bytes: 5,
    sha256: SHA_256_A,
    chunks: [
      { path: 'model.part-00', bytes: 2, sha256: SHA_256_A },
      { path: 'model.part-01', bytes: 3, sha256: SHA_256_B },
    ],
    source:
      'https://storage.googleapis.com/mediapipe-models/interactive-segmenter/model.task',
    license: 'Apache-2.0',
  };
}

function assertManifestError(parse: () => unknown, expectedCode: string): void {
  assert.throws(parse, (error: unknown) => {
    assert.ok(error instanceof ModelAssetError);
    assert.equal(error.code, expectedCode);
    return true;
  });
}

void test('the installed public MagicTouch manifest passes both manifest parsers', () => {
  const manifest = readPublicMagicTouchManifest();

  assert.ok(isMotusAiChunkManifest(manifest, MAGIC_TOUCH_MODEL_ID));
  assert.ok(isMotusAiModelManifest(manifest, MAGIC_TOUCH_MODEL_ID));
  assert.equal(isMotusAiChunkManifest(manifest, 'a-different-model'), false);

  const parsed = parseModelChunkManifest(manifest);
  assert.equal(parsed.schemaVersion, 1);
  assert.equal(parsed.id, MAGIC_TOUCH_MODEL_ID);
  assert.equal(parsed.format, 'mediapipe-task-chunks');
  assert.equal(parsed.bytes, manifest.bytes);
  assert.equal(parsed.sha256, manifest.sha256);
  assert.deepEqual(parsed.chunks, manifest.chunks);
  assert.equal(
    parsed.chunks.reduce((total, chunk) => total + (chunk.bytes ?? 0), 0),
    parsed.bytes,
  );
});

void test('strict chunk manifests reject unsafe and duplicate asset paths', () => {
  const unsafePaths = [
    '../model.part-00',
    './model.part-00',
    '/model.part-00',
    '//cdn.example/model.part-00',
    'https://cdn.example/model.part-00',
    'chunks\\model.part-00',
    'model.part-00?download=1',
    'model.part-00#fragment',
    'chunks//model.part-00',
    'chunks/%2e%2e/model.part-00',
  ];

  for (const path of unsafePaths) {
    const manifest = createChunkManifest();
    manifest.chunks[0].path = path;
    assert.equal(
      isMotusAiChunkManifest(manifest, MAGIC_TOUCH_MODEL_ID),
      false,
      `expected path ${JSON.stringify(path)} to be rejected`,
    );
  }

  const duplicate = createChunkManifest();
  duplicate.chunks[1].path = duplicate.chunks[0].path;
  assert.equal(isMotusAiChunkManifest(duplicate, MAGIC_TOUCH_MODEL_ID), false);
});

void test('strict chunk manifests require positive safe sizes and an exact byte total', () => {
  for (const bytes of [0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
    const manifest = createChunkManifest();
    manifest.bytes = bytes;
    assert.equal(
      isMotusAiChunkManifest(manifest, MAGIC_TOUCH_MODEL_ID),
      false,
      `expected manifest size ${bytes} to be rejected`,
    );
  }

  for (const bytes of [0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
    const manifest = createChunkManifest();
    manifest.chunks[0].bytes = bytes;
    assert.equal(
      isMotusAiChunkManifest(manifest, MAGIC_TOUCH_MODEL_ID),
      false,
      `expected chunk size ${bytes} to be rejected`,
    );
  }

  const mismatchedTotal = createChunkManifest();
  mismatchedTotal.bytes += 1;
  assert.equal(
    isMotusAiChunkManifest(mismatchedTotal, MAGIC_TOUCH_MODEL_ID),
    false,
  );

  const overflowingTotal = createChunkManifest();
  overflowingTotal.bytes = Number.MAX_SAFE_INTEGER;
  overflowingTotal.chunks = [
    {
      path: 'model.part-00',
      bytes: Number.MAX_SAFE_INTEGER,
      sha256: SHA_256_A,
    },
    { path: 'model.part-01', bytes: 1, sha256: SHA_256_B },
  ];
  assert.equal(
    isMotusAiChunkManifest(overflowingTotal, MAGIC_TOUCH_MODEL_ID),
    false,
  );
});

void test('the chunk loader parser rejects negative and unsafe-number sizes', () => {
  for (const bytes of [-1, 1.5, Number.MAX_SAFE_INTEGER + 1, Infinity, NaN]) {
    const manifest = createChunkManifest();
    manifest.bytes = bytes;
    assertManifestError(
      () => parseModelChunkManifest(manifest),
      'INVALID_MODEL_MANIFEST',
    );
  }

  for (const bytes of [-1, 1.5, Number.MAX_SAFE_INTEGER + 1, Infinity, NaN]) {
    const manifest = createChunkManifest();
    manifest.chunks[0].bytes = bytes;
    assertManifestError(
      () => parseModelChunkManifest(manifest),
      'INVALID_MODEL_MANIFEST',
    );
  }

  const overSafetyLimit = createChunkManifest();
  overSafetyLimit.bytes = 512 * 1024 * 1024 + 1;
  assertManifestError(
    () => parseModelChunkManifest(overSafetyLimit),
    'MODEL_TOO_LARGE',
  );
});

void test('manifest validators reject malformed SHA-256 declarations', () => {
  for (const sha256 of ['', 'abc', 'g'.repeat(64), 'a'.repeat(63)]) {
    const strictManifest = createChunkManifest();
    strictManifest.sha256 = sha256;
    assert.equal(
      isMotusAiChunkManifest(strictManifest, MAGIC_TOUCH_MODEL_ID),
      false,
      `expected model digest ${JSON.stringify(sha256)} to be rejected`,
    );
    assertManifestError(
      () => parseModelChunkManifest(strictManifest),
      'INVALID_MODEL_MANIFEST',
    );

    const chunkManifest = createChunkManifest();
    chunkManifest.chunks[0].sha256 = sha256;
    assert.equal(
      isMotusAiChunkManifest(chunkManifest, MAGIC_TOUCH_MODEL_ID),
      false,
      `expected chunk digest ${JSON.stringify(sha256)} to be rejected`,
    );
    assertManifestError(
      () => parseModelChunkManifest(chunkManifest),
      'INVALID_MODEL_MANIFEST',
    );
  }
});
