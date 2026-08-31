import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ELEMENT_CATALOG_CATEGORIES,
  ELEMENT_CATALOG_SHAPE_PRESETS,
  MISSING_SHAPE_PRESET_DEFINITIONS,
  MOTUS_ELEMENT_CATALOG,
  MOTUS_SHAPE_PRESET_DEFINITIONS,
  createElementCatalogItem,
  getShapePresetDefinition,
} from './motus-element-catalog.ts';
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  ELEMENT_SHAPE_PRESETS,
  MAX_ELEMENT_RIG_DEPTH,
  MIN_ELEMENT_HEIGHT,
  MIN_ELEMENT_WIDTH,
  MOTION_SCHEMA_VERSION,
  PROJECT_SCHEMA_VERSION,
  createBlankProject,
  createPublicationRevision,
  describeElementForAccessibility,
  getElementRigDepth,
  getElementRigIntegrityIssue,
  getElementRigRenderedVisualBounds,
  getMotionProgramRuntimeIssue,
  getSceneThumbnailElements,
  restoreProjectWithError,
  type ElementShapePreset,
  type MotionBlock,
  type MotusElement,
} from './motus-model.ts';

const EXPECTED_CATALOG_SIGNATURES = [
  ['glow-orb', 'basic', 'shape', 'orb', 'orb', 1],
  ['rectangle', 'basic', 'shape', 'rectangle', 'rectangle', 1],
  ['panel-frame', 'panels', 'shape', 'frame', 'frame', 1],
  ['rounded-panel', 'panels', 'shape', 'rounded-panel', 'rounded-panel', 1],
  ['scene-divider', 'panels', 'shape', 'divider', 'divider', 1],
  ['impact-burst', 'effects', 'shape', 'burst', 'burst', 1],
  ['focus-rays', 'effects', 'shape', 'focus-rays', 'focus-rays', 1],
  ['speed-lines', 'effects', 'shape', 'speed-lines', 'speed-lines', 1],
  ['halftone-field', 'effects', 'shape', 'halftone', 'halftone', 1],
  ['rain-streaks', 'effects', 'shape', 'rain', 'rain', 1],
  ['bold-arrow', 'symbols', 'shape', 'arrow', 'arrow', 1],
  ['comic-star', 'symbols', 'shape', 'star', 'star', 1],
  ['reaction-heart', 'symbols', 'shape', 'heart', 'heart', 1],
  ['lightning-mark', 'symbols', 'shape', 'lightning', 'lightning', 1],
  ['caption-bar-kit', 'kits', 'kit', 'caption-bar', 'rounded-panel', 3],
  ['impact-badge-kit', 'kits', 'kit', 'impact-badge', 'burst', 3],
  ['dialogue-pair-kit', 'kits', 'kit', 'dialogue-pair', 'rounded-panel', 3],
  ['chapter-card-kit', 'kits', 'kit', 'chapter-card', 'frame', 5],
] as const;

const EXPECTED_DEFINITION_SIGNATURES = [
  ['orb', 'Glow orb', 'basic', 240, 240],
  ['rectangle', 'Rectangle', 'basic', 360, 240],
  ['rounded-panel', 'Rounded panel', 'panels', 620, 360],
  ['frame', 'Panel frame', 'panels', 700, 520],
  ['divider', 'Scene divider', 'panels', 760, 70],
  ['burst', 'Impact burst', 'effects', 430, 430],
  ['focus-rays', 'Focus rays', 'effects', 650, 650],
  ['speed-lines', 'Speed lines', 'effects', 720, 330],
  ['halftone', 'Halftone field', 'effects', 560, 360],
  ['rain', 'Rain streaks', 'effects', 560, 520],
  ['arrow', 'Bold arrow', 'symbols', 430, 220],
  ['star', 'Comic star', 'symbols', 300, 300],
  ['heart', 'Heart', 'symbols', 310, 280],
  ['lightning', 'Lightning', 'symbols', 250, 380],
] as const;

