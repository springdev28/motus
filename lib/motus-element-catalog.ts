import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  ELEMENT_SHAPE_PRESETS,
  MOTION_SCHEMA_VERSION,
  createElement,
  createMotionBlock,
  type ElementMotion,
  type ElementShapePreset,
  type MotusElement,
} from './motus-model.ts';

export type ShapeCatalogCategory = 'basic' | 'panels' | 'effects' | 'symbols';

export type MotusShapePrimitive =
  | {
      kind: 'path';
      d: string;
      fillRule?: 'evenodd' | 'nonzero';
      opacity?: number;
    }
  | {
      kind: 'circle';
      cx: number;
      cy: number;
      r: number;
      opacity?: number;
    }
  | {
      kind: 'line';
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      strokeWidth: number;
      opacity?: number;
    };

export type MotusShapePresetDefinition = {
  id: ElementShapePreset;
  label: string;
  category: ShapeCatalogCategory;
  tags: readonly string[];
  defaultWidth: number;
  defaultHeight: number;
  primitives: readonly MotusShapePrimitive[];
};

export const MOTUS_SHAPE_PRESET_DEFINITIONS: readonly MotusShapePresetDefinition[] =
  [
    {
      id: 'orb',
      label: 'Glow orb',
      category: 'basic',
      tags: ['circle', 'glow', 'light'],
      defaultWidth: 240,
      defaultHeight: 240,
      primitives: [],
    },
    {
      id: 'rectangle',
      label: 'Rectangle',
      category: 'basic',
      tags: ['box', 'square', 'block'],
      defaultWidth: 360,
      defaultHeight: 240,
      primitives: [{ kind: 'path', d: 'M2 2H98V98H2Z' }],
    },
    {
      id: 'rounded-panel',
      label: 'Rounded panel',
      category: 'panels',
      tags: ['panel', 'box', 'card', 'background'],
      defaultWidth: 620,
      defaultHeight: 360,
      primitives: [
        {
          kind: 'path',
          d: 'M14 2H86Q98 2 98 14V86Q98 98 86 98H14Q2 98 2 86V14Q2 2 14 2Z',
        },
      ],
    },
    {
      id: 'frame',
      label: 'Panel frame',
      category: 'panels',
      tags: ['panel', 'frame', 'border', 'comic'],
      defaultWidth: 700,
      defaultHeight: 520,
      primitives: [
        {
          kind: 'path',
          d: 'M1 1H99V99H1ZM8 8V92H92V8Z',
          fillRule: 'evenodd',
        },
      ],
    },
    {
      id: 'divider',
      label: 'Scene divider',
      category: 'panels',
      tags: ['divider', 'line', 'separator', 'gutter'],
      defaultWidth: 760,
      defaultHeight: 70,
      primitives: [
        { kind: 'path', d: 'M2 42H70L77 28L84 42H98V58H82L76 70L69 58H2Z' },
      ],
    },
    {
      id: 'burst',
      label: 'Impact burst',
      category: 'effects',
      tags: ['impact', 'explosion', 'pow', 'action'],
      defaultWidth: 430,
      defaultHeight: 430,
      primitives: [
        {
          kind: 'path',
          d: 'M50 1L59 22L78 8L76 31L99 29L81 45L99 58L76 60L79 84L59 70L50 99L41 71L20 86L24 61L1 59L19 45L2 28L25 31L22 7L41 22Z',
        },
      ],
    },
    {
      id: 'focus-rays',
      label: 'Focus rays',
      category: 'effects',
      tags: ['rays', 'focus', 'dramatic', 'manga'],
      defaultWidth: 650,
      defaultHeight: 650,
      primitives: [
        {
          kind: 'path',
          d: 'M48 0H52L55 37L50 45L45 37ZM100 48V52L63 55L55 50L63 45ZM52 100H48L45 63L50 55L55 63ZM0 52V48L37 45L45 50L37 55ZM84 13L87 16L61 42L53 47L58 39ZM87 84L84 87L58 61L53 53L61 58ZM16 87L13 84L39 58L47 53L42 61ZM13 16L16 13L42 39L47 47L39 42Z',
        },
        {
          kind: 'circle',
          cx: 50,
          cy: 50,
          r: 8,
          opacity: 0.35,
        },
      ],
    },
    {
      id: 'speed-lines',
      label: 'Speed lines',
      category: 'effects',
      tags: ['speed', 'motion', 'action', 'wind'],
      defaultWidth: 720,
      defaultHeight: 330,
      primitives: [
        { kind: 'line', x1: 4, y1: 12, x2: 94, y2: 2, strokeWidth: 3 },
        { kind: 'line', x1: 18, y1: 31, x2: 99, y2: 27, strokeWidth: 2 },
        { kind: 'line', x1: 1, y1: 51, x2: 86, y2: 48, strokeWidth: 4 },
        { kind: 'line', x1: 12, y1: 70, x2: 98, y2: 76, strokeWidth: 2 },
        { kind: 'line', x1: 3, y1: 94, x2: 89, y2: 86, strokeWidth: 3 },
      ],
    },
    {
      id: 'halftone',
      label: 'Halftone field',
      category: 'effects',
      tags: ['dots', 'halftone', 'texture', 'comic'],
      defaultWidth: 560,
      defaultHeight: 360,
      primitives: Array.from({ length: 30 }, (_, index) => {
        const column = index % 6;
        const row = Math.floor(index / 6);
        return {
          kind: 'circle' as const,
          cx: 9 + column * 16.5,
          cy: 12 + row * 19,
          r: 2.2 + row * 0.8,
          opacity: 0.35 + row * 0.12,
        };
      }),
    },
    {
      id: 'rain',
      label: 'Rain streaks',
      category: 'effects',
      tags: ['rain', 'weather', 'streaks', 'atmosphere'],
      defaultWidth: 560,
      defaultHeight: 520,
      primitives: Array.from({ length: 15 }, (_, index) => {
        const column = index % 5;
        const row = Math.floor(index / 5);
        const x = 8 + column * 21 + (row % 2) * 6;
        const y = 4 + row * 31;
        return {
          kind: 'line' as const,
          x1: x + 10,
          y1: y,
          x2: x,
          y2: y + 24,
          strokeWidth: index % 3 === 0 ? 3 : 2,
          opacity: 0.45 + (index % 4) * 0.12,
        };
      }),
    },
    {
      id: 'arrow',
      label: 'Bold arrow',
      category: 'symbols',
      tags: ['arrow', 'direction', 'pointer', 'callout'],
      defaultWidth: 430,
      defaultHeight: 220,
      primitives: [{ kind: 'path', d: 'M2 36H62V12L98 50L62 88V64H2Z' }],
    },
    {
      id: 'star',
      label: 'Comic star',
      category: 'symbols',
      tags: ['star', 'sparkle', 'favorite', 'emphasis'],
      defaultWidth: 300,
      defaultHeight: 300,
      primitives: [
        {
          kind: 'path',
          d: 'M50 2L62 36L98 37L69 58L79 94L50 73L21 94L31 58L2 37L38 36Z',
        },
      ],
    },
    {
      id: 'heart',
      label: 'Heart',
      category: 'symbols',
      tags: ['heart', 'love', 'reaction', 'romance'],
      defaultWidth: 310,
      defaultHeight: 280,
      primitives: [
        {
          kind: 'path',
          d: 'M50 92C42 82 8 61 8 33C8 13 31 4 50 24C69 4 92 13 92 33C92 61 58 82 50 92Z',
        },
      ],
    },
    {
      id: 'lightning',
      label: 'Lightning',
      category: 'symbols',
      tags: ['lightning', 'energy', 'shock', 'action'],
      defaultWidth: 250,
      defaultHeight: 380,
      primitives: [{ kind: 'path', d: 'M58 1L14 56H43L32 99L88 39H58Z' }],
    },
  ];

