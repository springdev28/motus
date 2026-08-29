import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  ELEMENT_FONT_PRESETS,
  ELEMENT_FONT_WEIGHTS,
  ELEMENT_TEXT_ALIGNMENTS,
  MAX_BOUNCE_JUMPS,
  MAX_ELEMENT_FONT_SIZE,
  MAX_ELEMENT_LETTER_SPACING,
  MAX_ELEMENT_NAME_LENGTH,
  MAX_MOTION_BLOCKS,
  MAX_PROJECT_DESCRIPTION_LENGTH,
  MAX_SCENE_NAME_LENGTH,
  MIN_ELEMENT_FONT_SIZE,
  MIN_ELEMENT_HEIGHT,
  MIN_ELEMENT_LETTER_SPACING,
  MIN_ELEMENT_LINE_HEIGHT,
  MIN_ELEMENT_WIDTH,
  MOTION_BLOCK_CATALOG,
  MOTION_BLOCK_CATEGORIES,
  MOTION_BLOCK_CATEGORY_IDS,
  MOTION_BLOCK_KINDS,
  MOTION_SCHEMA_VERSION,
  PROJECT_SCHEMA_VERSION,
  canAddElementToScene,
  canAddSceneToProject,
  compileElementMotion,
  createBlankProject,
  constrainElementToCanvas,
  createCopyName,
  createDefaultProject,
  createElement,
  createElementCopy,
  createMotionBlock,
  createProjectHistoryEntry,
  createProjectBackupFileName,
  createPublicationRevision,
  describeElementForAccessibility,
  detectImageFormat,
  findSupportedImageFile,
  getPublicationReadiness,
  getDraftSaveStatus,
  getDraftExitAction,
  getEditorShortcut,
  getDefaultElementTypography,
  getFitCanvasWidth,
  getKeyboardNudgeDelta,
  getProjectStorageBytes,
  getSceneThumbnailElements,
  getTabIndexForKey,
  hasFileDrag,
  hasPointerDragStarted,
  hasUnpublishedChanges,
  insertMotionActionBefore,
  normalizeBounceJumpNumericField,
  normalizeElementTypography,
  normalizeMotionBlockNumericField,
  parseProjectTags,
  recordProjectHistory,
  removePublicationRevision,
  reorderMotionActionBefore,
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
  shouldEndContinuousHistoryOnKey,
  trimProjectHistory,
  transformElementByPointer,
  type CompiledMotionKeyframe,
  type ProjectHistoryState,
  validateImageAsset,
  writeDraftJournal,
} from './motus-model.ts';

const COMPILED_MOTION_CHANNELS = [
  'translateX',
  'translateY',
  'opacity',
  'scale',
  'scaleX',
  'scaleY',
  'rotation',
  'blurPx',
  'brightness',
  'contrast',
  'saturation',
  'grayscale',
  'sepia',
  'hueRotate',
  'glowPx',
  'clipTop',
  'clipRight',
  'clipBottom',
  'clipLeft',
] as const;

function compiledMotionChannels(frame: CompiledMotionKeyframe) {
  return Object.fromEntries(
    COMPILED_MOTION_CHANNELS.map((channel) => [channel, frame[channel]]),
  );
}

void test('blank projects start private with one editable scene', () => {
  const project = createBlankProject('work-123', '2026-08-29T02:00:00.000Z');

  assert.equal(project.id, 'work-123');
  assert.equal(project.title, 'Untitled work');
  assert.equal(project.creatorName, 'New creator');
  assert.equal(project.chapterTitle, 'Chapter 1');
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
    createProjectBackupFileName({
      id: 'fallback',
      title: ' Signal / Fog: №2 ',
    }),
    'signal-fog-no2.motus.json',
  );
  assert.equal(
    createProjectBackupFileName({ id: 'fallback', title: '✨' }),
    'untitled-work.motus.json',
  );
});

void test('project storage measurement counts encoded bytes without mutation', () => {
  const project = createDefaultProject();
  project.title = 'Signal 🌫️';
  const encodedLength = new TextEncoder().encode(
    JSON.stringify(project),
  ).byteLength;

  assert.equal(getProjectStorageBytes(project), encodedLength);
  assert.equal(project.title, 'Signal 🌫️');
  assert.equal(encodedLength > JSON.stringify(project).length, true);
});

void test('mirrored journal writes verify both recovery slots before advancing', () => {
  const values = new Map<string, string>([
    ['pointer', 'a'],
    ['slot-a', 'old-active'],
    ['slot-b', 'old-recovery'],
  ]);
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
    removeItem: (key: string) => {
      values.delete(key);
    },
  };

  const active = writeDraftJournal(
    storage,
    { pointer: 'pointer', slotA: 'slot-a', slotB: 'slot-b' },
    'candidate',
    (value) => value === 'candidate',
    true,
  );

  assert.equal(active, 'b');
  assert.equal(values.get('pointer'), 'b');
  assert.equal(values.get('slot-a'), 'candidate');
  assert.equal(values.get('slot-b'), 'candidate');
});

void test('mirrored journal rolls back its recovery slot when capacity fails', () => {
  const values = new Map<string, string>([
    ['pointer', 'a'],
    ['slot-a', 'old-active'],
    ['slot-b', 'old-recovery'],
  ]);
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      if (key === 'slot-a' && value === 'candidate') throw new Error('quota');
      values.set(key, value);
    },
    removeItem: (key: string) => {
      values.delete(key);
    },
  };

  assert.throws(() =>
    writeDraftJournal(
      storage,
      { pointer: 'pointer', slotA: 'slot-a', slotB: 'slot-b' },
      'candidate',
      (value) => value === 'candidate',
      true,
    ),
  );
  assert.equal(values.get('pointer'), 'a');
  assert.equal(values.get('slot-a'), 'old-active');
  assert.equal(values.get('slot-b'), 'old-recovery');
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
  assert.equal(
    describeElementForAccessibility(text).length,
    'Scene title: '.length + 240,
  );
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

  history = recordProjectHistory(
    history,
    project,
    selection,
    'project:description',
  );
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
  assert.equal(entry.bytes, getProjectStorageBytes(entry.project));
});

void test('history pruning keeps the newest contiguous snapshots within budget', () => {
  const projects = ['Oldest', 'Middle', 'Newest'].map((title) => {
    const project = createDefaultProject();
    project.title = title;
    return project;
  });
  const entries = projects.map((project) =>
    createProjectHistoryEntry(project, {
      sceneId: 'scene-1',
      elementId: 'scene-1-orb',
    }),
  );
  const newestPairBytes = entries[1].bytes + entries[2].bytes;

  const budgeted = trimProjectHistory(entries, 50, newestPairBytes);
  assert.deepEqual(
    budgeted.map((entry) => entry.project.title),
    ['Middle', 'Newest'],
  );
  assert.deepEqual(
    trimProjectHistory(entries, 1).map((entry) => entry.project.title),
    ['Newest'],
  );
  assert.deepEqual(
    trimProjectHistory([entries[2]], 50, 1).map((entry) => entry.project.title),
    ['Newest'],
  );
  assert.equal(entries.length, 3);
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
  assert.equal(resized.x, source.x);
  assert.equal(resized.width, CANVAS_WIDTH - source.x);
  assert.equal(resized.y, source.y);
  assert.equal(resized.height, MIN_ELEMENT_HEIGHT);
});

void test('directional resize handles anchor the opposite sides', () => {
  const source = createDefaultProject().scenes[0].elements[0];
  Object.assign(source, {
    x: 300,
    y: 400,
    width: 240,
    height: 160,
    rotation: 0,
  });

  const west = transformElementByPointer(source, 'resize-w', -60, 0);
  const northEast = transformElementByPointer(source, 'resize-ne', 40, -30);
  const south = transformElementByPointer(source, 'resize-s', 0, 50);

  assert.deepEqual(
    { x: west.x, width: west.width, right: west.x + west.width },
    { x: 240, width: 300, right: 540 },
  );
  assert.deepEqual(
    {
      x: northEast.x,
      y: northEast.y,
      width: northEast.width,
      height: northEast.height,
      left: northEast.x,
      bottom: northEast.y + northEast.height,
    },
    { x: 300, y: 370, width: 280, height: 190, left: 300, bottom: 560 },
  );
  assert.deepEqual(
    { y: south.y, height: south.height, top: south.y },
    { y: 400, height: 210, top: 400 },
  );
});

void test('directional resize follows a rotated element local axis', () => {
  const source = createDefaultProject().scenes[0].elements[0];
  Object.assign(source, {
    x: 300,
    y: 400,
    width: 240,
    height: 160,
    rotation: 90,
  });

  const east = transformElementByPointer(source, 'resize-e', 0, 40);

  assert.deepEqual(
    {
      x: east.x,
      y: east.y,
      width: east.width,
      height: east.height,
      rotation: east.rotation,
    },
    { x: 280, y: 420, width: 280, height: 160, rotation: 90 },
  );
});