const EXPECTED_KIT_TOPOLOGY = {
  'caption-bar-kit': {
    names: ['Caption bar', 'Caption panel', 'Caption text'],
    types: ['group', 'shape', 'text'],
    presets: [undefined, 'rounded-panel', undefined],
  },
  'impact-badge-kit': {
    names: ['Impact badge', 'Impact burst', 'Impact text'],
    types: ['group', 'shape', 'text'],
    presets: [undefined, 'burst', undefined],
  },
  'dialogue-pair-kit': {
    names: ['Dialogue pair', 'First dialogue', 'Reply dialogue'],
    types: ['group', 'speech', 'speech'],
    presets: [undefined, undefined, undefined],
  },
  'chapter-card-kit': {
    names: [
      'Chapter card',
      'Chapter frame',
      'Chapter title',
      'Title divider',
      'Chapter subtitle',
    ],
    types: ['group', 'shape', 'text', 'shape', 'text'],
    presets: [undefined, 'frame', undefined, 'divider', undefined],
  },
} as const;

function createDeterministicIdFactory(namespace: string) {
  let serial = 0;
  return (prefix: string) => `${namespace}-${prefix}-${++serial}`;
}

function collectMotionBlockIds(blocks: readonly MotionBlock[]): string[] {
  return blocks.flatMap((block) => [
    block.id,
    ...collectMotionBlockIds(block.children),
  ]);
}

function assertFiniteNumber(value: number, label: string) {
  assert.equal(Number.isFinite(value), true, `${label} must be finite`);
}

function compareShapePresets(
  left: ElementShapePreset | undefined,
  right: ElementShapePreset | undefined,
) {
  return (left ?? '').localeCompare(right ?? '');
}