export function getShapePresetDefinition(
  preset: ElementShapePreset,
): MotusShapePresetDefinition {
  return MOTUS_SHAPE_PRESET_DEFINITIONS.find(
    (definition) => definition.id === preset,
  )!;
}

export const ELEMENT_CATALOG_CATEGORIES = [
  { id: 'basic', label: 'Basics' },
  { id: 'panels', label: 'Panels' },
  { id: 'effects', label: 'FX' },
  { id: 'symbols', label: 'Symbols' },
  { id: 'kits', label: 'Text kits' },
] as const;

export type ElementCatalogCategory =
  (typeof ELEMENT_CATALOG_CATEGORIES)[number]['id'];

type ShapeCatalogEntry = {
  id: string;
  name: string;
  description: string;
  category: Exclude<ElementCatalogCategory, 'kits'>;
  tags: readonly string[];
  kind: 'shape';
  shapePreset: ElementShapePreset;
  previewPreset: ElementShapePreset;
  fill: string;
  layerCount: 1;
};

type KitCatalogEntry = {
  id: string;
  name: string;
  description: string;
  category: 'kits';
  tags: readonly string[];
  kind: 'kit';
  kit: 'caption-bar' | 'impact-badge' | 'dialogue-pair' | 'chapter-card';
  previewPreset: ElementShapePreset;
  previewText: string;
  previewTextColor: string;
  fill: string;
  layerCount: number;
};