void test('corner resize clamps each dimension independently at canvas bounds', () => {
  const source = createDefaultProject().scenes[0].elements[0];
  Object.assign(source, {
    x: 950,
    y: 200,
    width: 100,
    height: 100,
    rotation: 0,
  });

  const resized = transformElementByPointer(source, 'resize-se', 100, 300);

  assert.deepEqual(
    {
      x: resized.x,
      y: resized.y,
      width: resized.width,
      height: resized.height,
    },
    { x: 950, y: 200, width: 130, height: 400 },
  );
});

void test('west resize preserves its fixed right edge at the canvas boundary', () => {
  const source = createDefaultProject().scenes[0].elements[0];
  Object.assign(source, {
    x: 30,
    y: 200,
    width: 100,
    height: 100,
    rotation: 0,
  });

  const resized = transformElementByPointer(source, 'resize-w', -100, 0);

  assert.deepEqual(
    {
      x: resized.x,
      width: resized.width,
      right: resized.x + resized.width,
    },
    { x: 0, width: 130, right: 130 },
  );
});

void test('pointer rotation wraps cleanly inside the authored range', () => {
  const source = createDefaultProject().scenes[0].elements[0];
  source.rotation = 170;

  const clockwise = transformElementByPointer(source, 'rotate', 35, 0);
  const counterclockwise = transformElementByPointer(source, 'rotate', -400, 0);

  assert.equal(clockwise.rotation, -155);
  assert.equal(counterclockwise.rotation, 130);
});

