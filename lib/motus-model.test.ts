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
  createBlankProject,
  constrainElementToCanvas,
  createDefaultProject,
  createProjectBackupFileName,
  createPublicationRevision,
  detectImageFormat,
  recordProjectHistory,
  reorderScenes,
  resolveDraftConflict,
  resolveEditorSelection,
  restoreNewestProject,
  restorePublicationToDraft,
  restoreProject,
  restoreProjectWithError,
  type ProjectHistoryState,
  validateImageAsset,
} from './motus-model.ts';

void test('blank projects start private with one editable scene', () => {
  const project = createBlankProject('work-123', '2026-08-29T02:00:00.000Z');

  assert.equal(project.id, 'work-123');
  assert.equal(project.title, 'Untitled work');
  assert.equal(project.visibility, 'private');
  assert.equal(project.updatedAt, '2026-08-29T02:00:00.000Z');
  assert.equal(project.scenes.length, 1);
  assert.equal(project.scenes[0].id, 'work-123-scene-1');
  assert.deepEqual(project.scenes[0].elements, []);
  assert.deepEqual(project.publications, []);
});

void test('project backup names are portable and never empty', () => {
  assert.equal(
    createProjectBackupFileName({ id: 'fallback', title: ' Signal / Fog: №2 ' }),
    'signal-fog-no2.motus.json',
  );
  assert.equal(
    createProjectBackupFileName({ id: 'fallback', title: '✨' }),
    'untitled-work.motus.json',
  );
});

void test('continuous edit gestures occupy one undo history entry', () => {
  const project = createDefaultProject();
  let history: ProjectHistoryState = { undoStack: [], transactionKey: null };

  history = recordProjectHistory(history, project, 'project:title');
  project.title = 'S';
  history = recordProjectHistory(history, project, 'project:title');
  project.title = 'Signal';

  assert.equal(history.undoStack.length, 1);
  assert.equal(history.undoStack[0].title, 'Signal in the Fog');

  history = recordProjectHistory(history, project, 'project:description');
  assert.equal(history.undoStack.length, 2);
  assert.equal(history.undoStack[1].title, 'Signal');

  history = recordProjectHistory(history, project);
  history = recordProjectHistory(history, project);
  assert.equal(history.undoStack.length, 4);
});

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

void test('project import reports schema, layer, motion, and asset failures precisely', () => {
  assert.equal(
    restoreProjectWithError('not json').error,
    'Project file is not valid JSON',
  );
  assert.equal(
    restoreProjectWithError('{"schemaVersion":99,"title":"Future","scenes":[]}').error,
    'Project uses an unsupported schema version',
  );

  const unsupportedLayer = createDefaultProject() as unknown as {
    scenes: Array<{ elements: Array<Record<string, unknown>> }>;
  };
  unsupportedLayer.scenes[0].elements[0].type = 'video';
  assert.equal(
    restoreProjectWithError(JSON.stringify(unsupportedLayer)).error,
    'Project contains an unsupported layer type',
  );

  const unsupportedMotion = createDefaultProject();
  unsupportedMotion.scenes[0].elements[0].motion.schemaVersion =
    2 as typeof MOTION_SCHEMA_VERSION;
  assert.equal(
    restoreProjectWithError(JSON.stringify(unsupportedMotion)).error,
    'Project uses an unsupported motion version',
  );

  const unsafeImage = createDefaultProject();
  unsafeImage.scenes[0].elements.push({
    ...unsafeImage.scenes[0].elements[0],
    id: 'unsafe-image',
    type: 'image',
    src: 'https://tracker.example/private.png',
  });
  assert.equal(
    restoreProjectWithError(JSON.stringify(unsafeImage)).error,
    'Project contains an unsafe or oversized image source',
  );
});