export type ElementCatalogEntry = ShapeCatalogEntry | KitCatalogEntry;

export const MOTUS_ELEMENT_CATALOG = [
  {
    id: 'glow-orb',
    name: 'Glow orb',
    description: 'A luminous focal shape with an editable color and size.',
    category: 'basic',
    tags: ['orb', 'circle', 'glow', 'light'],
    kind: 'shape',
    shapePreset: 'orb',
    previewPreset: 'orb',
    fill: '#8c74ff',
    layerCount: 1,
  },
  {
    id: 'rectangle',
    name: 'Rectangle',
    description: 'A clean solid shape for backgrounds, bars, and masks.',
    category: 'basic',
    tags: ['rectangle', 'square', 'box', 'background'],
    kind: 'shape',
    shapePreset: 'rectangle',
    previewPreset: 'rectangle',
    fill: '#5d47c7',
    layerCount: 1,
  },
  {
    id: 'panel-frame',
    name: 'Panel frame',
    description: 'A clean comic frame with a transparent center.',
    category: 'panels',
    tags: ['panel', 'frame', 'border', 'comic'],
    kind: 'shape',
    shapePreset: 'frame',
    previewPreset: 'frame',
    fill: '#241b45',
    layerCount: 1,
  },
  {
    id: 'rounded-panel',
    name: 'Rounded panel',
    description: 'A soft card or inset panel for narration and UI.',
    category: 'panels',
    tags: ['panel', 'rounded', 'card', 'box'],
    kind: 'shape',
    shapePreset: 'rounded-panel',
    previewPreset: 'rounded-panel',
    fill: '#5d47c7',
    layerCount: 1,
  },
  {
    id: 'scene-divider',
    name: 'Scene divider',
    description: 'A sharp horizontal beat between story sections.',
    category: 'panels',
    tags: ['divider', 'separator', 'gutter', 'line'],
    kind: 'shape',
    shapePreset: 'divider',
    previewPreset: 'divider',
    fill: '#241b45',
    layerCount: 1,
  },
  {
    id: 'impact-burst',
    name: 'Impact burst',
    description: 'A high-energy starburst for hits and reveals.',
    category: 'effects',
    tags: ['impact', 'burst', 'pow', 'action'],
    kind: 'shape',
    shapePreset: 'burst',
    previewPreset: 'burst',
    fill: '#ffcf4d',
    layerCount: 1,
  },
  {
    id: 'focus-rays',
    name: 'Focus rays',
    description: 'Radial manga rays that pull attention to the center.',
    category: 'effects',
    tags: ['focus', 'rays', 'manga', 'dramatic'],
    kind: 'shape',
    shapePreset: 'focus-rays',
    previewPreset: 'focus-rays',
    fill: '#f05f9d',
    layerCount: 1,
  },
  {
    id: 'speed-lines',
    name: 'Speed lines',
    description: 'Directional strokes for movement and acceleration.',
    category: 'effects',
    tags: ['speed', 'lines', 'motion', 'action'],
    kind: 'shape',
    shapePreset: 'speed-lines',
    previewPreset: 'speed-lines',
    fill: '#4c35bd',
    layerCount: 1,
  },
  {
    id: 'halftone-field',
    name: 'Halftone field',
    description: 'Scalable comic dots for texture and atmosphere.',
    category: 'effects',
    tags: ['halftone', 'dots', 'texture', 'comic'],
    kind: 'shape',
    shapePreset: 'halftone',
    previewPreset: 'halftone',
    fill: '#6b50d9',
    layerCount: 1,
  },
  {
    id: 'rain-streaks',
    name: 'Rain streaks',
    description: 'A transparent weather layer with angled rain.',
    category: 'effects',
    tags: ['rain', 'weather', 'streaks', 'mood'],
    kind: 'shape',
    shapePreset: 'rain',
    previewPreset: 'rain',
    fill: '#5c80d8',
    layerCount: 1,
  },
  {
    id: 'bold-arrow',
    name: 'Bold arrow',
    description: 'A flexible callout arrow for diagrams and reactions.',
    category: 'symbols',
    tags: ['arrow', 'direction', 'pointer', 'callout'],
    kind: 'shape',
    shapePreset: 'arrow',
    previewPreset: 'arrow',
    fill: '#e84a8a',
    layerCount: 1,
  },
  {
    id: 'comic-star',
    name: 'Comic star',
    description: 'A crisp star for emphasis, ratings, and sparkles.',
    category: 'symbols',
    tags: ['star', 'sparkle', 'favorite', 'emphasis'],
    kind: 'shape',
    shapePreset: 'star',
    previewPreset: 'star',
    fill: '#ffd34f',
    layerCount: 1,
  },
  {
    id: 'reaction-heart',
    name: 'Reaction heart',
    description: 'A smooth heart for romance and audience reactions.',
    category: 'symbols',
    tags: ['heart', 'love', 'romance', 'reaction'],
    kind: 'shape',
    shapePreset: 'heart',
    previewPreset: 'heart',
    fill: '#ff5d95',
    layerCount: 1,
  },
  {
    id: 'lightning-mark',
    name: 'Lightning mark',
    description: 'A sharp energy symbol for shocks and power beats.',
    category: 'symbols',
    tags: ['lightning', 'energy', 'shock', 'power'],
    kind: 'shape',
    shapePreset: 'lightning',
    previewPreset: 'lightning',
    fill: '#a56bff',
    layerCount: 1,
  },
  {
    id: 'caption-bar-kit',
    name: 'Caption bar',
    description: 'Grouped panel and editable caption text.',
    category: 'kits',
    tags: ['caption', 'narration', 'text', 'bar'],
    kind: 'kit',
    kit: 'caption-bar',
    previewPreset: 'rounded-panel',
    previewText: 'CAPTION',
    previewTextColor: '#ffffff',
    fill: '#241b45',
    layerCount: 3,
  },
  {
    id: 'impact-badge-kit',
    name: 'Impact badge',
    description: 'Grouped burst and editable impact lettering.',
    category: 'kits',
    tags: ['impact', 'badge', 'pow', 'text'],
    kind: 'kit',
    kit: 'impact-badge',
    previewPreset: 'burst',
    previewText: 'POW!',
    previewTextColor: '#241b45',
    fill: '#ffcf4d',
    layerCount: 3,
  },
  {
    id: 'dialogue-pair-kit',
    name: 'Dialogue pair',
    description: 'Two editable speech bubbles grouped as one exchange.',
    category: 'kits',
    tags: ['dialogue', 'speech', 'conversation', 'bubble'],
    kind: 'kit',
    kit: 'dialogue-pair',
    previewPreset: 'rounded-panel',
    previewText: '…',
    previewTextColor: '#241b45',
    fill: '#fffaf0',
    layerCount: 3,
  },
  {
    id: 'chapter-card-kit',
    name: 'Chapter card',
    description: 'A framed title, divider, and editable subtitle group.',
    category: 'kits',
    tags: ['chapter', 'title', 'card', 'text'],
    kind: 'kit',
    kit: 'chapter-card',
    previewPreset: 'frame',
    previewText: 'CHAPTER',
    previewTextColor: '#241b45',
    fill: '#5d47c7',
    layerCount: 5,
  },
] as const satisfies readonly ElementCatalogEntry[];

