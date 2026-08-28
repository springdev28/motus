import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  MIN_ELEMENT_HEIGHT,
  MIN_ELEMENT_WIDTH,
  MOTION_SCHEMA_VERSION,
  PROJECT_SCHEMA_VERSION,
  compileElementMotion,
  constrainElementToCanvas,
  createDefaultProject,
  createPublicationRevision,
  detectImageFormat,
  reorderScenes,
  restoreNewestProject,
  restoreProject,
  validateImageAsset,
} from './motus-model.ts';

void test('element geometry is constrained without mutating the source', () => {
  const source = createDefaultProject().scenes[0].elements[0];
  source.x = -80;
  source.y = 2_000;
  source.width = CANVAS_WIDTH + 400;
  source.height = 0;
  source.rotation = 450;
  source.opacity = 4;

  const constrained = constrainElementToCanvas(source);

  assert.equal(source.x, -80);
  assert.notEqual(constrained, source);
  assert.deepEqual(
    {
      x: constrained.x,
      y: constrained.y,
      width: constrained.width,
      height: constrained.height,
      rotation: constrained.rotation,
      opacity: constrained.opacity,
    },
    {
      x: 0,
      y: CANVAS_HEIGHT - MIN_ELEMENT_HEIGHT,
      width: CANVAS_WIDTH,
      height: MIN_ELEMENT_HEIGHT,
      rotation: 180,
      opacity: 1,
    },
  );
});

void test('restored drafts normalize invalid element geometry', () => {
  const project = createDefaultProject();
  const element = project.scenes[0].elements[0];
  element.x = Number.NaN;
  element.y = -20;
  element.width = MIN_ELEMENT_WIDTH - 1;
  element.height = CANVAS_HEIGHT + 1;
  element.opacity = -1;

  const restored = restoreProject(JSON.stringify(project));

  assert.ok(restored);
  assert.deepEqual(
    {
      x: restored.scenes[0].elements[0].x,
      y: restored.scenes[0].elements[0].y,
      width: restored.scenes[0].elements[0].width,
      height: restored.scenes[0].elements[0].height,
      opacity: restored.scenes[0].elements[0].opacity,
    },
    { x: 0, y: 0, width: MIN_ELEMENT_WIDTH, height: CANVAS_HEIGHT, opacity: 0 },
  );
});

void test('motion compilation is deterministic and produces a final element state', () => {
  const element = createDefaultProject().scenes[0].elements[0];
  element.rotation = 12;
  element.opacity = 0.8;
  element.motion.moveX = 120;
  element.motion.moveY = -40;
  element.motion.fromRotation = -35;
  element.motion.fromScale = 0.6;
  element.motion.fromOpacity = 0.2;
  element.motion.delayMs = 300;

  const first = compileElementMotion(element);
  const second = compileElementMotion(element);

  assert.deepEqual(first, second);
  assert.deepEqual(first.from, {
    translateX: -120,
    translateY: 40,
    opacity: 0.2,
    scale: 0.6,
    rotation: -23,
  });
  assert.deepEqual(first.to, {
    translateX: 0,
    translateY: 0,
    opacity: 0.8,
    scale: 1,
    rotation: 12,
  });
  assert.equal(first.delayMs, 300);
});

void test('version 2 drafts migrate without losing scenes or element motion', () => {
  const legacy = structuredClone(createDefaultProject()) as unknown as {
    schemaVersion: number;
    title: string;
    scenes: Array<{
      elements: Array<{
        motion: Record<string, unknown>;
      }>;
    }>;
  };
  legacy.schemaVersion = 2;
  legacy.title = 'Recovered legacy draft';
  delete legacy.scenes[0].elements[0].motion.delayMs;
  delete legacy.scenes[0].elements[0].motion.fromScale;
  delete legacy.scenes[0].elements[0].motion.fromRotation;
  delete legacy.scenes[0].elements[0].motion.schemaVersion;
  delete legacy.scenes[0].elements[0].motion.event;

  const restored = restoreProject(JSON.stringify(legacy));

  assert.ok(restored);
  assert.equal(restored.schemaVersion, PROJECT_SCHEMA_VERSION);
  assert.equal(restored.title, 'Recovered legacy draft');
  assert.equal(restored.scenes.length, 3);
  assert.equal(restored.scenes[0].elements[0].motion.schemaVersion, MOTION_SCHEMA_VERSION);
  assert.equal(restored.scenes[0].elements[0].motion.event, 'scene-enter');
  assert.equal(restored.scenes[0].elements[0].motion.delayMs, 0);
  assert.equal(restored.scenes[0].elements[0].motion.fromScale, 1);
  assert.equal(restored.scenes[0].elements[0].motion.fromRotation, 0);
});