void test('project import normalizes optional metadata without losing history', () => {
  const project = createDefaultProject();
  const revision = createPublicationRevision(project, '2026-08-29T00:00:00.000Z');
  project.publications.push(revision);
  project.publishedRevision = 1;
  const candidate = structuredClone(project) as unknown as Record<string, unknown>;
  delete candidate.id;
  delete candidate.updatedAt;
  const publications = candidate.publications as Array<Record<string, unknown>>;
  delete publications[0].description;
  delete publications[0].tags;
  delete publications[0].visibility;

  const result = restoreProjectWithError(JSON.stringify(candidate));

  assert.ok(result.project);
  assert.equal(result.error, null);
  assert.equal(result.project.id, 'signal-in-the-fog');
  assert.equal(result.project.publications.length, 1);
  assert.equal(result.project.publications[0].description, '');
  assert.deepEqual(result.project.publications[0].tags, []);
  assert.equal(result.project.publications[0].visibility, 'private');
  assert.equal(result.project.updatedAt, '1970-01-01T00:00:00.000Z');
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

void test('a published revision can be recovered as a new editable draft', () => {
  const project = createDefaultProject();
  const revision = createPublicationRevision(project, '2026-08-29T00:00:00.000Z');
  project.publications.push(revision);
  project.publishedRevision = revision.revision;
  project.title = 'Later draft';
  project.scenes[0].elements[0].text = 'Later scene copy';

  const restored = restorePublicationToDraft(
    project,
    revision.id,
    '2026-08-29T01:00:00.000Z',
  );

  assert.ok(restored);
  assert.equal(restored.title, revision.title);
  assert.equal(restored.scenes[0].elements[0].text, revision.scenes[0].elements[0].text);
  assert.equal(restored.updatedAt, '2026-08-29T01:00:00.000Z');
  assert.equal(restored.publishedRevision, 1);
  assert.equal(restored.publications.length, 1);
  restored.scenes[0].elements[0].text = 'Editable restored scene';
  assert.equal(revision.scenes[0].elements[0].text, 'Something moved beyond the fog.');
  assert.equal(restorePublicationToDraft(project, 'missing-revision'), null);
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

void test('draft recovery honors the active journal slot when timestamps tie', () => {
  const slotA = createDefaultProject();
  slotA.title = 'Slot A';
  slotA.updatedAt = '2026-08-29T00:02:00.000Z';
  const slotB = createDefaultProject();
  slotB.title = 'Slot B';
  slotB.updatedAt = slotA.updatedAt;

  const restored = restoreNewestProject([
    { source: 'slot-a', value: JSON.stringify(slotA), priority: 0 },
    { source: 'slot-b', value: JSON.stringify(slotB), priority: 1 },
  ]);

  assert.ok(restored);
  assert.equal(restored.source, 'slot-b');
  assert.equal(restored.project.title, 'Slot B');
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

void test('editor selection resolves stale scene and layer references', () => {
  const project = createDefaultProject();
  assert.deepEqual(
    resolveEditorSelection(project, 'scene-2', 'scene-2-orb'),
    { sceneId: 'scene-2', elementId: 'scene-2-orb' },
  );
  assert.deepEqual(
    resolveEditorSelection(project, 'deleted-scene', 'deleted-layer'),
    { sceneId: 'scene-1', elementId: 'scene-1-speech' },
  );

  const blank = createBlankProject('blank');
  assert.deepEqual(resolveEditorSelection(blank, 'missing', 'missing'), {
    sceneId: 'blank-scene-1',
    elementId: '',
  });
});

void test('draft conflict resolution preserves the selected source', () => {
  const current = createDefaultProject();
  current.title = 'Current tab';
  current.updatedAt = '2026-08-29T00:01:00.000Z';
  const saved = createDefaultProject();
  saved.title = 'Other tab';
  saved.updatedAt = '2026-08-29T00:02:00.000Z';

  const kept = resolveDraftConflict(
    current,
    saved,
    'keep-current',
    '2026-08-29T00:03:00.000Z',
  );
  const loaded = resolveDraftConflict(current, saved, 'load-saved');

  assert.equal(kept.title, 'Current tab');
  assert.equal(kept.updatedAt, '2026-08-29T00:03:00.000Z');
  assert.equal(loaded.title, 'Other tab');
  assert.equal(loaded.updatedAt, '2026-08-29T00:02:00.000Z');
  kept.title = 'Edited resolution';
  loaded.title = 'Edited saved resolution';
  assert.equal(current.title, 'Current tab');
  assert.equal(saved.title, 'Other tab');
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