function createStaticMotion(id: string): ElementMotion {
  return {
    schemaVersion: MOTION_SCHEMA_VERSION,
    event: 'scene-enter',
    moveX: 0,
    moveY: 0,
    durationMs: 900,
    delayMs: 0,
    fromOpacity: 1,
    fromScale: 1,
    fromRotation: 0,
    easing: 'ease-out',
    blocks: [createMotionBlock('scene-enter', `${id}-event`)],
  };
}

function centeredPosition(width: number, height: number) {
  return {
    x: Math.round((CANVAS_WIDTH - width) / 2),
    y: Math.round((CANVAS_HEIGHT - height) / 2),
  };
}

export type CreatedElementCatalogItem = {
  entry: ElementCatalogEntry;
  elements: MotusElement[];
  rootElementId: string;
};

export function createElementCatalogItem(
  entryId: string,
  startIndex: number,
  createId: (prefix: string) => string,
): CreatedElementCatalogItem | null {
  const entry = MOTUS_ELEMENT_CATALOG.find(
    (candidate) => candidate.id === entryId,
  );
  if (!entry) return null;

  if (entry.kind === 'shape') {
    const definition = getShapePresetDefinition(entry.shapePreset);
    const id = createId('shape');
    const position = centeredPosition(
      definition.defaultWidth,
      definition.defaultHeight,
    );
    return {
      entry,
      rootElementId: id,
      elements: [
        createElement('shape', startIndex, {
          id,
          name: entry.name,
          shapePreset: entry.shapePreset,
          fill: entry.fill,
          width: definition.defaultWidth,
          height: definition.defaultHeight,
          ...position,
        }),
      ],
    };
  }

  const rootId = createId('group');
  const createLayer = (
    type: MotusElement['type'],
    offset: number,
    overrides: Partial<MotusElement>,
  ) => {
    const id = createId(type);
    return createElement(type, startIndex + offset, {
      id,
      parentId: rootId,
      motion: createStaticMotion(id),
      ...overrides,
    });
  };

  if (entry.kit === 'caption-bar') {
    const group = createElement('group', startIndex, {
      id: rootId,
      name: entry.name,
      x: 150,
      y: 1_080,
      width: 780,
      height: 190,
      motion: createStaticMotion(rootId),
    });
    return {
      entry,
      rootElementId: rootId,
      elements: [
        group,
        createLayer('shape', 1, {
          name: 'Caption panel',
          shapePreset: 'rounded-panel',
          x: 150,
          y: 1_080,
          width: 780,
          height: 190,
          fill: '#241b45',
        }),
        createLayer('text', 2, {
          name: 'Caption text',
          x: 205,
          y: 1_132,
          width: 670,
          height: 88,
          fill: '#ffffff',
          text: 'CAPTION GOES HERE',
          typography: {
            fontPreset: 'condensed',
            fontSize: 28,
            fontWeight: 800,
            textAlign: 'left',
            lineHeight: 1,
            letterSpacing: 0.03,
          },
        }),
      ],
    };
  }

  if (entry.kit === 'impact-badge') {
    const group = createElement('group', startIndex, {
      id: rootId,
      name: entry.name,
      x: 320,
      y: 460,
      width: 440,
      height: 440,
      motion: createStaticMotion(rootId),
    });
    return {
      entry,
      rootElementId: rootId,
      elements: [
        group,
        createLayer('shape', 1, {
          name: 'Impact burst',
          shapePreset: 'burst',
          x: 320,
          y: 460,
          width: 440,
          height: 440,
          fill: '#ffcf4d',
        }),
        createLayer('text', 2, {
          name: 'Impact text',
          x: 395,
          y: 610,
          width: 290,
          height: 120,
          fill: '#241b45',
          text: 'POW!',
          typography: {
            fontPreset: 'comic',
            fontSize: 36,
            fontWeight: 900,
            textAlign: 'center',
            lineHeight: 1,
            letterSpacing: -0.04,
          },
        }),
      ],
    };
  }

  if (entry.kit === 'dialogue-pair') {
    const group = createElement('group', startIndex, {
      id: rootId,
      name: entry.name,
      x: 125,
      y: 340,
      width: 830,
      height: 650,
      motion: createStaticMotion(rootId),
    });
    return {
      entry,
      rootElementId: rootId,
      elements: [
        group,
        createLayer('speech', 1, {
          name: 'First dialogue',
          x: 140,
          y: 350,
          width: 460,
          height: 210,
          fill: '#fffaf0',
          text: 'Did you see that?',
        }),
        createLayer('speech', 2, {
          name: 'Reply dialogue',
          x: 485,
          y: 700,
          width: 455,
          height: 210,
          fill: '#efe9ff',
          text: 'I thought it was you.',
        }),
      ],
    };
  }

  if (entry.kit === 'chapter-card') {
    const group = createElement('group', startIndex, {
      id: rootId,
      name: entry.name,
      x: 160,
      y: 330,
      width: 760,
      height: 700,
      motion: createStaticMotion(rootId),
    });
    return {
      entry,
      rootElementId: rootId,
      elements: [
        group,
        createLayer('shape', 1, {
          name: 'Chapter frame',
          shapePreset: 'frame',
          x: 160,
          y: 330,
          width: 760,
          height: 700,
          fill: '#5d47c7',
        }),
        createLayer('text', 2, {
          name: 'Chapter title',
          x: 240,
          y: 510,
          width: 600,
          height: 150,
          fill: '#ffffff',
          text: 'CHAPTER ONE',
          typography: {
            fontPreset: 'condensed',
            fontSize: 34,
            fontWeight: 900,
            textAlign: 'center',
            lineHeight: 0.95,
            letterSpacing: 0.04,
          },
        }),
        createLayer('shape', 3, {
          name: 'Title divider',
          shapePreset: 'divider',
          x: 310,
          y: 700,
          width: 460,
          height: 70,
          fill: '#e5ff73',
        }),
        createLayer('text', 4, {
          name: 'Chapter subtitle',
          x: 290,
          y: 805,
          width: 500,
          height: 100,
          fill: '#ffffff',
          text: 'THE SIGNAL',
          typography: {
            fontPreset: 'mono',
            fontSize: 22,
            fontWeight: 700,
            textAlign: 'center',
            lineHeight: 1,
            letterSpacing: 0.12,
          },
        }),
      ],
    };
  }

  const exhaustiveKit: never = entry;
  return exhaustiveKit;
}

export const ELEMENT_CATALOG_SHAPE_PRESETS = [
  ...new Set(
    MOTUS_ELEMENT_CATALOG.flatMap((entry) =>
      entry.kind === 'shape' ? [entry.shapePreset] : [entry.previewPreset],
    ),
  ),
] as readonly ElementShapePreset[];

export const MISSING_SHAPE_PRESET_DEFINITIONS = ELEMENT_SHAPE_PRESETS.filter(
  (preset) =>
    !MOTUS_SHAPE_PRESET_DEFINITIONS.some(
      (definition) => definition.id === preset,
    ),
);
