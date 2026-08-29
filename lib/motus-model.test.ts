import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  MIN_ELEMENT_HEIGHT,
  MIN_ELEMENT_WIDTH,
  MOTION_SCHEMA_VERSION,
  PROJECT_SCHEMA_VERSION,
  canAddElementToScene,
  canAddSceneToProject,
  compileElementMotion,
  createBlankProject,
  constrainElementToCanvas,
  createDefaultProject,
  createElement,
  createProjectHistoryEntry,
  createProjectBackupFileName,
  createPublicationRevision,
  describeElementForAccessibility,
  detectImageFormat,
  hasUnpublishedChanges,
  getPublicationReadiness,
  getDraftSaveStatus,
  getKeyboardNudgeDelta,
  parseProjectTags,
  recordProjectHistory,
  reorderScenes,
  resetProjectTimeline,
  resolveDraftConflict,
  resolveEditorSelection,
  resolveReaderSource,
  resolveSelectionAfterElementDeletion,
  restoreNewestProject,
  restorePublicationToDraft,
  restoreProject,
  restoreProjectWithError,
  shouldAutosaveDraft,
  transformElementByPointer,
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
  assert.equal(project.coverSceneId, 'work-123-scene-1');
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

void test('project tags preserve normal comma-separated entry safely', () => {
  assert.deepEqual(
    parseProjectTags(' mystery, Science   Fiction, mystery, quiet horror '),
    ['mystery', 'Science Fiction', 'quiet horror'],
  );
  assert.equal(
    parseProjectTags('one,two,three,four,five,six,seven,eight,nine').length,
    8,
  );
  assert.equal(parseProjectTags('x'.repeat(80))[0].length, 40);
});

void test('comic text is included in concise accessible element labels', () => {
  const project = createDefaultProject();
  const text = project.scenes[0].elements[0];
  const shape = project.scenes[0].elements[1];

  text.text = '  Something moved\n beyond the fog.  ';
  assert.equal(
    describeElementForAccessibility(text),
    'Scene title: Something moved beyond the fog.',
  );
  assert.equal(describeElementForAccessibility(shape), 'Signal orb');

  text.text = 'x'.repeat(300);
  assert.equal(describeElementForAccessibility(text).endsWith('…'), true);
  assert.equal(describeElementForAccessibility(text).length, 'Scene title: '.length + 240);
});

void test('continuous edit gestures occupy one undo history entry', () => {
  const project = createDefaultProject();
  const selection = { sceneId: 'scene-2', elementId: 'scene-2-speech' };
  let history: ProjectHistoryState = { undoStack: [], transactionKey: null };

  history = recordProjectHistory(history, project, selection, 'project:title');
  project.title = 'S';
  history = recordProjectHistory(history, project, selection, 'project:title');
  project.title = 'Signal';

  assert.equal(history.undoStack.length, 1);
  assert.equal(history.undoStack[0].project.title, 'Signal in the Fog');
  assert.deepEqual(history.undoStack[0].selection, selection);

  history = recordProjectHistory(history, project, selection, 'project:description');
  assert.equal(history.undoStack.length, 2);
  assert.equal(history.undoStack[1].project.title, 'Signal');

  history = recordProjectHistory(history, project, selection);
  history = recordProjectHistory(history, project, selection);
  assert.equal(history.undoStack.length, 4);
});

void test('history entries clone projects and repair stale selection', () => {
  const project = createDefaultProject();
  const entry = createProjectHistoryEntry(project, {
    sceneId: 'missing-scene',
    elementId: 'missing-layer',
  });

  project.title = 'Changed after capture';
  assert.equal(entry.project.title, 'Signal in the Fog');
  assert.deepEqual(entry.selection, {
    sceneId: 'scene-1',
    elementId: 'scene-1-speech',
  });
});