void test('pointer drags ignore tap jitter across mouse, pen, and touch input', () => {
  assert.equal(hasPointerDragStarted(1, 1, 'mouse'), false);
  assert.equal(hasPointerDragStarted(2, 0, 'mouse'), true);
  assert.equal(hasPointerDragStarted(2, 2, 'pen'), false);
  assert.equal(hasPointerDragStarted(3, 0, 'pen'), true);
  assert.equal(hasPointerDragStarted(4, 4, 'touch'), false);
  assert.equal(hasPointerDragStarted(6, 0, 'touch'), true);
  assert.equal(hasPointerDragStarted(Number.NaN, 10, 'touch'), false);
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

void test('editor shortcuts resolve save, history, and duplication commands', () => {
  assert.equal(getEditorShortcut('s', true), 'save');
  assert.equal(getEditorShortcut('S', true), 'save');
  assert.equal(getEditorShortcut('z', true), 'undo');
  assert.equal(getEditorShortcut('z', true, true), 'redo');
  assert.equal(getEditorShortcut('y', true), 'redo');
  assert.equal(getEditorShortcut('d', true), 'duplicate');
  assert.equal(getEditorShortcut('s', false), null);
  assert.equal(getEditorShortcut('p', true), null);
});

void test('element copies are independent and stay inside the canvas', () => {
  const source = createElement('text', 1, {
    id: 'source-layer',
    name: 'Caption',
    x: CANVAS_WIDTH - 200,
    y: CANVAS_HEIGHT - 100,
    width: 200,
    height: 100,
    text: 'Original',
    typography: {
      fontPreset: 'comic',
      fontSize: 52,
      fontWeight: 800,
      textAlign: 'right',
      lineHeight: 1.3,
      letterSpacing: 0.04,
    },
  });
  const copy = createElementCopy(source, 'copied-layer');

  assert.equal(copy.id, 'copied-layer');
  assert.equal(copy.name, 'Caption copy');
  assert.equal(copy.x, CANVAS_WIDTH - copy.width);
  assert.equal(copy.y, CANVAS_HEIGHT - copy.height);
  copy.text = 'Changed';
  copy.motion.moveX = 999;
  assert.deepEqual(copy.typography, source.typography);
  assert.ok(copy.typography);
  copy.typography.fontSize = 88;
  assert.equal(source.text, 'Original');
  assert.notEqual(source.motion.moveX, 999);
  assert.equal(source.typography?.fontSize, 52);
  assert.equal(
    createCopyName(
      'N'.repeat(MAX_ELEMENT_NAME_LENGTH),
      MAX_ELEMENT_NAME_LENGTH,
    ),
    `${'N'.repeat(MAX_ELEMENT_NAME_LENGTH - 5)} copy`,
  );
});

void test('text and speech layers start with legacy-equivalent typography', () => {
  assert.deepEqual(getDefaultElementTypography('text'), {
    fontPreset: 'editorial',
    fontSize: 34,
    fontWeight: 600,
    textAlign: 'left',
    lineHeight: 1.04,
    letterSpacing: -0.035,
  });
  assert.deepEqual(getDefaultElementTypography('speech'), {
    fontPreset: 'editorial',
    fontSize: 16,
    fontWeight: 700,
    textAlign: 'center',
    lineHeight: 1.15,
    letterSpacing: 0,
  });
  assert.equal(getDefaultElementTypography('shape'), undefined);
  assert.deepEqual(
    createElement('text', 1).typography,
    getDefaultElementTypography('text'),
  );
  assert.deepEqual(
    createElement('speech', 1).typography,
    getDefaultElementTypography('speech'),
  );
  assert.equal(createElement('image', 1).typography, undefined);
});

void test('typography normalization allowlists choices and clamps numeric values', () => {
  assert.equal(new Set(ELEMENT_FONT_PRESETS).size, ELEMENT_FONT_PRESETS.length);
  assert.equal(new Set(ELEMENT_FONT_WEIGHTS).size, ELEMENT_FONT_WEIGHTS.length);
  assert.equal(
    new Set(ELEMENT_TEXT_ALIGNMENTS).size,
    ELEMENT_TEXT_ALIGNMENTS.length,
  );

  assert.deepEqual(
    normalizeElementTypography('text', {
      fontPreset: 'comic',
      fontSize: MAX_ELEMENT_FONT_SIZE + 400,
      fontWeight: 900,
      textAlign: 'right',
      lineHeight: 0,
      letterSpacing: MAX_ELEMENT_LETTER_SPACING + 1,
    }),
    {
      fontPreset: 'comic',
      fontSize: MAX_ELEMENT_FONT_SIZE,
      fontWeight: 900,
      textAlign: 'right',
      lineHeight: MIN_ELEMENT_LINE_HEIGHT,
      letterSpacing: MAX_ELEMENT_LETTER_SPACING,
    },
  );
  assert.deepEqual(
    normalizeElementTypography('speech', {
      fontPreset: 'url(https://tracker.example/font.woff2)',
      fontSize: MIN_ELEMENT_FONT_SIZE - 100,
      fontWeight: 650,
      textAlign: 'justify',
      lineHeight: Number.NaN,
      letterSpacing: MIN_ELEMENT_LETTER_SPACING - 1,
    }),
    {
      fontPreset: 'editorial',
      fontSize: MIN_ELEMENT_FONT_SIZE,
      fontWeight: 700,
      textAlign: 'center',
      lineHeight: 1.15,
      letterSpacing: MIN_ELEMENT_LETTER_SPACING,
    },
  );
  assert.equal(normalizeElementTypography('shape', {}), undefined);
});

void test('canvas fit sizing respects both workspace axes and safe fallbacks', () => {
  assert.equal(getFitCanvasWidth(800, 600, 48, 48), 414);
  assert.equal(getFitCanvasWidth(500, 1_000, 48, 48), 452);
  assert.equal(getFitCanvasWidth(160, 160, 24, 24), 180);
  assert.equal(getFitCanvasWidth(Number.NaN, 600), 430);
});

void test('continuous controls close undo transactions after adjustment keys', () => {
  for (const key of [
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
    'ArrowUp',
    'End',
    'Home',
    'PageDown',
    'PageUp',
  ]) {
    assert.equal(shouldEndContinuousHistoryOnKey(key), true, key);
  }

  assert.equal(shouldEndContinuousHistoryOnKey('1'), false);
  assert.equal(shouldEndContinuousHistoryOnKey('Enter'), false);
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

void test('typography survives project and publication round trips', () => {
  const project = createDefaultProject();
  const title = project.scenes[0].elements[0];
  const speech = project.scenes[0].elements[2];
  title.typography = {
    fontPreset: 'condensed',
    fontSize: 72,
    fontWeight: 900,
    textAlign: 'center',
    lineHeight: 0.9,
    letterSpacing: -0.08,
  };
  speech.typography = {
    fontPreset: 'modern',
    fontSize: 24,
    fontWeight: 500,
    textAlign: 'left',
    lineHeight: 1.4,
    letterSpacing: 0.06,
  };
  project.publications.push(
    createPublicationRevision(project, '2026-08-30T00:00:00.000Z'),
  );
  project.publishedRevision = 1;

  const restored = restoreProject(JSON.stringify(project));

  assert.ok(restored);
  assert.deepEqual(restored.scenes[0].elements[0].typography, title.typography);
  assert.deepEqual(
    restored.scenes[0].elements[2].typography,
    speech.typography,
  );
  assert.deepEqual(
    restored.publications[0].scenes[0].elements[0].typography,
    title.typography,
  );
  title.typography.fontSize = 100;
  assert.equal(
    restored.publications[0].scenes[0].elements[0].typography?.fontSize,
    72,
  );
});

void test('version 5 drafts without typography preserve the legacy appearance', () => {
  const legacy = structuredClone(createDefaultProject()) as unknown as {
    schemaVersion: number;
    scenes: Array<{
      elements: Array<Record<string, unknown>>;
    }>;
  };
  legacy.schemaVersion = 5;
  for (const scene of legacy.scenes) {
    for (const element of scene.elements) delete element.typography;
  }

  const restored = restoreProject(JSON.stringify(legacy));

  assert.ok(restored);
  assert.equal(restored.schemaVersion, PROJECT_SCHEMA_VERSION);
  assert.deepEqual(
    restored.scenes[0].elements[0].typography,
    getDefaultElementTypography('text'),
  );
  assert.equal(restored.scenes[0].elements[1].typography, undefined);
  assert.deepEqual(
    restored.scenes[0].elements[2].typography,
    getDefaultElementTypography('speech'),
  );
});

void test('restored drafts bound editable names and reject invalid name types', () => {
  const project = createDefaultProject();
  project.scenes[0].name = `  ${'S'.repeat(MAX_SCENE_NAME_LENGTH + 20)}  `;
  project.scenes[0].elements[0].name = '   ';
  project.scenes[0].elements[1].name = 'L'.repeat(MAX_ELEMENT_NAME_LENGTH + 20);

  const restored = restoreProject(JSON.stringify(project));

  assert.ok(restored);
  assert.equal(restored.scenes[0].name.length, MAX_SCENE_NAME_LENGTH);
  assert.equal(restored.scenes[0].elements[0].name, 'Text');
  assert.equal(
    restored.scenes[0].elements[1].name.length,
    MAX_ELEMENT_NAME_LENGTH,
  );

  const malformed = JSON.parse(JSON.stringify(project));
  malformed.scenes[0].elements[0].name = 42;
  assert.equal(
    restoreProjectWithError(JSON.stringify(malformed)).error,
    'Project contains an invalid layer name',
  );
  malformed.scenes[0].elements[0].name = 'Layer';
  malformed.scenes[0].name = 42;
  assert.equal(
    restoreProjectWithError(JSON.stringify(malformed)).error,
    'Project contains an invalid scene name',
  );
});

void test('motion registry is exhaustive, categorized, and has bounded finite defaults', () => {
  const catalogKinds = MOTION_BLOCK_CATALOG.map((entry) => entry.kind);
  const addableEntries = MOTION_BLOCK_CATALOG.filter(
    (entry) => entry.kind !== 'scene-enter',
  );
  const representedCategories = new Set(
    MOTION_BLOCK_CATALOG.map((entry) => entry.category),
  );

  assert.equal(MOTION_BLOCK_CATALOG.length, 163);
  assert.equal(new Set(catalogKinds).size, 163);
  assert.equal(addableEntries.length, 162);
  assert.equal(MOTION_BLOCK_KINDS.length, 163);
  assert.equal(new Set(MOTION_BLOCK_KINDS).size, 163);
  assert.deepEqual(
    [...catalogKinds].sort(),
    [...MOTION_BLOCK_KINDS].sort(),
    'the kind tuple and catalog must contain exactly the same kinds',
  );

  assert.equal(MOTION_BLOCK_CATEGORY_IDS.length, 11);
  assert.equal(new Set(MOTION_BLOCK_CATEGORY_IDS).size, 11);
  assert.equal(MOTION_BLOCK_CATEGORIES.length, 11);
  assert.equal(
    new Set(MOTION_BLOCK_CATEGORIES.map((category) => category.id)).size,
    11,
  );
  assert.deepEqual(
    [...representedCategories].sort(),
    [...MOTION_BLOCK_CATEGORY_IDS].sort(),
    'all eleven declared categories must contain at least one block',
  );

  for (const entry of MOTION_BLOCK_CATALOG) {
    const block = createMotionBlock(entry.kind, `default-${entry.kind}`);
    const parameterFields = new Set<string>();

    assert.equal(block.kind, entry.kind);
    assert.equal(block.category, entry.category);
    assert.equal(block.label, entry.label);
    assert.equal(block.enabled, true);
    assert.ok(entry.label.trim(), `${entry.kind} needs a label`);
    assert.ok(entry.description.trim(), `${entry.kind} needs a description`);
    assert.ok(
      Number.isFinite(entry.durationMs),
      `${entry.kind} duration must be finite`,
    );
    assert.ok(
      entry.durationMs >= 0,
      `${entry.kind} duration cannot be negative`,
    );
    assert.equal(
      normalizeMotionBlockNumericField(block, 'durationMs', block.durationMs),
      block.durationMs,
      `${entry.kind} valid duration must remain unchanged`,
    );

    for (const [field, value] of Object.entries({
      durationMs: block.durationMs,
      x: block.x,
      y: block.y,
      value: block.value,
      secondaryValue: block.secondaryValue,
      repetitions: block.repetitions,
    })) {
      assert.ok(
        Number.isFinite(value),
        `${entry.kind} default ${field} must be finite`,
      );
    }

    for (const parameter of entry.parameters) {
      assert.equal(
        parameterFields.has(parameter.field),
        false,
        `${entry.kind} declares ${parameter.field} more than once`,
      );
      parameterFields.add(parameter.field);
      assert.ok(
        Number.isFinite(parameter.defaultValue),
        `${entry.kind}.${parameter.field} default must be finite`,
      );
      assert.ok(
        Number.isFinite(parameter.min),
        `${entry.kind}.${parameter.field} minimum must be finite`,
      );
      assert.ok(
        Number.isFinite(parameter.max),
        `${entry.kind}.${parameter.field} maximum must be finite`,
      );
      assert.ok(
        Number.isFinite(parameter.step) && parameter.step > 0,
        `${entry.kind}.${parameter.field} step must be positive and finite`,
      );
      assert.ok(
        parameter.min <= parameter.defaultValue &&
          parameter.defaultValue <= parameter.max,
        `${entry.kind}.${parameter.field} default must be within its bounds`,
      );
      assert.equal(
        block[parameter.field],
        parameter.defaultValue,
        `${entry.kind}.${parameter.field} must use the catalog default`,
      );
      assert.equal(
        normalizeMotionBlockNumericField(
          block,
          parameter.field,
          block[parameter.field],
        ),
        block[parameter.field],
        `${entry.kind}.${parameter.field} valid values must remain unchanged`,
      );
    }
  }
});

void test('motion numeric fields normalize to their authored playback bounds', () => {
  const move = createMotionBlock('move', 'normalized-move');
  move.x = 135;

  assert.equal(normalizeMotionBlockNumericField(move, 'x', 215), 215);
  assert.equal(normalizeMotionBlockNumericField(move, 'x', -9_999), -2_000);
  assert.equal(normalizeMotionBlockNumericField(move, 'x', 9_999), 2_000);
  assert.equal(normalizeMotionBlockNumericField(move, 'x', Number.NaN), 135);
  assert.equal(
    normalizeMotionBlockNumericField(move, 'durationMs', 899.6),
    900,
  );
  assert.equal(normalizeMotionBlockNumericField(move, 'durationMs', 0), 100);
  assert.equal(
    normalizeMotionBlockNumericField(move, 'durationMs', 99_999),
    10_000,
  );

  const wait = createMotionBlock('wait', 'normalized-wait');
  assert.equal(normalizeMotionBlockNumericField(wait, 'durationMs', -1), 0);

  const event = createMotionBlock('scene-enter', 'normalized-event');
  assert.equal(normalizeMotionBlockNumericField(event, 'durationMs', 5_000), 0);

  const shake = createMotionBlock('shake', 'normalized-shake');
  assert.equal(normalizeMotionBlockNumericField(shake, 'repetitions', 2.6), 3);
  assert.equal(normalizeMotionBlockNumericField(shake, 'repetitions', 0), 1);
  assert.equal(normalizeMotionBlockNumericField(shake, 'repetitions', 99), 20);
});

void test('bounce numeric fields normalize to preview and restore bounds', () => {
  const bounce = createMotionBlock('bounce', 'normalized-bounce');
  const jump = bounce.jumps[0];
  jump.height = 175;
  jump.spread = 190;
  jump.durationMs = 460;

  assert.equal(normalizeBounceJumpNumericField(jump, 'height', 240), 240);
  assert.equal(normalizeBounceJumpNumericField(jump, 'height', -1), 0);
  assert.equal(normalizeBounceJumpNumericField(jump, 'height', 9_999), 2_000);
  assert.equal(
    normalizeBounceJumpNumericField(jump, 'height', Number.NaN),
    175,
  );
  assert.equal(normalizeBounceJumpNumericField(jump, 'spread', -1), 0);
  assert.equal(normalizeBounceJumpNumericField(jump, 'spread', 9_999), 2_000);
  assert.equal(normalizeBounceJumpNumericField(jump, 'durationMs', 519.6), 520);
  assert.equal(normalizeBounceJumpNumericField(jump, 'durationMs', 0), 80);
  assert.equal(
    normalizeBounceJumpNumericField(jump, 'durationMs', 99_999),
    10_000,
  );
});

void test('normalized block values survive storage and compile without changing', () => {
  const project = createDefaultProject();
  const element = project.scenes[0].elements[0];
  const move = createMotionBlock('move', 'round-trip-move');
  const bounce = createMotionBlock('bounce', 'round-trip-bounce');
  const jump = bounce.jumps[0];

  move.x = normalizeMotionBlockNumericField(move, 'x', 9_999);
  move.y = normalizeMotionBlockNumericField(move, 'y', -9_999);
  move.durationMs = normalizeMotionBlockNumericField(move, 'durationMs', 0);
  jump.height = normalizeBounceJumpNumericField(jump, 'height', 9_999);
  jump.spread = normalizeBounceJumpNumericField(jump, 'spread', -10);
  jump.durationMs = normalizeBounceJumpNumericField(jump, 'durationMs', 0);
  bounce.jumps = [jump];
  element.motion.blocks = [
    createMotionBlock('scene-enter', 'round-trip-event'),
    move,
    bounce,
  ];

  const restored = restoreProject(JSON.stringify(project));

  assert.ok(restored);
  const restoredElement = restored.scenes[0].elements[0];
  const restoredMove = restoredElement.motion.blocks[1];
  const restoredBounce = restoredElement.motion.blocks[2];
  assert.deepEqual(
    {
      x: restoredMove.x,
      y: restoredMove.y,
      durationMs: restoredMove.durationMs,
    },
    { x: 2_000, y: -2_000, durationMs: 100 },
  );
  assert.deepEqual(
    {
      height: restoredBounce.jumps[0].height,
      spread: restoredBounce.jumps[0].spread,
      durationMs: restoredBounce.jumps[0].durationMs,
    },
    { height: 2_000, spread: 0, durationMs: 80 },
  );
  assert.deepEqual(
    compileElementMotion(restoredElement).steps.map((step) => step.durationMs),
    [100, 80],
  );
});

void test('motion restore keeps one event hat and respects the total block limit', () => {
  const eventOnlyProject = createDefaultProject();
  eventOnlyProject.scenes[0].elements[0].motion.blocks = [
    createMotionBlock('scene-enter', 'event-only'),
  ];

  const restoredEventOnly = restoreProject(JSON.stringify(eventOnlyProject));

  assert.ok(restoredEventOnly);
  assert.deepEqual(
    restoredEventOnly.scenes[0].elements[0].motion.blocks.map((block) => [
      block.id,
      block.kind,
    ]),
    [['event-only', 'scene-enter']],
  );

  const duplicateEventProject = createDefaultProject();
  duplicateEventProject.scenes[0].elements[0].motion.blocks = [
    createMotionBlock('scene-enter', 'event-first'),
    createMotionBlock('wait', 'wait-between-events'),
    createMotionBlock('scene-enter', 'event-duplicate'),
  ];

  const restoredDuplicateEvents = restoreProject(
    JSON.stringify(duplicateEventProject),
  );

  assert.ok(restoredDuplicateEvents);
  const normalizedDuplicateBlocks =
    restoredDuplicateEvents.scenes[0].elements[0].motion.blocks;
  assert.deepEqual(
    normalizedDuplicateBlocks.map((block) => block.kind),
    ['scene-enter', 'wait'],
  );
  assert.equal(normalizedDuplicateBlocks[0].id, 'event-first');
  assert.equal(
    normalizedDuplicateBlocks.filter((block) => block.kind === 'scene-enter')
      .length,
    1,
  );

  const maximumProgramProject = createDefaultProject();
  maximumProgramProject.scenes[0].elements[0].motion.blocks = Array.from(
    { length: MAX_MOTION_BLOCKS },
    (_, index) => createMotionBlock('wait', `maximum-wait-${index + 1}`),
  );

  const restoredMaximumProgram = restoreProject(
    JSON.stringify(maximumProgramProject),
  );

  assert.ok(restoredMaximumProgram);
  const maximumBlocks =
    restoredMaximumProgram.scenes[0].elements[0].motion.blocks;
  assert.equal(maximumBlocks.length, MAX_MOTION_BLOCKS);
  assert.equal(maximumBlocks[0].kind, 'scene-enter');
  assert.equal(
    maximumBlocks.filter((block) => block.kind === 'scene-enter').length,
    1,
  );
  assert.equal(
    maximumBlocks.filter((block) => block.kind !== 'scene-enter').length,
    MAX_MOTION_BLOCKS - 1,
  );
});

void test('insertMotionActionBefore inserts before the first or a middle action', () => {
  const event = createMotionBlock('scene-enter', 'event');
  const first = createMotionBlock('move', 'first');
  const middle = createMotionBlock('rotate', 'middle');
  const last = createMotionBlock('scale', 'last');
  const program = [event, first, middle, last];

  assert.deepEqual(
    insertMotionActionBefore(
      program,
      createMotionBlock('wait', 'before-first'),
      'first',
    ).map((block) => block.id),
    ['event', 'before-first', 'first', 'middle', 'last'],
  );
  assert.deepEqual(
    insertMotionActionBefore(
      program,
      createMotionBlock('wait', 'before-middle'),
      'middle',
    ).map((block) => block.id),
    ['event', 'first', 'before-middle', 'middle', 'last'],
  );
  assert.deepEqual(
    program.map((block) => block.id),
    ['event', 'first', 'middle', 'last'],
  );
});

void test('insertMotionActionBefore appends when no target is provided', () => {
  const event = createMotionBlock('scene-enter', 'event');
  const first = createMotionBlock('move', 'first');
  const appended = createMotionBlock('wait', 'appended');

  const result = insertMotionActionBefore([event, first], appended);

  assert.deepEqual(
    result.map((block) => block.id),
    ['event', 'first', 'appended'],
  );
  assert.equal(result[0], event);
});

void test('insertMotionActionBefore rejects unknown targets and full programs', () => {
  const event = createMotionBlock('scene-enter', 'event');
  const first = createMotionBlock('move', 'first');
  const program = [event, first];

  assert.deepEqual(
    insertMotionActionBefore(
      program,
      createMotionBlock('wait', 'unknown-target'),
      'missing',
    ),
    program,
  );

  const fullProgram = [
    event,
    ...Array.from({ length: MAX_MOTION_BLOCKS - 1 }, (_, index) =>
      createMotionBlock('wait', `action-${index + 1}`),
    ),
  ];
  const atCap = insertMotionActionBefore(
    fullProgram,
    createMotionBlock('move', 'over-cap'),
  );

  assert.equal(atCap.length, MAX_MOTION_BLOCKS);
  assert.deepEqual(atCap, fullProgram);
  assert.equal(
    atCap.some((block) => block.id === 'over-cap'),
    false,
  );
});

void test('reorderMotionActionBefore moves actions before first, middle, or end', () => {
  const event = createMotionBlock('scene-enter', 'event');
  const first = createMotionBlock('move', 'first');
  const middle = createMotionBlock('rotate', 'middle');
  const last = createMotionBlock('scale', 'last');
  const program = [event, first, middle, last];

  assert.deepEqual(
    reorderMotionActionBefore(program, 'last', 'first').map(
      (block) => block.id,
    ),
    ['event', 'last', 'first', 'middle'],
  );
  assert.deepEqual(
    reorderMotionActionBefore(program, 'first', 'last').map(
      (block) => block.id,
    ),
    ['event', 'middle', 'first', 'last'],
  );
  assert.deepEqual(
    reorderMotionActionBefore(program, 'first').map((block) => block.id),
    ['event', 'middle', 'last', 'first'],
  );
  assert.deepEqual(
    program.map((block) => block.id),
    ['event', 'first', 'middle', 'last'],
  );
});

void test('reorderMotionActionBefore is unchanged for unknown or self targets', () => {
  const program = [
    createMotionBlock('scene-enter', 'event'),
    createMotionBlock('move', 'first'),
    createMotionBlock('rotate', 'middle'),
  ];

  assert.deepEqual(reorderMotionActionBefore(program, 'missing'), program);
  assert.deepEqual(
    reorderMotionActionBefore(program, 'first', 'missing'),
    program,
  );
  assert.deepEqual(
    reorderMotionActionBefore(program, 'first', 'first'),
    program,
  );
});

void test('motion action helpers never move, remove, or duplicate the event', () => {
  const event = createMotionBlock('scene-enter', 'event');
  const first = createMotionBlock('move', 'first');
  const program = [event, first];

  const insertedEvent = insertMotionActionBefore(
    program,
    createMotionBlock('scene-enter', 'second-event'),
  );
  const movedEvent = reorderMotionActionBefore(program, 'event');
  const targetedEvent = reorderMotionActionBefore(program, 'first', 'event');

  for (const result of [insertedEvent, movedEvent, targetedEvent]) {
    assert.deepEqual(result, program);
    assert.equal(result[0], event);
    assert.equal(
      result.filter((block) => block.kind === 'scene-enter').length,
      1,
    );
  }
});

void test('every exposed block control changes its compiled animation', () => {
  const compileCatalogBlock = (
    kind: (typeof MOTION_BLOCK_KINDS)[number],
    mutate?: (block: ReturnType<typeof createMotionBlock>) => void,
  ) => {
    const element = createDefaultProject().scenes[0].elements[0];
    const block = createMotionBlock(kind, `controls-${kind}`);
    block.jumps = block.jumps.map((jump, index) => ({
      ...jump,
      id: `controls-jump-${index + 1}`,
    }));
    mutate?.(block);
    element.motion.blocks = [
      createMotionBlock('scene-enter', 'controls-event'),
      block,
    ];
    const compiled = compileElementMotion(element);
    return JSON.stringify({
      sequenceDurationMs: compiled.sequenceDurationMs,
      steps: compiled.steps,
      keyframes: compiled.keyframes,
    });
  };

  for (const entry of MOTION_BLOCK_CATALOG) {
    if (entry.kind === 'scene-enter') continue;
    const baseline = compileCatalogBlock(entry.kind);

    for (const parameter of entry.parameters) {
      const changedValue =
        parameter.defaultValue === parameter.max
          ? parameter.min
          : parameter.max;
      assert.notEqual(
        compileCatalogBlock(entry.kind, (block) => {
          block[parameter.field] = changedValue;
        }),
        baseline,
        `${entry.kind}.${parameter.field} must affect compiled playback`,
      );
    }

    if (entry.usesDirection) {
      const directionSignatures = ['left', 'right', 'up', 'down'].map(
        (direction) =>
          compileCatalogBlock(entry.kind, (block) => {
            block.direction = direction as typeof block.direction;
          }),
      );
      assert.equal(
        new Set(directionSignatures).size,
        4,
        `${entry.kind} must compile all four directions differently`,
      );
    }

    if (entry.kind !== 'bounce') {
      assert.notEqual(
        compileCatalogBlock(entry.kind, (block) => {
          block.durationMs = Math.min(10_000, entry.durationMs + 150);
        }),
        baseline,
        `${entry.kind} duration must affect compiled playback`,
      );
      if (entry.kind !== 'wait') {
        assert.notEqual(
          compileCatalogBlock(entry.kind, (block) => {
            block.easing = 'linear';
          }),
          baseline,
          `${entry.kind} easing must affect compiled playback`,
        );
      }
    }
  }
});

void test('every catalog numeric boundary survives restore without playback saturation', () => {
  const compileParameter = (
    entry: (typeof MOTION_BLOCK_CATALOG)[number],
    field: (typeof entry.parameters)[number]['field'],
    value: number,
  ) => {
    const element = createDefaultProject().scenes[0].elements[0];
    const block = createMotionBlock(entry.kind, `boundary-${entry.kind}`);
    block[field] = normalizeMotionBlockNumericField(block, field, value);
    element.motion.blocks = [
      createMotionBlock('scene-enter', 'boundary-event'),
      block,
    ];
    return JSON.stringify(compileElementMotion(element).keyframes);
  };

  for (const entry of MOTION_BLOCK_CATALOG) {
    for (const parameter of entry.parameters) {
      const block = createMotionBlock(entry.kind, `normalize-${entry.kind}`);
      const minimum = normalizeMotionBlockNumericField(
        block,
        parameter.field,
        parameter.min,
      );
      const maximum = normalizeMotionBlockNumericField(
        block,
        parameter.field,
        parameter.max,
      );
      assert.equal(
        minimum,
        parameter.min,
        `${entry.kind}.${parameter.field} must accept its catalog minimum`,
      );
      assert.equal(
        maximum,
        parameter.max,
        `${entry.kind}.${parameter.field} must accept its catalog maximum`,
      );

      for (const boundary of [minimum, maximum]) {
        const project = createDefaultProject();
        const boundaryBlock = createMotionBlock(
          entry.kind,
          `restore-${entry.kind}`,
        );
        boundaryBlock[parameter.field] = boundary;
        project.scenes[0].elements[0].motion.blocks = [
          createMotionBlock('scene-enter', 'restore-event'),
          boundaryBlock,
        ];
        const restored = restoreProject(JSON.stringify(project));
        assert.ok(restored);
        assert.equal(
          restored.scenes[0].elements[0].motion.blocks[1][parameter.field],
          boundary,
          `${entry.kind}.${parameter.field} boundary must survive restore`,
        );
      }

      if (parameter.min === parameter.max) continue;
      const span = parameter.max - parameter.min;
      const lowerInterior = normalizeMotionBlockNumericField(
        block,
        parameter.field,
        parameter.min + span * 0.25,
      );
      const upperInterior = normalizeMotionBlockNumericField(
        block,
        parameter.field,
        parameter.min + span * 0.75,
      );
      assert.notEqual(
        compileParameter(entry, parameter.field, minimum),
        compileParameter(entry, parameter.field, lowerInterior),
        `${entry.kind}.${parameter.field} minimum must not saturate playback`,
      );
      assert.notEqual(
        compileParameter(entry, parameter.field, maximum),
        compileParameter(entry, parameter.field, upperInterior),
        `${entry.kind}.${parameter.field} maximum must not saturate playback`,
      );
    }
  }
});

void test('every addable default block compiles to a finite visible one-step program', () => {
  const expectedFinalChannels = {
    translateX: 0,
    translateY: 0,
    opacity: 0.73,
    scale: 1,
    scaleX: 1,
    scaleY: 1,
    rotation: 17,
    blurPx: 0,
    brightness: 1,
    contrast: 1,
    saturation: 1,
    grayscale: 0,
    sepia: 0,
    hueRotate: 0,
    glowPx: 0,
    clipTop: 0,
    clipRight: 0,
    clipBottom: 0,
    clipLeft: 0,
  };

  for (const entry of MOTION_BLOCK_CATALOG) {
    if (entry.kind === 'scene-enter') continue;

    const element = createDefaultProject().scenes[0].elements[0];
    element.opacity = expectedFinalChannels.opacity;
    element.rotation = expectedFinalChannels.rotation;
    const block = createMotionBlock(entry.kind, `compile-${entry.kind}`);
    element.motion.blocks = [
      createMotionBlock('scene-enter', 'compile-event'),
      block,
    ];

    const compiled = compileElementMotion(element);
    const finalFrame = compiled.keyframes.at(-1);

    assert.equal(block.enabled, true, `${entry.kind} must default to enabled`);
    assert.equal(
      compiled.steps.length,
      1,
      `${entry.kind} must compile as exactly one step`,
    );
    assert.equal(compiled.steps[0].blockId, block.id);
    assert.equal(compiled.steps[0].kind, entry.kind);
    assert.ok(
      compiled.steps[0].durationMs > 0,
      `${entry.kind} must compile with a positive duration`,
    );
    assert.ok(finalFrame, `${entry.kind} must emit a final keyframe`);
    assert.equal(compiled.keyframes[0].offset, 0);
    assert.equal(finalFrame.offset, 1);
    assert.deepEqual(
      compiledMotionChannels(finalFrame),
      expectedFinalChannels,
      `${entry.kind} must finish at the exact authored neutral state`,
    );

    for (let index = 0; index < compiled.keyframes.length; index += 1) {
      const frame = compiled.keyframes[index];
      assert.ok(
        frame.offset >= 0 && frame.offset <= 1,
        `${entry.kind} frame ${index} offset must be bounded`,
      );
      if (index > 0) {
        assert.ok(
          frame.offset >= compiled.keyframes[index - 1].offset,
          `${entry.kind} frame offsets must be monotonic`,
        );
      }
      for (const channel of COMPILED_MOTION_CHANNELS) {
        assert.ok(
          Number.isFinite(frame[channel]),
          `${entry.kind} frame ${index} ${channel} must be finite`,
        );
      }
    }

    const changesACompiledChannel = compiled.keyframes.some((frame) =>
      COMPILED_MOTION_CHANNELS.some(
        (channel) => frame[channel] !== finalFrame[channel],
      ),
    );
    assert.equal(
      changesACompiledChannel,
      entry.kind !== 'wait',
      entry.kind === 'wait'
        ? 'wait may advance time without changing a visual channel'
        : `${entry.kind} must visibly change at least one compiled channel`,
    );
  }
});

void test('path, filter, flip, and transition blocks retain representative semantics', () => {
  const compileDefault = (kind: (typeof MOTION_BLOCK_KINDS)[number]) => {
    const element = createDefaultProject().scenes[0].elements[0];
    element.motion.blocks = [
      createMotionBlock('scene-enter', `representative-${kind}-event`),
      createMotionBlock(kind, `representative-${kind}`),
    ];
    return compileElementMotion(element);
  };

  const squarePath = compileDefault('square-path');
  assert.deepEqual(
    squarePath.keyframes.map((frame) => [
      frame.offset,
      frame.translateX,
      frame.translateY,
    ]),
    [
      [0, 0, 0],
      [0.125, 120, 0],
      [0.25, 120, 90],
      [0.375, 0, 90],
      [0.5, 0, 0],
      [0.625, 120, 0],
      [0.75, 120, 90],
      [0.875, 0, 90],
      [1, 0, 0],
    ],
  );

  const brightness = compileDefault('brightness');
  assert.equal(brightness.keyframes[0].brightness, 1.8);
  assert.equal(brightness.keyframes.at(-1)?.brightness, 1);
  assert.ok(
    brightness.keyframes.every(
      (frame) =>
        frame.contrast === 1 &&
        frame.saturation === 1 &&
        frame.grayscale === 0 &&
        frame.sepia === 0 &&
        frame.hueRotate === 0,
    ),
  );

  const horizontalFlip = compileDefault('flip-horizontal');
  assert.ok(horizontalFlip.keyframes.some((frame) => frame.scaleX === -1));
  assert.ok(horizontalFlip.keyframes.every((frame) => frame.scaleY === 1));
  assert.equal(horizontalFlip.keyframes.at(-1)?.scaleX, 1);

  const slideFade = compileDefault('slide-fade-left');
  assert.deepEqual(
    {
      opacity: slideFade.keyframes[0].opacity,
      translateX: slideFade.keyframes[0].translateX,
    },
    { opacity: 0, translateX: 180 },
  );
  assert.deepEqual(
    {
      opacity: slideFade.keyframes.at(-1)?.opacity,
      translateX: slideFade.keyframes.at(-1)?.translateX,
    },
    { opacity: 1, translateX: 0 },
  );
});

void test('motion compilation is deterministic and produces a final element state', () => {
  const element = createDefaultProject().scenes[0].elements[0];
  element.rotation = 12;
  element.opacity = 0.8;
  element.motion.blocks = [
    createMotionBlock('scene-enter', 'event'),
    { ...createMotionBlock('wait', 'wait'), durationMs: 300 },
    { ...createMotionBlock('move', 'move'), x: 120, y: -40, durationMs: 800 },
    { ...createMotionBlock('rotate', 'rotate'), value: -35, durationMs: 400 },
    { ...createMotionBlock('scale', 'scale'), value: 0.6, durationMs: 400 },
    { ...createMotionBlock('opacity', 'opacity'), value: 0.2, durationMs: 500 },
  ];

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
  assert.equal(first.sequenceDurationMs, 2_400);
  assert.deepEqual(
    first.steps.map((step) => [step.kind, step.startsAtMs, step.durationMs]),
    [
      ['wait', 0, 300],
      ['move', 300, 800],
      ['rotate', 1_100, 400],
      ['scale', 1_500, 400],
      ['opacity', 1_900, 500],
    ],
  );
  assert.equal(first.keyframes[0].offset, 0);
  assert.equal(first.keyframes[1].offset, 0.125);
  assert.equal(first.keyframes[0].easing, 'steps(1, end)');
  assert.deepEqual(
    {
      translateX: first.keyframes.at(-1)?.translateX,
      translateY: first.keyframes.at(-1)?.translateY,
      opacity: first.keyframes.at(-1)?.opacity,
      scale: first.keyframes.at(-1)?.scale,
      rotation: first.keyframes.at(-1)?.rotation,
    },
    first.to,
  );
});

void test('default bounce compiles into four editable jumps and lands exactly on canvas', () => {
  const element = createDefaultProject().scenes[0].elements[0];
  const bounce = createMotionBlock('bounce', 'bounce-default');
  bounce.jumps = bounce.jumps.map((jump, index) => ({
    ...jump,
    id: `default-jump-${index + 1}`,
  }));
  element.motion.blocks = [createMotionBlock('scene-enter', 'event'), bounce];

  const compiled = compileElementMotion(element);

  assert.deepEqual(
    compiled.steps.map((step) => [step.kind, step.startsAtMs, step.durationMs]),
    [['bounce', 0, 1_480]],
  );
  assert.equal(compiled.sequenceDurationMs, 1_480);
  assert.deepEqual(
    compiled.keyframes.map((frame) => [frame.translateX, frame.translateY]),
    [
      [485, 0],
      [390, -170],
      [295, 0],
      [222.5, -120],
      [150, 0],
      [102.5, -78],
      [55, 0],
      [27.5, -42],
      [0, 0],
    ],
  );
  assert.deepEqual(compiled.from, {
    translateX: 485,
    translateY: 0,
    opacity: element.opacity,
    scale: 1,
    rotation: element.rotation,
  });
  assert.deepEqual(compiled.to, {
    translateX: 0,
    translateY: 0,
    opacity: element.opacity,
    scale: 1,
    rotation: element.rotation,
  });
});

void test('bounce honors mixed directions, later taller jumps, and a widest final jump', () => {
  const element = createDefaultProject().scenes[0].elements[0];
  element.rotation = 17;
  element.opacity = 0.72;
  const bounce = createMotionBlock('bounce', 'bounce-custom');
  bounce.jumps = [
    {
      id: 'jump-left-small',
      direction: 'left',
      height: 80,
      spread: 100,
      durationMs: 200,
      easing: 'ease-out',
    },
    {
      id: 'jump-right-tall',
      direction: 'right',
      height: 150,
      spread: 40,
      durationMs: 300,
      easing: 'ease-in-out',
    },
    {
      id: 'jump-left-widest',
      direction: 'left',
      height: 110,
      spread: 250,
      durationMs: 400,
      easing: 'linear',
    },
  ];
  element.motion.blocks = [createMotionBlock('scene-enter', 'event'), bounce];

  const compiled = compileElementMotion(element);

  assert.equal(compiled.sequenceDurationMs, 900);
  assert.deepEqual(
    compiled.keyframes.map((frame) => [frame.translateX, frame.translateY]),
    [
      [310, 0],
      [260, -80],
      [210, 0],
      [230, -150],
      [250, 0],
      [125, -110],
      [0, 0],
    ],
  );
  assert.deepEqual(
    compiled.keyframes.map((frame) => Number(frame.offset.toFixed(6))),
    [0, 0.111111, 0.222222, 0.388889, 0.555556, 0.777778, 1],
  );
  assert.deepEqual(
    {
      translateX: compiled.keyframes.at(-1)?.translateX,
      translateY: compiled.keyframes.at(-1)?.translateY,
      opacity: compiled.keyframes.at(-1)?.opacity,
      rotation: compiled.keyframes.at(-1)?.rotation,
    },
    { translateX: 0, translateY: 0, opacity: 0.72, rotation: 17 },
  );
});

void test('repeated move blocks preserve their own sequential endpoints', () => {
  const element = createDefaultProject().scenes[0].elements[0];
  element.motion.blocks = [
    createMotionBlock('scene-enter', 'event'),
    { ...createMotionBlock('move', 'move-one'), x: 100, y: 0, durationMs: 200 },
    {
      ...createMotionBlock('move', 'move-two'),
      x: -40,
      y: 50,
      durationMs: 300,
    },
  ];

  const compiled = compileElementMotion(element);

  assert.equal(compiled.sequenceDurationMs, 500);
  assert.deepEqual(
    compiled.keyframes.map((frame) => [
      frame.offset,
      frame.translateX,
      frame.translateY,
    ]),
    [
      [0, -60, -50],
      [0.4, 40, -50],
      [1, 0, 0],
    ],
  );
});

void test('shake, float, pulse, and flash are transient and finish at authored state', () => {
  const cases = [
    {
      block: {
        ...createMotionBlock('shake', 'shake'),
        x: 30,
        secondaryValue: 12,
        repetitions: 3,
        durationMs: 600,
      },
      changed: (
        frame: ReturnType<typeof compileElementMotion>['keyframes'][number],
      ) => frame.translateX !== 0 || frame.translateY !== 0,
    },
    {
      block: {
        ...createMotionBlock('float', 'float'),
        y: 60,
        repetitions: 2,
        durationMs: 800,
      },
      changed: (
        frame: ReturnType<typeof compileElementMotion>['keyframes'][number],
      ) => frame.translateY < 0,
    },
    {
      block: {
        ...createMotionBlock('pulse', 'pulse'),
        value: 1.3,
        repetitions: 2,
        durationMs: 800,
      },
      changed: (
        frame: ReturnType<typeof compileElementMotion>['keyframes'][number],
      ) => frame.scale > 1,
    },
    {
      block: {
        ...createMotionBlock('flash', 'flash'),
        value: 0.2,
        repetitions: 3,
        durationMs: 600,
      },
      changed: (
        frame: ReturnType<typeof compileElementMotion>['keyframes'][number],
      ) => frame.opacity < 0.73,
    },
  ];

  for (const { block, changed } of cases) {
    const element = createDefaultProject().scenes[0].elements[0];
    element.rotation = 19;
    element.opacity = 0.73;
    element.motion.blocks = [createMotionBlock('scene-enter', 'event'), block];

    const compiled = compileElementMotion(element);
    const finalFrame = compiled.keyframes.at(-1);

    assert.ok(
      compiled.keyframes.some(changed),
      `${block.kind} should create an intermediate state`,
    );
    assert.deepEqual(
      finalFrame && {
        translateX: finalFrame.translateX,
        translateY: finalFrame.translateY,
        opacity: finalFrame.opacity,
        scale: finalFrame.scale,
        rotation: finalFrame.rotation,
        blurPx: finalFrame.blurPx,
        clipTop: finalFrame.clipTop,
        clipRight: finalFrame.clipRight,
        clipBottom: finalFrame.clipBottom,
        clipLeft: finalFrame.clipLeft,
      },
      {
        translateX: 0,
        translateY: 0,
        opacity: 0.73,
        scale: 1,
        rotation: 19,
        blurPx: 0,
        clipTop: 0,
        clipRight: 0,
        clipBottom: 0,
        clipLeft: 0,
      },
    );
  }
});

void test('blur and directional reveal both finish fully visible and in focus', () => {
  const element = createDefaultProject().scenes[0].elements[0];
  const blur = {
    ...createMotionBlock('blur', 'blur'),
    value: 26,
    durationMs: 300,
  };
  element.motion.blocks = [createMotionBlock('scene-enter', 'event'), blur];
  const compiledBlur = compileElementMotion(element);

  assert.equal(compiledBlur.keyframes[0].blurPx, 26);
  assert.equal(compiledBlur.keyframes.at(-1)?.blurPx, 0);

  const reveal = {
    ...createMotionBlock('reveal', 'reveal'),
    direction: 'right' as const,
    value: 75,
    durationMs: 300,
  };
  element.motion.blocks = [createMotionBlock('scene-enter', 'event'), reveal];
  const compiledReveal = compileElementMotion(element);
  const firstReveal = compiledReveal.keyframes[0];
  const finalReveal = compiledReveal.keyframes.at(-1);

  assert.equal(
    firstReveal.clipTop +
      firstReveal.clipRight +
      firstReveal.clipBottom +
      firstReveal.clipLeft,
    75,
  );
  assert.deepEqual(
    finalReveal && [
      finalReveal.clipTop,
      finalReveal.clipRight,
      finalReveal.clipBottom,
      finalReveal.clipLeft,
    ],
    [0, 0, 0, 0],
  );
});

void test('disabled bounce blocks do not affect timing or the compiled path', () => {
  const element = createDefaultProject().scenes[0].elements[0];
  const disabledBounce = createMotionBlock('bounce', 'bounce-disabled');
  disabledBounce.enabled = false;
  disabledBounce.jumps = disabledBounce.jumps.map((jump, index) => ({
    ...jump,
    id: `disabled-jump-${index + 1}`,
  }));
  element.motion.blocks = [
    createMotionBlock('scene-enter', 'event'),
    disabledBounce,
    { ...createMotionBlock('move', 'move'), x: 30, y: 0, durationMs: 200 },
  ];

  const compiled = compileElementMotion(element);

  assert.deepEqual(
    compiled.steps.map((step) => step.kind),
    ['move'],
  );
  assert.equal(compiled.sequenceDurationMs, 200);
  assert.deepEqual(
    compiled.keyframes.map((frame) => [frame.translateX, frame.translateY]),
    [
      [-30, 0],
      [0, 0],
    ],
  );
});

void test('project restore normalizes new motion fields and legacy bounce jumps', () => {
  const candidate = JSON.parse(JSON.stringify(createDefaultProject())) as {
    scenes: Array<{
      elements: Array<{
        motion: { blocks: Array<Record<string, unknown>> };
      }>;
    }>;
  };
  candidate.scenes[0].elements[0].motion.blocks = [
    { id: 'event', kind: 'scene-enter' },
    {
      id: 'legacy-move',
      kind: 'move',
      durationMs: 250,
      easing: 'linear',
      x: 35,
      y: -10,
      value: 0,
    },
    {
      id: 'legacy-bounce',
      kind: 'bounce',
      jumps: [
        {
          id: 'legacy-jump-bounded',
          direction: 'right',
          height: 9_999,
          spread: -12,
          durationMs: 2,
          easing: 'unsupported',
        },
        { id: 'legacy-jump-defaulted', direction: 'left' },
      ],
    },
    { id: 'legacy-shake', kind: 'shake', repetitions: 99 },
    { id: 'legacy-reveal', kind: 'reveal', direction: 'diagonal' },
  ];

  const restored = restoreProject(JSON.stringify(candidate));

  assert.ok(restored);
  const blocks = restored.scenes[0].elements[0].motion.blocks;
  const move = blocks.find((block) => block.id === 'legacy-move');
  const bounce = blocks.find((block) => block.id === 'legacy-bounce');
  const shake = blocks.find((block) => block.id === 'legacy-shake');
  const reveal = blocks.find((block) => block.id === 'legacy-reveal');
  assert.ok(move && bounce && shake && reveal);
  assert.deepEqual(
    {
      secondaryValue: move.secondaryValue,
      repetitions: move.repetitions,
      direction: move.direction,
      jumps: move.jumps,
    },
    { secondaryValue: 0, repetitions: 1, direction: 'left', jumps: [] },
  );
  assert.deepEqual(bounce.jumps, [
    {
      id: 'legacy-jump-bounded',
      direction: 'right',
      height: 2_000,
      spread: 0,
      durationMs: 80,
      easing: 'ease-out',
    },
    {
      id: 'legacy-jump-defaulted',
      direction: 'left',
      height: 80,
      spread: 100,
      durationMs: 360,
      easing: 'ease-out',
    },
  ]);
  assert.equal(shake.x, 24);
  assert.equal(shake.secondaryValue, 10);
  assert.equal(shake.repetitions, 20);
  assert.equal(reveal.direction, 'left');
});

void test('project import rejects bounce sequences beyond the editable jump limit', () => {
  const candidate = createDefaultProject();
  const bounce = createMotionBlock('bounce', 'too-many-jumps');
  bounce.jumps = Array.from({ length: MAX_BOUNCE_JUMPS + 1 }, (_, index) => ({
    id: `jump-${index + 1}`,
    direction: 'left' as const,
    height: 40,
    spread: 50,
    durationMs: 200,
    easing: 'ease-out' as const,
  }));
  candidate.scenes[0].elements[0].motion.blocks = [
    createMotionBlock('scene-enter', 'event'),
    bounce,
  ];

  assert.equal(
    restoreProjectWithError(JSON.stringify(candidate)).error,
    'Project contains an invalid bounce sequence',
  );
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
  assert.equal(
    restored.scenes[0].elements[0].motion.schemaVersion,
    MOTION_SCHEMA_VERSION,
  );
  assert.equal(restored.scenes[0].elements[0].motion.event, 'scene-enter');
  assert.equal(restored.scenes[0].elements[0].motion.delayMs, 0);
  assert.equal(restored.scenes[0].elements[0].motion.fromScale, 1);
  assert.equal(restored.scenes[0].elements[0].motion.fromRotation, 0);
  assert.equal(
    restored.scenes[0].elements[0].motion.blocks[0].kind,
    'scene-enter',
  );
  assert.ok(
    restored.scenes[0].elements[0].motion.blocks.some(
      (block) => block.kind === 'move',
    ),
  );
});

void test('invalid project data is rejected', () => {
  assert.equal(
    restoreProject('{"schemaVersion":4,"title":"Broken","scenes":[]}'),
    null,
  );
  assert.equal(restoreProject('not json'), null);
});

void test('project import reports schema, layer, motion, and asset failures precisely', () => {
  assert.equal(
    restoreProjectWithError('not json').error,
    'Project file is not valid JSON',
  );
  assert.equal(
    restoreProjectWithError('{"schemaVersion":99,"title":"Future","scenes":[]}')
      .error,
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

  const invalidBlocks = createDefaultProject();
  invalidBlocks.scenes[0].elements[0].motion.blocks.push({
    ...createMotionBlock('move', 'event'),
  });
  assert.equal(
    restoreProjectWithError(JSON.stringify(invalidBlocks)).error,
    'Project contains an invalid animation block program',
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
  const revision = createPublicationRevision(
    project,
    '2026-08-29T00:00:00.000Z',
  );
  project.publications.push(revision);
  project.publishedRevision = 1;
  const candidate = structuredClone(project) as unknown as Record<
    string,
    unknown
  >;
  delete candidate.id;
  delete candidate.coverSceneId;
  delete candidate.updatedAt;
  candidate.publishedRevision = 999;
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
  assert.equal(result.project.publishedRevision, 1);
  assert.equal(result.project.publications[0].description, '');
  assert.deepEqual(result.project.publications[0].tags, []);
  assert.equal(result.project.publications[0].visibility, 'private');
  assert.equal(result.project.coverSceneId, 'scene-1');
  assert.equal(result.project.publications[0].coverSceneId, 'scene-1');
  assert.equal(result.project.updatedAt, '1970-01-01T00:00:00.000Z');
});

void test('project import bounds draft and published descriptions', () => {
  const project = createDefaultProject();
  project.description = 'D'.repeat(MAX_PROJECT_DESCRIPTION_LENGTH + 50);
  const revision = createPublicationRevision(
    project,
    '2026-08-29T00:00:00.000Z',
  );
  revision.description = 'R'.repeat(MAX_PROJECT_DESCRIPTION_LENGTH + 50);
  project.publications = [revision];
  project.publishedRevision = 1;

  const restored = restoreProject(JSON.stringify(project));

  assert.ok(restored);
  assert.equal(restored.description.length, MAX_PROJECT_DESCRIPTION_LENGTH);
  assert.equal(
    restored.publications[0].description.length,
    MAX_PROJECT_DESCRIPTION_LENGTH,
  );
});

void test('published revisions remain immutable when the draft changes', () => {
  const project = createDefaultProject();
  project.coverSceneId = 'scene-2';
  const revision = createPublicationRevision(
    project,
    '2026-08-29T00:00:00.000Z',
  );

  project.title = 'Changed draft title';
  project.coverSceneId = 'scene-3';
  project.tags.push('new tag');
  project.scenes[0].elements[0].text = 'Changed draft scene';

  assert.equal(revision.revision, 1);
  assert.equal(revision.createdAt, '2026-08-29T00:00:00.000Z');
  assert.equal(revision.title, 'Signal in the Fog');
  assert.equal(revision.coverSceneId, 'scene-2');
  assert.deepEqual(revision.tags, ['science fiction', 'mystery']);
  assert.equal(
    revision.scenes[0].elements[0].text,
    'Something moved beyond the fog.',
  );
});

void test('publication changes are detected against the current revision', () => {
  const project = createDefaultProject();
  assert.equal(hasUnpublishedChanges(project), true);

  const revision = createPublicationRevision(
    project,
    '2026-08-29T03:00:00.000Z',
  );
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
  const revision = createPublicationRevision(
    project,
    '2026-08-29T03:00:00.000Z',
  );
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
  assert.deepEqual(getPublicationReadiness(blank).issues, [
    'Choose a cover scene',
  ]);
  blank.coverSceneId = blank.scenes[0].id;

  blank.title = 'x'.repeat(161);
  assert.deepEqual(getPublicationReadiness(blank).issues, [
    'Shorten the title to 160 characters',
  ]);
});

void test('a published revision can be recovered as a new editable draft', () => {
  const project = createDefaultProject();
  project.coverSceneId = 'scene-2';
  const revision = createPublicationRevision(
    project,
    '2026-08-29T00:00:00.000Z',
  );
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
  assert.equal(
    restored.scenes[0].elements[0].text,
    revision.scenes[0].elements[0].text,
  );
  assert.equal(restored.updatedAt, '2026-08-29T01:00:00.000Z');
  assert.equal(restored.publishedRevision, 1);
  assert.equal(restored.publications.length, 1);
  restored.scenes[0].elements[0].text = 'Editable restored scene';
  assert.equal(
    revision.scenes[0].elements[0].text,
    'Something moved beyond the fog.',
  );
  assert.equal(restorePublicationToDraft(project, 'missing-revision'), null);
});

void test('only non-current publication revisions can be removed', () => {
  const project = createDefaultProject();
  const first = createPublicationRevision(project, '2026-08-29T00:00:00.000Z');
  project.publications.push(first);
  project.publishedRevision = first.revision;
  project.title = 'Updated signal';
  const second = createPublicationRevision(project, '2026-08-29T01:00:00.000Z');
  project.publications.push(second);
  project.publishedRevision = second.revision;

  const trimmed = removePublicationRevision(project, first.id);
  assert.deepEqual(
    trimmed?.publications.map((revision) => revision.id),
    [second.id],
  );
  assert.equal(project.publications.length, 2);
  assert.equal(removePublicationRevision(project, second.id), null);
  assert.equal(removePublicationRevision(project, 'missing-revision'), null);
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
  assert.deepEqual(resolveEditorSelection(project, 'scene-2', 'scene-2-orb'), {
    sceneId: 'scene-2',
    elementId: 'scene-2-orb',
  });
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
    shouldAutosaveDraft({
      hydrated: false,
      dirty: true,
      externalChange: false,
    }),
    false,
  );
  assert.equal(
    shouldAutosaveDraft({
      hydrated: true,
      dirty: false,
      externalChange: false,
    }),
    false,
  );
  assert.equal(
    shouldAutosaveDraft({ hydrated: true, dirty: true, externalChange: true }),
    false,
  );
});

void test('draft exit actions flush unsaved work and preserve conflicts', () => {
  assert.equal(
    getDraftExitAction({
      hydrated: true,
      dirty: true,
      externalChange: true,
    }),
    'warn',
  );
  assert.equal(
    getDraftExitAction({
      hydrated: true,
      dirty: true,
      externalChange: false,
    }),
    'flush',
  );
  assert.equal(
    getDraftExitAction({
      hydrated: true,
      dirty: false,
      externalChange: false,
    }),
    'none',
  );
  assert.equal(
    getDraftExitAction({
      hydrated: false,
      dirty: true,
      externalChange: true,
    }),
    'none',
  );
});

void test('draft save status prioritizes conflicts and failures', () => {
  assert.equal(
    getDraftSaveStatus({ dirty: true, externalChange: true, saveFailed: true }),
    'conflict',
  );
  assert.equal(
    getDraftSaveStatus({
      dirty: true,
      externalChange: false,
      saveFailed: true,
    }),
    'failed',
  );
  assert.equal(
    getDraftSaveStatus({
      dirty: true,
      externalChange: false,
      saveFailed: false,
    }),
    'saving',
  );
  assert.equal(
    getDraftSaveStatus({
      dirty: false,
      externalChange: false,
      saveFailed: false,
    }),
    'saved',
  );
});

void test('scene ordering moves one scene without mutating the source list', () => {
  const scenes = createDefaultProject().scenes;
  const originalOrder = scenes.map((scene) => scene.id);
  const reordered = reorderScenes(scenes, 'scene-2', -1);

  assert.deepEqual(originalOrder, ['scene-1', 'scene-2', 'scene-3']);
  assert.deepEqual(
    reordered.map((scene) => scene.id),
    ['scene-2', 'scene-1', 'scene-3'],
  );
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

void test('horizontal tab navigation wraps and supports boundaries', () => {
  assert.equal(getTabIndexForKey(0, 2, 'ArrowLeft'), 1);
  assert.equal(getTabIndexForKey(1, 2, 'ArrowRight'), 0);
  assert.equal(getTabIndexForKey(0, 3, 'ArrowLeft'), 2);
  assert.equal(getTabIndexForKey(2, 3, 'ArrowRight'), 0);
  assert.equal(getTabIndexForKey(1, 3, 'Home'), 0);
  assert.equal(getTabIndexForKey(1, 3, 'End'), 2);
  assert.equal(getTabIndexForKey(1, 3, 'Enter'), null);
  assert.equal(getTabIndexForKey(0, 0, 'ArrowRight'), null);
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

  assert.equal(resolveSelectionAfterElementDeletion(elements, ids[1]), ids[2]);
  assert.equal(
    resolveSelectionAfterElementDeletion(elements, ids.at(-1) ?? ''),
    ids.at(-2),
  );
  assert.equal(resolveSelectionAfterElementDeletion([elements[0]], ids[0]), '');
  assert.equal(resolveSelectionAfterElementDeletion(elements, 'missing'), '');
  assert.deepEqual(
    elements.map((element) => element.id),
    ids,
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

void test('file drags are distinguished from internal text drags', () => {
  assert.equal(hasFileDrag(['text/plain', 'Files']), true);
  assert.equal(hasFileDrag(new Set(['files'])), true);
  assert.equal(hasFileDrag(['text/plain', 'text/html']), false);
});

void test('scene thumbnails sample visible layers without mutating the scene', () => {
  const scene = createDefaultProject().scenes[0];
  scene.elements = Array.from({ length: 20 }, (_, index) => ({
    ...createElement('shape', index + 1),
    id: `layer-${index}`,
  }));

  assert.deepEqual(
    getSceneThumbnailElements(scene, 5).map((element) => element.id),
    ['layer-0', 'layer-5', 'layer-10', 'layer-14', 'layer-19'],
  );
  assert.equal(scene.elements.length, 20);

  scene.elements[19].visible = false;
  assert.equal(getSceneThumbnailElements(scene, 1)[0].id, 'layer-18');
  assert.deepEqual(getSceneThumbnailElements(scene, 0), []);
});

void test('supported clipboard and drop images select the first safe format', () => {
  const jpeg = { type: 'image/jpeg', name: 'photo.jpg' };
  const png = { type: 'image/png', name: 'shot.png' };
  const webp = { type: 'image/webp', name: 'art.webp' };

  assert.equal(findSupportedImageFile([jpeg, png, webp]), png);
  assert.equal(findSupportedImageFile(new Set([webp, png])), webp);
  assert.equal(findSupportedImageFile([jpeg]), undefined);
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
    validateImageAsset({
      mime: 'image/webp',
      size: 100,
      width: 5_000,
      height: 10,
    }),
    'Images must be at most 4096px per side and 12 megapixels',
  );
  assert.equal(
    validateImageAsset({
      mime: 'image/png',
      size: 100,
      width: 2_000,
      height: 2_000,
    }),
    null,
  );
});
