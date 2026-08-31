import assert from 'node:assert/strict';
import test from 'node:test';

import { createImageRigMesh } from './motus-mesh-warp.ts';

import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  DEFAULT_ELEMENT_IMAGE_FRAMING,
  DEFAULT_READER_PRESENTATION,
  ELEMENT_IMAGE_FITS,
  ELEMENT_FONT_PRESETS,
  ELEMENT_FONT_WEIGHTS,
  ELEMENT_TEXT_ALIGNMENTS,
  MAX_BOUNCE_JUMPS,
  MAX_COMPILED_MOTION_DURATION_MS,
  MAX_COMPILED_MOTION_KEYFRAMES,
  MAX_ELEMENT_FONT_SIZE,
  MAX_ELEMENT_ID_LENGTH,
  MAX_ELEMENT_LETTER_SPACING,
  MAX_ELEMENT_IMAGE_RIG_MASK_POINTS,
  MAX_ELEMENT_NAME_LENGTH,
  MAX_ELEMENT_RIG_DEPTH,
  MAX_MOTION_BLOCKS,
  MAX_MOTION_EVENT_SOURCE_ID_LENGTH,
  MAX_PROJECT_DESCRIPTION_LENGTH,
  MAX_PROJECT_CHAPTERS,
  MAX_PROJECT_SCENES,
  MAX_PUBLICATION_REVISION,
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
  MOTION_EVENT_BLOCK_KINDS,
  MOTION_SCHEMA_VERSION,
  PROJECT_SCHEMA_VERSION,
  alignSelectedElements,
  canAddChapterToProject,
  canAddElementToScene,
  canAddSceneToProject,
  compileElementMotion,
  createBlankChapter,
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
  distributeSelectedElements,
  findSupportedImageFile,
  findProjectScene,
  getPublicationReadiness,
  getCompiledMotionKeyframeEstimate,
  getDraftSaveStatus,
  getDraftExitAction,
  getEditorShortcut,
  getElementImageFraming,
  getElementRigCascadeDeleteIds,
  getElementRigDepth,
  getElementRigDescendantIds,
  getElementRigIntegrityIssue,
  getElementRigRenderedVisualBounds,
  getElementVisualBounds,
  getDefaultElementTypography,
  getFitCanvasWidth,
  getKeyboardNudgeDelta,
  getExpandedMotionStepCount,
  getMotionProgramDurationMs,
  getMotionProgramRuntimeIssue,
  getProjectStorageBytes,
  getProjectScenes,
  getSceneThumbnailElements,
  getTabIndexForKey,
  hasFileDrag,
  hasPointerDragStarted,
  hasUnpublishedChanges,
  insertMotionActionBefore,
  isMotionContainerBlockKind,
  isMotionEventBlockKind,
  isElementEffectivelyVisible,
  normalizeBounceJumpNumericField,
  normalizeElementImageFraming,
  normalizeElementImageRigPart,
  normalizeElementTypography,
  normalizeMotionBlockNumericField,
  parseProjectTags,
  recordProjectHistory,
  removePublicationRevision,
  replaceMotionEvent,
  reorderChapters,
  reorderMotionActionBefore,
  reorderScenes,
  resetProjectTimeline,
  resolveDraftConflict,
  resolveEditorSelection,
  resolveProjectCoverSceneId,
  resolveReaderSource,
  resolveSelectionAfterElementDeletion,
  restoreNewestProject,
  restorePublicationToDraft,
  restoreProject,
  restoreProjectWithError,
  shouldAutosaveDraft,
  shouldEndContinuousHistoryOnKey,
  snapSelectedElementMovement,
  trimProjectHistory,
  transformElementByPointer,
  translateElementRigBranch,
  translateElementRigSelectionByCanvasDelta,
  translateSelectedElements,
  type CompiledMotionKeyframe,
  type ProjectHistoryState,
  validateImageAsset,
  wouldCreateAnimationFinishCycle,
  wouldCreateElementRigCycle,
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

const DEFAULT_CHAPTER_ID = 'signal-in-the-fog-chapter-1';

function createLegacyProject(
  schemaVersion: 2 | 3 | 4 | 5 | 6,
  source = createDefaultProject(),
) {
  const project = structuredClone(source);
  const chapter = project.chapters[0];
  const publications = project.publications.map((publication) => {
    const {
      format: _format,
      chapters,
      metadata: _metadata,
      ...legacyPublication
    } = publication;
    return {
      ...legacyPublication,
      chapterTitle: chapters[0].title,
      scenes: chapters[0].scenes,
    };
  });
  const {
    format: _format,
    chapters: _chapters,
    metadata: _metadata,
    ...legacyProject
  } = project;
  return {
    ...legacyProject,
    schemaVersion,
    chapterTitle: chapter.title,
    scenes: chapter.scenes,
    publications,
  };
}

function createVersion7Project(source = createDefaultProject()) {
  const project = structuredClone(source);
  const publications = project.publications.map((publication) => {
    const { metadata: _metadata, ...version7Publication } = publication;
    return version7Publication;
  });
  const { metadata: _metadata, ...version7Project } = project;
  return { ...version7Project, schemaVersion: 7 as const, publications };
}

function migratedMetadataFor(creatorName: string) {
  return {
    contributorNames: [creatorName],
    workStatus: null,
    origin: null,
    sourceWorkSlug: null,
    sourceTitle: null,
    sourceCreator: null,
    fandom: null,
    genres: [],
    characters: [],
    relationships: [],
    themes: [],
    contentWarnings: [],
    communityLinks: [],
  };
}

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
  assert.equal(project.chapters[0].title, 'Chapter 1');
  assert.equal(project.visibility, 'private');
  assert.equal(project.updatedAt, '2026-08-29T02:00:00.000Z');
  assert.equal(project.chapters[0].scenes.length, 1);
  assert.equal(project.chapters[0].scenes[0].id, 'work-123-scene-1');
  assert.equal(project.coverSceneId, 'work-123-scene-1');
  assert.deepEqual(project.chapters[0].scenes[0].elements, []);
  assert.deepEqual(project.publications, []);
  assert.deepEqual(project.metadata, migratedMetadataFor('New creator'));
  assert.deepEqual(project.readerPresentation, DEFAULT_READER_PRESENTATION);
  assert.notEqual(project.readerPresentation, DEFAULT_READER_PRESENTATION);
});