void test('external draft adoption clears undo, redo, and open transactions', () => {
  const project = createDefaultProject();
  const entry = createProjectHistoryEntry(project, {
    sceneId: 'scene-1',
    elementId: 'scene-1-orb',
  });
  const timeline = {
    undoStack: [entry],
    redoStack: [entry],
    transactionKey: 'element:scene-1-orb:x',
  };

  assert.deepEqual(resetProjectTimeline(timeline), {
    undoStack: [],
    redoStack: [],
    transactionKey: null,
  });
  assert.equal(timeline.undoStack.length, 1);
  assert.equal(timeline.redoStack.length, 1);
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

void test('pointer transforms use a fixed origin and stay inside the canvas', () => {
  const source = createDefaultProject().scenes[0].elements[0];
  const moved = transformElementByPointer(source, 'move', -10_000, 10_000);
  const resized = transformElementByPointer(source, 'resize', 10_000, -10_000);

  assert.equal(source.x > 0, true);
  assert.equal(moved.x, 0);
  assert.equal(moved.y, CANVAS_HEIGHT - source.height);
  assert.equal(resized.width, CANVAS_WIDTH);
  assert.equal(resized.height, MIN_ELEMENT_HEIGHT);
});

void test('keyboard nudges use precise and accelerated canvas steps', () => {
  assert.deepEqual(getKeyboardNudgeDelta('ArrowLeft'), { x: -1, y: 0 });
  assert.deepEqual(getKeyboardNudgeDelta('ArrowDown', true), { x: 0, y: 10 });
  assert.equal(getKeyboardNudgeDelta('Enter'), null);

  const source = createDefaultProject().scenes[0].elements[0];
  source.x = 0;
  source.y = 0;
  const delta = getKeyboardNudgeDelta('ArrowUp', true);
  assert.ok(delta);
  const moved = transformElementByPointer(source, 'move', delta.x, delta.y);
  assert.equal(moved.x, 0);
  assert.equal(moved.y, 0);
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
  delete candidate.coverSceneId;
  delete candidate.updatedAt;
  const publications = candidate.publications as Array<Record<string, unknown>>;
  delete publications[0].coverSceneId;
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
  assert.equal(result.project.coverSceneId, 'scene-1');
  assert.equal(result.project.publications[0].coverSceneId, 'scene-1');
  assert.equal(result.project.updatedAt, '1970-01-01T00:00:00.000Z');
});

void test('published revisions remain immutable when the draft changes', () => {
  const project = createDefaultProject();
  project.coverSceneId = 'scene-2';
  const revision = createPublicationRevision(project, '2026-08-29T00:00:00.000Z');

  project.title = 'Changed draft title';
  project.coverSceneId = 'scene-3';
  project.tags.push('new tag');
  project.scenes[0].elements[0].text = 'Changed draft scene';

  assert.equal(revision.revision, 1);
  assert.equal(revision.createdAt, '2026-08-29T00:00:00.000Z');
  assert.equal(revision.title, 'Signal in the Fog');
  assert.equal(revision.coverSceneId, 'scene-2');
  assert.deepEqual(revision.tags, ['science fiction', 'mystery']);
  assert.equal(revision.scenes[0].elements[0].text, 'Something moved beyond the fog.');
});

void test('publication changes are detected against the current revision', () => {
  const project = createDefaultProject();
  assert.equal(hasUnpublishedChanges(project), true);

  const revision = createPublicationRevision(project, '2026-08-29T03:00:00.000Z');
  project.publications.push(revision);
  project.publishedRevision = revision.revision;
  assert.equal(hasUnpublishedChanges(project), false);

  project.scenes[0].elements[0].text = 'A revised opening';
  assert.equal(hasUnpublishedChanges(project), true);

  project.scenes[0].elements[0].text = revision.scenes[0].elements[0].text;
  project.coverSceneId = 'scene-2';
  assert.equal(hasUnpublishedChanges(project), true);
});

void test('reader source defaults to the edited draft after publication', () => {
  const project = createDefaultProject();
  const revision = createPublicationRevision(project, '2026-08-29T03:00:00.000Z');
  project.publications.push(revision);
  project.publishedRevision = revision.revision;
  project.title = 'Edited draft title';
  project.contentRating = 'mature';
  project.scenes[0].name = 'Edited draft scene';

  const draftSource = resolveReaderSource(project);
  assert.equal(draftSource.mode, 'draft');
  assert.equal(draftSource.title, 'Edited draft title');
  assert.equal(draftSource.contentRating, 'mature');
  assert.equal(draftSource.coverSceneId, 'scene-1');
  assert.equal(draftSource.scenes[0].name, 'Edited draft scene');

  const revisionSource = resolveReaderSource(project, revision);
  assert.equal(revisionSource.mode, 'revision');
  assert.equal(revisionSource.revision, 1);
  assert.equal(revisionSource.title, 'Signal in the Fog');
  assert.equal(revisionSource.contentRating, 'all-ages');
  assert.equal(revisionSource.coverSceneId, 'scene-1');
  assert.equal(revisionSource.scenes[0].name, 'The signal');
});

void test('publication readiness blocks untitled or invisible work', () => {
  const ready = getPublicationReadiness(createDefaultProject());
  assert.equal(ready.ready, true);
  assert.equal(ready.sceneCount, 3);
  assert.equal(ready.visibleLayerCount, 9);

  const blank = createBlankProject('empty-work');
  blank.title = '   ';
  assert.deepEqual(getPublicationReadiness(blank).issues, [
    'Add a title for this work',
    'Add at least one visible layer',
  ]);

  blank.title = 'A visible beginning';
  blank.scenes[0].elements.push(createElement('shape', 1, { visible: false }));
  assert.equal(getPublicationReadiness(blank).ready, false);
  blank.scenes[0].elements[0].visible = true;
  assert.equal(getPublicationReadiness(blank).ready, true);

  blank.coverSceneId = 'missing-scene';
  assert.deepEqual(getPublicationReadiness(blank).issues, ['Choose a cover scene']);
  blank.coverSceneId = blank.scenes[0].id;

  blank.title = 'x'.repeat(161);
  assert.deepEqual(getPublicationReadiness(blank).issues, [
    'Shorten the title to 160 characters',
  ]);
});

void test('a published revision can be recovered as a new editable draft', () => {
  const project = createDefaultProject();
  project.coverSceneId = 'scene-2';
  const revision = createPublicationRevision(project, '2026-08-29T00:00:00.000Z');
  project.publications.push(revision);
  project.publishedRevision = revision.revision;
  project.title = 'Later draft';
  project.coverSceneId = 'scene-3';
  project.scenes[0].elements[0].text = 'Later scene copy';

  const restored = restorePublicationToDraft(
    project,
    revision.id,
    '2026-08-29T01:00:00.000Z',
  );

  assert.ok(restored);
  assert.equal(restored.title, revision.title);
  assert.equal(restored.coverSceneId, 'scene-2');
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

void test('autosave runs only for hydrated, dirty, conflict-free drafts', () => {
  assert.equal(
    shouldAutosaveDraft({ hydrated: true, dirty: true, externalChange: false }),
    true,
  );
  assert.equal(
    shouldAutosaveDraft({ hydrated: false, dirty: true, externalChange: false }),
    false,
  );
  assert.equal(
    shouldAutosaveDraft({ hydrated: true, dirty: false, externalChange: false }),
    false,
  );
  assert.equal(
    shouldAutosaveDraft({ hydrated: true, dirty: true, externalChange: true }),
    false,
  );
});

void test('draft save status prioritizes conflicts and failures', () => {
  assert.equal(
    getDraftSaveStatus({ dirty: true, externalChange: true, saveFailed: true }),
    'conflict',
  );
  assert.equal(
    getDraftSaveStatus({ dirty: true, externalChange: false, saveFailed: true }),
    'failed',
  );
  assert.equal(
    getDraftSaveStatus({ dirty: true, externalChange: false, saveFailed: false }),
    'saving',
  );
  assert.equal(
    getDraftSaveStatus({ dirty: false, externalChange: false, saveFailed: false }),
    'saved',
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

void test('editor capacity matches project validation limits', () => {
  const project = createDefaultProject();
  const scene = project.scenes[0];

  assert.equal(canAddSceneToProject(project), true);
  assert.equal(canAddElementToScene(scene), true);

  project.scenes = Array.from({ length: 100 }, () => scene);
  scene.elements = Array.from({ length: 500 }, () => scene.elements[0]);

  assert.equal(canAddSceneToProject(project), false);
  assert.equal(canAddElementToScene(scene), false);
});

void test('layer deletion selects the adjacent layer without mutating the list', () => {
  const elements = createDefaultProject().scenes[0].elements;
  const ids = elements.map((element) => element.id);

  assert.equal(
    resolveSelectionAfterElementDeletion(elements, ids[1]),
    ids[2],
  );
  assert.equal(
    resolveSelectionAfterElementDeletion(elements, ids.at(-1) ?? ''),
    ids.at(-2),
  );
  assert.equal(resolveSelectionAfterElementDeletion([elements[0]], ids[0]), '');
  assert.equal(resolveSelectionAfterElementDeletion(elements, 'missing'), '');
  assert.deepEqual(elements.map((element) => element.id), ids);
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