void test('invalid project data is rejected', () => {
  assert.equal(restoreProject('{"schemaVersion":4,"title":"Broken","scenes":[]}'), null);
  assert.equal(restoreProject('not json'), null);
});

void test('published revisions remain immutable when the draft changes', () => {
  const project = createDefaultProject();
  const revision = createPublicationRevision(project, '2026-08-29T00:00:00.000Z');

  project.title = 'Changed draft title';
  project.tags.push('new tag');
  project.scenes[0].elements[0].text = 'Changed draft scene';

  assert.equal(revision.revision, 1);
  assert.equal(revision.createdAt, '2026-08-29T00:00:00.000Z');
  assert.equal(revision.title, 'Signal in the Fog');
  assert.deepEqual(revision.tags, ['science fiction', 'mystery']);
  assert.equal(revision.scenes[0].elements[0].text, 'Something moved beyond the fog.');
});

void test('version 3 drafts receive safe publication defaults', () => {
  const legacy = structuredClone(createDefaultProject()) as unknown as Record<
    string,
    unknown
  >;
  legacy.schemaVersion = 3;
  delete legacy.description;
  delete legacy.tags;
  delete legacy.language;
  delete legacy.contentRating;
  delete legacy.visibility;
  delete legacy.publications;

  const restored = restoreProject(JSON.stringify(legacy));

  assert.ok(restored);
  assert.equal(restored.description, '');
  assert.deepEqual(restored.tags, []);
  assert.equal(restored.language, 'en');
  assert.equal(restored.contentRating, 'all-ages');
  assert.equal(restored.visibility, 'private');
  assert.deepEqual(restored.publications, []);
});

void test('draft recovery selects the newest valid journal slot', () => {
  const older = createDefaultProject();
  older.title = 'Older valid draft';
  older.updatedAt = '2026-08-29T00:01:00.000Z';
  const newer = createDefaultProject();
  newer.title = 'Newest valid draft';
  newer.updatedAt = '2026-08-29T00:02:00.000Z';

  const restored = restoreNewestProject([
    { source: 'corrupt', value: '{bad json' },
    { source: 'slot-a', value: JSON.stringify(older) },
    { source: 'slot-b', value: JSON.stringify(newer) },
  ]);

  assert.ok(restored);
  assert.equal(restored.source, 'slot-b');
  assert.equal(restored.project.title, 'Newest valid draft');
});

void test('draft recovery returns null when every candidate is invalid', () => {
  assert.equal(
    restoreNewestProject([
      { source: 'empty', value: null },
      { source: 'corrupt', value: 'not json' },
    ]),
    null,
  );
});

void test('scene ordering moves one scene without mutating the source list', () => {
  const scenes = createDefaultProject().scenes;
  const originalOrder = scenes.map((scene) => scene.id);
  const reordered = reorderScenes(scenes, 'scene-2', -1);

  assert.deepEqual(originalOrder, ['scene-1', 'scene-2', 'scene-3']);
  assert.deepEqual(reordered.map((scene) => scene.id), [
    'scene-2',
    'scene-1',
    'scene-3',
  ]);
  assert.notEqual(reordered, scenes);
});

void test('scene ordering keeps boundary scenes in place', () => {
  const scenes = createDefaultProject().scenes;
  assert.deepEqual(
    reorderScenes(scenes, 'scene-1', -1).map((scene) => scene.id),
    ['scene-1', 'scene-2', 'scene-3'],
  );
  assert.deepEqual(
    reorderScenes(scenes, 'scene-3', 1).map((scene) => scene.id),
    ['scene-1', 'scene-2', 'scene-3'],
  );
});

void test('image signatures identify PNG and WebP content', () => {
  const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const webp = new Uint8Array([
    0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50,
  ]);

  assert.equal(detectImageFormat(png), 'image/png');
  assert.equal(detectImageFormat(webp), 'image/webp');
  assert.equal(detectImageFormat(new Uint8Array([0xff, 0xd8, 0xff])), null);
});

void test('image validation enforces format, storage, and decoded dimensions', () => {
  assert.equal(
    validateImageAsset({ mime: 'image/jpeg', size: 100 }),
    'Use a PNG or WebP image',
  );
  assert.equal(
    validateImageAsset({ mime: 'image/png', size: 800_000 }),
    'Images must be under 750 KB',
  );
  assert.equal(
    validateImageAsset({ mime: 'image/webp', size: 100, width: 5_000, height: 10 }),
    'Images must be at most 4096px per side and 12 megapixels',
  );
  assert.equal(
    validateImageAsset({ mime: 'image/png', size: 100, width: 2_000, height: 2_000 }),
    null,
  );
});