void test('default projects start with an independent book presentation', () => {
  const first = createDefaultProject();
  const second = createDefaultProject();

  assert.deepEqual(first.readerPresentation, {
    transition: 'book',
    direction: 'ltr',
    durationMs: 360,
  });
  assert.notEqual(first.readerPresentation, second.readerPresentation);
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
  const text = project.chapters[0].scenes[0].elements[0];
  const shape = project.chapters[0].scenes[0].elements[1];

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
  const selection = {
    chapterId: DEFAULT_CHAPTER_ID,
    sceneId: 'scene-2',
    elementId: 'scene-2-speech',
  };
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
    chapterId: 'missing-chapter',
    sceneId: 'missing-scene',
    elementId: 'missing-layer',
  });

  project.title = 'Changed after capture';
  assert.equal(entry.project.title, 'Signal in the Fog');
  assert.deepEqual(entry.selection, {
    chapterId: DEFAULT_CHAPTER_ID,
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
      chapterId: DEFAULT_CHAPTER_ID,
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
    chapterId: DEFAULT_CHAPTER_ID,
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
  const source = createDefaultProject().chapters[0].scenes[0].elements[0];
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
  const source = createDefaultProject().chapters[0].scenes[0].elements[0];
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

void test('selected elements translate with one shared canvas-clamped delta', () => {
  const nearTopLeft = createElement('shape', 1, {
    id: 'near-top-left',
    x: 10,
    y: 20,
    width: 100,
    height: 80,
  });
  const nearBottomRight = createElement('text', 2, {
    id: 'near-bottom-right',
    x: 850,
    y: 1_200,
    width: 200,
    height: 200,
  });
  const locked = createElement('speech', 3, {
    id: 'locked',
    x: 5,
    y: 5,
    width: 160,
    height: 120,
    locked: true,
  });
  const unselected = createElement('shape', 4, {
    id: 'unselected',
    x: 300,
    y: 500,
    width: 140,
    height: 140,
  });
  const elements = [nearBottomRight, locked, nearTopLeft, unselected];
  const original = structuredClone(elements);
  const moved = translateSelectedElements(
    elements,
    ['near-top-left', 'near-bottom-right', 'locked', 'missing'],
    500,
    500,
  );

  assert.deepEqual(
    moved.map((element) => element.id),
    elements.map((element) => element.id),
  );
  assert.deepEqual(
    moved.map(({ id, x, y }) => ({ id, x, y })),
    [
      { id: 'near-bottom-right', x: 880, y: 1_240 },
      { id: 'locked', x: 5, y: 5 },
      { id: 'near-top-left', x: 40, y: 60 },
      { id: 'unselected', x: 300, y: 500 },
    ],
  );
  assert.equal(moved[0].x - moved[2].x, nearBottomRight.x - nearTopLeft.x);
  assert.equal(moved[0].y - moved[2].y, nearBottomRight.y - nearTopLeft.y);
  assert.strictEqual(moved[1], locked);
  assert.strictEqual(moved[3], unselected);
  assert.deepEqual(elements, original);

  const movedToOrigin = translateSelectedElements(
    elements,
    ['near-top-left', 'near-bottom-right'],
    -10_000,
    -10_000,
  );
  assert.deepEqual(
    movedToOrigin.map(({ id, x, y }) => ({ id, x, y })),
    [
      { id: 'near-bottom-right', x: 840, y: 1_180 },
      { id: 'locked', x: 5, y: 5 },
      { id: 'near-top-left', x: 0, y: 0 },
      { id: 'unselected', x: 300, y: 500 },
    ],
  );
});

void test('visual element bounds include rotation around the element center', () => {
  const element = createElement('shape', 1, {
    id: 'rotated',
    x: 100,
    y: 200,
    width: 120,
    height: 60,
    rotation: 90,
  });

  const bounds = getElementVisualBounds(element);

  assert.ok(Math.abs(bounds.left - 130) < 1e-9);
  assert.ok(Math.abs(bounds.top - 170) < 1e-9);
  assert.ok(Math.abs(bounds.right - 190) < 1e-9);
  assert.ok(Math.abs(bounds.bottom - 290) < 1e-9);
  assert.deepEqual(
    { centerX: bounds.centerX, centerY: bounds.centerY },
    { centerX: 160, centerY: 230 },
  );
});

void test('visual bounds and resizing honor an articulated off-center pivot', () => {
  const arm = createElement('shape', 1, {
    id: 'pivot-arm',
    x: 100,
    y: 200,
    width: 120,
    height: 60,
    pivotX: 0,
    pivotY: 50,
    rotation: 90,
  });
  const bounds = getElementVisualBounds(arm);
  assert.deepEqual(bounds, {
    left: 70,
    top: 230,
    right: 130,
    bottom: 350,
    centerX: 100,
    centerY: 290,
  });

  const resized = transformElementByPointer(arm, 'resize-e', 0, 40);
  assert.deepEqual(
    {
      x: resized.x,
      y: resized.y,
      width: resized.width,
      height: resized.height,
      pivotX: resized.pivotX,
      pivotY: resized.pivotY,
    },
    {
      x: 100,
      y: 200,
      width: 160,
      height: 60,
      pivotX: 0,
      pivotY: 50,
    },
  );
});

void test('movement snapping aligns a layer center to both canvas axes', () => {
  const moving = createElement('shape', 1, {
    id: 'moving',
    x: 100,
    y: 200,
    width: 100,
    height: 100,
  });

  const snapped = snapSelectedElementMovement(
    [moving],
    [moving.id],
    386,
    466,
    6,
    6,
  );

  assert.deepEqual(
    { deltaX: snapped.deltaX, deltaY: snapped.deltaY },
    { deltaX: 390, deltaY: 470 },
  );
  assert.deepEqual(
    snapped.guides.map(({ axis, position, target, movingAnchor }) => ({
      axis,
      position,
      target,
      movingAnchor,
    })),
    [
      {
        axis: 'vertical',
        position: CANVAS_WIDTH / 2,
        target: 'canvas',
        movingAnchor: 'center',
      },
      {
        axis: 'horizontal',
        position: CANVAS_HEIGHT / 2,
        target: 'canvas',
        movingAnchor: 'center',
      },
    ],
  );
  const [translated] = translateSelectedElements(
    [moving],
    [moving.id],
    snapped.deltaX,
    snapped.deltaY,
  );
  assert.deepEqual({ x: translated.x, y: translated.y }, { x: 490, y: 670 });
});

void test('movement snapping uses visible locked peers and ignores hidden peers', () => {
  const moving = createElement('shape', 1, {
    id: 'moving',
    x: 100,
    y: 100,
    width: 100,
    height: 100,
  });
  const lockedPeer = createElement('text', 2, {
    id: 'locked-peer',
    x: 400,
    y: 500,
    width: 200,
    height: 150,
    locked: true,
  });
  const hiddenPeer = createElement('shape', 3, {
    id: 'hidden-peer',
    x: 300,
    y: 300,
    width: 100,
    height: 100,
    visible: false,
  });

  const snapped = snapSelectedElementMovement(
    [moving, hiddenPeer, lockedPeer],
    [moving.id],
    196,
    296,
    6,
    6,
  );

  assert.deepEqual(
    { deltaX: snapped.deltaX, deltaY: snapped.deltaY },
    { deltaX: 200, deltaY: 300 },
  );
  assert.equal(snapped.guides.length, 2);
  assert.ok(
    snapped.guides.every(
      (guide) =>
        guide.target === 'element' && guide.targetElementId === lockedPeer.id,
    ),
  );

  const hiddenOnly = snapSelectedElementMovement(
    [moving, hiddenPeer],
    [moving.id],
    99,
    99,
    4,
    4,
  );
  assert.deepEqual(hiddenOnly, { deltaX: 99, deltaY: 99, guides: [] });
});

void test('movement snapping stays free outside the threshold', () => {
  const moving = createElement('shape', 1, {
    id: 'moving',
    x: 100,
    y: 100,
    width: 100,
    height: 100,
  });

  const snapped = snapSelectedElementMovement(
    [moving],
    [moving.id],
    330,
    300,
    6,
    6,
  );

  assert.deepEqual(snapped, { deltaX: 330, deltaY: 300, guides: [] });
});

void test('movement snapping resolves equal peer candidates deterministically', () => {
  const moving = createElement('shape', 1, {
    id: 'moving',
    x: 100,
    y: 100,
    width: 100,
    height: 100,
  });
  const firstPeer = createElement('shape', 2, {
    id: 'first-peer',
    x: 400,
    y: 600,
    width: 100,
    height: 100,
  });
  const secondPeer = createElement('shape', 3, {
    id: 'second-peer',
    x: 400,
    y: 900,
    width: 100,
    height: 100,
  });

  const snapped = snapSelectedElementMovement(
    [moving, firstPeer, secondPeer],
    [moving.id],
    198,
    100,
    4,
    4,
  );

  const verticalGuide = snapped.guides.find(
    (guide) => guide.axis === 'vertical',
  );
  assert.equal(snapped.deltaX, 200);
  assert.equal(verticalGuide?.targetElementId, firstPeer.id);
});

void test('group snapping preserves spacing and excludes every moving layer', () => {
  const first = createElement('shape', 1, {
    id: 'first',
    x: 100,
    y: 100,
    width: 100,
    height: 100,
  });
  const second = createElement('shape', 2, {
    id: 'second',
    x: 300,
    y: 150,
    width: 100,
    height: 100,
  });
  const peer = createElement('shape', 3, {
    id: 'peer',
    x: 700,
    y: 600,
    width: 100,
    height: 100,
  });
  const elements = [first, second, peer];

  const snapped = snapSelectedElementMovement(
    elements,
    [first.id, second.id],
    296,
    0,
    6,
    6,
  );
  const moved = translateSelectedElements(
    elements,
    [first.id, second.id],
    snapped.deltaX,
    snapped.deltaY,
  );

  assert.equal(snapped.deltaX, 300);
  assert.equal(snapped.guides[0]?.targetElementId, peer.id);
  assert.deepEqual(
    moved.slice(0, 2).map(({ x, y }) => ({ x, y })),
    [
      { x: 400, y: 100 },
      { x: 600, y: 150 },
    ],
  );
  assert.equal(moved[1].x - moved[0].x, second.x - first.x);
  assert.strictEqual(moved[2], peer);
});

void test('movement snapping clamps unsafe and non-finite deltas', () => {
  const moving = createElement('shape', 1, {
    id: 'moving',
    x: 900,
    y: 200,
    width: 100,
    height: 100,
  });

  const clamped = snapSelectedElementMovement(
    [moving],
    [moving.id],
    Number.POSITIVE_INFINITY,
    Number.NaN,
    Number.NaN,
    Number.NaN,
  );

  assert.equal(clamped.deltaX, 0);
  assert.equal(clamped.deltaY, 0);
  assert.ok(Number.isFinite(clamped.deltaX));
  assert.ok(Number.isFinite(clamped.deltaY));
});

void test('rotated non-square layers can snap their visible edges to canvas', () => {
  const rotated = createElement('shape', 1, {
    id: 'rotated',
    x: 0,
    y: 200,
    width: 400,
    height: 100,
    rotation: 90,
  });

  const snapped = snapSelectedElementMovement(
    [rotated],
    [rotated.id],
    -149,
    0,
    2,
    2,
  );

  assert.equal(snapped.deltaX, -150);
  assert.deepEqual(snapped.guides, [
    {
      axis: 'vertical',
      position: 0,
      target: 'canvas',
      movingAnchor: 'start',
      targetAnchor: 'start',
    },
  ]);
});

void test('selected elements align to editable cohort bounds in every direction', () => {
  const first = createElement('shape', 1, {
    id: 'first',
    x: 100,
    y: 100,
    width: 100,
    height: 80,
  });
  const second = createElement('text', 2, {
    id: 'second',
    x: 400,
    y: 300,
    width: 200,
    height: 120,
  });
  const locked = createElement('speech', 3, {
    id: 'locked',
    x: 10,
    y: 20,
    width: 400,
    height: 300,
    locked: true,
  });
  const unselected = createElement('shape', 4, {
    id: 'unselected',
    x: 700,
    y: 700,
    width: 100,
    height: 100,
  });
  const elements = [second, locked, unselected, first];
  const original = structuredClone(elements);
  const selectedIds = ['first', 'second', 'locked'];
  const expected = {
    left: [
      { x: 100, y: 300 },
      { x: 100, y: 100 },
    ],
    center: [
      { x: 250, y: 300 },
      { x: 300, y: 100 },
    ],
    right: [
      { x: 400, y: 300 },
      { x: 500, y: 100 },
    ],
    top: [
      { x: 400, y: 100 },
      { x: 100, y: 100 },
    ],
    middle: [
      { x: 400, y: 200 },
      { x: 100, y: 220 },
    ],
    bottom: [
      { x: 400, y: 300 },
      { x: 100, y: 340 },
    ],
  } as const;

  for (const alignment of [
    'left',
    'center',
    'right',
    'top',
    'middle',
    'bottom',
  ] as const) {
    const aligned = alignSelectedElements(elements, selectedIds, alignment);
    assert.deepEqual(
      [aligned[0], aligned[3]].map(({ x, y }) => ({ x, y })),
      expected[alignment],
    );
    assert.deepEqual(
      aligned.map((element) => element.id),
      elements.map((element) => element.id),
    );
    assert.strictEqual(aligned[1], locked);
    assert.strictEqual(aligned[2], unselected);
  }
  assert.deepEqual(elements, original);
});

void test('selected elements distribute with fixed spatial anchors and stable z-order', () => {
  const horizontalFirst = createElement('shape', 1, {
    id: 'horizontal-first',
    x: 100,
    y: 100,
    width: 100,
    height: 80,
  });
  const horizontalMiddleOne = createElement('shape', 2, {
    id: 'horizontal-middle-one',
    x: 320,
    y: 100,
    width: 50,
    height: 80,
  });
  const horizontalMiddleTwo = createElement('shape', 3, {
    id: 'horizontal-middle-two',
    x: 600,
    y: 100,
    width: 100,
    height: 80,
  });
  const horizontalLast = createElement('shape', 4, {
    id: 'horizontal-last',
    x: 960,
    y: 100,
    width: 100,
    height: 80,
  });
  const locked = createElement('shape', 5, {
    id: 'locked',
    x: 0,
    y: 0,
    width: 60,
    height: 60,
    locked: true,
  });
  const elements = [
    horizontalMiddleTwo,
    horizontalLast,
    locked,
    horizontalFirst,
    horizontalMiddleOne,
  ];
  const original = structuredClone(elements);
  const selectedIds = elements.map((element) => element.id);
  const distributed = distributeSelectedElements(
    elements,
    selectedIds,
    'horizontal',
  );

  assert.deepEqual(
    distributed.map(({ id, x }) => ({ id, x })),
    [
      { id: 'horizontal-middle-two', x: 660 },
      { id: 'horizontal-last', x: 960 },
      { id: 'locked', x: 0 },
      { id: 'horizontal-first', x: 100 },
      { id: 'horizontal-middle-one', x: 400 },
    ],
  );
  assert.strictEqual(distributed[1], horizontalLast);
  assert.strictEqual(distributed[2], locked);
  assert.strictEqual(distributed[3], horizontalFirst);
  assert.deepEqual(elements, original);

  const verticalFirst = createElement('shape', 6, {
    id: 'vertical-first',
    x: 100,
    y: 100,
    width: 80,
    height: 100,
  });
  const verticalMiddle = createElement('shape', 7, {
    id: 'vertical-middle',
    x: 100,
    y: 500,
    width: 80,
    height: 200,
  });
  const verticalLast = createElement('shape', 8, {
    id: 'vertical-last',
    x: 100,
    y: 1_100,
    width: 80,
    height: 100,
  });
  const vertical = [verticalMiddle, verticalLast, verticalFirst];
  const verticallyDistributed = distributeSelectedElements(
    vertical,
    vertical.map((element) => element.id),
    'vertical',
  );

  assert.deepEqual(
    verticallyDistributed.map(({ id, y }) => ({ id, y })),
    [
      { id: 'vertical-middle', y: 550 },
      { id: 'vertical-last', y: 1_100 },
      { id: 'vertical-first', y: 100 },
    ],
  );
  assert.strictEqual(verticallyDistributed[1], verticalLast);
  assert.strictEqual(verticallyDistributed[2], verticalFirst);
});

void test('selection layout helpers leave undersized editable cohorts unchanged', () => {
  const unlocked = createElement('shape', 1, { id: 'unlocked' });
  const locked = createElement('shape', 2, { id: 'locked', locked: true });
  const elements = [locked, unlocked];

  const translated = translateSelectedElements(elements, ['locked'], 80, 90);
  const aligned = alignSelectedElements(
    elements,
    ['locked', 'unlocked'],
    'left',
  );
  const distributed = distributeSelectedElements(
    elements,
    ['locked', 'unlocked'],
    'horizontal',
  );

  assert.deepEqual(translated, elements);
  assert.deepEqual(aligned, elements);
  assert.deepEqual(distributed, elements);
  assert.notStrictEqual(translated, elements);
  assert.notStrictEqual(aligned, elements);
  assert.notStrictEqual(distributed, elements);
  assert.strictEqual(translated[0], locked);
  assert.strictEqual(aligned[1], unlocked);
});

void test('distribution refuses an unsafe proposal instead of clamping members apart', () => {
  const first = createElement('shape', 1, {
    id: 'first',
    x: 0,
    width: 60,
  });
  const wideOne = createElement('shape', 2, {
    id: 'wide-one',
    x: 40,
    width: 1_000,
  });
  const wideTwo = createElement('shape', 3, {
    id: 'wide-two',
    x: 60,
    width: 1_000,
  });
  const last = createElement('shape', 4, {
    id: 'last',
    x: 1_020,
    width: 60,
  });
  const elements = [wideTwo, last, first, wideOne];
  const distributed = distributeSelectedElements(
    elements,
    elements.map((element) => element.id),
    'horizontal',
  );

  assert.deepEqual(distributed, elements);
  assert.notStrictEqual(distributed, elements);
  assert.ok(distributed.every((element, index) => element === elements[index]));
});

void test('directional resize handles anchor the opposite sides', () => {
  const source = createDefaultProject().chapters[0].scenes[0].elements[0];
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
  const source = createDefaultProject().chapters[0].scenes[0].elements[0];
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
  const source = createDefaultProject().chapters[0].scenes[0].elements[0];
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
  const source = createDefaultProject().chapters[0].scenes[0].elements[0];
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
  const source = createDefaultProject().chapters[0].scenes[0].elements[0];
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

  const source = createDefaultProject().chapters[0].scenes[0].elements[0];
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

void test('image layers start centered and framing normalization stays bounded', () => {
  assert.deepEqual(ELEMENT_IMAGE_FITS, ['cover', 'contain']);
  const image = createElement('image', 1);
  assert.deepEqual(getElementImageFraming(image), {
    fit: 'cover',
    focalX: 50,
    focalY: 50,
  });
  assert.deepEqual(
    getElementImageFraming(image),
    DEFAULT_ELEMENT_IMAGE_FRAMING,
  );

  assert.deepEqual(
    normalizeElementImageFraming({
      imageFit: 'contain',
      imageFocalX: -25,
      imageFocalY: 175,
    }),
    { fit: 'contain', focalX: 0, focalY: 100 },
  );
  assert.deepEqual(
    normalizeElementImageFraming({
      imageFit: 'stretch',
      imageFocalX: Number.NaN,
      imageFocalY: Number.POSITIVE_INFINITY,
    }),
    DEFAULT_ELEMENT_IMAGE_FRAMING,
  );
  assert.deepEqual(
    normalizeElementImageFraming(undefined),
    DEFAULT_ELEMENT_IMAGE_FRAMING,
  );

  const shape = createElement('shape', 2, {
    imageFit: 'contain',
    imageFocalX: 12,
    imageFocalY: 88,
  });
  assert.equal(Object.hasOwn(shape, 'imageFit'), false);
  assert.equal(Object.hasOwn(shape, 'imageFocalX'), false);
  assert.equal(Object.hasOwn(shape, 'imageFocalY'), false);
});

void test('image element copies preserve independent framing controls', () => {
  const source = createElement('image', 1, {
    id: 'source-image',
    name: 'Portrait',
    imageFit: 'cover',
    imageFocalX: 18,
    imageFocalY: 76,
  });
  const copy = createElementCopy(source, 'copied-image');

  assert.deepEqual(getElementImageFraming(copy), {
    fit: 'cover',
    focalX: 18,
    focalY: 76,
  });
  copy.imageFit = 'contain';
  copy.imageFocalX = 90;
  copy.imageFocalY = 10;
  assert.deepEqual(getElementImageFraming(source), {
    fit: 'cover',
    focalX: 18,
    focalY: 76,
  });
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
  const element = project.chapters[0].scenes[0].elements[0];
  element.x = Number.NaN;
  element.y = -20;
  element.width = MIN_ELEMENT_WIDTH - 1;
  element.height = CANVAS_HEIGHT + 1;
  element.opacity = -1;

  const restored = restoreProject(JSON.stringify(project));

  assert.ok(restored);
  assert.deepEqual(
    {
      x: restored.chapters[0].scenes[0].elements[0].x,
      y: restored.chapters[0].scenes[0].elements[0].y,
      width: restored.chapters[0].scenes[0].elements[0].width,
      height: restored.chapters[0].scenes[0].elements[0].height,
      opacity: restored.chapters[0].scenes[0].elements[0].opacity,
    },
    { x: 0, y: 0, width: MIN_ELEMENT_WIDTH, height: CANVAS_HEIGHT, opacity: 0 },
  );
});

void test('typography survives project and publication round trips', () => {
  const project = createDefaultProject();
  const title = project.chapters[0].scenes[0].elements[0];
  const speech = project.chapters[0].scenes[0].elements[2];
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
  assert.deepEqual(
    restored.chapters[0].scenes[0].elements[0].typography,
    title.typography,
  );
  assert.deepEqual(
    restored.chapters[0].scenes[0].elements[2].typography,
    speech.typography,
  );
  assert.deepEqual(
    restored.publications[0].chapters[0].scenes[0].elements[0].typography,
    title.typography,
  );
  title.typography.fontSize = 100;
  assert.equal(
    restored.publications[0].chapters[0].scenes[0].elements[0].typography
      ?.fontSize,
    72,
  );
});

void test('image framing survives draft and publication round trips independently', () => {
  const project = createDefaultProject();
  const image = createElement('image', 4, {
    id: 'framed-image',
    imageFit: 'cover',
    imageFocalX: 22.5,
    imageFocalY: 81,
  });
  project.chapters[0].scenes[0].elements.push(image);
  const revision = createPublicationRevision(
    project,
    '2026-08-30T03:00:00.000Z',
  );
  project.publications = [revision];
  project.publishedRevision = revision.revision;

  image.imageFit = 'contain';
  image.imageFocalX = 64;
  image.imageFocalY = 37;
  const restored = restoreProject(JSON.stringify(project));

  assert.ok(restored);
  assert.deepEqual(
    getElementImageFraming(
      restored.chapters[0].scenes[0].elements.find(
        (element) => element.id === image.id,
      )!,
    ),
    { fit: 'contain', focalX: 64, focalY: 37 },
  );
  assert.deepEqual(
    getElementImageFraming(
      restored.publications[0].chapters[0].scenes[0].elements.find(
        (element) => element.id === image.id,
      )!,
    ),
    { fit: 'cover', focalX: 22.5, focalY: 81 },
  );

  const publicationDraft = restorePublicationToDraft(
    restored,
    restored.publications[0].id,
  );
  assert.ok(publicationDraft);
  assert.deepEqual(
    getElementImageFraming(
      publicationDraft.chapters[0].scenes[0].elements.find(
        (element) => element.id === image.id,
      )!,
    ),
    { fit: 'cover', focalX: 22.5, focalY: 81 },
  );
});

void test('version 8 image layers migrate to centered cover framing', () => {
  const project = createDefaultProject();
  const image = createElement('image', 4, { id: 'legacy-image' });
  project.chapters[0].scenes[0].elements.push(image);
  const revision = createPublicationRevision(project);
  project.publications = [revision];
  project.publishedRevision = revision.revision;

  type LegacyFramingProject = {
    schemaVersion: number;
    chapters: Array<{
      scenes: Array<{ elements: Array<Record<string, unknown>> }>;
    }>;
    publications: Array<{
      chapters: Array<{
        scenes: Array<{ elements: Array<Record<string, unknown>> }>;
      }>;
    }>;
  };
  const legacy = JSON.parse(JSON.stringify(project)) as LegacyFramingProject;
  legacy.schemaVersion = 8;
  for (const element of legacy.chapters[0].scenes[0].elements) {
    delete element.imageFit;
    delete element.imageFocalX;
    delete element.imageFocalY;
  }
  for (const element of legacy.publications[0].chapters[0].scenes[0].elements) {
    delete element.imageFit;
    delete element.imageFocalX;
    delete element.imageFocalY;
  }

  const restored = restoreProject(JSON.stringify(legacy));

  assert.ok(restored);
  assert.equal(restored.schemaVersion, PROJECT_SCHEMA_VERSION);
  assert.deepEqual(
    getElementImageFraming(
      restored.chapters[0].scenes[0].elements.find(
        (element) => element.id === image.id,
      )!,
    ),
    DEFAULT_ELEMENT_IMAGE_FRAMING,
  );
  assert.deepEqual(
    getElementImageFraming(
      restored.publications[0].chapters[0].scenes[0].elements.find(
        (element) => element.id === image.id,
      )!,
    ),
    DEFAULT_ELEMENT_IMAGE_FRAMING,
  );
});

void test('current projects reject malformed image framing and strip it from other layers', () => {
  const malformedValues = [
    { imageFit: 'stretch' },
    { imageFocalX: -0.01 },
    { imageFocalX: 100.01 },
    { imageFocalY: null },
    { imageFocalY: '50' },
  ];

  for (const malformedFraming of malformedValues) {
    const project = createDefaultProject();
    const image = createElement('image', 4, { id: 'invalid-image' });
    Object.assign(image, malformedFraming);
    project.chapters[0].scenes[0].elements.push(image);
    assert.equal(
      restoreProjectWithError(JSON.stringify(project)).error,
      'Project chapter 1 contains invalid image framing',
    );
  }

  const project = createDefaultProject();
  const shape = project.chapters[0].scenes[0].elements[1];
  Object.assign(shape, {
    imageFit: 'contain',
    imageFocalX: 14,
    imageFocalY: 86,
  });
  const restored = restoreProject(JSON.stringify(project));
  assert.ok(restored);
  const restoredShape = restored.chapters[0].scenes[0].elements[1];
  assert.equal(Object.hasOwn(restoredShape, 'imageFit'), false);
  assert.equal(Object.hasOwn(restoredShape, 'imageFocalX'), false);
  assert.equal(Object.hasOwn(restoredShape, 'imageFocalY'), false);

  const publicationProject = createDefaultProject();
  publicationProject.chapters[0].scenes[0].elements.push(
    createElement('image', 4, { id: 'published-invalid-image' }),
  );
  const revision = createPublicationRevision(publicationProject);
  revision.chapters[0].scenes[0].elements.at(-1)!.imageFocalY = 125;
  publicationProject.publications = [revision];
  publicationProject.publishedRevision = revision.revision;
  assert.equal(
    restoreProjectWithError(JSON.stringify(publicationProject)).error,
    'Publication revision 1 chapter 1 contains invalid image framing',
  );
});

void test('version 5 drafts without typography preserve the legacy appearance', () => {
  const legacy = createLegacyProject(5);
  for (const scene of legacy.scenes) {
    for (const element of scene.elements) delete element.typography;
  }

  const restored = restoreProject(JSON.stringify(legacy));

  assert.ok(restored);
  assert.equal(restored.schemaVersion, PROJECT_SCHEMA_VERSION);
  assert.deepEqual(
    restored.chapters[0].scenes[0].elements[0].typography,
    getDefaultElementTypography('text'),
  );
  assert.equal(
    restored.chapters[0].scenes[0].elements[1].typography,
    undefined,
  );
  assert.deepEqual(
    restored.chapters[0].scenes[0].elements[2].typography,
    getDefaultElementTypography('speech'),
  );
});

void test('restored drafts bound editable names and reject invalid name types', () => {
  const project = createDefaultProject();
  project.chapters[0].scenes[0].name = `  ${'S'.repeat(MAX_SCENE_NAME_LENGTH + 20)}  `;
  project.chapters[0].scenes[0].elements[0].name = '   ';
  project.chapters[0].scenes[0].elements[1].name = 'L'.repeat(
    MAX_ELEMENT_NAME_LENGTH + 20,
  );

  const restored = restoreProject(JSON.stringify(project));

  assert.ok(restored);
  assert.equal(
    restored.chapters[0].scenes[0].name.length,
    MAX_SCENE_NAME_LENGTH,
  );
  assert.equal(restored.chapters[0].scenes[0].elements[0].name, 'Text');
  assert.equal(
    restored.chapters[0].scenes[0].elements[1].name.length,
    MAX_ELEMENT_NAME_LENGTH,
  );

  const malformed = JSON.parse(JSON.stringify(project));
  malformed.chapters[0].scenes[0].elements[0].name = 42;
  assert.equal(
    restoreProjectWithError(JSON.stringify(malformed)).error,
    'Project chapter 1 contains an invalid layer name',
  );
  malformed.chapters[0].scenes[0].elements[0].name = 'Layer';
  malformed.chapters[0].scenes[0].name = 42;
  assert.equal(
    restoreProjectWithError(JSON.stringify(malformed)).error,
    'Project chapter 1 contains an invalid scene name',
  );
});

void test('motion registry is exhaustive, categorized, and has bounded finite defaults', () => {
  const catalogKinds = MOTION_BLOCK_CATALOG.map((entry) => entry.kind);
  const addableEntries = MOTION_BLOCK_CATALOG.filter(
    (entry) => !isMotionEventBlockKind(entry.kind),
  );
  const representedCategories = new Set(
    MOTION_BLOCK_CATALOG.map((entry) => entry.category),
  );

  assert.equal(MOTION_BLOCK_CATALOG.length, 170);
  assert.equal(new Set(catalogKinds).size, 170);
  assert.equal(addableEntries.length, 164);
  assert.equal(MOTION_BLOCK_KINDS.length, 170);
  assert.equal(new Set(MOTION_BLOCK_KINDS).size, 170);
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
    assert.deepEqual(block.children, []);
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

void test('motion event registry exposes six fixed zero-duration hats', () => {
  assert.deepEqual(MOTION_EVENT_BLOCK_KINDS, [
    'page-open',
    'element-appear',
    'element-tap',
    'element-hover',
    'animation-finish',
    'scene-enter',
  ]);
  assert.equal(isMotionEventBlockKind('page-open'), true);
  assert.equal(isMotionEventBlockKind('scene-enter'), true);
  assert.equal(isMotionEventBlockKind('move'), false);
  assert.equal(isMotionEventBlockKind(null), false);

  const expectedLabels = [
    'When page opens',
    'When element appears',
    'When tapped',
    'When hovered',
    'When another animation finishes',
    'When reader scrolls into section',
  ];
  const eventEntries = MOTION_BLOCK_CATALOG.filter(
    (entry) => entry.category === 'event',
  );
  assert.deepEqual(
    eventEntries.map((entry) => entry.kind),
    [...MOTION_EVENT_BLOCK_KINDS],
  );
  assert.deepEqual(
    eventEntries.map((entry) => entry.label),
    expectedLabels,
  );
  assert.equal(
    eventEntries.every((entry) => entry.durationMs === 0),
    true,
  );
});

void test('replaceMotionEvent preserves one fixed hat and every action', () => {
  const event = createMotionBlock('scene-enter', 'event');
  const move = createMotionBlock('move', 'move');
  const wait = createMotionBlock('wait', 'wait');
  const source = [event, move, wait];

  for (const eventKind of MOTION_EVENT_BLOCK_KINDS) {
    const replaced = replaceMotionEvent(source, eventKind);
    assert.notEqual(replaced, source);
    assert.equal(replaced[0].kind, eventKind);
    assert.equal(replaced[0].id, event.id);
    assert.equal(replaced[1], move);
    assert.equal(replaced[2], wait);
    assert.deepEqual(source, [event, move, wait]);
  }

  const chained = replaceMotionEvent(source, 'animation-finish');
  assert.equal(chained[0].sourceElementId, null);
  chained[0].sourceElementId = 'source-layer';
  const retained = replaceMotionEvent(chained, 'animation-finish');
  assert.equal(retained[0], chained[0]);
  assert.equal(retained[0].sourceElementId, 'source-layer');
  const changedAway = replaceMotionEvent(chained, 'page-open');
  assert.equal(changedAway[0].sourceElementId, null);
  assert.equal(changedAway[1], move);
  assert.equal(changedAway[2], wait);

  const invalid = [move, wait];
  assert.deepEqual(replaceMotionEvent(invalid, 'page-open'), invalid);
  assert.notEqual(replaceMotionEvent(invalid, 'page-open'), invalid);
});

void test('all six event triggers survive restore and compile without becoming steps', () => {
  for (const eventKind of MOTION_EVENT_BLOCK_KINDS) {
    const project = createDefaultProject();
    const element = project.chapters[0].scenes[0].elements[0];
    element.motion.event = 'scene-enter';
    const eventBlock = createMotionBlock(eventKind, `event-${eventKind}`);
    if (eventKind === 'animation-finish') {
      eventBlock.sourceElementId = project.chapters[0].scenes[0].elements[1].id;
    }
    element.motion.blocks = [
      eventBlock,
      createMotionBlock('move', `move-${eventKind}`),
    ];

    const restored = restoreProject(JSON.stringify(project));
    assert.ok(restored);
    const restoredElement = restored.chapters[0].scenes[0].elements[0];
    assert.equal(restoredElement.motion.event, eventKind);
    assert.equal(restoredElement.motion.blocks[0].kind, eventKind);
    const compiled = compileElementMotion(restoredElement);
    assert.equal(compiled.event, eventKind);
    assert.equal(
      compiled.eventSourceElementId,
      eventKind === 'animation-finish'
        ? project.chapters[0].scenes[0].elements[1].id
        : null,
    );
    assert.deepEqual(
      compiled.steps.map((step) => step.kind),
      ['move'],
    );
  }
});

void test('animation-finish source IDs normalize safely and remain recoverable', () => {
  const project = createDefaultProject();
  const element = project.chapters[0].scenes[0].elements[0];
  const sourceId = project.chapters[0].scenes[0].elements[1].id;
  const eventBlock = createMotionBlock('animation-finish', 'event-chain');
  eventBlock.sourceElementId = `  ${sourceId}  `;
  element.motion.blocks = [eventBlock, createMotionBlock('move', 'move')];

  const restored = restoreProject(JSON.stringify(project));
  assert.ok(restored);
  assert.equal(
    restored.chapters[0].scenes[0].elements[0].motion.blocks[0].sourceElementId,
    sourceId,
  );

  const missing = structuredClone(project);
  missing.chapters[0].scenes[0].elements[0].motion.blocks[0].sourceElementId =
    'deleted-layer';
  assert.ok(restoreProject(JSON.stringify(missing)));

  const malformed = structuredClone(project);
  malformed.chapters[0].scenes[0].elements[0].motion.blocks[0].sourceElementId =
    'x'.repeat(MAX_MOTION_EVENT_SOURCE_ID_LENGTH + 1);
  assert.equal(
    restoreProjectWithError(JSON.stringify(malformed)).error,
    'Project contains an invalid animation source layer',
  );

  const oversizedLayerId = structuredClone(project);
  oversizedLayerId.chapters[0].scenes[0].elements[1].id = 'x'.repeat(
    MAX_ELEMENT_ID_LENGTH + 1,
  );
  oversizedLayerId.chapters[0].scenes[0].elements[0].motion.blocks[0].sourceElementId =
    null;
  assert.equal(
    restoreProjectWithError(JSON.stringify(oversizedLayerId)).error,
    'Project chapter 1 contains an invalid layer',
  );
});

void test('animation-finish dependency checks reject self and transitive cycles', () => {
  const project = createDefaultProject();
  const elements = project.chapters[0].scenes[0].elements.slice(0, 3);
  const [first, second, third] = elements;
  assert.ok(first && second && third);

  second.motion.blocks = replaceMotionEvent(
    second.motion.blocks,
    'animation-finish',
  );
  second.motion.blocks[0].sourceElementId = first.id;
  third.motion.blocks = replaceMotionEvent(
    third.motion.blocks,
    'animation-finish',
  );
  third.motion.blocks[0].sourceElementId = second.id;

  assert.equal(
    wouldCreateAnimationFinishCycle(elements, first.id, first.id),
    true,
  );
  assert.equal(
    wouldCreateAnimationFinishCycle(elements, first.id, third.id),
    true,
  );
  assert.equal(
    wouldCreateAnimationFinishCycle(elements, third.id, first.id),
    false,
  );
  assert.equal(
    wouldCreateAnimationFinishCycle(elements, first.id, 'deleted-layer'),
    false,
  );
});

void test('motion action helpers reject every event kind', () => {
  const program = [
    createMotionBlock('element-hover', 'event'),
    createMotionBlock('move', 'move'),
  ];
  for (const eventKind of MOTION_EVENT_BLOCK_KINDS) {
    assert.deepEqual(
      insertMotionActionBefore(
        program,
        createMotionBlock(eventKind, `extra-${eventKind}`),
      ),
      program,
    );
  }
  assert.deepEqual(reorderMotionActionBefore(program, 'event'), program);
  assert.deepEqual(
    reorderMotionActionBefore(program, 'move', 'event'),
    program,
  );
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
  const element = project.chapters[0].scenes[0].elements[0];
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
  const restoredElement = restored.chapters[0].scenes[0].elements[0];
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
  eventOnlyProject.chapters[0].scenes[0].elements[0].motion.blocks = [
    createMotionBlock('scene-enter', 'event-only'),
  ];

  const restoredEventOnly = restoreProject(JSON.stringify(eventOnlyProject));

  assert.ok(restoredEventOnly);
  assert.deepEqual(
    restoredEventOnly.chapters[0].scenes[0].elements[0].motion.blocks.map(
      (block) => [block.id, block.kind],
    ),
    [['event-only', 'scene-enter']],
  );

  const duplicateEventProject = createDefaultProject();
  duplicateEventProject.chapters[0].scenes[0].elements[0].motion.blocks = [
    createMotionBlock('scene-enter', 'event-first'),
    createMotionBlock('wait', 'wait-between-events'),
    createMotionBlock('scene-enter', 'event-duplicate'),
  ];

  const restoredDuplicateEvents = restoreProject(
    JSON.stringify(duplicateEventProject),
  );

  assert.ok(restoredDuplicateEvents);
  const normalizedDuplicateBlocks =
    restoredDuplicateEvents.chapters[0].scenes[0].elements[0].motion.blocks;
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
  maximumProgramProject.chapters[0].scenes[0].elements[0].motion.blocks =
    Array.from({ length: MAX_MOTION_BLOCKS }, (_, index) =>
      createMotionBlock('wait', `maximum-wait-${index + 1}`),
    );

  const restoredMaximumProgram = restoreProject(
    JSON.stringify(maximumProgramProject),
  );

  assert.ok(restoredMaximumProgram);
  const maximumBlocks =
    restoredMaximumProgram.chapters[0].scenes[0].elements[0].motion.blocks;
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
    const element = createDefaultProject().chapters[0].scenes[0].elements[0];
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
    if (
      isMotionEventBlockKind(entry.kind) ||
      isMotionContainerBlockKind(entry.kind)
    )
      continue;
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
    const element = createDefaultProject().chapters[0].scenes[0].elements[0];
    const block = createMotionBlock(entry.kind, `boundary-${entry.kind}`);
    block[field] = normalizeMotionBlockNumericField(block, field, value);
    element.motion.blocks = [
      createMotionBlock('scene-enter', 'boundary-event'),
      block,
    ];
    return JSON.stringify(compileElementMotion(element).keyframes);
  };

  for (const entry of MOTION_BLOCK_CATALOG) {
    if (isMotionContainerBlockKind(entry.kind)) continue;
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
        project.chapters[0].scenes[0].elements[0].motion.blocks = [
          createMotionBlock('scene-enter', 'restore-event'),
          boundaryBlock,
        ];
        const restored = restoreProject(JSON.stringify(project));
        assert.ok(restored);
        assert.equal(
          restored.chapters[0].scenes[0].elements[0].motion.blocks[1][
            parameter.field
          ],
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
    if (
      isMotionEventBlockKind(entry.kind) ||
      isMotionContainerBlockKind(entry.kind)
    )
      continue;

    const element = createDefaultProject().chapters[0].scenes[0].elements[0];
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

void test('motion schema 1 programs migrate to recursive schema 2 without changing leaves', () => {
  const project = createDefaultProject();
  const element = project.chapters[0].scenes[0].elements[0];
  const event = createMotionBlock('scene-enter', 'legacy-event');
  const move = createMotionBlock('move', 'legacy-move');
  move.x = 245;
  move.durationMs = 640;
  element.motion.blocks = [event, move];

  const legacyMotion = element.motion as unknown as Record<string, unknown>;
  legacyMotion.schemaVersion = 1;
  for (const block of legacyMotion.blocks as Array<Record<string, unknown>>) {
    delete block.children;
  }

  const restored = restoreProject(JSON.stringify(project));
  assert.ok(restored);
  const restoredMotion = restored.chapters[0].scenes[0].elements[0].motion;
  assert.equal(restoredMotion.schemaVersion, MOTION_SCHEMA_VERSION);
  assert.deepEqual(
    restoredMotion.blocks.map((block) => [
      block.id,
      block.kind,
      block.children,
    ]),
    [
      ['legacy-event', 'scene-enter', []],
      ['legacy-move', 'move', []],
    ],
  );
  assert.equal(restoredMotion.blocks[1].x, 245);
  assert.equal(restoredMotion.blocks[1].durationMs, 640);
});

void test('repeat schedules finite nested blocks in order with stable instances', () => {
  const element = createDefaultProject().chapters[0].scenes[0].elements[0];
  const repeat = createMotionBlock('repeat', 'repeat-three');
  repeat.repetitions = 3;
  const move = createMotionBlock('move', 'repeat-move');
  move.durationMs = 100;
  const wait = createMotionBlock('wait', 'repeat-wait');
  wait.durationMs = 50;
  repeat.children = [move, wait];
  const rotate = createMotionBlock('rotate', 'after-repeat');
  rotate.durationMs = 200;
  element.motion.blocks = [
    createMotionBlock('scene-enter', 'repeat-event'),
    repeat,
    rotate,
  ];

  const first = compileElementMotion(element);
  const second = compileElementMotion(element);
  assert.equal(first.sequenceDurationMs, 650);
  assert.deepEqual(
    first.steps.map((step) => [step.kind, step.startsAtMs, step.durationMs]),
    [
      ['move', 0, 100],
      ['wait', 100, 50],
      ['move', 150, 100],
      ['wait', 250, 50],
      ['move', 300, 100],
      ['wait', 400, 50],
      ['rotate', 450, 200],
    ],
  );
  assert.equal(new Set(first.steps.map((step) => step.instanceId)).size, 7);
  assert.deepEqual(first, second);
});

void test('repeat visibly resets and replays absolute entry effects', () => {
  const element = createDefaultProject().chapters[0].scenes[0].elements[0];
  const repeat = createMotionBlock('repeat', 'repeat-opacity');
  repeat.repetitions = 2;
  const opacity = createMotionBlock('opacity', 'repeat-opacity-child');
  opacity.value = 0;
  opacity.durationMs = 200;
  repeat.children = [opacity];
  element.motion.blocks = [
    createMotionBlock('scene-enter', 'repeat-opacity-event'),
    repeat,
  ];

  const compiled = compileElementMotion(element);
  assert.equal(compiled.sequenceDurationMs, 400);
  assert.equal(compiled.steps.length, 2);
  const boundaryFrames = compiled.keyframes.filter(
    (frame) => frame.offset === 0.5,
  );
  assert.ok(boundaryFrames.some((frame) => frame.opacity === element.opacity));
  assert.ok(boundaryFrames.some((frame) => frame.opacity === 0));
});

void test('run together merges compatible channels into one exact shared tween', () => {
  const element = createDefaultProject().chapters[0].scenes[0].elements[0];
  const parallel = createMotionBlock('parallel', 'parallel-pair');
  const move = createMotionBlock('move', 'parallel-move');
  const opacity = createMotionBlock('opacity', 'parallel-opacity');
  move.durationMs = 400;
  opacity.durationMs = 400;
  move.easing = 'ease-in-out';
  opacity.easing = 'ease-in-out';
  parallel.children = [move, opacity];
  element.motion.blocks = [
    createMotionBlock('scene-enter', 'parallel-event'),
    parallel,
  ];

  const compiled = compileElementMotion(element);
  assert.equal(compiled.sequenceDurationMs, 400);
  assert.deepEqual(
    compiled.steps.map((step) => [step.kind, step.startsAtMs, step.durationMs]),
    [
      ['move', 0, 400],
      ['opacity', 0, 400],
    ],
  );
  assert.equal(compiled.keyframes[0].translateX, -move.x);
  assert.equal(compiled.keyframes[0].opacity, opacity.value);
  assert.equal(compiled.keyframes.at(-1)?.translateX, 0);
  assert.equal(compiled.keyframes.at(-1)?.opacity, element.opacity);
});

void test('run together rejects conflicts and mismatched timing during import', () => {
  const project = createDefaultProject();
  const element = project.chapters[0].scenes[0].elements[0];
  const parallel = createMotionBlock('parallel', 'invalid-parallel');
  const firstMove = createMotionBlock('move', 'first-move');
  const secondMove = createMotionBlock('move', 'second-move');
  parallel.children = [firstMove, secondMove];
  element.motion.blocks = [
    createMotionBlock('scene-enter', 'invalid-parallel-event'),
    parallel,
  ];
  assert.equal(
    restoreProjectWithError(JSON.stringify(project)).error,
    'Project contains an invalid parallel animation group',
  );

  parallel.children = [
    firstMove,
    { ...createMotionBlock('opacity', 'mismatched-opacity'), durationMs: 900 },
  ];
  assert.equal(
    restoreProjectWithError(JSON.stringify(project)).error,
    'Parallel blocks must use the same time and easing',
  );
});

void test('recursive motion programs round-trip without sharing child objects', () => {
  const project = createDefaultProject();
  const element = project.chapters[0].scenes[0].elements[0];
  const repeat = createMotionBlock('repeat', 'roundtrip-repeat');
  const parallel = createMotionBlock('parallel', 'roundtrip-parallel');
  parallel.children = [
    createMotionBlock('move', 'roundtrip-move'),
    createMotionBlock('opacity', 'roundtrip-opacity'),
  ];
  repeat.children = [parallel];
  element.motion.blocks = [
    createMotionBlock('scene-enter', 'roundtrip-event'),
    repeat,
  ];

  const restored = restoreProject(JSON.stringify(project));
  assert.ok(restored);
  const restoredRepeat =
    restored.chapters[0].scenes[0].elements[0].motion.blocks[1];
  assert.deepEqual(restoredRepeat, repeat);
  assert.notEqual(restoredRepeat, repeat);
  assert.notEqual(restoredRepeat.children[0], parallel);
  assert.notEqual(restoredRepeat.children[0].children[0], parallel.children[0]);
});

void test('nested runtime estimates stop high-cycle repeats before reader work explodes', () => {
  const element = createDefaultProject().chapters[0].scenes[0].elements[0];
  const outer = createMotionBlock('repeat', 'budget-outer');
  const inner = createMotionBlock('repeat', 'budget-inner');
  const orbit = createMotionBlock('orbit', 'budget-orbit');
  outer.repetitions = 20;
  inner.repetitions = 20;
  orbit.repetitions = 20;
  orbit.durationMs = 100;
  inner.children = [orbit];
  outer.children = [inner];
  element.motion.blocks = [
    createMotionBlock('scene-enter', 'budget-event'),
    outer,
  ];

  assert.equal(getExpandedMotionStepCount(element.motion.blocks), 400);
  assert.ok(
    getCompiledMotionKeyframeEstimate(element.motion.blocks) >
      MAX_COMPILED_MOTION_KEYFRAMES,
  );
  assert.equal(
    getMotionProgramRuntimeIssue(element.motion.blocks),
    'keyframes',
  );
  assert.ok(
    compileElementMotion(element).keyframes.length <=
      MAX_COMPILED_MOTION_KEYFRAMES,
  );
});

void test('keyframe estimates conservatively cover every catalog leaf and repeat', () => {
  for (const catalogEntry of MOTION_BLOCK_CATALOG) {
    if (
      isMotionEventBlockKind(catalogEntry.kind) ||
      isMotionContainerBlockKind(catalogEntry.kind)
    ) {
      continue;
    }
    const element = createDefaultProject().chapters[0].scenes[0].elements[0];
    const repeat = createMotionBlock('repeat', `estimate-${catalogEntry.kind}`);
    const block = createMotionBlock(
      catalogEntry.kind,
      `estimate-${catalogEntry.kind}-child`,
    );
    block.repetitions = 20;
    repeat.repetitions = 13;
    repeat.children = [block];
    element.motion.blocks = [
      createMotionBlock('scene-enter', `estimate-${catalogEntry.kind}-event`),
      repeat,
    ];

    const estimate = getCompiledMotionKeyframeEstimate(element.motion.blocks);
    const actual = compileElementMotion(element).keyframes.length;
    assert.ok(
      estimate >= actual,
      `${catalogEntry.kind} estimated ${estimate} frames but compiled ${actual}`,
    );
  }
});

void test('runtime duration budget rejects new truncated repeats and flags publication', () => {
  const project = createDefaultProject();
  const element = project.chapters[0].scenes[0].elements[0];
  const event = createMotionBlock('scene-enter', 'duration-budget-event');
  const repeat = createMotionBlock('repeat', 'duration-budget-repeat');
  const move = createMotionBlock('move', 'duration-budget-move');
  repeat.repetitions = 20;
  move.durationMs = 10_000;
  repeat.children = [move];

  assert.ok(
    getMotionProgramDurationMs([event, repeat]) >
      MAX_COMPILED_MOTION_DURATION_MS,
  );
  assert.equal(getMotionProgramRuntimeIssue([event, repeat]), 'duration');
  assert.deepEqual(insertMotionActionBefore([event], repeat), [event]);

  element.motion.blocks = [event, repeat];
  assert.ok(
    getPublicationReadiness(project).issues.includes(
      'Shorten a motion program to 60 seconds or less',
    ),
  );
});

void test('legacy flat programs beyond the new runtime budget still restore safely', () => {
  const project = createDefaultProject();
  const element = project.chapters[0].scenes[0].elements[0];
  element.motion.blocks = [
    createMotionBlock('scene-enter', 'legacy-budget-event'),
    ...Array.from({ length: 7 }, (_, index) => {
      const move = createMotionBlock('move', `legacy-budget-${index}`);
      move.durationMs = 10_000;
      return move;
    }),
  ];
  const legacyMotion = element.motion as unknown as Record<string, unknown>;
  legacyMotion.schemaVersion = 1;
  for (const block of legacyMotion.blocks as Array<Record<string, unknown>>) {
    delete block.children;
  }

  const restored = restoreProject(JSON.stringify(project));
  assert.ok(restored);
  const restoredElement = restored.chapters[0].scenes[0].elements[0];
  assert.equal(restoredElement.motion.schemaVersion, MOTION_SCHEMA_VERSION);
  assert.equal(restoredElement.motion.blocks.length, 8);
  assert.equal(
    compileElementMotion(restoredElement).sequenceDurationMs,
    MAX_COMPILED_MOTION_DURATION_MS,
  );
  const partiallyRepaired = structuredClone(restoredElement.motion.blocks);
  partiallyRepaired[1].durationMs = 100;
  assert.equal(getMotionProgramDurationMs(partiallyRepaired), 60_100);
  assert.equal(getMotionProgramRuntimeIssue(partiallyRepaired), 'duration');
  partiallyRepaired[2].durationMs = 100;
  assert.equal(getMotionProgramRuntimeIssue(partiallyRepaired), null);
});

void test('parallel container timing normalizes to its retained child timing', () => {
  const project = createDefaultProject();
  const element = project.chapters[0].scenes[0].elements[0];
  const parallel = createMotionBlock('parallel', 'timing-parallel');
  const move = createMotionBlock('move', 'timing-move');
  const opacity = createMotionBlock('opacity', 'timing-opacity');
  parallel.durationMs = 700;
  move.durationMs = 900;
  opacity.durationMs = 900;
  parallel.children = [move, opacity];
  element.motion.blocks = [
    createMotionBlock('scene-enter', 'timing-event'),
    parallel,
  ];

  const restored = restoreProject(JSON.stringify(project));
  assert.ok(restored);
  const restoredParallel =
    restored.chapters[0].scenes[0].elements[0].motion.blocks[1];
  assert.equal(restoredParallel.durationMs, 900);
  assert.equal(
    compileElementMotion(restored.chapters[0].scenes[0].elements[0])
      .sequenceDurationMs,
    900,
  );
});

void test('compiled offsets never decrease across repeated fractional beats', () => {
  const element = createDefaultProject().chapters[0].scenes[0].elements[0];
  const repeat = createMotionBlock('repeat', 'offset-repeat');
  const silhouette = createMotionBlock('silhouette', 'offset-silhouette');
  const ladder = createMotionBlock('ladder-up', 'offset-ladder');
  const glow = createMotionBlock('glow', 'offset-glow');
  repeat.repetitions = 13;
  silhouette.durationMs = 1_501;
  silhouette.repetitions = 11;
  repeat.children = [silhouette];
  ladder.durationMs = 7_361;
  ladder.repetitions = 7;
  glow.durationMs = 4_057;
  glow.repetitions = 11;
  element.motion.blocks = [
    createMotionBlock('scene-enter', 'offset-event'),
    repeat,
    ladder,
    glow,
  ];

  const offsets = compileElementMotion(element).keyframes.map(
    (frame) => frame.offset,
  );
  assert.ok(offsets.every(Number.isFinite));
  assert.ok(
    offsets.every(
      (offset, index) => index === 0 || offset >= offsets[index - 1],
    ),
  );
});

void test('path, filter, flip, and transition blocks retain representative semantics', () => {
  const compileDefault = (kind: (typeof MOTION_BLOCK_KINDS)[number]) => {
    const element = createDefaultProject().chapters[0].scenes[0].elements[0];
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
  const element = createDefaultProject().chapters[0].scenes[0].elements[0];
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
  const element = createDefaultProject().chapters[0].scenes[0].elements[0];
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
  const element = createDefaultProject().chapters[0].scenes[0].elements[0];
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
  const element = createDefaultProject().chapters[0].scenes[0].elements[0];
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
    const element = createDefaultProject().chapters[0].scenes[0].elements[0];
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
  const element = createDefaultProject().chapters[0].scenes[0].elements[0];
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
  const element = createDefaultProject().chapters[0].scenes[0].elements[0];
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
    chapters: Array<{
      scenes: Array<{
        elements: Array<{
          motion: { blocks: Array<Record<string, unknown>> };
        }>;
      }>;
    }>;
  };
  candidate.chapters[0].scenes[0].elements[0].motion.blocks = [
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
  const blocks = restored.chapters[0].scenes[0].elements[0].motion.blocks;
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
  candidate.chapters[0].scenes[0].elements[0].motion.blocks = [
    createMotionBlock('scene-enter', 'event'),
    bounce,
  ];

  assert.equal(
    restoreProjectWithError(JSON.stringify(candidate)).error,
    'Project contains an invalid bounce sequence',
  );
});

void test('version 2 drafts migrate without losing scenes or element motion', () => {
  const legacy = createLegacyProject(2);
  legacy.title = 'Recovered legacy draft';
  const legacyMotion = legacy.scenes[0].elements[0].motion as unknown as Record<
    string,
    unknown
  >;
  delete legacyMotion.delayMs;
  delete legacyMotion.fromScale;
  delete legacyMotion.fromRotation;
  delete legacyMotion.schemaVersion;
  delete legacyMotion.event;

  const restored = restoreProject(JSON.stringify(legacy));

  assert.ok(restored);
  assert.equal(restored.schemaVersion, PROJECT_SCHEMA_VERSION);
  assert.equal(restored.title, 'Recovered legacy draft');
  assert.equal(restored.chapters[0].scenes.length, 3);
  assert.equal(
    restored.chapters[0].scenes[0].elements[0].motion.schemaVersion,
    MOTION_SCHEMA_VERSION,
  );
  assert.equal(
    restored.chapters[0].scenes[0].elements[0].motion.event,
    'scene-enter',
  );
  assert.equal(restored.chapters[0].scenes[0].elements[0].motion.delayMs, 0);
  assert.equal(restored.chapters[0].scenes[0].elements[0].motion.fromScale, 1);
  assert.equal(
    restored.chapters[0].scenes[0].elements[0].motion.fromRotation,
    0,
  );
  assert.equal(
    restored.chapters[0].scenes[0].elements[0].motion.blocks[0].kind,
    'scene-enter',
  );
  assert.ok(
    restored.chapters[0].scenes[0].elements[0].motion.blocks.some(
      (block) => block.kind === 'move',
    ),
  );
});

void test('version 6 drafts and publication revisions migrate losslessly into one chapter', () => {
  const source = createDefaultProject();
  const revision = createPublicationRevision(
    source,
    '2026-08-30T01:00:00.000Z',
  );
  source.publications = [revision];
  source.publishedRevision = revision.revision;
  const legacy = createLegacyProject(6, source);

  const restored = restoreProject(JSON.stringify(legacy));

  assert.ok(restored);
  assert.equal(restored.schemaVersion, PROJECT_SCHEMA_VERSION);
  assert.equal(restored.format, 'vertical-scroll');
  assert.equal(restored.chapters.length, 1);
  assert.equal(restored.chapters[0].title, source.chapters[0].title);
  assert.deepEqual(
    getProjectScenes(restored).map((scene) => scene.id),
    getProjectScenes(source).map((scene) => scene.id),
  );
  assert.equal(restored.publications.length, 1);
  assert.equal(restored.publications[0].format, 'vertical-scroll');
  assert.equal(
    restored.publications[0].chapters[0].title,
    revision.chapters[0].title,
  );
  assert.deepEqual(
    getProjectScenes(restored.publications[0]).map((scene) => scene.id),
    getProjectScenes(revision).map((scene) => scene.id),
  );
});

void test('nested version 7 projects round-trip chapters, format, cover, and revisions', () => {
  const project = createDefaultProject();
  const secondChapter = createBlankChapter({
    id: 'signal-in-the-fog-chapter-2',
    sceneId: 'scene-4',
    title: 'Chapter 2 · The Return',
  });
  project.chapters.push(secondChapter);
  project.format = 'page';
  project.coverSceneId = 'scene-4';
  const revision = createPublicationRevision(
    project,
    '2026-08-30T02:00:00.000Z',
  );
  revision.creatorName = 'Revision creator';
  project.publications = [revision];
  project.publishedRevision = revision.revision;
  const version7Project = createVersion7Project(project);

  const restored = restoreProject(JSON.stringify(version7Project));

  assert.ok(restored);
  assert.equal(restored.schemaVersion, PROJECT_SCHEMA_VERSION);
  assert.equal(restored.format, 'page');
  assert.equal(restored.coverSceneId, 'scene-4');
  assert.deepEqual(
    restored.chapters.map((chapter) => chapter.id),
    project.chapters.map((chapter) => chapter.id),
  );
  assert.deepEqual(restored.metadata, migratedMetadataFor(project.creatorName));
  assert.deepEqual(
    restored.publications[0].metadata,
    migratedMetadataFor('Revision creator'),
  );
  assert.notEqual(restored.chapters, project.chapters);
  assert.notEqual(restored.publications[0].chapters, project.chapters);
});

void test('versions 2 through 7 receive honest metadata defaults per revision', () => {
  for (const version of [2, 3, 4, 5, 6, 7] as const) {
    const source = createDefaultProject();
    source.creatorName = `Draft creator v${version}`;
    const revision = createPublicationRevision(source);
    revision.creatorName = `Revision creator v${version}`;
    source.publications = [revision];
    source.publishedRevision = revision.revision;
    const legacy =
      version === 7
        ? createVersion7Project(source)
        : createLegacyProject(version, source);

    const restored = restoreProject(JSON.stringify(legacy));

    assert.ok(restored);
    assert.deepEqual(
      restored.metadata,
      migratedMetadataFor(`Draft creator v${version}`),
    );
    assert.deepEqual(
      restored.publications[0].metadata,
      migratedMetadataFor(`Revision creator v${version}`),
    );
  }
});

void test('version 8 metadata round-trips, repairs the creator alias, and stays independent', () => {
  const project = createDefaultProject();
  project.creatorName = 'Stale creator alias';
  project.metadata = {
    contributorNames: ['Lead Creator', 'Co Creator'],
    workStatus: 'hiatus',
    origin: 'external-fanwork',
    sourceWorkSlug: null,
    sourceTitle: 'The External Source',
    sourceCreator: 'Original Rights Holder',
    fandom: 'Source Fandom',
    genres: ['Drama', 'Mystery'],
    characters: ['A', 'B'],
    relationships: ['A / B'],
    themes: ['Memory'],
    contentWarnings: ['Flashing lights'],
    communityLinks: ['Experimental comics'],
  };
  const revision = createPublicationRevision(project);
  project.publications = [revision];
  project.publishedRevision = revision.revision;

  const restored = restoreProject(JSON.stringify(project));

  assert.ok(restored);
  assert.equal(restored.creatorName, 'Lead Creator');
  assert.equal(restored.publications[0].creatorName, 'Lead Creator');
  assert.deepEqual(restored.metadata, project.metadata);
  assert.deepEqual(restored.publications[0].metadata, revision.metadata);
  restored.metadata.characters.push('C');
  assert.deepEqual(restored.publications[0].metadata.characters, ['A', 'B']);
});

void test('version 8 rejects malformed project and publication metadata', () => {
  const malformedProjects: unknown[] = [];
  const missingMetadata = createDefaultProject() as unknown as Record<
    string,
    unknown
  >;
  delete missingMetadata.metadata;
  malformedProjects.push(missingMetadata);

  const badStatus = createDefaultProject();
  (badStatus.metadata as unknown as Record<string, unknown>).workStatus =
    'paused';
  malformedProjects.push(badStatus);

  const duplicateContributors = createDefaultProject();
  duplicateContributors.metadata.contributorNames = ['Bahar', ' bahar '];
  malformedProjects.push(duplicateContributors);

  const illegalSourceLink = createDefaultProject();
  illegalSourceLink.metadata.sourceWorkSlug = 'another-work';
  malformedProjects.push(illegalSourceLink);

  for (const malformed of malformedProjects) {
    assert.match(
      restoreProjectWithError(JSON.stringify(malformed)).error ?? '',
      /^Project .+ metadata is invalid$|^Project source work relationship is invalid$/,
    );
  }

  const revisionProject = createDefaultProject();
  const revision = createPublicationRevision(revisionProject);
  revision.metadata.genres = ['Mystery', 'mystery'];
  revisionProject.publications = [revision];
  revisionProject.publishedRevision = revision.revision;
  assert.equal(
    restoreProjectWithError(JSON.stringify(revisionProject)).error,
    'Publication revision 1 work metadata is invalid',
  );
});

void test('nested project validation rejects malformed hierarchy and aggregate overflow', () => {
  const unsupportedFormat = createDefaultProject() as unknown as Record<
    string,
    unknown
  >;
  unsupportedFormat.format = 'book';
  assert.equal(
    restoreProjectWithError(JSON.stringify(unsupportedFormat)).error,
    'Project uses an unsupported format',
  );

  const emptyChapter = createDefaultProject();
  emptyChapter.chapters.push({
    id: 'empty-chapter',
    title: 'Empty',
    scenes: [],
  });
  assert.equal(
    restoreProjectWithError(JSON.stringify(emptyChapter)).error,
    'Project chapter 2 needs at least one scene',
  );

  const duplicateChapter = createDefaultProject();
  duplicateChapter.chapters.push(
    createBlankChapter({
      id: DEFAULT_CHAPTER_ID,
      sceneId: 'unique-scene',
      title: 'Duplicate ID',
    }),
  );
  assert.equal(
    restoreProjectWithError(JSON.stringify(duplicateChapter)).error,
    'Project has duplicate chapter IDs',
  );

  const duplicateScene = createDefaultProject();
  duplicateScene.chapters.push({
    id: 'second-chapter',
    title: 'Second',
    scenes: [structuredClone(duplicateScene.chapters[0].scenes[0])],
  });
  assert.equal(
    restoreProjectWithError(JSON.stringify(duplicateScene)).error,
    'Project chapter 2 has duplicate scene IDs',
  );

  const tooManyScenes = createBlankProject('many-scenes');
  const makeScene = (id: string) => ({
    id,
    name: id,
    background: '#111111',
    elements: [],
  });
  tooManyScenes.chapters[0].scenes = Array.from({ length: 60 }, (_, index) =>
    makeScene(`first-${index}`),
  );
  tooManyScenes.chapters.push({
    id: 'many-scenes-chapter-2',
    title: 'Second',
    scenes: Array.from({ length: 41 }, (_, index) =>
      makeScene(`second-${index}`),
    ),
  });
  assert.equal(
    restoreProjectWithError(JSON.stringify(tooManyScenes)).error,
    `Project has more than ${MAX_PROJECT_SCENES} scenes`,
  );

  const tooManyChapters = createBlankProject('many-chapters');
  tooManyChapters.chapters = Array.from(
    { length: MAX_PROJECT_CHAPTERS + 1 },
    (_, index) =>
      createBlankChapter({
        id: `chapter-${index}`,
        sceneId: `chapter-${index}-scene`,
        title: `Chapter ${index + 1}`,
      }),
  );
  assert.equal(
    restoreProjectWithError(JSON.stringify(tooManyChapters)).error,
    `Project has more than ${MAX_PROJECT_CHAPTERS} chapters`,
  );
});

void test('chapter helpers recover cross-chapter scenes, cover, order, and capacity', () => {
  const project = createDefaultProject();
  const secondChapter = createBlankChapter({
    id: 'chapter-2',
    sceneId: 'scene-4',
    title: 'Chapter 2',
  });
  project.chapters.push(secondChapter);

  assert.equal(findProjectScene(project, 'scene-4')?.chapter.id, 'chapter-2');
  assert.deepEqual(
    resolveEditorSelection(
      project,
      DEFAULT_CHAPTER_ID,
      'scene-4',
      'missing-layer',
    ),
    { chapterId: 'chapter-2', sceneId: 'scene-4', elementId: '' },
  );
  assert.equal(resolveProjectCoverSceneId(project, 'scene-4'), 'scene-4');
  assert.equal(resolveProjectCoverSceneId(project, 'missing'), 'scene-1');
  assert.deepEqual(
    reorderChapters(project.chapters, 'chapter-2', -1).map(
      (chapter) => chapter.id,
    ),
    ['chapter-2', DEFAULT_CHAPTER_ID],
  );
  assert.equal(canAddChapterToProject(project), true);

  project.chapters = Array.from({ length: MAX_PROJECT_CHAPTERS }, (_, index) =>
    createBlankChapter({
      id: `capacity-chapter-${index}`,
      sceneId: `capacity-scene-${index}`,
      title: `Chapter ${index + 1}`,
    }),
  );
  assert.equal(canAddChapterToProject(project), false);
});

void test('multi-chapter revisions snapshot, diff, and restore the whole work', () => {
  const project = createDefaultProject();
  project.chapters.push(
    createBlankChapter({
      id: 'chapter-2',
      sceneId: 'scene-4',
      title: 'Second chapter',
    }),
  );
  project.format = 'page';
  project.coverSceneId = 'scene-4';
  const revision = createPublicationRevision(project);
  project.publications = [revision];
  project.publishedRevision = revision.revision;
  assert.equal(hasUnpublishedChanges(project), false);

  project.chapters[1].title = 'Changed second chapter';
  project.format = 'vertical-scroll';
  assert.equal(hasUnpublishedChanges(project), true);

  const restored = restorePublicationToDraft(project, revision.id);
  assert.ok(restored);
  assert.equal(restored.format, 'page');
  assert.equal(restored.coverSceneId, 'scene-4');
  assert.equal(restored.chapters[1].title, 'Second chapter');
  assert.equal(getPublicationReadiness(restored).chapterCount, 2);
  assert.equal(getPublicationReadiness(restored).sceneCount, 4);
});

void test('reader presentation survives publication snapshot, diff, source, and restore flows', () => {
  const project = createDefaultProject();
  project.readerPresentation = {
    transition: 'slide',
    direction: 'rtl',
    durationMs: 725,
  };
  const revision = createPublicationRevision(
    project,
    '2026-08-31T08:00:00.000Z',
  );
  project.publications = [revision];
  project.publishedRevision = revision.revision;

  assert.deepEqual(revision.readerPresentation, {
    transition: 'slide',
    direction: 'rtl',
    durationMs: 725,
  });
  assert.notEqual(revision.readerPresentation, project.readerPresentation);
  assert.equal(hasUnpublishedChanges(project), false);

  project.readerPresentation.transition = 'book';
  project.readerPresentation.direction = 'ltr';
  project.readerPresentation.durationMs = 910;
  assert.equal(hasUnpublishedChanges(project), true);

  const draftSource = resolveReaderSource(project);
  const revisionSource = resolveReaderSource(project, revision);
  assert.deepEqual(draftSource.readerPresentation, {
    transition: 'book',
    direction: 'ltr',
    durationMs: 910,
  });
  assert.deepEqual(revisionSource.readerPresentation, {
    transition: 'slide',
    direction: 'rtl',
    durationMs: 725,
  });
  assert.notEqual(
    revisionSource.readerPresentation,
    revision.readerPresentation,
  );
  revisionSource.readerPresentation.durationMs = 1_100;
  assert.equal(revision.readerPresentation.durationMs, 725);

  const restored = restorePublicationToDraft(
    project,
    revision.id,
    '2026-08-31T08:30:00.000Z',
  );
  assert.ok(restored);
  assert.deepEqual(restored.readerPresentation, revision.readerPresentation);
  assert.notEqual(restored.readerPresentation, revision.readerPresentation);
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
    chapters: Array<{
      scenes: Array<{ elements: Array<Record<string, unknown>> }>;
    }>;
  };
  unsupportedLayer.chapters[0].scenes[0].elements[0].type = 'video';
  assert.equal(
    restoreProjectWithError(JSON.stringify(unsupportedLayer)).error,
    'Project chapter 1 contains an unsupported layer type',
  );

  const unsupportedMotion = createDefaultProject();
  unsupportedMotion.chapters[0].scenes[0].elements[0].motion.schemaVersion =
    3 as typeof MOTION_SCHEMA_VERSION;
  assert.equal(
    restoreProjectWithError(JSON.stringify(unsupportedMotion)).error,
    'Project uses an unsupported motion version',
  );

  const invalidBlocks = createDefaultProject();
  invalidBlocks.chapters[0].scenes[0].elements[0].motion.blocks.push({
    ...createMotionBlock('move', 'event'),
  });
  assert.equal(
    restoreProjectWithError(JSON.stringify(invalidBlocks)).error,
    'Project contains an invalid animation block program',
  );

  const unsafeImage = createDefaultProject();
  unsafeImage.chapters[0].scenes[0].elements.push({
    ...unsafeImage.chapters[0].scenes[0].elements[0],
    id: 'unsafe-image',
    type: 'image',
    src: 'https://tracker.example/private.png',
  });
  assert.equal(
    restoreProjectWithError(JSON.stringify(unsafeImage)).error,
    'Project chapter 1 contains an unsafe or oversized image source',
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

void test('project import rejects unsafe or unsupported publication revisions', () => {
  const project = createDefaultProject();
  const revision = createPublicationRevision(project);
  project.publications = [revision];

  const unsafe = structuredClone(project);
  unsafe.publications[0].revision = 1e300;
  assert.equal(
    restoreProjectWithError(JSON.stringify(unsafe)).error,
    'Project publication history is invalid',
  );

  const unsupported = structuredClone(project);
  unsupported.publications[0].revision = MAX_PUBLICATION_REVISION + 1;
  assert.equal(
    restoreProjectWithError(JSON.stringify(unsupported)).error,
    'Project publication history is invalid',
  );
});

void test('new publication IDs cannot collide with imported history', () => {
  const project = createDefaultProject();
  const first = createPublicationRevision(project);
  first.id = `${project.id}-revision-2`;
  project.publications = [first];
  project.publishedRevision = first.revision;

  const restored = restoreProject(JSON.stringify(project));
  assert.ok(restored);
  const second = createPublicationRevision(restored);
  assert.equal(second.revision, 2);
  assert.notEqual(second.id, first.id);

  restored.publications.push(second);
  restored.publishedRevision = second.revision;
  assert.ok(restoreProject(JSON.stringify(restored)));
});

void test('publication readiness blocks exhausted revision history', () => {
  const project = createDefaultProject();
  const revision = createPublicationRevision(project);
  revision.revision = MAX_PUBLICATION_REVISION;
  project.publications = [revision];
  project.publishedRevision = revision.revision;

  assert.deepEqual(getPublicationReadiness(project).issues, [
    'Publication history has reached its supported limit',
  ]);
  assert.throws(
    () => createPublicationRevision(project),
    /Publication history has reached its supported limit/,
  );
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
  project.metadata.characters.push('The Archivist');
  project.metadata.themes.push('Inheritance');
  project.chapters[0].scenes[0].elements[0].text = 'Changed draft scene';

  assert.equal(revision.revision, 1);
  assert.equal(revision.createdAt, '2026-08-29T00:00:00.000Z');
  assert.equal(revision.title, 'Signal in the Fog');
  assert.equal(revision.coverSceneId, 'scene-2');
  assert.deepEqual(revision.tags, ['science fiction', 'mystery']);
  assert.deepEqual(revision.metadata.characters, [
    'The Cartographer',
    'The Signal',
  ]);
  assert.deepEqual(revision.metadata.themes, ['Connection', 'Memory']);
  assert.equal(
    revision.chapters[0].scenes[0].elements[0].text,
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

  project.chapters[0].scenes[0].elements[0].text = 'A revised opening';
  assert.equal(hasUnpublishedChanges(project), true);

  project.chapters[0].scenes[0].elements[0].text =
    revision.chapters[0].scenes[0].elements[0].text;
  project.metadata.themes.push('Isolation');
  assert.equal(hasUnpublishedChanges(project), true);
  project.metadata.themes = [...revision.metadata.themes];
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
  project.metadata.themes.push('Isolation');
  project.chapters[0].scenes[0].name = 'Edited draft scene';

  const draftSource = resolveReaderSource(project);
  assert.equal(draftSource.mode, 'draft');
  assert.equal(draftSource.title, 'Edited draft title');
  assert.equal(draftSource.contentRating, 'mature');
  assert.equal(draftSource.coverSceneId, 'scene-1');
  assert.deepEqual(draftSource.metadata.themes, [
    'Connection',
    'Memory',
    'Isolation',
  ]);
  assert.equal(draftSource.chapters[0].scenes[0].name, 'Edited draft scene');

  const revisionSource = resolveReaderSource(project, revision);
  assert.equal(revisionSource.mode, 'revision');
  assert.equal(revisionSource.revision, 1);
  assert.equal(revisionSource.title, 'Signal in the Fog');
  assert.equal(revisionSource.contentRating, 'all-ages');
  assert.equal(revisionSource.coverSceneId, 'scene-1');
  assert.deepEqual(revisionSource.metadata.themes, ['Connection', 'Memory']);
  assert.equal(revisionSource.chapters[0].scenes[0].name, 'The signal');
  draftSource.metadata.themes.push('Reader-only mutation');
  assert.equal(project.metadata.themes.includes('Reader-only mutation'), false);
});

void test('publication readiness blocks untitled or invisible work', () => {
  const ready = getPublicationReadiness(createDefaultProject());
  assert.equal(ready.ready, true);
  assert.equal(ready.sceneCount, 3);
  assert.equal(ready.visibleLayerCount, 9);

  const blank = createBlankProject('empty-work');
  blank.metadata.workStatus = 'ongoing';
  blank.metadata.origin = 'original';
  blank.title = '   ';
  assert.deepEqual(getPublicationReadiness(blank).issues, [
    'Add a title for this work',
    'Add at least one visible layer',
  ]);

  blank.title = 'A visible beginning';
  blank.chapters[0].scenes[0].elements.push(
    createElement('shape', 1, { visible: false }),
  );
  assert.equal(getPublicationReadiness(blank).ready, false);
  blank.chapters[0].scenes[0].elements[0].visible = true;
  assert.equal(getPublicationReadiness(blank).ready, true);

  blank.coverSceneId = 'missing-scene';
  assert.deepEqual(getPublicationReadiness(blank).issues, [
    'Choose a cover scene',
  ]);
  blank.coverSceneId = blank.chapters[0].scenes[0].id;

  blank.title = 'x'.repeat(161);
  assert.deepEqual(getPublicationReadiness(blank).issues, [
    'Shorten the title to 160 characters',
  ]);
});

void test('publication readiness requires creator status and exact fanwork source context', () => {
  const project = createDefaultProject();
  project.metadata.contributorNames = [];
  project.metadata.workStatus = null;
  project.metadata.origin = null;
  assert.deepEqual(getPublicationReadiness(project).issues, [
    'Add at least one creator credit',
    'Choose a completion status',
    'Choose the work origin',
  ]);

  project.metadata.contributorNames = ['Bahar Yüksel'];
  project.metadata.workStatus = 'ongoing';
  project.metadata.origin = 'motus-fanwork';
  assert.deepEqual(getPublicationReadiness(project).issues, [
    'Choose the source Motus work',
  ]);
  project.metadata.origin = 'external-fanwork';
  assert.deepEqual(getPublicationReadiness(project).issues, [
    'Name the external source work',
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
  project.creatorName = 'Later creator';
  project.metadata.contributorNames = ['Later creator', 'Second creator'];
  project.metadata.genres = ['Drama'];
  project.coverSceneId = 'scene-3';
  project.chapters[0].scenes[0].elements[0].text = 'Later scene copy';

  const restored = restorePublicationToDraft(
    project,
    revision.id,
    '2026-08-29T01:00:00.000Z',
  );

  assert.ok(restored);
  assert.equal(restored.title, revision.title);
  assert.equal(restored.creatorName, revision.metadata.contributorNames[0]);
  assert.deepEqual(restored.metadata, revision.metadata);
  assert.equal(restored.coverSceneId, 'scene-2');
  assert.equal(
    restored.chapters[0].scenes[0].elements[0].text,
    revision.chapters[0].scenes[0].elements[0].text,
  );
  assert.equal(restored.updatedAt, '2026-08-29T01:00:00.000Z');
  assert.equal(restored.publishedRevision, 1);
  assert.equal(restored.publications.length, 1);
  restored.chapters[0].scenes[0].elements[0].text = 'Editable restored scene';
  assert.equal(
    revision.chapters[0].scenes[0].elements[0].text,
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

void test('adults-only ratings survive project and publication round trips', () => {
  const project = createDefaultProject();
  project.contentRating = 'adults-only';
  const revision = createPublicationRevision(
    project,
    '2026-08-29T02:00:00.000Z',
  );
  project.publications = [revision];
  project.publishedRevision = revision.revision;

  const restored = restoreProject(JSON.stringify(project));

  assert.ok(restored);
  assert.equal(restored.contentRating, 'adults-only');
  assert.equal(restored.publications[0].contentRating, 'adults-only');
});

void test('version 3 drafts receive safe publication defaults', () => {
  const legacy = createLegacyProject(3) as unknown as Record<string, unknown>;
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
    resolveEditorSelection(
      project,
      DEFAULT_CHAPTER_ID,
      'scene-2',
      'scene-2-orb',
    ),
    {
      chapterId: DEFAULT_CHAPTER_ID,
      sceneId: 'scene-2',
      elementId: 'scene-2-orb',
    },
  );
  assert.deepEqual(
    resolveEditorSelection(
      project,
      'deleted-chapter',
      'deleted-scene',
      'deleted-layer',
    ),
    {
      chapterId: DEFAULT_CHAPTER_ID,
      sceneId: 'scene-1',
      elementId: 'scene-1-speech',
    },
  );

  const blank = createBlankProject('blank');
  assert.deepEqual(
    resolveEditorSelection(blank, 'missing', 'missing', 'missing'),
    {
      chapterId: 'blank-chapter-1',
      sceneId: 'blank-scene-1',
      elementId: '',
    },
  );
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
  const scenes = createDefaultProject().chapters[0].scenes;
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
  const scenes = createDefaultProject().chapters[0].scenes;
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
  const scene = project.chapters[0].scenes[0];

  assert.equal(canAddSceneToProject(project), true);
  assert.equal(canAddElementToScene(scene), true);

  project.chapters[0].scenes = Array.from({ length: 100 }, () => scene);
  scene.elements = Array.from({ length: 500 }, () => scene.elements[0]);

  assert.equal(canAddSceneToProject(project), false);
  assert.equal(canAddElementToScene(scene), false);
});

void test('layer deletion selects the adjacent layer without mutating the list', () => {
  const elements = createDefaultProject().chapters[0].scenes[0].elements;
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
  const scene = createDefaultProject().chapters[0].scenes[0];
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

void test('rig hierarchy helpers preserve nested branches and reject cycles', () => {
  const body = createElement('group', 1, {
    id: 'body',
    x: 100,
    y: 200,
  });
  const head = createElement('group', 2, {
    id: 'head',
    parentId: body.id,
    x: 180,
    y: 260,
  });
  const hair = createElement('image', 3, {
    id: 'hair',
    parentId: head.id,
    x: 210,
    y: 250,
  });
  const elements = [body, head, hair];

  assert.deepEqual(getElementRigDescendantIds(elements, body.id), [
    head.id,
    hair.id,
  ]);
  assert.equal(getElementRigDepth(elements, hair.id), 2);
  assert.equal(wouldCreateElementRigCycle(elements, body.id, hair.id), true);
  assert.equal(wouldCreateElementRigCycle(elements, hair.id, body.id), false);

  const moved = translateElementRigBranch(elements, body.id, 30, -20);
  assert.deepEqual(
    moved.map(({ x, y }) => ({ x, y })),
    [
      { x: 130, y: 180 },
      { x: 210, y: 240 },
      { x: 240, y: 230 },
    ],
  );
  assert.deepEqual(
    elements.map(({ x, y }) => ({ x, y })),
    [
      { x: 100, y: 200 },
      { x: 180, y: 260 },
      { x: 210, y: 250 },
    ],
  );
});

void test('rig branch movement uses one bounded delta at canvas edges', () => {
  const body = createElement('group', 1, {
    id: 'edge-body',
    x: 0,
    y: 120,
    width: 200,
    height: 200,
  });
  const arm = createElement('shape', 2, {
    id: 'edge-arm',
    parentId: body.id,
    x: 400,
    y: 160,
    width: 100,
    height: 100,
  });

  const blockedLeft = translateElementRigBranch([body, arm], body.id, -50, 0);
  assert.deepEqual(
    blockedLeft.map(({ x, y }) => ({ x, y })),
    [
      { x: 0, y: 120 },
      { x: 400, y: 160 },
    ],
  );
  const movedRight = translateElementRigBranch([body, arm], body.id, 40, 0);
  assert.deepEqual(
    movedRight.map(({ x }) => x),
    [40, 440],
  );
});

void test('rig selection movement is bounded in rendered canvas space', () => {
  const rotatedParent = createElement('group', 1, {
    id: 'rotated-parent',
    x: 400,
    y: 400,
    width: 200,
    height: 200,
    rotation: 90,
  });
  const rotatedChild = createElement('shape', 2, {
    id: 'rotated-child',
    parentId: rotatedParent.id,
    x: 420,
    y: 0,
    width: 100,
    height: 100,
  });
  const childDetail = createElement('shape', 3, {
    id: 'child-detail',
    parentId: rotatedChild.id,
    x: 440,
    y: 20,
    width: 60,
    height: 60,
  });
  const edgeRoot = createElement('shape', 4, {
    id: 'edge-root',
    x: 1_010,
    y: 120,
    width: 60,
    height: 60,
  });
  const elements = [rotatedParent, rotatedChild, childDetail, edgeRoot];
  const beforeChildBounds = getElementRigRenderedVisualBounds(
    elements,
    rotatedChild.id,
  )!;

  const moved = translateElementRigSelectionByCanvasDelta(
    elements,
    [rotatedChild.id, childDetail.id, edgeRoot.id],
    20,
    0,
  );
  const movedParent = moved.find((element) => element.id === rotatedParent.id)!;
  const movedChild = moved.find((element) => element.id === rotatedChild.id)!;
  const movedDetail = moved.find((element) => element.id === childDetail.id)!;
  const movedRoot = moved.find((element) => element.id === edgeRoot.id)!;
  const afterChildBounds = getElementRigRenderedVisualBounds(
    moved,
    rotatedChild.id,
  )!;

  assert.strictEqual(movedParent, rotatedParent);
  assert.equal(rotatedChild.y, 0);
  assert.ok(Math.abs(movedChild.x - 420) < 1e-9);
  assert.ok(Math.abs(movedChild.y + 10) < 1e-9);
  assert.ok(Math.abs(movedDetail.x - 440) < 1e-9);
  assert.ok(Math.abs(movedDetail.y - 10) < 1e-9);
  assert.equal(movedRoot.x, 1_020);
  assert.ok(
    Math.abs(afterChildBounds.left - beforeChildBounds.left - 10) < 1e-9,
  );
  assert.ok(Math.abs(afterChildBounds.top - beforeChildBounds.top) < 1e-9);
  assert.equal(
    constrainElementToCanvas({ ...movedChild }).y,
    movedChild.y,
    'rigged authored coordinates survive normalization',
  );
});

void test('rig normalization clamps polygon points and drops degenerate masks', () => {
  assert.deepEqual(
    normalizeElementImageRigPart({
      sourceElementId: 'character',
      cropX: 100,
      cropY: 100,
      cropWidth: 100,
      cropHeight: 100,
      maskPoints: [
        { x: -10, y: 10 },
        { x: 50, y: -5 },
        { x: 110, y: 90 },
      ],
    }),
    {
      sourceElementId: 'character',
      cropX: 0,
      cropY: 0,
      cropWidth: 100,
      cropHeight: 90,
      maskPoints: [
        { x: 0, y: 10 },
        { x: 50, y: 0 },
        { x: 100, y: 90 },
      ],
    },
  );
  assert.deepEqual(
    normalizeElementImageRigPart({
      sourceElementId: 'character',
      cropX: 0,
      cropY: 0,
      cropWidth: 30,
      cropHeight: 30,
      maskPoints: [
        { x: 0, y: 0 },
        { x: 10, y: 10 },
        { x: 20, y: 20 },
      ],
    }),
    {
      sourceElementId: 'character',
      cropX: 0,
      cropY: 0,
      cropWidth: 30,
      cropHeight: 30,
    },
  );
});

void test('rig visibility, dependency closure, and cascade deletion stay coherent', () => {
  const source = createElement('image', 1, {
    id: 'rig-source',
    src: 'data:image/png;base64,iVBORw0KGgo=',
  });
  const hiddenHead = createElement('group', 2, {
    id: 'hidden-head',
    visible: false,
  });
  const hair = createElement('image', 3, {
    id: 'rig-hair',
    parentId: hiddenHead.id,
    imageRigPart: {
      sourceElementId: source.id,
      cropX: 10,
      cropY: 10,
      cropWidth: 20,
      cropHeight: 30,
    },
  });
  const visibleArm = createElement('image', 4, {
    id: 'rig-arm',
    parentId: null,
    imageRigPart: {
      sourceElementId: source.id,
      cropX: 60,
      cropY: 20,
      cropWidth: 20,
      cropHeight: 40,
    },
  });
  const elements = [source, hiddenHead, hair, visibleArm];

  assert.equal(isElementEffectivelyVisible(elements, hair.id), false);
  assert.equal(isElementEffectivelyVisible(elements, visibleArm.id), true);
  assert.deepEqual(
    getSceneThumbnailElements({ elements }, 1).map((element) => element.id),
    [source.id, visibleArm.id],
  );
  assert.deepEqual(getElementRigCascadeDeleteIds(elements, [source.id]), [
    source.id,
    hair.id,
    visibleArm.id,
  ]);
  assert.equal(getElementRigIntegrityIssue(elements), null);
});

void test('schema 9 projects migrate to independent centered rig layers', () => {
  const legacy = JSON.parse(JSON.stringify(createDefaultProject())) as Record<
    string,
    unknown
  >;
  legacy.schemaVersion = 9;
  for (const chapter of legacy.chapters as Array<Record<string, unknown>>) {
    for (const scene of chapter.scenes as Array<Record<string, unknown>>) {
      for (const element of scene.elements as Array<Record<string, unknown>>) {
        delete element.parentId;
        delete element.pivotX;
        delete element.pivotY;
      }
    }
  }

  const restored = restoreProject(JSON.stringify(legacy));
  assert.ok(restored);
  assert.equal(restored.schemaVersion, PROJECT_SCHEMA_VERSION);
  for (const element of restored.chapters[0].scenes[0].elements) {
    assert.equal(element.parentId, null);
    assert.equal(element.pivotX, 50);
    assert.equal(element.pivotY, 50);
  }
});

void test('schema 9 migration discards forward rig fields instead of smuggling cycles', () => {
  const legacy = structuredClone(createDefaultProject()) as unknown as Record<
    string,
    unknown
  >;
  legacy.schemaVersion = 9;
  const elements = (
    (legacy.chapters as Array<Record<string, unknown>>)[0].scenes as Array<
      Record<string, unknown>
    >
  )[0].elements as Array<Record<string, unknown>>;
  elements[0].parentId = elements[1].id;
  elements[1].parentId = elements[0].id;
  elements[0].pivotX = 8;
  elements[0].imageRigPart = {
    sourceElementId: elements[1].id,
    cropX: 0,
    cropY: 0,
    cropWidth: 10,
    cropHeight: 10,
  };

  const restored = restoreProject(JSON.stringify(legacy));
  assert.ok(restored);
  for (const element of restored.chapters[0].scenes[0].elements) {
    assert.equal(element.parentId, null);
    assert.equal(element.pivotX, 50);
    assert.equal(element.pivotY, 50);
    assert.equal(element.imageRigPart, undefined);
  }
});

void test('schema 10 migration preserves rectangular rigs and discards polygon fields', () => {
  const legacy = createBlankProject('schema-10-rig');
  const scene = legacy.chapters[0].scenes[0];
  const source = createElement('image', 1, {
    id: 'schema-10-source',
    src: 'data:image/png;base64,iVBORw0KGgo=',
  });
  const part = createElement('image', 2, {
    id: 'schema-10-part',
    imageRigPart: {
      sourceElementId: source.id,
      cropX: 10,
      cropY: 20,
      cropWidth: 30,
      cropHeight: 40,
      maskPoints: [
        { x: 10, y: 20 },
        { x: 40, y: 20 },
        { x: 20, y: 60 },
      ],
    },
  });
  scene.elements = [source, part];
  (legacy as unknown as Record<string, unknown>).schemaVersion = 10;

  const restored = restoreProject(JSON.stringify(legacy));
  assert.ok(restored);
  assert.equal(restored.schemaVersion, PROJECT_SCHEMA_VERSION);
  assert.deepEqual(restored.chapters[0].scenes[0].elements[1].imageRigPart, {
    sourceElementId: source.id,
    cropX: 10,
    cropY: 20,
    cropWidth: 30,
    cropHeight: 40,
  });
});

void test('schema 11 restore rejects malformed or degenerate polygon masks', () => {
  const project = createBlankProject('invalid-polygon-rig');
  const scene = project.chapters[0].scenes[0];
  const source = createElement('image', 1, {
    id: 'polygon-source',
    src: 'data:image/png;base64,iVBORw0KGgo=',
  });
  const part = createElement('image', 2, {
    id: 'polygon-part',
    imageRigPart: {
      sourceElementId: source.id,
      cropX: 0,
      cropY: 0,
      cropWidth: 50,
      cropHeight: 50,
    },
  });
  scene.elements = [source, part];
  const invalidMasks: unknown[] = [
    [
      { x: 0, y: 0 },
      { x: 10, y: 10 },
    ],
    [
      { x: 0, y: 0 },
      { x: 10, y: 10 },
      { x: 20, y: 20 },
    ],
    [
      { x: -1, y: 0 },
      { x: 10, y: 0 },
      { x: 0, y: 10 },
    ],
    [
      { x: 0, y: 0 },
      { x: 60, y: 0 },
      { x: 0, y: 10 },
    ],
    [
      { x: Number.POSITIVE_INFINITY, y: 0 },
      { x: 10, y: 0 },
      { x: 0, y: 10 },
    ],
    Array.from(
      { length: MAX_ELEMENT_IMAGE_RIG_MASK_POINTS + 1 },
      (_, index) => ({ x: index % 100, y: (index * 7) % 100 }),
    ),
  ];

  for (const maskPoints of invalidMasks) {
    const candidate = structuredClone(project) as unknown as {
      chapters: Array<{
        scenes: Array<{
          elements: Array<{
            imageRigPart?: Record<string, unknown>;
          }>;
        }>;
      }>;
    };
    candidate.chapters[0].scenes[0].elements[1].imageRigPart!.maskPoints =
      maskPoints;
    assert.equal(
      restoreProjectWithError(JSON.stringify(candidate)).error,
      'Project chapter 1 contains an invalid image rig part',
    );
  }
});

void test('schema 11 migration preserves masks and discards forward mesh fields', () => {
  const legacy = createBlankProject('schema-11-mesh-forward-field');
  const scene = legacy.chapters[0].scenes[0];
  const source = createElement('image', 1, {
    id: 'mesh-source',
    src: 'data:image/png;base64,iVBORw0KGgo=',
  });
  const part = createElement('image', 2, {
    id: 'mesh-part',
    imageRigPart: {
      sourceElementId: source.id,
      cropX: 10,
      cropY: 10,
      cropWidth: 40,
      cropHeight: 50,
      maskPoints: [
        { x: 10, y: 10 },
        { x: 50, y: 10 },
        { x: 30, y: 60 },
      ],
      mesh: createImageRigMesh('wind-left'),
    },
  });
  scene.elements = [source, part];
  (legacy as unknown as Record<string, unknown>).schemaVersion = 11;

  const restored = restoreProject(JSON.stringify(legacy));
  assert.ok(restored);
  const restoredPart = restored.chapters[0].scenes[0].elements[1];
  assert.equal(restoredPart.imageRigPart?.maskPoints?.length, 3);
  assert.equal(restoredPart.imageRigPart?.mesh, undefined);
});

void test('schema 12 projects and revisions receive the reader presentation default', () => {
  const project = createDefaultProject();
  project.readerPresentation = {
    transition: 'slide',
    direction: 'rtl',
    durationMs: 780,
  };
  const revision = createPublicationRevision(project);
  project.publications = [revision];
  project.publishedRevision = revision.revision;
  const legacy = structuredClone(project) as unknown as {
    schemaVersion: number;
    readerPresentation?: unknown;
    publications: Array<{ readerPresentation?: unknown }>;
  };
  legacy.schemaVersion = 12;
  delete legacy.readerPresentation;
  delete legacy.publications[0].readerPresentation;

  const restored = restoreProject(JSON.stringify(legacy));

  assert.ok(restored);
  assert.equal(restored.schemaVersion, PROJECT_SCHEMA_VERSION);
  assert.deepEqual(restored.readerPresentation, DEFAULT_READER_PRESENTATION);
  assert.deepEqual(
    restored.publications[0].readerPresentation,
    DEFAULT_READER_PRESENTATION,
  );
  assert.notEqual(
    restored.readerPresentation,
    restored.publications[0].readerPresentation,
  );
});

void test('schema 13 rejects invalid project and publication reader presentation values', () => {
  const invalidPresentations: unknown[] = [
    undefined,
    null,
    { transition: 'fold', direction: 'ltr', durationMs: 360 },
    { transition: 'book', direction: 'down', durationMs: 360 },
    { transition: 'book', direction: 'ltr', durationMs: 99 },
    { transition: 'book', direction: 'ltr', durationMs: 2_001 },
    { transition: 'book', direction: 'ltr', durationMs: 360.5 },
  ];

  for (const readerPresentation of invalidPresentations) {
    const candidate = structuredClone(createDefaultProject()) as unknown as
      | Record<string, unknown>
      | { readerPresentation?: unknown };
    if (readerPresentation === undefined) {
      delete candidate.readerPresentation;
    } else {
      candidate.readerPresentation = readerPresentation;
    }
    assert.equal(
      restoreProjectWithError(JSON.stringify(candidate)).error,
      'Project reader presentation is invalid',
    );
  }

  for (const readerPresentation of invalidPresentations) {
    const candidate = createDefaultProject();
    const revision = createPublicationRevision(candidate);
    candidate.publications = [revision];
    candidate.publishedRevision = revision.revision;
    const serialized = structuredClone(candidate) as unknown as {
      publications: Array<{ readerPresentation?: unknown }>;
    };
    if (readerPresentation === undefined) {
      delete serialized.publications[0].readerPresentation;
    } else {
      serialized.publications[0].readerPresentation = readerPresentation;
    }
    assert.equal(
      restoreProjectWithError(JSON.stringify(serialized)).error,
      'Project publication reader presentation is invalid',
    );
  }
});

void test('current schema preserves valid meshes and rejects malformed meshes', () => {
  const project = createBlankProject('mesh-round-trip');
  const scene = project.chapters[0].scenes[0];
  const source = createElement('image', 1, {
    id: 'mesh-round-trip-source',
    src: 'data:image/png;base64,iVBORw0KGgo=',
  });
  const part = createElement('image', 2, {
    id: 'mesh-round-trip-part',
    imageRigPart: {
      sourceElementId: source.id,
      cropX: 10,
      cropY: 10,
      cropWidth: 40,
      cropHeight: 50,
      mesh: createImageRigMesh('s-curve'),
    },
  });
  scene.elements = [source, part];

  const restored = restoreProject(JSON.stringify(project));
  assert.ok(restored);
  assert.deepEqual(
    restored.chapters[0].scenes[0].elements[1].imageRigPart?.mesh,
    part.imageRigPart?.mesh,
  );

  const invalid = structuredClone(project) as unknown as {
    chapters: Array<{
      scenes: Array<{
        elements: Array<{
          imageRigPart?: {
            mesh?: { offsets: Array<{ x: number; y: number }> };
          };
        }>;
      }>;
    }>;
  };
  invalid.chapters[0].scenes[0].elements[1].imageRigPart!.mesh!.offsets[4].x = 21;
  assert.equal(
    restoreProjectWithError(JSON.stringify(invalid)).error,
    'Project chapter 1 contains an invalid image rig part',
  );
});

void test('masked image rig parts and spread format survive publication round trips', () => {
  const project = createBlankProject('rig-round-trip');
  project.format = 'spread';
  const scene = project.chapters[0].scenes[0];
  const source = createElement('image', 1, {
    id: 'character-source',
    name: 'Character',
    src: 'data:image/png;base64,iVBORw0KGgo=',
    x: 120,
    y: 180,
    width: 600,
    height: 900,
  });
  const arm = createElement('image', 2, {
    id: 'character-arm',
    name: 'Arm',
    parentId: source.id,
    pivotX: 15,
    pivotY: 20,
    src: undefined,
    imageRigPart: {
      sourceElementId: source.id,
      cropX: 62,
      cropY: 28,
      cropWidth: 20,
      cropHeight: 42,
      maskPoints: [
        { x: 62, y: 28 },
        { x: 82, y: 35 },
        { x: 78, y: 70 },
        { x: 64, y: 68 },
      ],
    },
  });
  scene.elements = [source, arm];
  const revision = createPublicationRevision(project);
  project.publications = [revision];
  project.publishedRevision = revision.revision;

  const restored = restoreProject(JSON.stringify(project));
  assert.ok(restored);
  assert.equal(restored.format, 'spread');
  assert.equal(restored.publications[0].format, 'spread');
  assert.equal(restored.chapters[0].scenes[0].elements[1].parentId, source.id);
  assert.deepEqual(
    restored.chapters[0].scenes[0].elements[1].imageRigPart,
    arm.imageRigPart,
  );
});

void test('current project restore rejects orphaned, cyclic, and overdeep rigs', () => {
  const orphaned = createDefaultProject();
  orphaned.chapters[0].scenes[0].elements[0].parentId = 'missing-parent';
  assert.equal(
    restoreProjectWithError(JSON.stringify(orphaned)).error,
    'Project chapter 1 contains an orphaned or self-parented rig layer',
  );

  const cyclic = createBlankProject('cyclic-rig');
  const first = createElement('group', 1, { id: 'first', parentId: 'second' });
  const second = createElement('group', 2, { id: 'second', parentId: 'first' });
  cyclic.chapters[0].scenes[0].elements = [first, second];
  assert.equal(
    restoreProjectWithError(JSON.stringify(cyclic)).error,
    'Project chapter 1 contains a cyclic rig hierarchy',
  );

  const overdeep = createBlankProject('overdeep-rig');
  overdeep.chapters[0].scenes[0].elements = Array.from(
    { length: MAX_ELEMENT_RIG_DEPTH + 2 },
    (_, index) =>
      createElement('group', index + 1, {
        id: `joint-${index}`,
        parentId: index === 0 ? null : `joint-${index - 1}`,
      }),
  );
  assert.equal(
    restoreProjectWithError(JSON.stringify(overdeep)).error,
    `Project chapter 1 contains a rig deeper than ${MAX_ELEMENT_RIG_DEPTH} levels`,
  );

  const missingImageSource = createBlankProject('missing-rig-source');
  const emptySource = createElement('image', 1, {
    id: 'empty-source',
    src: undefined,
  });
  const dependentPart = createElement('image', 2, {
    id: 'dependent-part',
    imageRigPart: {
      sourceElementId: emptySource.id,
      cropX: 0,
      cropY: 0,
      cropWidth: 20,
      cropHeight: 20,
    },
  });
  missingImageSource.chapters[0].scenes[0].elements = [
    emptySource,
    dependentPart,
  ];
  assert.equal(
    restoreProjectWithError(JSON.stringify(missingImageSource)).error,
    'Project chapter 1 contains an orphaned image rig part',
  );
});

void test('publication readiness ignores empty groups and catches broken rigs', () => {
  const project = createBlankProject('empty-rig-project');
  project.title = 'Empty rig';
  project.metadata.contributorNames = ['Creator'];
  project.metadata.workStatus = 'ongoing';
  project.metadata.origin = 'original';
  project.chapters[0].scenes[0].elements = [createElement('group', 1)];
  assert.ok(
    getPublicationReadiness(project).issues.includes(
      'Add at least one visible layer',
    ),
  );

  const brokenPart = createElement('image', 2, {
    imageRigPart: {
      sourceElementId: 'missing',
      cropX: 0,
      cropY: 0,
      cropWidth: 20,
      cropHeight: 20,
    },
  });
  project.chapters[0].scenes[0].elements.push(brokenPart);
  assert.ok(
    getPublicationReadiness(project).issues.includes(
      'Repair broken character rig links before publishing',
    ),
  );
});