void test('element catalog exposes the exact finalized 18-entry inventory', () => {
  assert.deepEqual(ELEMENT_CATALOG_CATEGORIES, [
    { id: 'basic', label: 'Basics' },
    { id: 'panels', label: 'Panels' },
    { id: 'effects', label: 'FX' },
    { id: 'symbols', label: 'Symbols' },
    { id: 'kits', label: 'Text kits' },
  ]);
  assert.equal(MOTUS_ELEMENT_CATALOG.length, 18);
  assert.equal(
    new Set(MOTUS_ELEMENT_CATALOG.map((entry) => entry.id)).size,
    MOTUS_ELEMENT_CATALOG.length,
  );
  assert.deepEqual(
    MOTUS_ELEMENT_CATALOG.map((entry) => [
      entry.id,
      entry.category,
      entry.kind,
      entry.kind === 'shape' ? entry.shapePreset : entry.kit,
      entry.previewPreset,
      entry.layerCount,
    ]),
    EXPECTED_CATALOG_SIGNATURES,
  );

  for (const entry of MOTUS_ELEMENT_CATALOG) {
    assert.equal(entry.name.trim().length > 0, true);
    assert.equal(entry.description.trim().length > 0, true);
    assert.match(entry.fill, /^#[0-9a-f]{6}$/i);
    assert.equal(entry.tags.length > 0, true);
    assert.equal(new Set(entry.tags).size, entry.tags.length);
    assert.equal(
      entry.tags.every((tag) => tag === tag.trim() && !!tag),
      true,
    );
    if (entry.kind === 'shape') {
      assert.equal(entry.layerCount, 1);
      assert.equal(entry.previewPreset, entry.shapePreset);
    } else {
      assert.equal(entry.previewText.trim().length > 0, true);
    }
  }
});

void test('all 14 shape preset definitions are exhaustive and renderer-safe', () => {
  assert.equal(PROJECT_SCHEMA_VERSION, 14);
  assert.deepEqual(
    MOTUS_SHAPE_PRESET_DEFINITIONS.map((definition) => [
      definition.id,
      definition.label,
      definition.category,
      definition.defaultWidth,
      definition.defaultHeight,
    ]),
    EXPECTED_DEFINITION_SIGNATURES,
  );
  assert.deepEqual(
    MOTUS_SHAPE_PRESET_DEFINITIONS.map((definition) => definition.id),
    ELEMENT_SHAPE_PRESETS,
  );
  assert.deepEqual(MISSING_SHAPE_PRESET_DEFINITIONS, []);
  assert.deepEqual(ELEMENT_CATALOG_SHAPE_PRESETS, [
    'orb',
    'rectangle',
    'frame',
    'rounded-panel',
    'divider',
    'burst',
    'focus-rays',
    'speed-lines',
    'halftone',
    'rain',
    'arrow',
    'star',
    'heart',
    'lightning',
  ]);
  assert.deepEqual(
    [...ELEMENT_CATALOG_SHAPE_PRESETS].sort(compareShapePresets),
    [...ELEMENT_SHAPE_PRESETS].sort(compareShapePresets),
  );

  for (const definition of MOTUS_SHAPE_PRESET_DEFINITIONS) {
    assert.equal(getShapePresetDefinition(definition.id), definition);
    assert.equal(definition.label.trim().length > 0, true);
    assert.equal(definition.tags.length > 0, true);
    assert.equal(new Set(definition.tags).size, definition.tags.length);
    assert.equal(definition.defaultWidth >= MIN_ELEMENT_WIDTH, true);
    assert.equal(definition.defaultWidth <= CANVAS_WIDTH, true);
    assert.equal(definition.defaultHeight >= MIN_ELEMENT_HEIGHT, true);
    assert.equal(definition.defaultHeight <= CANVAS_HEIGHT, true);
    assert.equal(
      definition.id === 'orb'
        ? definition.primitives.length === 0
        : definition.primitives.length > 0,
      true,
    );

    for (const primitive of definition.primitives) {
      if (primitive.opacity !== undefined) {
        assertFiniteNumber(primitive.opacity, `${definition.id} opacity`);
        assert.equal(primitive.opacity >= 0 && primitive.opacity <= 1, true);
      }
      if (primitive.kind === 'path') {
        assert.equal(primitive.d.trim().length > 0, true);
        assert.equal(
          primitive.fillRule === undefined ||
            primitive.fillRule === 'evenodd' ||
            primitive.fillRule === 'nonzero',
          true,
        );
      } else if (primitive.kind === 'circle') {
        assertFiniteNumber(primitive.cx, `${definition.id} circle cx`);
        assertFiniteNumber(primitive.cy, `${definition.id} circle cy`);
        assertFiniteNumber(primitive.r, `${definition.id} circle radius`);
        assert.equal(primitive.cx >= -5 && primitive.cx <= 105, true);
        assert.equal(primitive.cy >= -5 && primitive.cy <= 105, true);
        assert.equal(primitive.r > 0 && primitive.r <= 100, true);
      } else {
        for (const [field, value] of Object.entries({
          x1: primitive.x1,
          y1: primitive.y1,
          x2: primitive.x2,
          y2: primitive.y2,
          strokeWidth: primitive.strokeWidth,
        })) {
          assertFiniteNumber(value, `${definition.id} line ${field}`);
        }
        assert.equal(
          [primitive.x1, primitive.y1, primitive.x2, primitive.y2].every(
            (value) => value >= -10 && value <= 110,
          ),
          true,
        );
        assert.equal(primitive.strokeWidth > 0, true);
      }
    }
  }
});

void test('every catalog factory creates a valid independent render graph', () => {
  for (const [catalogIndex, entry] of MOTUS_ELEMENT_CATALOG.entries()) {
    const created = createElementCatalogItem(
      entry.id,
      catalogIndex * 10 + 1,
      createDeterministicIdFactory(`entry-${catalogIndex}`),
    );
    assert.ok(created, entry.id);
    assert.equal(created.entry, entry);
    assert.equal(created.elements.length, entry.layerCount);
    assert.equal(created.elements[0].id, created.rootElementId);
    assert.equal(created.elements[0].parentId, null);
    assert.equal(
      new Set(created.elements.map((element) => element.id)).size,
      created.elements.length,
    );
    assert.equal(getElementRigIntegrityIssue(created.elements), null);
    assert.deepEqual(
      getSceneThumbnailElements({ elements: created.elements }).map(
        (element) => element.id,
      ),
      created.elements.map((element) => element.id),
    );

    if (entry.kind === 'shape') {
      assert.deepEqual(
        created.elements.map((element) => element.name),
        [entry.name],
      );
      assert.deepEqual(
        created.elements.map((element) => element.type),
        ['shape'],
      );
      assert.deepEqual(
        created.elements.map((element) => element.shapePreset),
        [entry.shapePreset],
      );
    } else {
      const topology = EXPECTED_KIT_TOPOLOGY[entry.id];
      assert.deepEqual(
        created.elements.map((element) => element.name),
        topology.names,
      );
      assert.deepEqual(
        created.elements.map((element) => element.type),
        topology.types,
      );
      assert.deepEqual(
        created.elements.map((element) => element.shapePreset),
        topology.presets,
      );
    }

    for (const [elementIndex, element] of created.elements.entries()) {
      assert.equal(
        element.parentId,
        elementIndex === 0 ? null : created.rootElementId,
      );
      assert.equal(
        getElementRigDepth(created.elements, element.id),
        elementIndex === 0 ? 0 : 1,
      );
      assert.equal(
        getElementRigDepth(created.elements, element.id) <=
          MAX_ELEMENT_RIG_DEPTH,
        true,
      );
      assert.equal(element.width >= MIN_ELEMENT_WIDTH, true);
      assert.equal(element.height >= MIN_ELEMENT_HEIGHT, true);
      assert.equal(element.visible, true);
      assert.equal(element.locked, false);
      assert.equal(element.src, undefined);
      assert.equal(element.imageRigPart, undefined);
      assert.equal(element.motion.schemaVersion, MOTION_SCHEMA_VERSION);
      assert.equal(getMotionProgramRuntimeIssue(element.motion.blocks), null);
      const blockIds = collectMotionBlockIds(element.motion.blocks);
      assert.equal(new Set(blockIds).size, blockIds.length);
      assert.equal(
        describeElementForAccessibility(element).trim().length > 0,
        true,
      );
      if (entry.kind === 'kit') {
        assert.deepEqual(
          element.motion.blocks.map((block) => block.kind),
          ['scene-enter'],
        );
      }
      if (element.type === 'shape') {
        assert.equal(
          ELEMENT_SHAPE_PRESETS.includes(
            element.shapePreset as ElementShapePreset,
          ),
          true,
        );
        assert.equal(Object.hasOwn(element, 'shapePreset'), true);
      } else {
        assert.equal(Object.hasOwn(element, 'shapePreset'), false);
      }

      const bounds = getElementRigRenderedVisualBounds(
        created.elements,
        element.id,
      );
      assert.ok(bounds);
      assert.equal(bounds.left >= 0, true, `${entry.id}/${element.name} left`);
      assert.equal(bounds.top >= 0, true, `${entry.id}/${element.name} top`);
      assert.equal(
        bounds.right <= CANVAS_WIDTH,
        true,
        `${entry.id}/${element.name} right`,
      );
      assert.equal(
        bounds.bottom <= CANVAS_HEIGHT,
        true,
        `${entry.id}/${element.name} bottom`,
      );
    }
  }
});

void test('catalog factories return null for unknown entries without allocating IDs', () => {
  let calls = 0;
  assert.equal(
    createElementCatalogItem('not-a-real-entry', 1, () => {
      calls += 1;
      return 'unexpected-id';
    }),
    null,
  );
  assert.equal(calls, 0);
});

void test('repeated kit creation shares no editable element state', () => {
  const first = createElementCatalogItem(
    'chapter-card-kit',
    1,
    createDeterministicIdFactory('first'),
  );
  const second = createElementCatalogItem(
    'chapter-card-kit',
    1,
    createDeterministicIdFactory('second'),
  );
  assert.ok(first);
  assert.ok(second);
  assert.notEqual(first.elements, second.elements);
  assert.equal(first.entry, second.entry);
  assert.deepEqual(
    first.elements.map((element) => element.id),
    [
      'first-group-1',
      'first-shape-2',
      'first-text-3',
      'first-shape-4',
      'first-text-5',
    ],
  );
  assert.deepEqual(
    second.elements.map((element) => element.id),
    [
      'second-group-1',
      'second-shape-2',
      'second-text-3',
      'second-shape-4',
      'second-text-5',
    ],
  );
  const secondSnapshot = structuredClone(second);

  first.elements[0].name = 'Changed group';
  first.elements[0].motion.blocks[0].enabled = false;
  const firstText = first.elements.find(
    (element) => element.type === 'text' && element.typography,
  );
  assert.ok(firstText);
  firstText.text = 'Changed copy';
  firstText.typography!.fontSize += 7;

  assert.deepEqual(second, secondSnapshot);
  for (let index = 0; index < first.elements.length; index += 1) {
    assert.notEqual(first.elements[index], second.elements[index]);
    assert.notEqual(
      first.elements[index].motion,
      second.elements[index].motion,
    );
    assert.notEqual(
      first.elements[index].motion.blocks,
      second.elements[index].motion.blocks,
    );
    if (first.elements[index].typography) {
      assert.notEqual(
        first.elements[index].typography,
        second.elements[index].typography,
      );
    }
  }
});

void test('the complete catalog survives current-schema draft and publication round trips', () => {
  const project = createBlankProject(
    'catalog-round-trip',
    '2026-08-31T10:00:00.000Z',
  );
  const elements: MotusElement[] = [];
  let serial = 0;
  const createId = (prefix: string) => `catalog-${prefix}-${++serial}`;
  for (const [index, entry] of MOTUS_ELEMENT_CATALOG.entries()) {
    const created = createElementCatalogItem(
      entry.id,
      index * 10 + 1,
      createId,
    );
    assert.ok(created);
    elements.push(...created.elements);
  }
  project.chapters[0].scenes[0].elements = elements;
  const revision = createPublicationRevision(
    project,
    '2026-08-31T10:01:00.000Z',
  );
  project.publications = [revision];
  project.publishedRevision = revision.revision;

  const result = restoreProjectWithError(JSON.stringify(project));
  assert.equal(result.error, null);
  assert.ok(result.project);
  const restoredDraft = result.project.chapters[0].scenes[0].elements;
  const restoredRevision =
    result.project.publications[0].chapters[0].scenes[0].elements;
  assert.deepEqual(
    JSON.parse(JSON.stringify(restoredDraft)),
    JSON.parse(JSON.stringify(elements)),
  );
  assert.deepEqual(
    JSON.parse(JSON.stringify(restoredRevision)),
    JSON.parse(JSON.stringify(elements)),
  );
  assert.notEqual(restoredDraft, restoredRevision);
  for (let index = 0; index < restoredDraft.length; index += 1) {
    assert.notEqual(restoredDraft[index], restoredRevision[index]);
  }
  assert.deepEqual(
    [
      ...new Set(
        restoredDraft
          .filter((element) => element.type === 'shape')
          .map((element) => element.shapePreset),
      ),
    ].sort(compareShapePresets),
    [...ELEMENT_SHAPE_PRESETS].sort(compareShapePresets),
  );
  assert.equal(
    restoredDraft
      .filter((element) => element.type !== 'shape')
      .every((element) => !Object.hasOwn(element, 'shapePreset')),
    true,
  );

  restoredDraft[0].name = 'Draft-only change';
  restoredDraft[0].motion.blocks[0].enabled = false;
  assert.notEqual(restoredRevision[0].name, restoredDraft[0].name);
  assert.notEqual(
    restoredRevision[0].motion.blocks[0].enabled,
    restoredDraft[0].motion.blocks[0].enabled,
  );
});
