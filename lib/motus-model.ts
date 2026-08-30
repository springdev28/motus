export const PROJECT_SCHEMA_VERSION = 8 as const;
export const MOTION_SCHEMA_VERSION = 1 as const;
export const MOTUS_PROJECT_FORMATS = ['vertical-scroll', 'page'] as const;
export type MotusProjectFormat = (typeof MOTUS_PROJECT_FORMATS)[number];
export const CANVAS_WIDTH = 1_080;
export const CANVAS_HEIGHT = 1_440;
export const MIN_ELEMENT_WIDTH = 60;
export const MIN_ELEMENT_HEIGHT = 50;

export type ElementType = 'shape' | 'text' | 'speech' | 'image';
export type TextElementType = Extract<ElementType, 'text' | 'speech'>;
export const ELEMENT_FONT_PRESETS = [
  'editorial',
  'modern',
  'comic',
  'condensed',
  'mono',
] as const;
export type ElementFontPreset = (typeof ELEMENT_FONT_PRESETS)[number];
export const ELEMENT_FONT_WEIGHTS = [400, 500, 600, 700, 800, 900] as const;
export type ElementFontWeight = (typeof ELEMENT_FONT_WEIGHTS)[number];
export const ELEMENT_TEXT_ALIGNMENTS = ['left', 'center', 'right'] as const;
export type ElementTextAlignment = (typeof ELEMENT_TEXT_ALIGNMENTS)[number];
export const MIN_ELEMENT_FONT_SIZE = 8;
export const MAX_ELEMENT_FONT_SIZE = 200;
export const MIN_ELEMENT_LINE_HEIGHT = 0.75;
export const MAX_ELEMENT_LINE_HEIGHT = 3;
export const MIN_ELEMENT_LETTER_SPACING = -0.2;
export const MAX_ELEMENT_LETTER_SPACING = 0.5;

export type ElementTypography = {
  fontPreset: ElementFontPreset;
  fontSize: number;
  fontWeight: ElementFontWeight;
  textAlign: ElementTextAlignment;
  lineHeight: number;
  /** Letter spacing expressed in em so it scales with font size. */
  letterSpacing: number;
};
export type ElementPointerTransformMode =
  | 'move'
  | 'resize'
  | 'resize-n'
  | 'resize-ne'
  | 'resize-e'
  | 'resize-se'
  | 'resize-s'
  | 'resize-sw'
  | 'resize-w'
  | 'resize-nw'
  | 'rotate';
export type Easing = 'linear' | 'ease-out' | 'ease-in-out';
export const MOTION_BLOCK_CATEGORY_IDS = [
  'event',
  'motion',
  'paths',
  'physics',
  'looks',
  'emphasis',
  'effects',
  'transitions',
  'text',
  'control',
  'timing',
] as const;
export type MotionBlockCategory = (typeof MOTION_BLOCK_CATEGORY_IDS)[number];

export const MOTION_EVENT_BLOCK_KINDS = [
  'page-open',
  'element-appear',
  'element-tap',
  'element-hover',
  'animation-finish',
  'scene-enter',
] as const;
export type MotionEventBlockKind = (typeof MOTION_EVENT_BLOCK_KINDS)[number];

export const MOTION_BLOCK_KINDS = [
  ...MOTION_EVENT_BLOCK_KINDS,
  'wait',
  'move',
  'scale',
  'rotate',
  'opacity',
  'bounce',
  'shake',
  'drift',
  'float',
  'pulse',
  'blur',
  'reveal',
  'flash',
  'slide-left',
  'slide-right',
  'slide-up',
  'slide-down',
  'arc-in',
  'orbit',
  'zigzag',
  'wave',
  'spring',
  'roll',
  'jump',
  'sway',
  'swing',
  'spiral',
  'overshoot',
  'bob',
  'tremble',
  'corkscrew',
  'recoil',
  'grow',
  'shrink',
  'spin',
  'breathe',
  'squash',
  'stretch',
  'flip-horizontal',
  'flip-vertical',
  'flicker',
  'blur-pulse',
  'glow',
  'brightness',
  'contrast',
  'saturate',
  'desaturate',
  'grayscale',
  'sepia',
  'hue-rotate',
  'pop-in',
  'zoom-in',
  'zoom-out',
  'rise-in',
  'drop-in',
  'wipe',
  'curtain',
  'dissolve',
  'type-on',
  'caption-rise',
  'dialogue-pop',
  'word-pulse',
  'text-jitter',
  'text-reveal',
  'yoyo',
  'loop-move',
  'loop-rotate',
  'loop-scale',
  'loop-opacity',
  'settle',
  'dash-in',
  'glide-in',
  'skid-in',
  'snap-in',
  'swoop-left',
  'swoop-right',
  'hop-left',
  'hop-right',
  'ladder-up',
  'ladder-down',
  'figure-eight',
  'infinity-loop',
  'circle-clockwise',
  'circle-counterclockwise',
  'ellipse-loop',
  'snake',
  'stair-step',
  'sawtooth',
  'triangle-path',
  'square-path',
  'diamond-path',
  'boomerang',
  'ricochet',
  'pinball',
  'pendulum',
  'drop-bounce',
  'rubber-band',
  'elastic-slide',
  'slingshot',
  'magnetic-snap',
  'gravity-fall',
  'parachute',
  'rocket-rise',
  'toss',
  'fling',
  'drift-left',
  'drift-right',
  'drift-up',
  'drift-down',
  'backtrack',
  'wobble',
  'jello',
  'heartbeat',
  'throb',
  'blink',
  'shimmer',
  'sparkle',
  'spotlight',
  'neon',
  'shadow-pulse',
  'tilt-left',
  'tilt-right',
  'compress',
  'inflate',
  'deflate',
  'rubber-stamp',
  'hinge',
  'card-flip',
  'coin-flip',
  'spin-pulse',
  'color-pop',
  'color-drain',
  'exposure-flash',
  'focus-pull',
  'ghost',
  'silhouette',
  'warm-up',
  'cool-down',
  'prism',
  'chromatic-pulse',
  'soft-focus',
  'hard-focus',
  'fade-up',
  'fade-down',
  'fade-left',
  'fade-right',
  'zoom-bounce',
  'rotate-pop',
  'flip-in-horizontal',
  'flip-in-vertical',
  'blur-in-left',
  'blur-in-right',
  'slide-fade-left',
  'slide-fade-right',
  'letter-hop',
  'letter-wave',
  'caption-slide',
  'subtitle-fade',
  'speech-bounce',
  'thought-float',
  'headline-drop',
  'text-blink',
] as const;
export type MotionBlockKind = (typeof MOTION_BLOCK_KINDS)[number];
const MOTION_EVENT_BLOCK_KIND_SET = new Set<string>(MOTION_EVENT_BLOCK_KINDS);
export const isMotionEventBlockKind = (
  value: unknown,
): value is MotionEventBlockKind =>
  typeof value === 'string' && MOTION_EVENT_BLOCK_KIND_SET.has(value);
export type ContentRating = 'all-ages' | 'teen' | 'mature' | 'adults-only';
export type PublicationVisibility = 'private' | 'public';
export type SupportedImageMime = 'image/png' | 'image/webp';
export const WORK_STATUSES = ['ongoing', 'completed', 'hiatus'] as const;
export type WorkStatus = (typeof WORK_STATUSES)[number];
export const WORK_ORIGINS = [
  'original',
  'motus-fanwork',
  'external-fanwork',
] as const;
export type WorkOrigin = (typeof WORK_ORIGINS)[number];

export const MAX_IMAGE_BYTES = 750_000;
export const MAX_IMAGE_DIMENSION = 4_096;
export const MAX_IMAGE_PIXELS = 12_000_000;
export const MAX_ELEMENT_NAME_LENGTH = 160;
export const MAX_PROJECT_DESCRIPTION_LENGTH = 5_000;
export const MAX_PROJECT_FILE_BYTES = 12_000_000;
export const MAX_PROJECT_TITLE_LENGTH = 160;
export const MAX_PROJECT_TAGS = 8;
export const MAX_PROJECT_TAG_LENGTH = 40;
export const MAX_PROJECT_CHAPTERS = 100;
export const MAX_PROJECT_SCENES = 100;
export const MAX_PUBLICATION_REVISION = 1_000_000;
export const MAX_PROJECT_CONTRIBUTORS = 32;
export const MAX_PROJECT_METADATA_ITEMS = 64;
export const MAX_PROJECT_METADATA_VALUE_LENGTH = 160;
export const MAX_SCENE_ELEMENTS = 500;
export const MAX_SCENE_NAME_LENGTH = 160;
export const MAX_SCENE_THUMBNAIL_ELEMENTS = 12;
export const MAX_ELEMENT_TEXT_LENGTH = 50_000;
export const MAX_PROJECT_HISTORY_ENTRIES = 50;
export const MAX_PROJECT_HISTORY_BYTES = 24_000_000;
export const MAX_MOTION_BLOCKS = 64;
export const MAX_BOUNCE_JUMPS = 12;
export const MAX_ELEMENT_ID_LENGTH = 256;
export const MAX_MOTION_EVENT_SOURCE_ID_LENGTH = 256;

export type BounceDirection = 'left' | 'right';
export type RevealDirection = 'left' | 'right' | 'up' | 'down';

export type BounceJump = {
  id: string;
  direction: BounceDirection;
  height: number;
  spread: number;
  durationMs: number;
  easing: Easing;
};

export type MotionBlock = {
  id: string;
  kind: MotionBlockKind;
  category: MotionBlockCategory;
  label: string;
  enabled: boolean;
  sourceElementId: string | null;
  durationMs: number;
  easing: Easing;
  x: number;
  y: number;
  value: number;
  secondaryValue: number;
  repetitions: number;
  direction: RevealDirection;
  jumps: BounceJump[];
};

export type MotionBlockNumericField =
  | 'x'
  | 'y'
  | 'value'
  | 'secondaryValue'
  | 'repetitions';

export type EditableMotionBlockNumericField =
  | MotionBlockNumericField
  | 'durationMs';

export type BounceJumpNumericField = 'height' | 'spread' | 'durationMs';

export type MotionBlockParameterSpec = {
  field: MotionBlockNumericField;
  label: string;
  defaultValue: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
};

export type MotionBlockCatalogEntry = {
  kind: MotionBlockKind;
  category: MotionBlockCategory;
  label: string;
  description: string;
  parameters: MotionBlockParameterSpec[];
  durationMs: number;
  usesDirection?: boolean;
};

export const MOTION_BLOCK_CATEGORIES: Array<{
  id: MotionBlockCategory;
  label: string;
  description: string;
}> = [
  {
    id: 'event',
    label: 'Events',
    description: 'Choose when a program starts.',
  },
  {
    id: 'motion',
    label: 'Motion',
    description: 'Move, slide, rotate, and travel.',
  },
  {
    id: 'paths',
    label: 'Paths',
    description: 'Trace geometric and free-flowing routes.',
  },
  {
    id: 'physics',
    label: 'Physics',
    description: 'Bounce, spring, fall, and recoil.',
  },
  {
    id: 'looks',
    label: 'Looks',
    description: 'Transform scale, rotation, and visibility.',
  },
  {
    id: 'emphasis',
    label: 'Emphasis',
    description: 'Pulse, shake, blink, and draw attention.',
  },
  {
    id: 'effects',
    label: 'Effects',
    description: 'Animate focus, color, and light.',
  },
  {
    id: 'transitions',
    label: 'Transitions',
    description: 'Bring layers on and off the stage.',
  },
  { id: 'text', label: 'Text', description: 'Animate captions and dialogue.' },
  {
    id: 'control',
    label: 'Control',
    description: 'Loop and oscillate editable motion.',
  },
  { id: 'timing', label: 'Timing', description: 'Pause and pace a sequence.' },
];

const parameter = (
  field: MotionBlockNumericField,
  label: string,
  defaultValue: number,
  min: number,
  max: number,
  step = 1,
  unit?: string,
): MotionBlockParameterSpec => ({
  field,
  label,
  defaultValue,
  min,
  max,
  step,
  unit,
});

const catalogBlock = (
  kind: MotionBlockKind,
  category: MotionBlockCategory,
  label: string,
  description: string,
  parameters: MotionBlockParameterSpec[] = [],
  durationMs = 700,
  usesDirection = false,
): MotionBlockCatalogEntry => ({
  kind,
  category,
  label,
  description,
  parameters,
  durationMs,
  usesDirection,
});

const horizontal = (label = 'Horizontal', value = 80) =>
  parameter('x', label, value, -2_000, 2_000, 5, 'px');
const positiveHorizontal = (label = 'Distance', value = 180) =>
  parameter('x', label, value, 0, 2_000, 5, 'px');
const vertical = (label = 'Vertical', value = 60) =>
  parameter('y', label, value, -2_000, 2_000, 5, 'px');
const positiveVertical = (label = 'Height', value = 60) =>
  parameter('y', label, value, 0, 2_000, 5, 'px');
const repeats = (value = 3, label = 'Repeats') =>
  parameter('repetitions', label, value, 1, 20, 1, '×');
const amount = (
  label: string,
  value: number,
  min: number,
  max: number,
  step = 1,
  unit?: string,
) => parameter('value', label, value, min, max, step, unit);
const secondary = (
  label: string,
  value: number,
  min: number,
  max: number,
  step = 1,
  unit?: string,
) => parameter('secondaryValue', label, value, min, max, step, unit);

export const MOTION_BLOCK_CATALOG: MotionBlockCatalogEntry[] = [
  catalogBlock(
    'page-open',
    'event',
    'When page opens',
    'Starts this layer program as soon as the reader opens the page.',
    [],
    0,
  ),
  catalogBlock(
    'element-appear',
    'event',
    'When element appears',
    'Starts when this layer enters the reader viewport.',
    [],
    0,
  ),
  catalogBlock(
    'element-tap',
    'event',
    'When tapped',
    'Starts when a reader clicks, taps, or keyboard-activates this layer.',
    [],
    0,
  ),
  catalogBlock(
    'element-hover',
    'event',
    'When hovered',
    'Starts when a pointer enters or keyboard focus reaches this layer.',
    [],
    0,
  ),
  catalogBlock(
    'animation-finish',
    'event',
    'When another animation finishes',
    'Starts after a chosen layer in this scene successfully finishes its animation.',
    [],
    0,
  ),
  catalogBlock(
    'scene-enter',
    'event',
    'When reader scrolls into section',
    'Starts when the containing scene enters the reader viewport.',
    [],
    0,
  ),
  catalogBlock(
    'wait',
    'timing',
    'Wait',
    'Pauses before the next block runs.',
    [],
    300,
  ),

  catalogBlock(
    'move',
    'motion',
    'Move in',
    'Moves from an editable X/Y offset into place.',
    [horizontal('Move X', 80), vertical('Move Y', 0)],
  ),
  catalogBlock(
    'rotate',
    'motion',
    'Rotate in',
    'Rotates from an editable angle into place.',
    [amount('Start angle', -12, -1_440, 1_440, 1, '°')],
  ),
  catalogBlock(
    'bounce',
    'physics',
    'Custom bounce',
    'Builds a path from independently editable jumps.',
    [],
    1_480,
  ),
  catalogBlock(
    'shake',
    'emphasis',
    'Shake',
    'Shakes horizontally and vertically for editable beats.',
    [
      positiveHorizontal('Horizontal', 24),
      secondary('Vertical', 10, 0, 800, 1, 'px'),
      repeats(6, 'Beats'),
    ],
  ),
  catalogBlock(
    'drift',
    'motion',
    'Drift in',
    'Glides slowly from an editable X/Y offset.',
    [horizontal('Drift X', 110), vertical('Drift Y', 38)],
    1_100,
  ),
  catalogBlock(
    'float',
    'emphasis',
    'Float',
    'Rises and falls by an editable height and cycle count.',
    [positiveVertical('Float height', 52), repeats(2, 'Cycles')],
    1_400,
  ),
  catalogBlock(
    'slide-left',
    'motion',
    'Slide from left',
    'Slides in from the left by an exact distance.',
    [positiveHorizontal('Distance', 220)],
  ),
  catalogBlock(
    'slide-right',
    'motion',
    'Slide from right',
    'Slides in from the right by an exact distance.',
    [positiveHorizontal('Distance', 220)],
  ),
  catalogBlock(
    'slide-up',
    'motion',
    'Slide from top',
    'Slides in from above by an exact distance.',
    [positiveVertical('Distance', 220)],
  ),
  catalogBlock(
    'slide-down',
    'motion',
    'Slide from bottom',
    'Slides in from below by an exact distance.',
    [positiveVertical('Distance', 220)],
  ),
  catalogBlock(
    'arc-in',
    'motion',
    'Arc in',
    'Curves into place using editable width and arc height.',
    [horizontal('Travel X', 260), positiveVertical('Arc height', 140)],
    900,
  ),
  catalogBlock(
    'orbit',
    'paths',
    'Orbit',
    'Orbits around the final position on an editable ellipse.',
    [
      positiveHorizontal('Radius X', 120),
      positiveVertical('Radius Y', 80),
      repeats(2, 'Orbits'),
    ],
    1_400,
  ),
  catalogBlock(
    'zigzag',
    'paths',
    'Zigzag',
    'Alternates horizontal direction while moving vertically.',
    [
      positiveHorizontal('Width', 100),
      positiveVertical('Height', 60),
      repeats(4, 'Turns'),
    ],
    1_100,
  ),
  catalogBlock(
    'wave',
    'paths',
    'Wave path',
    'Follows an editable horizontal and vertical wave.',
    [
      positiveHorizontal('Width', 120),
      positiveVertical('Height', 60),
      repeats(3, 'Waves'),
    ],
    1_200,
  ),
  catalogBlock(
    'spring',
    'physics',
    'Spring in',
    'Springs from an editable size and overshoots before settling.',
    [
      amount('Start scale', 0.4, 0.05, 4, 0.05, '×'),
      secondary('Overshoot', 1.18, 1, 2, 0.01, '×'),
    ],
    850,
  ),
  catalogBlock(
    'roll',
    'motion',
    'Roll in',
    'Rolls across an editable distance and angle.',
    [
      horizontal('Travel X', 300),
      amount('Rotation', -360, -1_440, 1_440, 5, '°'),
    ],
    1_000,
  ),
  catalogBlock(
    'jump',
    'physics',
    'Jump in',
    'Drops through an editable jump height and lands in place.',
    [positiveVertical('Jump height', 180)],
    760,
  ),
  catalogBlock(
    'sway',
    'emphasis',
    'Sway',
    'Sways gently around the final angle.',
    [amount('Angle', 12, 0, 180, 1, '°'), repeats(4, 'Swings')],
    1_200,
  ),
  catalogBlock(
    'swing',
    'emphasis',
    'Swing',
    'Swings widely around the final angle.',
    [amount('Angle', 28, 0, 360, 1, '°'), repeats(4, 'Swings')],
    1_200,
  ),
  catalogBlock(
    'spiral',
    'paths',
    'Spiral',
    'Travels an editable ellipse while spiraling inward.',
    [
      positiveHorizontal('Radius X', 130),
      positiveVertical('Radius Y', 90),
      repeats(2, 'Turns'),
    ],
    1_500,
  ),
  catalogBlock(
    'overshoot',
    'physics',
    'Overshoot',
    'Moves past the destination, then settles back.',
    [
      horizontal('Travel X', 220),
      secondary('Overshoot', 32, -400, 400, 1, 'px'),
    ],
    850,
  ),
  catalogBlock(
    'bob',
    'emphasis',
    'Bob',
    'Bobs vertically for an editable number of cycles.',
    [positiveVertical('Height', 50), repeats(3, 'Cycles')],
    1_100,
  ),
  catalogBlock(
    'tremble',
    'emphasis',
    'Tremble',
    'Adds a tight, fast two-axis tremble.',
    [
      positiveHorizontal('Horizontal', 14),
      secondary('Vertical', 10, 0, 800, 1, 'px'),
      repeats(8, 'Beats'),
    ],
    700,
  ),
  catalogBlock(
    'corkscrew',
    'paths',
    'Corkscrew',
    'Combines an editable orbit with rotation.',
    [
      positiveHorizontal('Radius X', 150),
      positiveVertical('Radius Y', 100),
      amount('Rotation', 360, -1_440, 1_440, 5, '°'),
      repeats(2, 'Turns'),
    ],
    1_600,
  ),
  catalogBlock(
    'recoil',
    'physics',
    'Recoil',
    'Kicks backward and returns with editable force.',
    [positiveHorizontal('Force', 80), repeats(3, 'Kicks')],
    750,
  ),

  catalogBlock(
    'scale',
    'looks',
    'Scale in',
    'Scales from a chosen size to 100%.',
    [amount('Start scale', 0.8, 0.05, 4, 0.05, '×')],
  ),
  catalogBlock(
    'opacity',
    'looks',
    'Fade in',
    'Changes opacity from a chosen value to the layer opacity.',
    [amount('Start opacity', 0, 0, 1, 0.05)],
  ),
  catalogBlock(
    'pulse',
    'emphasis',
    'Pulse',
    'Pulses to an editable scale for a chosen count.',
    [amount('Peak scale', 1.18, 0.05, 4, 0.05, '×'), repeats(2, 'Pulses')],
  ),
  catalogBlock(
    'flash',
    'emphasis',
    'Flash',
    'Flashes between the layer opacity and an editable low level.',
    [amount('Low opacity', 0, 0, 1, 0.05), repeats(3, 'Flashes')],
  ),
  catalogBlock(
    'grow',
    'looks',
    'Grow in',
    'Grows from an editable starting scale.',
    [amount('Start scale', 0.4, 0.05, 4, 0.05, '×')],
  ),
  catalogBlock(
    'shrink',
    'looks',
    'Shrink in',
    'Shrinks from an editable larger scale.',
    [amount('Start scale', 1.6, 0.05, 4, 0.05, '×')],
  ),
  catalogBlock(
    'spin',
    'looks',
    'Spin in',
    'Spins from an editable rotation into place.',
    [amount('Rotation', -360, -1_440, 1_440, 5, '°')],
    900,
  ),
  catalogBlock(
    'breathe',
    'emphasis',
    'Breathe',
    'Breathes between normal and an editable scale.',
    [amount('Peak scale', 1.08, 0.05, 4, 0.01, '×'), repeats(4, 'Breaths')],
    1_600,
  ),
  catalogBlock(
    'squash',
    'looks',
    'Squash',
    'Squashes width and height by an editable amount.',
    [amount('Amount', 0.25, 0, 0.9, 0.05), repeats(3, 'Squashes')],
    900,
  ),
  catalogBlock(
    'stretch',
    'looks',
    'Stretch',
    'Stretches height and narrows width by an editable amount.',
    [amount('Amount', 0.25, 0, 0.9, 0.05), repeats(3, 'Stretches')],
    900,
  ),
  catalogBlock(
    'flip-horizontal',
    'looks',
    'Flip horizontal',
    'Flips across the vertical axis and returns.',
    [repeats(1, 'Flips')],
    700,
  ),
  catalogBlock(
    'flip-vertical',
    'looks',
    'Flip vertical',
    'Flips across the horizontal axis and returns.',
    [repeats(1, 'Flips')],
    700,
  ),
  catalogBlock(
    'flicker',
    'emphasis',
    'Flicker',
    'Flickers to an editable opacity for a chosen count.',
    [amount('Low opacity', 0.25, 0, 1, 0.05), repeats(6, 'Flickers')],
    800,
  ),
  catalogBlock(
    'blur-pulse',
    'emphasis',
    'Blur pulse',
    'Pulses focus by an editable blur radius.',
    [amount('Blur radius', 20, 0, 60, 1, 'px'), repeats(3, 'Pulses')],
    1_000,
  ),

  catalogBlock(
    'blur',
    'effects',
    'Focus from blur',
    'Animates from an editable blur radius into focus.',
    [amount('Start blur', 18, 0, 60, 1, 'px')],
  ),
  catalogBlock(
    'glow',
    'effects',
    'Glow pulse',
    'Pulses an editable halo around the layer.',
    [amount('Glow radius', 26, 0, 80, 1, 'px'), repeats(2, 'Pulses')],
    1_100,
  ),
  catalogBlock(
    'brightness',
    'effects',
    'Brightness in',
    'Animates from an editable brightness into the original.',
    [amount('Start brightness', 1.8, 0, 4, 0.05, '×')],
  ),
  catalogBlock(
    'contrast',
    'effects',
    'Contrast in',
    'Animates from editable contrast into the original.',
    [amount('Start contrast', 1.8, 0, 4, 0.05, '×')],
  ),
  catalogBlock(
    'saturate',
    'effects',
    'Saturate in',
    'Animates from intense editable saturation.',
    [amount('Start saturation', 2, 0, 4, 0.05, '×')],
  ),
  catalogBlock(
    'desaturate',
    'effects',
    'Colorize in',
    'Animates from low saturation into full color.',
    [amount('Start saturation', 0, 0, 4, 0.05, '×')],
  ),
  catalogBlock(
    'grayscale',
    'effects',
    'Grayscale to color',
    'Animates from grayscale into the original colors.',
    [amount('Gray amount', 1, 0, 1, 0.05)],
  ),
  catalogBlock(
    'sepia',
    'effects',
    'Sepia to color',
    'Animates from sepia into the original colors.',
    [amount('Sepia amount', 1, 0, 1, 0.05)],
  ),
  catalogBlock(
    'hue-rotate',
    'effects',
    'Hue rotate in',
    'Rotates color hue by an editable starting angle.',
    [amount('Hue angle', 180, -720, 720, 5, '°')],
  ),

  catalogBlock(
    'reveal',
    'transitions',
    'Directional reveal',
    'Reveals from any side by an editable amount.',
    [amount('Hidden amount', 100, 0, 100, 1, '%')],
    700,
    true,
  ),
  catalogBlock(
    'pop-in',
    'transitions',
    'Pop in',
    'Pops from an editable size and opacity into place.',
    [amount('Start scale', 0.45, 0.05, 4, 0.05, '×')],
    520,
  ),
  catalogBlock(
    'zoom-in',
    'transitions',
    'Zoom in',
    'Zooms from an editable small scale.',
    [amount('Start scale', 0.2, 0.05, 4, 0.05, '×')],
    760,
  ),
  catalogBlock(
    'zoom-out',
    'transitions',
    'Zoom out',
    'Zooms down from an editable large scale.',
    [amount('Start scale', 2, 0.05, 4, 0.05, '×')],
    760,
  ),
  catalogBlock(
    'rise-in',
    'transitions',
    'Rise and fade',
    'Rises from below while fading into view.',
    [positiveVertical('Distance', 120)],
    720,
  ),
  catalogBlock(
    'drop-in',
    'transitions',
    'Drop and fade',
    'Drops from above while fading into view.',
    [positiveVertical('Distance', 120)],
    720,
  ),
  catalogBlock(
    'wipe',
    'transitions',
    'Wipe',
    'Wipes on from any side by an editable amount.',
    [amount('Hidden amount', 100, 0, 100, 1, '%')],
    700,
    true,
  ),
  catalogBlock(
    'curtain',
    'transitions',
    'Curtain open',
    'Opens from the center with an editable hidden amount.',
    [amount('Hidden amount', 100, 0, 100, 1, '%')],
    850,
  ),
  catalogBlock(
    'dissolve',
    'transitions',
    'Blur dissolve',
    'Dissolves from editable blur and transparency.',
    [amount('Blur radius', 24, 0, 60, 1, 'px')],
    850,
  ),

  catalogBlock(
    'type-on',
    'text',
    'Type on',
    'Reveals text progressively from left to right.',
    [amount('Reveal amount', 100, 0, 100, 1, '%')],
    1_200,
  ),
  catalogBlock(
    'caption-rise',
    'text',
    'Caption rise',
    'Raises a caption from below while fading it in.',
    [positiveVertical('Distance', 70)],
    700,
  ),
  catalogBlock(
    'dialogue-pop',
    'text',
    'Dialogue pop',
    'Pops a dialogue layer from an editable scale.',
    [amount('Start scale', 0.5, 0.05, 4, 0.05, '×')],
    520,
  ),
  catalogBlock(
    'word-pulse',
    'text',
    'Word pulse',
    'Pulses text to an editable scale and count.',
    [amount('Peak scale', 1.2, 0.05, 4, 0.05, '×'), repeats(3, 'Pulses')],
    900,
  ),
  catalogBlock(
    'text-jitter',
    'text',
    'Text jitter',
    'Jitters text by editable horizontal and vertical amounts.',
    [
      positiveHorizontal('Horizontal', 10),
      secondary('Vertical', 8, 0, 800, 1, 'px'),
      repeats(8, 'Beats'),
    ],
    700,
  ),
  catalogBlock(
    'text-reveal',
    'text',
    'Text reveal',
    'Reveals text from an editable side and amount.',
    [amount('Hidden amount', 100, 0, 100, 1, '%')],
    900,
    true,
  ),

  catalogBlock(
    'yoyo',
    'control',
    'Yoyo',
    'Moves out and back by editable X/Y values.',
    [
      horizontal('Travel X', 120),
      vertical('Travel Y', 0),
      repeats(3, 'Cycles'),
    ],
    1_100,
  ),
  catalogBlock(
    'loop-move',
    'control',
    'Loop move',
    'Loops an editable X/Y movement and returns each time.',
    [horizontal('Travel X', 80), vertical('Travel Y', 0), repeats(4, 'Loops')],
    1_200,
  ),
  catalogBlock(
    'loop-rotate',
    'control',
    'Loop rotation',
    'Loops an editable rotation and returns each time.',
    [amount('Angle', 45, -1_440, 1_440, 1, '°'), repeats(4, 'Loops')],
    1_200,
  ),
  catalogBlock(
    'loop-scale',
    'control',
    'Loop scale',
    'Loops to an editable scale and returns each time.',
    [amount('Scale', 1.2, 0.05, 4, 0.05, '×'), repeats(4, 'Loops')],
    1_200,
  ),
  catalogBlock(
    'loop-opacity',
    'control',
    'Loop opacity',
    'Loops to an editable opacity and returns each time.',
    [amount('Opacity', 0.25, 0, 1, 0.05), repeats(4, 'Loops')],
    1_200,
  ),
  catalogBlock(
    'settle',
    'control',
    'Settle',
    'Oscillates scale with editable overshoot before resting.',
    [amount('Overshoot', 1.18, 1, 2, 0.01, '×'), repeats(4, 'Oscillations')],
    900,
  ),

  catalogBlock(
    'dash-in',
    'motion',
    'Dash in',
    'Dashes into place with editable travel and recoil.',
    [
      positiveHorizontal('Distance', 320),
      secondary('Recoil', 26, 0, 400, 1, 'px'),
    ],
    520,
  ),
  catalogBlock(
    'glide-in',
    'motion',
    'Glide in',
    'Glides gently from an editable two-axis offset.',
    [horizontal('Travel X', 240), vertical('Travel Y', 60)],
    1_400,
  ),
  catalogBlock(
    'skid-in',
    'motion',
    'Skid in',
    'Skids past the destination, then slides back.',
    [horizontal('Travel X', 300), secondary('Skid', 54, -400, 400, 1, 'px')],
    900,
  ),
  catalogBlock(
    'snap-in',
    'motion',
    'Snap in',
    'Snaps from an editable offset with a sharp settle.',
    [
      horizontal('Travel X', 150),
      vertical('Travel Y', 0),
      secondary('Snap', 18, 0, 200, 1, 'px'),
    ],
    420,
  ),
  catalogBlock(
    'swoop-left',
    'motion',
    'Swoop from left',
    'Swoops in from the left on an editable arc.',
    [positiveHorizontal('Distance', 280), positiveVertical('Arc height', 130)],
    900,
  ),
  catalogBlock(
    'swoop-right',
    'motion',
    'Swoop from right',
    'Swoops in from the right on an editable arc.',
    [positiveHorizontal('Distance', 280), positiveVertical('Arc height', 130)],
    900,
  ),
  catalogBlock(
    'hop-left',
    'physics',
    'Hop left',
    'Hops left and back with editable distance and height.',
    [
      positiveHorizontal('Distance', 90),
      positiveVertical('Height', 70),
      repeats(2, 'Hops'),
    ],
    900,
  ),
  catalogBlock(
    'hop-right',
    'physics',
    'Hop right',
    'Hops right and back with editable distance and height.',
    [
      positiveHorizontal('Distance', 90),
      positiveVertical('Height', 70),
      repeats(2, 'Hops'),
    ],
    900,
  ),
  catalogBlock(
    'ladder-up',
    'paths',
    'Ladder up',
    'Climbs an editable stair-step path and returns.',
    [
      positiveHorizontal('Step width', 54),
      positiveVertical('Step height', 42),
      repeats(4, 'Steps'),
    ],
    1_100,
  ),
  catalogBlock(
    'ladder-down',
    'paths',
    'Ladder down',
    'Descends an editable stair-step path and returns.',
    [
      positiveHorizontal('Step width', 54),
      positiveVertical('Step height', 42),
      repeats(4, 'Steps'),
    ],
    1_100,
  ),
  catalogBlock(
    'figure-eight',
    'paths',
    'Figure eight',
    'Traces an editable figure-eight path.',
    [
      positiveHorizontal('Radius X', 120),
      positiveVertical('Radius Y', 70),
      repeats(2, 'Loops'),
    ],
    1_500,
  ),
  catalogBlock(
    'infinity-loop',
    'paths',
    'Infinity loop',
    'Loops continuously through an editable infinity path.',
    [
      positiveHorizontal('Width', 140),
      positiveVertical('Height', 70),
      repeats(3, 'Loops'),
    ],
    1_700,
  ),
  catalogBlock(
    'circle-clockwise',
    'paths',
    'Circle clockwise',
    'Circles clockwise with editable radius and laps.',
    [positiveHorizontal('Radius', 100), repeats(2, 'Laps')],
    1_400,
  ),
  catalogBlock(
    'circle-counterclockwise',
    'paths',
    'Circle counterclockwise',
    'Circles counterclockwise with editable radius and laps.',
    [positiveHorizontal('Radius', 100), repeats(2, 'Laps')],
    1_400,
  ),
  catalogBlock(
    'ellipse-loop',
    'paths',
    'Ellipse loop',
    'Loops around an editable horizontal ellipse.',
    [
      positiveHorizontal('Radius X', 150),
      positiveVertical('Radius Y', 70),
      repeats(2, 'Laps'),
    ],
    1_400,
  ),
  catalogBlock(
    'snake',
    'paths',
    'Snake path',
    'Slithers through editable side-to-side turns.',
    [
      positiveHorizontal('Width', 100),
      positiveVertical('Height', 55),
      repeats(5, 'Turns'),
    ],
    1_400,
  ),
  catalogBlock(
    'stair-step',
    'paths',
    'Stair step',
    'Steps diagonally with editable rise, run, and count.',
    [
      positiveHorizontal('Step width', 48),
      positiveVertical('Step height', 38),
      repeats(4, 'Steps'),
    ],
    1_100,
  ),
  catalogBlock(
    'sawtooth',
    'paths',
    'Sawtooth path',
    'Repeats editable sharp rises and drops.',
    [
      positiveHorizontal('Width', 85),
      positiveVertical('Height', 70),
      repeats(4, 'Teeth'),
    ],
    1_200,
  ),
  catalogBlock(
    'triangle-path',
    'paths',
    'Triangle path',
    'Traces an editable triangular route.',
    [
      positiveHorizontal('Width', 130),
      positiveVertical('Height', 100),
      repeats(2, 'Laps'),
    ],
    1_300,
  ),
  catalogBlock(
    'square-path',
    'paths',
    'Square path',
    'Traces an editable rectangular route.',
    [
      positiveHorizontal('Width', 120),
      positiveVertical('Height', 90),
      repeats(2, 'Laps'),
    ],
    1_400,
  ),
  catalogBlock(
    'diamond-path',
    'paths',
    'Diamond path',
    'Traces an editable diamond route.',
    [
      positiveHorizontal('Width', 130),
      positiveVertical('Height', 100),
      repeats(2, 'Laps'),
    ],
    1_400,
  ),
  catalogBlock(
    'boomerang',
    'paths',
    'Boomerang',
    'Flies through an editable offset and comes back.',
    [
      horizontal('Travel X', 220),
      vertical('Travel Y', -80),
      repeats(2, 'Trips'),
    ],
    1_100,
  ),
  catalogBlock(
    'ricochet',
    'paths',
    'Ricochet',
    'Ricochets between editable horizontal and vertical bounds.',
    [
      positiveHorizontal('Width', 120),
      positiveVertical('Height', 90),
      repeats(4, 'Hits'),
    ],
    1_100,
  ),
  catalogBlock(
    'pinball',
    'paths',
    'Pinball',
    'Pings around an editable box for a chosen hit count.',
    [
      positiveHorizontal('Width', 110),
      positiveVertical('Height', 80),
      repeats(6, 'Hits'),
    ],
    1_300,
  ),
  catalogBlock(
    'pendulum',
    'physics',
    'Pendulum',
    'Swings around the final point at an editable angle.',
    [amount('Angle', 34, 0, 180, 1, '°'), repeats(5, 'Swings')],
    1_400,
  ),
  catalogBlock(
    'drop-bounce',
    'physics',
    'Drop bounce',
    'Drops from an editable height and rebounds before settling.',
    [
      positiveVertical('Drop height', 220),
      secondary('Rebound', 80, 0, 800, 1, 'px'),
      repeats(2, 'Bounces'),
    ],
    1_000,
  ),
  catalogBlock(
    'rubber-band',
    'physics',
    'Rubber band',
    'Stretches scale past normal and rebounds repeatedly.',
    [amount('Stretch', 1.3, 1, 3, 0.05, '×'), repeats(4, 'Rebounds')],
    1_000,
  ),
  catalogBlock(
    'elastic-slide',
    'physics',
    'Elastic slide',
    'Slides from an editable distance with elastic overshoot.',
    [
      horizontal('Travel X', 260),
      secondary('Overshoot', 48, -400, 400, 1, 'px'),
      repeats(3, 'Settles'),
    ],
    1_100,
  ),
  catalogBlock(
    'slingshot',
    'physics',
    'Slingshot',
    'Pulls backward, then launches through an editable offset.',
    [
      horizontal('Launch X', 260),
      vertical('Launch Y', -90),
      secondary('Pullback', 70, 0, 400, 1, 'px'),
    ],
    850,
  ),
  catalogBlock(
    'magnetic-snap',
    'physics',
    'Magnetic snap',
    'Accelerates from an editable offset and snaps into place.',
    [
      horizontal('Travel X', 180),
      vertical('Travel Y', 40),
      secondary('Snap', 22, 0, 200, 1, 'px'),
    ],
    620,
  ),
  catalogBlock(
    'gravity-fall',
    'physics',
    'Gravity fall',
    'Falls from an editable height and settles into place.',
    [
      positiveVertical('Height', 260),
      secondary('Rebound', 45, 0, 400, 1, 'px'),
    ],
    900,
  ),
  catalogBlock(
    'parachute',
    'physics',
    'Parachute',
    'Descends while drifting side to side.',
    [
      positiveVertical('Height', 240),
      positiveHorizontal('Drift', 65),
      repeats(4, 'Swerves'),
    ],
    1_700,
  ),
  catalogBlock(
    'rocket-rise',
    'physics',
    'Rocket rise',
    'Rockets upward from an editable distance with a recoil.',
    [
      positiveVertical('Distance', 300),
      secondary('Recoil', 30, 0, 300, 1, 'px'),
    ],
    700,
  ),
  catalogBlock(
    'toss',
    'physics',
    'Toss',
    'Tosses through an editable two-axis arc and returns.',
    [
      horizontal('Travel X', 160),
      positiveVertical('Height', 120),
      repeats(2, 'Tosses'),
    ],
    1_000,
  ),
  catalogBlock(
    'fling',
    'physics',
    'Fling',
    'Flings through an editable offset and snaps back.',
    [
      horizontal('Travel X', 220),
      vertical('Travel Y', -70),
      repeats(2, 'Flings'),
    ],
    850,
  ),
  catalogBlock(
    'drift-left',
    'motion',
    'Drift left',
    'Drifts left by an editable distance and returns.',
    [positiveHorizontal('Distance', 100), repeats(2, 'Cycles')],
    1_300,
  ),
  catalogBlock(
    'drift-right',
    'motion',
    'Drift right',
    'Drifts right by an editable distance and returns.',
    [positiveHorizontal('Distance', 100), repeats(2, 'Cycles')],
    1_300,
  ),
  catalogBlock(
    'drift-up',
    'motion',
    'Drift up',
    'Drifts upward by an editable distance and returns.',
    [positiveVertical('Distance', 80), repeats(2, 'Cycles')],
    1_300,
  ),
  catalogBlock(
    'drift-down',
    'motion',
    'Drift down',
    'Drifts downward by an editable distance and returns.',
    [positiveVertical('Distance', 80), repeats(2, 'Cycles')],
    1_300,
  ),
  catalogBlock(
    'backtrack',
    'motion',
    'Backtrack',
    'Moves through an editable offset, reverses, and settles.',
    [
      horizontal('Travel X', 140),
      vertical('Travel Y', 40),
      repeats(2, 'Trips'),
    ],
    1_100,
  ),

  catalogBlock(
    'wobble',
    'emphasis',
    'Wobble',
    'Wobbles rotation with editable angle and count.',
    [amount('Angle', 16, 0, 180, 1, '°'), repeats(5, 'Wobbles')],
    1_000,
  ),
  catalogBlock(
    'jello',
    'emphasis',
    'Jello',
    'Alternates editable width and height deformation.',
    [amount('Amount', 0.22, 0, 0.9, 0.05), repeats(5, 'Wobbles')],
    1_000,
  ),
  catalogBlock(
    'heartbeat',
    'emphasis',
    'Heartbeat',
    'Plays a two-step editable scale beat.',
    [amount('Peak scale', 1.24, 1, 4, 0.05, '×'), repeats(3, 'Beats')],
    1_000,
  ),
  catalogBlock(
    'throb',
    'emphasis',
    'Throb',
    'Pulses steadily to an editable scale.',
    [amount('Peak scale', 1.14, 0.05, 4, 0.05, '×'), repeats(5, 'Pulses')],
    1_300,
  ),
  catalogBlock(
    'blink',
    'emphasis',
    'Blink',
    'Blinks to an editable opacity for a chosen count.',
    [amount('Low opacity', 0, 0, 1, 0.05), repeats(4, 'Blinks')],
    800,
  ),
  catalogBlock(
    'shimmer',
    'emphasis',
    'Shimmer',
    'Shimmers with editable brightness and repetition.',
    [amount('Brightness', 1.6, 1, 4, 0.05, '×'), repeats(5, 'Shimmers')],
    1_200,
  ),
  catalogBlock(
    'sparkle',
    'emphasis',
    'Sparkle',
    'Pulses editable brightness and glow.',
    [
      amount('Brightness', 2, 1, 4, 0.05, '×'),
      secondary('Glow', 24, 0, 80, 1, 'px'),
      repeats(4, 'Sparkles'),
    ],
    1_100,
  ),
  catalogBlock(
    'spotlight',
    'emphasis',
    'Spotlight',
    'Raises editable brightness and contrast, then returns.',
    [
      amount('Brightness', 1.7, 1, 4, 0.05, '×'),
      secondary('Contrast', 1.4, 1, 4, 0.05, '×'),
      repeats(2, 'Pulses'),
    ],
    1_100,
  ),
  catalogBlock(
    'neon',
    'emphasis',
    'Neon',
    'Pulses an editable neon glow around the layer.',
    [amount('Glow radius', 34, 0, 80, 1, 'px'), repeats(4, 'Pulses')],
    1_200,
  ),
  catalogBlock(
    'shadow-pulse',
    'emphasis',
    'Shadow pulse',
    'Pulses an editable soft shadow radius.',
    [amount('Shadow radius', 18, 0, 80, 1, 'px'), repeats(3, 'Pulses')],
    1_000,
  ),
  catalogBlock(
    'tilt-left',
    'looks',
    'Tilt left',
    'Tilts left by an editable angle and returns.',
    [amount('Angle', 18, 0, 180, 1, '°'), repeats(2, 'Tilts')],
    800,
  ),
  catalogBlock(
    'tilt-right',
    'looks',
    'Tilt right',
    'Tilts right by an editable angle and returns.',
    [amount('Angle', 18, 0, 180, 1, '°'), repeats(2, 'Tilts')],
    800,
  ),
  catalogBlock(
    'compress',
    'looks',
    'Compress',
    'Compresses height by an editable amount and rebounds.',
    [amount('Amount', 0.3, 0, 0.9, 0.05), repeats(3, 'Presses')],
    900,
  ),
  catalogBlock(
    'inflate',
    'looks',
    'Inflate',
    'Inflates to an editable scale and returns.',
    [amount('Scale', 1.35, 1, 4, 0.05, '×'), repeats(3, 'Inflations')],
    1_000,
  ),
  catalogBlock(
    'deflate',
    'looks',
    'Deflate',
    'Deflates to an editable scale and returns.',
    [amount('Scale', 0.65, 0.05, 1, 0.05, '×'), repeats(3, 'Deflations')],
    1_000,
  ),
  catalogBlock(
    'rubber-stamp',
    'emphasis',
    'Rubber stamp',
    'Drops, squashes, and rebounds like an editable stamp.',
    [
      positiveVertical('Drop', 70),
      amount('Squash', 0.28, 0, 0.9, 0.05),
      repeats(2, 'Stamps'),
    ],
    900,
  ),
  catalogBlock(
    'hinge',
    'looks',
    'Hinge',
    'Swings down from an editable hinge angle and returns.',
    [amount('Angle', 70, 0, 180, 1, '°'), repeats(2, 'Swings')],
    1_000,
  ),
  catalogBlock(
    'card-flip',
    'looks',
    'Card flip',
    'Flips horizontally with editable repetitions.',
    [repeats(2, 'Flips')],
    900,
  ),
  catalogBlock(
    'coin-flip',
    'looks',
    'Coin flip',
    'Flips vertically with editable repetitions.',
    [repeats(3, 'Flips')],
    900,
  ),
  catalogBlock(
    'spin-pulse',
    'emphasis',
    'Spin pulse',
    'Combines editable rotation and scale pulses.',
    [
      amount('Angle', 180, -720, 720, 5, '°'),
      secondary('Scale', 1.2, 0.05, 4, 0.05, '×'),
      repeats(3, 'Pulses'),
    ],
    1_200,
  ),

  catalogBlock(
    'color-pop',
    'effects',
    'Color pop',
    'Pulses editable saturation and returns to the original.',
    [amount('Saturation', 2.4, 0, 4, 0.05, '×'), repeats(3, 'Pulses')],
    1_000,
  ),
  catalogBlock(
    'color-drain',
    'effects',
    'Color drain in',
    'Animates from an editable low saturation into full color.',
    [amount('Start saturation', 0.1, 0, 4, 0.05, '×')],
  ),
  catalogBlock(
    'exposure-flash',
    'effects',
    'Exposure flash',
    'Flashes editable brightness for a chosen count.',
    [amount('Brightness', 2.5, 1, 4, 0.05, '×'), repeats(3, 'Flashes')],
    900,
  ),
  catalogBlock(
    'focus-pull',
    'effects',
    'Focus pull',
    'Pulls focus through an editable blur radius.',
    [amount('Blur radius', 22, 0, 60, 1, 'px'), repeats(2, 'Pulls')],
    1_200,
  ),
  catalogBlock(
    'ghost',
    'effects',
    'Ghost',
    'Fades to an editable ghost opacity and returns.',
    [amount('Opacity', 0.2, 0, 1, 0.05), repeats(3, 'Fades')],
    1_200,
  ),
  catalogBlock(
    'silhouette',
    'effects',
    'Silhouette',
    'Pulses to an editable dark brightness level.',
    [amount('Brightness', 0, 0, 1, 0.05, '×'), repeats(2, 'Pulses')],
    1_000,
  ),
  catalogBlock(
    'warm-up',
    'effects',
    'Warm up',
    'Animates from an editable warm sepia tone.',
    [amount('Warmth', 0.75, 0, 1, 0.05)],
  ),
  catalogBlock(
    'cool-down',
    'effects',
    'Cool down',
    'Animates from an editable cool hue shift.',
    [amount('Hue shift', -45, -720, 720, 5, '°')],
  ),
  catalogBlock(
    'prism',
    'effects',
    'Prism',
    'Cycles through an editable hue range.',
    [amount('Hue range', 300, -720, 720, 5, '°'), repeats(3, 'Cycles')],
    1_400,
  ),
  catalogBlock(
    'chromatic-pulse',
    'effects',
    'Chromatic pulse',
    'Pulses editable hue and saturation together.',
    [
      amount('Hue angle', 120, -720, 720, 5, '°'),
      secondary('Saturation', 2, 0, 4, 0.05, '×'),
      repeats(3, 'Pulses'),
    ],
    1_200,
  ),
  catalogBlock(
    'soft-focus',
    'effects',
    'Soft focus in',
    'Animates from an editable soft blur into focus.',
    [amount('Start blur', 12, 0, 60, 1, 'px')],
  ),
  catalogBlock(
    'hard-focus',
    'effects',
    'Hard focus in',
    'Animates from editable high contrast into normal.',
    [amount('Start contrast', 2.2, 0, 4, 0.05, '×')],
  ),

  catalogBlock(
    'fade-up',
    'transitions',
    'Fade up',
    'Fades in while rising an editable distance.',
    [positiveVertical('Distance', 90)],
  ),
  catalogBlock(
    'fade-down',
    'transitions',
    'Fade down',
    'Fades in while dropping an editable distance.',
    [positiveVertical('Distance', 90)],
  ),
  catalogBlock(
    'fade-left',
    'transitions',
    'Fade left',
    'Fades in while moving left by an editable distance.',
    [positiveHorizontal('Distance', 110)],
  ),
  catalogBlock(
    'fade-right',
    'transitions',
    'Fade right',
    'Fades in while moving right by an editable distance.',
    [positiveHorizontal('Distance', 110)],
  ),
  catalogBlock(
    'zoom-bounce',
    'transitions',
    'Zoom bounce',
    'Zooms from an editable scale, overshoots, and settles.',
    [
      amount('Start scale', 0.3, 0.05, 4, 0.05, '×'),
      secondary('Overshoot', 1.2, 1, 2, 0.01, '×'),
    ],
    800,
  ),
  catalogBlock(
    'rotate-pop',
    'transitions',
    'Rotate pop',
    'Rotates and scales in from editable starting values.',
    [
      amount('Start angle', -90, -720, 720, 5, '°'),
      secondary('Start scale', 0.45, 0.05, 4, 0.05, '×'),
    ],
    700,
  ),
  catalogBlock(
    'flip-in-horizontal',
    'transitions',
    'Flip in horizontal',
    'Flips in across the vertical axis with editable turns.',
    [repeats(1, 'Turns')],
    700,
  ),
  catalogBlock(
    'flip-in-vertical',
    'transitions',
    'Flip in vertical',
    'Flips in across the horizontal axis with editable turns.',
    [repeats(1, 'Turns')],
    700,
  ),
  catalogBlock(
    'blur-in-left',
    'transitions',
    'Blur in from left',
    'Slides from the left through editable blur into focus.',
    [
      positiveHorizontal('Distance', 160),
      amount('Blur radius', 18, 0, 60, 1, 'px'),
    ],
    800,
  ),
  catalogBlock(
    'blur-in-right',
    'transitions',
    'Blur in from right',
    'Slides from the right through editable blur into focus.',
    [
      positiveHorizontal('Distance', 160),
      amount('Blur radius', 18, 0, 60, 1, 'px'),
    ],
    800,
  ),
  catalogBlock(
    'slide-fade-left',
    'transitions',
    'Slide fade left',
    'Slides left and fades in over an editable distance.',
    [positiveHorizontal('Distance', 180)],
  ),
  catalogBlock(
    'slide-fade-right',
    'transitions',
    'Slide fade right',
    'Slides right and fades in over an editable distance.',
    [positiveHorizontal('Distance', 180)],
  ),

  catalogBlock(
    'letter-hop',
    'text',
    'Letter hop',
    'Hops text by an editable height and count.',
    [positiveVertical('Height', 42), repeats(4, 'Hops')],
    900,
  ),
  catalogBlock(
    'letter-wave',
    'text',
    'Letter wave',
    'Moves text through an editable wave path.',
    [
      positiveHorizontal('Width', 55),
      positiveVertical('Height', 28),
      repeats(4, 'Waves'),
    ],
    1_100,
  ),
  catalogBlock(
    'caption-slide',
    'text',
    'Caption slide',
    'Slides a caption from an editable side and distance.',
    [positiveHorizontal('Distance', 140)],
    800,
    true,
  ),
  catalogBlock(
    'subtitle-fade',
    'text',
    'Subtitle fade',
    'Fades a subtitle in from an editable opacity.',
    [amount('Start opacity', 0, 0, 1, 0.05)],
    700,
  ),
  catalogBlock(
    'speech-bounce',
    'text',
    'Speech bounce',
    'Bounces dialogue with editable height and repetitions.',
    [positiveVertical('Height', 46), repeats(3, 'Bounces')],
    900,
  ),
  catalogBlock(
    'thought-float',
    'text',
    'Thought float',
    'Floats a thought by editable distance and cycles.',
    [positiveVertical('Height', 38), repeats(4, 'Cycles')],
    1_300,
  ),
  catalogBlock(
    'headline-drop',
    'text',
    'Headline drop',
    'Drops a headline from an editable height and rebounds.',
    [
      positiveVertical('Height', 160),
      secondary('Rebound', 36, 0, 400, 1, 'px'),
    ],
    850,
  ),
  catalogBlock(
    'text-blink',
    'text',
    'Text blink',
    'Blinks text to an editable opacity for a chosen count.',
    [amount('Low opacity', 0, 0, 1, 0.05), repeats(4, 'Blinks')],
    800,
  ),
];

const MOTION_BLOCK_CATALOG_BY_KIND = new Map(
  MOTION_BLOCK_CATALOG.map((entry) => [entry.kind, entry]),
);

export function createBounceJump(
  index: number,
  overrides: Partial<BounceJump> = {},
): BounceJump {
  const defaultHeights = [170, 120, 78, 42];
  const defaultSpreads = [190, 145, 95, 55];
  const defaultDurations = [460, 400, 340, 280];
  return {
    id: `jump-${index + 1}-${Math.random().toString(36).slice(2, 7)}`,
    direction: 'left',
    height: defaultHeights[index] ?? 42,
    spread: defaultSpreads[index] ?? 55,
    durationMs: defaultDurations[index] ?? 280,
    easing: 'ease-out',
    ...overrides,
  };
}

export function createMotionBlock(
  kind: MotionBlockKind,
  id = `${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
): MotionBlock {
  const catalogEntry = MOTION_BLOCK_CATALOG_BY_KIND.get(kind)!;
  const block: MotionBlock = {
    id,
    kind,
    category: catalogEntry.category,
    label: catalogEntry.label,
    enabled: true,
    sourceElementId: null,
    durationMs: catalogEntry.durationMs,
    easing: 'ease-out',
    x: 0,
    y: 0,
    value: 0,
    secondaryValue: 0,
    repetitions: 1,
    direction: 'left',
    jumps:
      kind === 'bounce'
        ? Array.from({ length: 4 }, (_, index) => createBounceJump(index))
        : [],
  };
  for (const parameterSpec of catalogEntry.parameters) {
    block[parameterSpec.field] = parameterSpec.defaultValue;
  }
  return block;
}

function hasSingleLeadingMotionEvent(blocks: readonly MotionBlock[]): boolean {
  return (
    isMotionEventBlockKind(blocks[0]?.kind) &&
    blocks.slice(1).every((block) => !isMotionEventBlockKind(block.kind))
  );
}

export function replaceMotionEvent(
  blocks: readonly MotionBlock[],
  eventKind: MotionEventBlockKind,
): MotionBlock[] {
  if (!hasSingleLeadingMotionEvent(blocks)) return [...blocks];
  const current = blocks[0];
  if (current.kind === eventKind) return [...blocks];
  return [
    {
      ...createMotionBlock(eventKind, current.id),
      enabled: current.enabled,
    },
    ...blocks.slice(1),
  ];
}

export function insertMotionActionBefore(
  blocks: readonly MotionBlock[],
  action: MotionBlock,
  beforeActionId: string | null = null,
): MotionBlock[] {
  const unchanged = () => [...blocks];
  if (
    !hasSingleLeadingMotionEvent(blocks) ||
    isMotionEventBlockKind(action.kind) ||
    blocks.length >= MAX_MOTION_BLOCKS ||
    blocks.some((block) => block.id === action.id)
  ) {
    return unchanged();
  }

  const actions = blocks.slice(1);
  const insertionIndex =
    beforeActionId === null
      ? actions.length
      : actions.findIndex((block) => block.id === beforeActionId);
  if (insertionIndex < 0) return unchanged();

  return [
    blocks[0],
    ...actions.slice(0, insertionIndex),
    action,
    ...actions.slice(insertionIndex),
  ];
}

export function reorderMotionActionBefore(
  blocks: readonly MotionBlock[],
  actionId: string,
  beforeActionId: string | null = null,
): MotionBlock[] {
  const unchanged = () => [...blocks];
  if (!hasSingleLeadingMotionEvent(blocks)) return unchanged();

  const actions = blocks.slice(1);
  const actionIndex = actions.findIndex((block) => block.id === actionId);
  if (actionIndex < 0 || beforeActionId === actionId) return unchanged();
  if (
    beforeActionId !== null &&
    !actions.some((block) => block.id === beforeActionId)
  ) {
    return unchanged();
  }

  const action = actions[actionIndex];
  const remaining = actions.filter((block) => block.id !== actionId);
  const insertionIndex =
    beforeActionId === null
      ? remaining.length
      : remaining.findIndex((block) => block.id === beforeActionId);
  if (insertionIndex < 0) return unchanged();

  return [
    blocks[0],
    ...remaining.slice(0, insertionIndex),
    action,
    ...remaining.slice(insertionIndex),
  ];
}

export type ImageAssetMetadata = {
  mime: string;
  size: number;
  width?: number;
  height?: number;
};

export function detectImageFormat(
  bytes: Uint8Array,
): SupportedImageMime | null {
  const isPng =
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a;
  if (isPng) return 'image/png';

  const isWebp =
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
    String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
  return isWebp ? 'image/webp' : null;
}

export function hasFileDrag(types: Iterable<string>): boolean {
  return Array.from(types).some((type) => type.toLowerCase() === 'files');
}

export function findSupportedImageFile<T extends { type: string }>(
  files: Iterable<T>,
): T | undefined {
  return Array.from(files).find(
    (file) => file.type === 'image/png' || file.type === 'image/webp',
  );
}

export function validateImageAsset(
  metadata: ImageAssetMetadata,
): string | null {
  if (metadata.mime !== 'image/png' && metadata.mime !== 'image/webp') {
    return 'Use a PNG or WebP image';
  }
  if (!Number.isFinite(metadata.size) || metadata.size <= 0) {
    return 'The image file is empty';
  }
  if (metadata.size > MAX_IMAGE_BYTES) {
    return 'Images must be under 750 KB';
  }
  if (metadata.width === undefined || metadata.height === undefined)
    return null;
  if (
    !Number.isInteger(metadata.width) ||
    !Number.isInteger(metadata.height) ||
    metadata.width <= 0 ||
    metadata.height <= 0
  ) {
    return 'The image dimensions are invalid';
  }
  if (
    metadata.width > MAX_IMAGE_DIMENSION ||
    metadata.height > MAX_IMAGE_DIMENSION ||
    metadata.width * metadata.height > MAX_IMAGE_PIXELS
  ) {
    return 'Images must be at most 4096px per side and 12 megapixels';
  }
  return null;
}

export type ElementMotion = {
  schemaVersion: typeof MOTION_SCHEMA_VERSION;
  event: MotionEventBlockKind;
  moveX: number;
  moveY: number;
  durationMs: number;
  delayMs: number;
  fromOpacity: number;
  fromScale: number;
  fromRotation: number;
  easing: Easing;
  blocks: MotionBlock[];
};

export type CompiledMotionStep = {
  blockId: string;
  kind: Exclude<MotionBlockKind, MotionEventBlockKind>;
  startsAtMs: number;
  durationMs: number;
  easing: Easing;
};

export type CompiledMotionKeyframe = {
  offset: number;
  translateX: number;
  translateY: number;
  opacity: number;
  scale: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
  blurPx: number;
  brightness: number;
  contrast: number;
  saturation: number;
  grayscale: number;
  sepia: number;
  hueRotate: number;
  glowPx: number;
  clipTop: number;
  clipRight: number;
  clipBottom: number;
  clipLeft: number;
  easing: Easing | 'steps(1, end)';
};

export type CompiledElementMotion = {
  schemaVersion: typeof MOTION_SCHEMA_VERSION;
  event: MotionEventBlockKind;
  eventSourceElementId: string | null;
  durationMs: number;
  delayMs: number;
  easing: Easing;
  sequenceDurationMs: number;
  steps: CompiledMotionStep[];
  keyframes: CompiledMotionKeyframe[];
  from: {
    translateX: number;
    translateY: number;
    opacity: number;
    scale: number;
    rotation: number;
  };
  to: {
    translateX: 0;
    translateY: 0;
    opacity: number;
    scale: 1;
    rotation: number;
  };
};

export type MotusElement = {
  id: string;
  name: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  fill: string;
  text?: string;
  typography?: ElementTypography;
  src?: string;
  visible: boolean;
  locked: boolean;
  motion: ElementMotion;
};

export function describeElementForAccessibility(element: MotusElement): string {
  if (element.type !== 'text' && element.type !== 'speech') return element.name;
  const content = element.text?.trim().replace(/\s+/g, ' ') ?? '';
  if (!content) return element.name;
  const summary = content.length > 240 ? `${content.slice(0, 239)}…` : content;
  return `${element.name}: ${summary}`;
}

export type MotusScene = {
  id: string;
  name: string;
  background: string;
  elements: MotusElement[];
};

export type MotusChapter = {
  id: string;
  title: string;
  scenes: MotusScene[];
};

export function getSceneThumbnailElements(
  scene: Pick<MotusScene, 'elements'>,
  limit = MAX_SCENE_THUMBNAIL_ELEMENTS,
): MotusElement[] {
  const visibleElements = scene.elements.filter((element) => element.visible);
  const safeLimit = Number.isFinite(limit) ? Math.max(0, Math.floor(limit)) : 0;
  if (safeLimit === 0 || visibleElements.length === 0) return [];
  if (visibleElements.length <= safeLimit) return [...visibleElements];
  if (safeLimit === 1) return [visibleElements.at(-1)!];

  return Array.from({ length: safeLimit }, (_, index) => {
    const sourceIndex = Math.round(
      (index * (visibleElements.length - 1)) / (safeLimit - 1),
    );
    return visibleElements[sourceIndex];
  });
}

export type MotusWorkMetadata = {
  contributorNames: string[];
  workStatus: WorkStatus | null;
  origin: WorkOrigin | null;
  sourceWorkSlug: string | null;
  sourceTitle: string | null;
  sourceCreator: string | null;
  fandom: string | null;
  genres: string[];
  characters: string[];
  relationships: string[];
  themes: string[];
  contentWarnings: string[];
  communityLinks: string[];
};

export type MotusPublicationRevision = {
  id: string;
  revision: number;
  createdAt: string;
  title: string;
  creatorName: string;
  description: string;
  tags: string[];
  language: string;
  contentRating: ContentRating;
  visibility: PublicationVisibility;
  metadata: MotusWorkMetadata;
  format: MotusProjectFormat;
  coverSceneId: string;
  chapters: MotusChapter[];
};

export type MotusProject = {
  schemaVersion: typeof PROJECT_SCHEMA_VERSION;
  id: string;
  title: string;
  creatorName: string;
  description: string;
  tags: string[];
  language: string;
  contentRating: ContentRating;
  visibility: PublicationVisibility;
  metadata: MotusWorkMetadata;
  format: MotusProjectFormat;
  coverSceneId: string;
  publishedRevision: number;
  publications: MotusPublicationRevision[];
  chapters: MotusChapter[];
  updatedAt: string;
};

export function getProjectStorageBytes(project: MotusProject): number {
  return new TextEncoder().encode(JSON.stringify(project)).byteLength;
}

export type DraftJournalStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

export type DraftJournalKeys = {
  pointer: string;
  slotA: string;
  slotB: string;
};

export function writeDraftJournal(
  storage: DraftJournalStorage,
  keys: DraftJournalKeys,
  encoded: string,
  validate: (value: string | null) => boolean,
  mirrorRecovery = false,
): 'a' | 'b' {
  const activeSlot = storage.getItem(keys.pointer) === 'b' ? 'b' : 'a';
  const nextSlot = activeSlot === 'a' ? 'b' : 'a';
  const activeKey = activeSlot === 'a' ? keys.slotA : keys.slotB;
  const nextKey = nextSlot === 'a' ? keys.slotA : keys.slotB;
  const previousRecovery = mirrorRecovery ? storage.getItem(nextKey) : null;

  storage.setItem(nextKey, encoded);
  if (!validate(storage.getItem(nextKey))) {
    throw new Error('Draft verification failed');
  }
  if (mirrorRecovery) {
    try {
      storage.setItem(activeKey, encoded);
      if (!validate(storage.getItem(activeKey))) {
        throw new Error('Draft mirror verification failed');
      }
    } catch (error) {
      if (previousRecovery === null) storage.removeItem(nextKey);
      else storage.setItem(nextKey, previousRecovery);
      throw error;
    }
    try {
      storage.setItem(keys.pointer, nextSlot);
    } catch {
      // Both slots contain the candidate, so the existing pointer remains valid.
    }
  } else {
    storage.setItem(keys.pointer, nextSlot);
  }
  return nextSlot;
}

export type MotusReaderSource = {
  mode: 'draft' | 'revision';
  revision: number | null;
  title: string;
  creatorName: string;
  description: string;
  tags: string[];
  language: string;
  contentRating: ContentRating;
  visibility: PublicationVisibility;
  metadata: MotusWorkMetadata;
  format: MotusProjectFormat;
  coverSceneId: string;
  chapters: MotusChapter[];
};

export function getProjectScenes(source: {
  chapters: MotusChapter[];
}): MotusScene[] {
  return source.chapters.flatMap((chapter) => chapter.scenes);
}

export function findProjectScene(
  source: { chapters: MotusChapter[] },
  sceneId: string,
): { chapter: MotusChapter; scene: MotusScene } | null {
  for (const chapter of source.chapters) {
    const scene = chapter.scenes.find((item) => item.id === sceneId);
    if (scene) return { chapter, scene };
  }
  return null;
}

export function resolveChapterId(
  chapters: MotusChapter[],
  candidate: unknown,
): string {
  if (
    typeof candidate === 'string' &&
    chapters.some((chapter) => chapter.id === candidate)
  ) {
    return candidate;
  }
  return chapters[0]?.id ?? '';
}

export function resolveCoverSceneId(
  scenes: Array<Pick<MotusScene, 'id'>>,
  candidate: unknown,
): string {
  if (
    typeof candidate === 'string' &&
    scenes.some((scene) => scene.id === candidate)
  ) {
    return candidate;
  }
  return scenes[0]?.id ?? '';
}

export function resolveProjectCoverSceneId(
  source: { chapters: MotusChapter[] },
  candidate: unknown,
): string {
  return resolveCoverSceneId(getProjectScenes(source), candidate);
}

export function resolveReaderSource(
  project: MotusProject,
  revision: MotusPublicationRevision | null = null,
): MotusReaderSource {
  return revision
    ? {
        mode: 'revision',
        revision: revision.revision,
        title: revision.title,
        creatorName: revision.creatorName,
        description: revision.description,
        tags: [...revision.tags],
        language: revision.language,
        contentRating: revision.contentRating,
        visibility: revision.visibility,
        metadata: cloneWorkMetadata(revision.metadata),
        format: revision.format,
        coverSceneId: resolveProjectCoverSceneId(
          revision,
          revision.coverSceneId,
        ),
        chapters: revision.chapters,
      }
    : {
        mode: 'draft',
        revision: null,
        title: project.title,
        creatorName:
          project.metadata.contributorNames[0] ?? project.creatorName,
        description: project.description,
        tags: [...project.tags],
        language: project.language,
        contentRating: project.contentRating,
        visibility: project.visibility,
        metadata: cloneWorkMetadata(project.metadata),
        format: project.format,
        coverSceneId: resolveProjectCoverSceneId(project, project.coverSceneId),
        chapters: project.chapters,
      };
}

export type PublicationReadiness = {
  ready: boolean;
  issues: string[];
  chapterCount: number;
  sceneCount: number;
  visibleLayerCount: number;
};

export function getPublicationReadiness(
  project: MotusProject,
): PublicationReadiness {
  const issues: string[] = [];
  const scenes = getProjectScenes(project);
  const visibleLayerCount = scenes.reduce(
    (count, scene) =>
      count + scene.elements.filter((element) => element.visible).length,
    0,
  );

  if (!project.title.trim()) issues.push('Add a title for this work');
  else if (project.title.length > MAX_PROJECT_TITLE_LENGTH) {
    issues.push(`Shorten the title to ${MAX_PROJECT_TITLE_LENGTH} characters`);
  }
  if (project.metadata.contributorNames.length === 0) {
    issues.push('Add at least one creator credit');
  }
  if (!project.metadata.workStatus) {
    issues.push('Choose a completion status');
  }
  if (!project.metadata.origin) {
    issues.push('Choose the work origin');
  } else if (
    project.metadata.origin === 'motus-fanwork' &&
    !project.metadata.sourceWorkSlug
  ) {
    issues.push('Choose the source Motus work');
  } else if (
    project.metadata.origin === 'external-fanwork' &&
    !project.metadata.sourceTitle
  ) {
    issues.push('Name the external source work');
  }
  if (project.chapters.some((chapter) => !chapter.title.trim())) {
    issues.push('Name every chapter');
  }
  if (project.chapters.some((chapter) => chapter.scenes.length === 0)) {
    issues.push('Give every chapter at least one scene');
  }
  if (visibleLayerCount === 0) issues.push('Add at least one visible layer');
  if (!scenes.some((scene) => scene.id === project.coverSceneId)) {
    issues.push('Choose a cover scene');
  }
  if (
    project.publishedRevision >= MAX_PUBLICATION_REVISION ||
    project.publications.some(
      (revision) => revision.revision >= MAX_PUBLICATION_REVISION,
    )
  ) {
    issues.push('Publication history has reached its supported limit');
  }

  return {
    ready: issues.length === 0,
    issues,
    chapterCount: project.chapters.length,
    sceneCount: scenes.length,
    visibleLayerCount,
  };
}

const motion = (
  moveX = 0,
  moveY = 0,
  durationMs = 900,
  fromOpacity = 1,
): ElementMotion => ({
  schemaVersion: MOTION_SCHEMA_VERSION,
  event: 'scene-enter',
  moveX,
  moveY,
  durationMs,
  delayMs: 0,
  fromOpacity,
  fromScale: 1,
  fromRotation: 0,
  easing: 'ease-out',
  blocks: [
    createMotionBlock('scene-enter', 'event'),
    {
      ...createMotionBlock('move', 'move'),
      x: moveX,
      y: moveY,
      durationMs,
    },
    ...(fromOpacity < 1
      ? [
          {
            ...createMotionBlock('opacity', 'opacity'),
            durationMs,
            value: fromOpacity,
          },
        ]
      : []),
  ],
});

const finite = (value: unknown, fallback: number) =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value));

const DEFAULT_ELEMENT_TYPOGRAPHY: Record<TextElementType, ElementTypography> = {
  text: {
    fontPreset: 'editorial',
    fontSize: 34,
    fontWeight: 600,
    textAlign: 'left',
    lineHeight: 1.04,
    letterSpacing: -0.035,
  },
  speech: {
    fontPreset: 'editorial',
    fontSize: 16,
    fontWeight: 700,
    textAlign: 'center',
    lineHeight: 1.15,
    letterSpacing: 0,
  },
};

export function isTextElementType(type: ElementType): type is TextElementType {
  return type === 'text' || type === 'speech';
}

export function getDefaultElementTypography(
  type: ElementType,
): ElementTypography | undefined {
  if (!isTextElementType(type)) return undefined;
  return { ...DEFAULT_ELEMENT_TYPOGRAPHY[type] };
}

const isElementFontPreset = (value: unknown): value is ElementFontPreset =>
  typeof value === 'string' &&
  (ELEMENT_FONT_PRESETS as readonly string[]).includes(value);

const isElementFontWeight = (value: unknown): value is ElementFontWeight =>
  typeof value === 'number' &&
  (ELEMENT_FONT_WEIGHTS as readonly number[]).includes(value);

const isElementTextAlignment = (
  value: unknown,
): value is ElementTextAlignment =>
  typeof value === 'string' &&
  (ELEMENT_TEXT_ALIGNMENTS as readonly string[]).includes(value);

export function normalizeElementTypography(
  type: ElementType,
  value: unknown,
): ElementTypography | undefined {
  const fallback = getDefaultElementTypography(type);
  if (!fallback) return undefined;
  const candidate =
    value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};

  return {
    fontPreset: isElementFontPreset(candidate.fontPreset)
      ? candidate.fontPreset
      : fallback.fontPreset,
    fontSize: clamp(
      Math.round(finite(candidate.fontSize, fallback.fontSize)),
      MIN_ELEMENT_FONT_SIZE,
      MAX_ELEMENT_FONT_SIZE,
    ),
    fontWeight: isElementFontWeight(candidate.fontWeight)
      ? candidate.fontWeight
      : fallback.fontWeight,
    textAlign: isElementTextAlignment(candidate.textAlign)
      ? candidate.textAlign
      : fallback.textAlign,
    lineHeight: clamp(
      finite(candidate.lineHeight, fallback.lineHeight),
      MIN_ELEMENT_LINE_HEIGHT,
      MAX_ELEMENT_LINE_HEIGHT,
    ),
    letterSpacing: clamp(
      finite(candidate.letterSpacing, fallback.letterSpacing),
      MIN_ELEMENT_LETTER_SPACING,
      MAX_ELEMENT_LETTER_SPACING,
    ),
  };
}

export function normalizeMotionBlockNumericField(
  block: MotionBlock,
  field: EditableMotionBlockNumericField,
  value: unknown,
): number {
  const catalogEntry = MOTION_BLOCK_CATALOG_BY_KIND.get(block.kind);
  const currentValue = block[field];
  const fallback = finite(
    currentValue,
    field === 'durationMs'
      ? (catalogEntry?.durationMs ?? 700)
      : field === 'repetitions'
        ? 1
        : 0,
  );
  const numericValue = finite(value, fallback);

  if (field === 'durationMs') {
    if (isMotionEventBlockKind(block.kind)) return 0;
    return clamp(
      Math.round(numericValue),
      block.kind === 'wait' ? 0 : 100,
      10_000,
    );
  }

  if (field === 'repetitions') {
    return clamp(Math.round(numericValue), 1, 20);
  }

  const parameterSpec = catalogEntry?.parameters.find(
    (parameter) => parameter.field === field,
  );
  return parameterSpec
    ? clamp(numericValue, parameterSpec.min, parameterSpec.max)
    : numericValue;
}

export function normalizeBounceJumpNumericField(
  jump: BounceJump,
  field: BounceJumpNumericField,
  value: unknown,
): number {
  const fallback = finite(
    jump[field],
    field === 'height' ? 80 : field === 'spread' ? 100 : 360,
  );
  const numericValue = finite(value, fallback);
  return field === 'durationMs'
    ? clamp(Math.round(numericValue), 80, 10_000)
    : clamp(numericValue, 0, 2_000);
}

function sanitizeProjectTags(values: unknown[]): string[] {
  const tags: string[] = [];
  const seen = new Set<string>();

  for (const value of values) {
    if (typeof value !== 'string') continue;
    const tag = value
      .trim()
      .replace(/\s+/g, ' ')
      .slice(0, MAX_PROJECT_TAG_LENGTH);
    const key = tag.toLocaleLowerCase();
    if (!tag || seen.has(key)) continue;
    tags.push(tag);
    seen.add(key);
    if (tags.length === MAX_PROJECT_TAGS) break;
  }

  return tags;
}

export function parseProjectTags(value: string): string[] {
  return sanitizeProjectTags(value.split(','));
}

function sanitizeWorkMetadataItems(
  values: unknown[],
  maxItems = MAX_PROJECT_METADATA_ITEMS,
): string[] {
  const items: string[] = [];
  const seen = new Set<string>();

  for (const value of values) {
    if (typeof value !== 'string') continue;
    const item = value
      .trim()
      .replace(/\s+/g, ' ')
      .slice(0, MAX_PROJECT_METADATA_VALUE_LENGTH);
    const key = item.toLocaleLowerCase();
    if (!item || seen.has(key)) continue;
    items.push(item);
    seen.add(key);
    if (items.length === maxItems) break;
  }

  return items;
}

export function parseWorkMetadataItems(value: string): string[] {
  return sanitizeWorkMetadataItems(value.split(','));
}

function normalizeOptionalMetadataValue(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().replace(/\s+/g, ' ');
  return normalized
    ? normalized.slice(0, MAX_PROJECT_METADATA_VALUE_LENGTH)
    : null;
}

export function createWorkMetadata(
  source: Partial<MotusWorkMetadata> = {},
  fallbackCreatorName = 'Unknown creator',
): MotusWorkMetadata {
  const workStatus = WORK_STATUSES.includes(source.workStatus as WorkStatus)
    ? (source.workStatus as WorkStatus)
    : null;
  const origin = WORK_ORIGINS.includes(source.origin as WorkOrigin)
    ? (source.origin as WorkOrigin)
    : null;
  const hasExplicitContributors = source.contributorNames !== undefined;
  const contributorNames = sanitizeWorkMetadataItems(
    source.contributorNames ?? [fallbackCreatorName],
    MAX_PROJECT_CONTRIBUTORS,
  );
  const normalizedContributors =
    contributorNames.length || hasExplicitContributors
      ? contributorNames
      : sanitizeWorkMetadataItems(
          [fallbackCreatorName],
          MAX_PROJECT_CONTRIBUTORS,
        );
  return {
    contributorNames: normalizedContributors,
    workStatus,
    origin,
    sourceWorkSlug:
      origin === 'motus-fanwork'
        ? normalizeOptionalMetadataValue(source.sourceWorkSlug)
        : null,
    sourceTitle:
      origin !== 'original'
        ? normalizeOptionalMetadataValue(source.sourceTitle)
        : null,
    sourceCreator:
      origin !== 'original'
        ? normalizeOptionalMetadataValue(source.sourceCreator)
        : null,
    fandom:
      origin !== 'original'
        ? normalizeOptionalMetadataValue(source.fandom)
        : null,
    genres: sanitizeWorkMetadataItems(source.genres ?? []),
    characters: sanitizeWorkMetadataItems(source.characters ?? []),
    relationships: sanitizeWorkMetadataItems(source.relationships ?? []),
    themes: sanitizeWorkMetadataItems(source.themes ?? []),
    contentWarnings: sanitizeWorkMetadataItems(source.contentWarnings ?? []),
    communityLinks: sanitizeWorkMetadataItems(source.communityLinks ?? []),
  };
}

export function cloneWorkMetadata(
  metadata: MotusWorkMetadata,
): MotusWorkMetadata {
  return {
    ...metadata,
    contributorNames: [...metadata.contributorNames],
    genres: [...metadata.genres],
    characters: [...metadata.characters],
    relationships: [...metadata.relationships],
    themes: [...metadata.themes],
    contentWarnings: [...metadata.contentWarnings],
    communityLinks: [...metadata.communityLinks],
  };
}

const MOTION_BLOCK_KIND_SET = new Set<string>(MOTION_BLOCK_KINDS);

const isMotionBlockKind = (value: unknown): value is MotionBlockKind =>
  typeof value === 'string' && MOTION_BLOCK_KIND_SET.has(value);

const normalizeEasing = (value: unknown): Easing =>
  value === 'linear' || value === 'ease-in-out' ? value : 'ease-out';

function normalizeBounceJumps(value: unknown): BounceJump[] {
  if (!Array.isArray(value)) return [];
  return value
    .flatMap((candidate, index) => {
      if (
        !candidate ||
        typeof candidate !== 'object' ||
        Array.isArray(candidate)
      )
        return [];
      const raw = candidate as Partial<BounceJump>;
      const fallbackJump: BounceJump = {
        ...createBounceJump(index, {
          id:
            typeof raw.id === 'string' && raw.id ? raw.id : `jump-${index + 1}`,
        }),
        height: 80,
        spread: 100,
        durationMs: 360,
        direction: raw.direction === 'right' ? 'right' : 'left',
        easing: normalizeEasing(raw.easing),
      };
      const jump: BounceJump = {
        ...fallbackJump,
        height: normalizeBounceJumpNumericField(
          fallbackJump,
          'height',
          raw.height,
        ),
        spread: normalizeBounceJumpNumericField(
          fallbackJump,
          'spread',
          raw.spread,
        ),
        durationMs: normalizeBounceJumpNumericField(
          fallbackJump,
          'durationMs',
          raw.durationMs,
        ),
      };
      return [jump];
    })
    .slice(0, MAX_BOUNCE_JUMPS);
}

function normalizeMotionBlocks(
  value: unknown,
  legacy: Partial<ElementMotion>,
): MotionBlock[] {
  const fallbackEventKind = isMotionEventBlockKind(legacy.event)
    ? legacy.event
    : 'scene-enter';
  if (Array.isArray(value)) {
    const seen = new Set<string>();
    let eventBlock: MotionBlock | null = null;
    const actionBlocks: MotionBlock[] = [];
    for (let index = 0; index < value.length; index += 1) {
      const candidate = value[index];
      if (
        !candidate ||
        typeof candidate !== 'object' ||
        Array.isArray(candidate)
      )
        continue;
      const raw = candidate as Partial<MotionBlock>;
      if (!isMotionBlockKind(raw.kind)) continue;
      const block = createMotionBlock(
        raw.kind,
        typeof raw.id === 'string' && raw.id
          ? raw.id
          : `${raw.kind}-${index + 1}`,
      );
      block.enabled = raw.enabled !== false;
      block.sourceElementId =
        block.kind === 'animation-finish' &&
        typeof raw.sourceElementId === 'string' &&
        raw.sourceElementId.trim()
          ? raw.sourceElementId
              .trim()
              .slice(0, MAX_MOTION_EVENT_SOURCE_ID_LENGTH)
          : null;
      block.durationMs = normalizeMotionBlockNumericField(
        block,
        'durationMs',
        raw.durationMs,
      );
      block.easing = normalizeEasing(raw.easing);
      for (const field of [
        'x',
        'y',
        'value',
        'secondaryValue',
        'repetitions',
      ] as const) {
        block[field] = normalizeMotionBlockNumericField(
          block,
          field,
          raw[field],
        );
      }
      block.direction =
        raw.direction === 'right' ||
        raw.direction === 'up' ||
        raw.direction === 'down'
          ? raw.direction
          : 'left';
      const jumps = normalizeBounceJumps(raw.jumps);
      if (block.kind === 'bounce' && jumps.length > 0) block.jumps = jumps;
      if (seen.has(block.id)) block.id = `${block.id}-${index + 1}`;
      seen.add(block.id);
      if (isMotionEventBlockKind(block.kind)) {
        if (!eventBlock) eventBlock = block;
      } else if (actionBlocks.length < MAX_MOTION_BLOCKS - 1) {
        actionBlocks.push(block);
      }
    }
    return [
      eventBlock ?? createMotionBlock(fallbackEventKind, 'event'),
      ...actionBlocks,
    ];
  }

  const migrated = motion(
    finite(legacy.moveX, 0),
    finite(legacy.moveY, 0),
    finite(legacy.durationMs, 900),
    finite(legacy.fromOpacity, 1),
  ).blocks;
  migrated[0] = createMotionBlock(fallbackEventKind, 'event');
  if (finite(legacy.delayMs, 0) > 0) {
    migrated.splice(1, 0, {
      ...createMotionBlock('wait', 'wait'),
      durationMs: finite(legacy.delayMs, 0),
    });
  }
  if (finite(legacy.fromScale, 1) !== 1) {
    migrated.push({
      ...createMotionBlock('scale', 'scale'),
      durationMs: finite(legacy.durationMs, 900),
      value: finite(legacy.fromScale, 1),
    });
  }
  if (finite(legacy.fromRotation, 0) !== 0) {
    migrated.push({
      ...createMotionBlock('rotate', 'rotate'),
      durationMs: finite(legacy.durationMs, 900),
      value: finite(legacy.fromRotation, 0),
    });
  }
  return migrated.slice(0, MAX_MOTION_BLOCKS);
}

function migrateMotion(
  value: Partial<ElementMotion> | undefined,
): ElementMotion {
  const legacy = value ?? {};
  const blocks = normalizeMotionBlocks(legacy.blocks, legacy);
  const event = isMotionEventBlockKind(blocks[0]?.kind)
    ? blocks[0].kind
    : 'scene-enter';
  return {
    schemaVersion: MOTION_SCHEMA_VERSION,
    event,
    moveX: finite(legacy.moveX, 0),
    moveY: finite(legacy.moveY, 0),
    durationMs: finite(legacy.durationMs, 900),
    delayMs: finite(legacy.delayMs, 0),
    fromOpacity: finite(legacy.fromOpacity, 1),
    fromScale: finite(legacy.fromScale, 1),
    fromRotation: finite(legacy.fromRotation, 0),
    easing:
      legacy.easing === 'linear' || legacy.easing === 'ease-in-out'
        ? legacy.easing
        : 'ease-out',
    blocks,
  };
}

export function wouldCreateAnimationFinishCycle(
  elements: readonly MotusElement[],
  targetElementId: string,
  sourceElementId: string,
): boolean {
  if (!targetElementId || !sourceElementId) return false;
  if (targetElementId === sourceElementId) return true;

  const byId = new Map(elements.map((element) => [element.id, element]));
  const visited = new Set<string>();
  let currentId: string | null = sourceElementId;
  while (currentId && !visited.has(currentId)) {
    if (currentId === targetElementId) return true;
    visited.add(currentId);
    const current = byId.get(currentId);
    if (!current) return false;
    const motion = migrateMotion(current.motion);
    const eventBlock = motion.blocks[0];
    currentId =
      eventBlock?.kind === 'animation-finish'
        ? eventBlock.sourceElementId
        : null;
  }
  return false;
}

export function constrainElementToCanvas(
  element: MotusElement,
  canvasWidth = CANVAS_WIDTH,
  canvasHeight = CANVAS_HEIGHT,
): MotusElement {
  const safeCanvasWidth = Math.max(
    MIN_ELEMENT_WIDTH,
    finite(canvasWidth, CANVAS_WIDTH),
  );
  const safeCanvasHeight = Math.max(
    MIN_ELEMENT_HEIGHT,
    finite(canvasHeight, CANVAS_HEIGHT),
  );
  const width = clamp(
    finite(element.width, MIN_ELEMENT_WIDTH),
    MIN_ELEMENT_WIDTH,
    safeCanvasWidth,
  );
  const height = clamp(
    finite(element.height, MIN_ELEMENT_HEIGHT),
    MIN_ELEMENT_HEIGHT,
    safeCanvasHeight,
  );

  return {
    ...element,
    x: clamp(finite(element.x, 0), 0, safeCanvasWidth - width),
    y: clamp(finite(element.y, 0), 0, safeCanvasHeight - height),
    width,
    height,
    rotation: clamp(finite(element.rotation, 0), -180, 180),
    opacity: clamp(finite(element.opacity, 1), 0, 1),
  };
}

export function transformElementByPointer(
  element: MotusElement,
  mode: ElementPointerTransformMode,
  deltaX: number,
  deltaY: number,
): MotusElement {
  if (mode === 'move') {
    return constrainElementToCanvas({
      ...element,
      x: Math.round(element.x + deltaX),
      y: Math.round(element.y + deltaY),
    });
  }

  if (mode === 'rotate') {
    const rotation =
      ((((element.rotation + deltaX + 180) % 360) + 360) % 360) - 180;
    return constrainElementToCanvas({
      ...element,
      rotation: Math.round(rotation),
    });
  }

  const handle = mode === 'resize' ? 'se' : mode.slice('resize-'.length);
  const resizeWest = handle.includes('w');
  const resizeEast = handle.includes('e');
  const resizeNorth = handle.includes('n');
  const resizeSouth = handle.includes('s');
  const radians = (element.rotation * Math.PI) / 180;
  const cosine = Math.cos(radians);
  const sine = Math.sin(radians);
  const localDeltaX = deltaX * cosine + deltaY * sine;
  const localDeltaY = -deltaX * sine + deltaY * cosine;
  const widthDelta = resizeWest ? -localDeltaX : resizeEast ? localDeltaX : 0;
  const heightDelta = resizeNorth
    ? -localDeltaY
    : resizeSouth
      ? localDeltaY
      : 0;
  const targetWidth = clamp(
    element.width + widthDelta,
    MIN_ELEMENT_WIDTH,
    CANVAS_WIDTH,
  );
  const targetHeight = clamp(
    element.height + heightDelta,
    MIN_ELEMENT_HEIGHT,
    CANVAS_HEIGHT,
  );
  const resizeToDimensions = (
    widthCandidate: number,
    heightCandidate: number,
  ) => {
    const width = Math.round(widthCandidate);
    const height = Math.round(heightCandidate);
    const localCenterShiftX = resizeWest
      ? -(width - element.width) / 2
      : resizeEast
        ? (width - element.width) / 2
        : 0;
    const localCenterShiftY = resizeNorth
      ? -(height - element.height) / 2
      : resizeSouth
        ? (height - element.height) / 2
        : 0;
    const centerX =
      element.x +
      element.width / 2 +
      localCenterShiftX * cosine -
      localCenterShiftY * sine;
    const centerY =
      element.y +
      element.height / 2 +
      localCenterShiftX * sine +
      localCenterShiftY * cosine;
    return {
      x: Math.round(centerX - width / 2),
      y: Math.round(centerY - height / 2),
      width,
      height,
    };
  };
  const fitsCanvas = (candidate: {
    x: number;
    y: number;
    width: number;
    height: number;
  }) =>
    candidate.x >= 0 &&
    candidate.y >= 0 &&
    candidate.x + candidate.width <= CANVAS_WIDTH &&
    candidate.y + candidate.height <= CANVAS_HEIGHT;

  let resized = resizeToDimensions(element.width, element.height);
  const advanceDimension = (property: 'width' | 'height', target: number) => {
    const start = resized[property];
    const resizeAtProgress = (progress: number) =>
      resizeToDimensions(
        property === 'width'
          ? start + (target - start) * progress
          : resized.width,
        property === 'height'
          ? start + (target - start) * progress
          : resized.height,
      );
    const targetGeometry = resizeAtProgress(1);
    if (fitsCanvas(targetGeometry)) return targetGeometry;

    let lower = 0;
    let upper = 1;
    let bounded = resizeAtProgress(0);
    for (let iteration = 0; iteration < 32; iteration += 1) {
      const progress = (lower + upper) / 2;
      const candidate = resizeAtProgress(progress);
      if (fitsCanvas(candidate)) {
        lower = progress;
        bounded = candidate;
      } else {
        upper = progress;
      }
    }
    return bounded;
  };

  resized = advanceDimension('width', targetWidth);
  resized = advanceDimension('height', targetHeight);
  // A height reduction can make additional width available on a rotated box.
  resized = advanceDimension('width', targetWidth);

  return { ...element, ...resized };
}

export type ElementAlignment =
  | 'left'
  | 'center'
  | 'right'
  | 'top'
  | 'middle'
  | 'bottom';

export type ElementDistributionAxis = 'horizontal' | 'vertical';

type IndexedElement = {
  element: MotusElement;
  index: number;
};

function getEditableSelectedElements(
  elements: readonly MotusElement[],
  selectedElementIds: Iterable<string>,
): IndexedElement[] {
  const selectedIds = new Set(selectedElementIds);
  return elements.flatMap((element, index) =>
    selectedIds.has(element.id) && !element.locked ? [{ element, index }] : [],
  );
}

/**
 * Moves a selection with one shared bounded delta so members cannot shear apart
 * when the cohort reaches a canvas edge.
 */
export function translateSelectedElements(
  elements: readonly MotusElement[],
  selectedElementIds: Iterable<string>,
  deltaX: number,
  deltaY: number,
  canvasWidth = CANVAS_WIDTH,
  canvasHeight = CANVAS_HEIGHT,
): MotusElement[] {
  const selected = getEditableSelectedElements(elements, selectedElementIds);
  if (selected.length === 0) return [...elements];

  const safeCanvasWidth = Math.max(0, finite(canvasWidth, CANVAS_WIDTH));
  const safeCanvasHeight = Math.max(0, finite(canvasHeight, CANVAS_HEIGHT));
  const minimumX = Math.min(...selected.map(({ element }) => element.x));
  const minimumY = Math.min(...selected.map(({ element }) => element.y));
  const maximumX = Math.max(
    ...selected.map(({ element }) => element.x + element.width),
  );
  const maximumY = Math.max(
    ...selected.map(({ element }) => element.y + element.height),
  );
  const minimumDeltaX = -minimumX;
  const maximumDeltaX = safeCanvasWidth - maximumX;
  const minimumDeltaY = -minimumY;
  const maximumDeltaY = safeCanvasHeight - maximumY;
  const boundedDeltaX =
    minimumDeltaX <= maximumDeltaX
      ? clamp(Math.round(finite(deltaX, 0)), minimumDeltaX, maximumDeltaX)
      : 0;
  const boundedDeltaY =
    minimumDeltaY <= maximumDeltaY
      ? clamp(Math.round(finite(deltaY, 0)), minimumDeltaY, maximumDeltaY)
      : 0;
  const selectedIndexes = new Set(selected.map(({ index }) => index));

  return elements.map((element, index) =>
    selectedIndexes.has(index) && (boundedDeltaX !== 0 || boundedDeltaY !== 0)
      ? {
          ...element,
          x: element.x + boundedDeltaX,
          y: element.y + boundedDeltaY,
        }
      : element,
  );
}

/** Aligns editable selected elements to their collective authored bounds. */
export function alignSelectedElements(
  elements: readonly MotusElement[],
  selectedElementIds: Iterable<string>,
  alignment: ElementAlignment,
): MotusElement[] {
  const selected = getEditableSelectedElements(elements, selectedElementIds);
  if (selected.length < 2) return [...elements];

  const left = Math.min(...selected.map(({ element }) => element.x));
  const top = Math.min(...selected.map(({ element }) => element.y));
  const right = Math.max(
    ...selected.map(({ element }) => element.x + element.width),
  );
  const bottom = Math.max(
    ...selected.map(({ element }) => element.y + element.height),
  );
  const horizontalCenter = (left + right) / 2;
  const verticalCenter = (top + bottom) / 2;
  const updates = new Map<number, { x: number; y: number }>();

  for (const { element, index } of selected) {
    let x = element.x;
    let y = element.y;
    if (alignment === 'left') x = left;
    else if (alignment === 'center') x = horizontalCenter - element.width / 2;
    else if (alignment === 'right') x = right - element.width;
    else if (alignment === 'top') y = top;
    else if (alignment === 'middle') y = verticalCenter - element.height / 2;
    else if (alignment === 'bottom') y = bottom - element.height;
    updates.set(index, { x, y });
  }

  return elements.map((element, index) => {
    const update = updates.get(index);
    if (!update || (update.x === element.x && update.y === element.y)) {
      return element;
    }
    return { ...element, ...update };
  });
}

/**
 * Spaces editable selected elements evenly between their first and last
 * spatial anchors while keeping scene stacking order unchanged.
 */
export function distributeSelectedElements(
  elements: readonly MotusElement[],
  selectedElementIds: Iterable<string>,
  axis: ElementDistributionAxis,
  canvasWidth = CANVAS_WIDTH,
  canvasHeight = CANVAS_HEIGHT,
): MotusElement[] {
  const selected = getEditableSelectedElements(elements, selectedElementIds);
  if (selected.length < 3) return [...elements];

  const ordered = [...selected].sort((left, right) => {
    const positionDifference =
      axis === 'horizontal'
        ? left.element.x - right.element.x
        : left.element.y - right.element.y;
    return positionDifference || left.index - right.index;
  });
  const first = ordered[0].element;
  const last = ordered.at(-1)!.element;
  const middleSize = ordered
    .slice(1, -1)
    .reduce(
      (total, { element }) =>
        total + (axis === 'horizontal' ? element.width : element.height),
      0,
    );
  const firstEnd =
    axis === 'horizontal' ? first.x + first.width : first.y + first.height;
  const lastStart = axis === 'horizontal' ? last.x : last.y;
  const gap = (lastStart - firstEnd - middleSize) / (ordered.length - 1);
  const updates = new Map<number, number>();
  let cursor = firstEnd + gap;

  for (const { element, index } of ordered.slice(1, -1)) {
    updates.set(index, cursor);
    cursor += (axis === 'horizontal' ? element.width : element.height) + gap;
  }

  const axisLimit = Math.max(
    0,
    finite(
      axis === 'horizontal' ? canvasWidth : canvasHeight,
      axis === 'horizontal' ? CANVAS_WIDTH : CANVAS_HEIGHT,
    ),
  );
  const proposalFitsCanvas = ordered
    .slice(1, -1)
    .every(({ element, index }) => {
      const position = updates.get(index)!;
      const size = axis === 'horizontal' ? element.width : element.height;
      return position >= 0 && position + size <= axisLimit;
    });
  if (!proposalFitsCanvas) return [...elements];

  return elements.map((element, index) => {
    const position = updates.get(index);
    if (position === undefined) return element;
    if (axis === 'horizontal') {
      return position === element.x ? element : { ...element, x: position };
    }
    return position === element.y ? element : { ...element, y: position };
  });
}

export function hasPointerDragStarted(
  deltaX: number,
  deltaY: number,
  pointerType: string,
): boolean {
  const threshold = pointerType === 'touch' ? 6 : pointerType === 'pen' ? 3 : 2;
  return (
    Number.isFinite(deltaX) &&
    Number.isFinite(deltaY) &&
    Math.hypot(deltaX, deltaY) >= threshold
  );
}

export function getKeyboardNudgeDelta(
  key: string,
  accelerated = false,
): { x: number; y: number } | null {
  const distance = accelerated ? 10 : 1;
  if (key === 'ArrowLeft') return { x: -distance, y: 0 };
  if (key === 'ArrowRight') return { x: distance, y: 0 };
  if (key === 'ArrowUp') return { x: 0, y: -distance };
  if (key === 'ArrowDown') return { x: 0, y: distance };
  return null;
}

export type EditorShortcut = 'duplicate' | 'redo' | 'save' | 'undo';

export function getEditorShortcut(
  key: string,
  commandKey: boolean,
  shiftKey = false,
): EditorShortcut | null {
  if (!commandKey) return null;
  const normalizedKey = key.toLowerCase();
  if (normalizedKey === 's') return 'save';
  if (normalizedKey === 'z') return shiftKey ? 'redo' : 'undo';
  if (normalizedKey === 'y') return 'redo';
  if (normalizedKey === 'd') return 'duplicate';
  return null;
}

export function getFitCanvasWidth(
  containerWidth: number,
  containerHeight: number,
  horizontalPadding = 0,
  verticalPadding = 0,
): number {
  if (
    !Number.isFinite(containerWidth) ||
    !Number.isFinite(containerHeight) ||
    containerWidth <= 0 ||
    containerHeight <= 0
  ) {
    return 430;
  }

  const safeHorizontalPadding = Number.isFinite(horizontalPadding)
    ? Math.max(0, horizontalPadding)
    : 0;
  const safeVerticalPadding = Number.isFinite(verticalPadding)
    ? Math.max(0, verticalPadding)
    : 0;
  const availableWidth = Math.max(0, containerWidth - safeHorizontalPadding);
  const availableHeight = Math.max(0, containerHeight - safeVerticalPadding);
  const fittedWidth = Math.min(
    availableWidth,
    availableHeight * (CANVAS_WIDTH / CANVAS_HEIGHT),
    CANVAS_WIDTH,
  );

  return Math.max(180, Math.floor(fittedWidth));
}

export function shouldEndContinuousHistoryOnKey(key: string): boolean {
  return [
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
    'ArrowUp',
    'End',
    'Home',
    'PageDown',
    'PageUp',
  ].includes(key);
}

type MotionFrameState = Omit<CompiledMotionKeyframe, 'offset' | 'easing'>;

const copyMotionState = (state: MotionFrameState): MotionFrameState => ({
  ...state,
});

function getBlockDuration(block: MotionBlock): number {
  if (block.kind === 'bounce') {
    return block.jumps.reduce(
      (total, jump) =>
        total +
        normalizeBounceJumpNumericField(jump, 'durationMs', jump.durationMs),
      0,
    );
  }
  return normalizeMotionBlockNumericField(
    block,
    'durationMs',
    block.durationMs,
  );
}

function getBlockInputState(
  block: MotionBlock,
  output: MotionFrameState,
): MotionFrameState {
  const input = copyMotionState(output);
  const setDirectionalClip = (amount: number) => {
    if (block.direction === 'right') input.clipRight = amount;
    else if (block.direction === 'up') input.clipTop = amount;
    else if (block.direction === 'down') input.clipBottom = amount;
    else input.clipLeft = amount;
  };

  switch (block.kind) {
    case 'move':
    case 'drift':
    case 'glide-in':
    case 'snap-in':
    case 'magnetic-snap':
      input.translateX = clamp(output.translateX - block.x, -8_000, 8_000);
      input.translateY = clamp(output.translateY - block.y, -8_000, 8_000);
      break;
    case 'slide-left':
    case 'dash-in':
    case 'skid-in':
    case 'elastic-slide':
    case 'swoop-left':
    case 'blur-in-left':
    case 'slide-fade-right':
      input.translateX = clamp(
        output.translateX - Math.abs(block.x),
        -8_000,
        8_000,
      );
      if (block.kind === 'swoop-left') {
        input.translateY = clamp(
          output.translateY + Math.abs(block.y),
          -8_000,
          8_000,
        );
      }
      if (block.kind === 'blur-in-left') {
        input.blurPx = clamp(block.value, 0, 60);
      }
      if (block.kind === 'slide-fade-right') input.opacity = 0;
      break;
    case 'slide-right':
    case 'swoop-right':
    case 'blur-in-right':
    case 'slide-fade-left':
      input.translateX = clamp(
        output.translateX + Math.abs(block.x),
        -8_000,
        8_000,
      );
      if (block.kind === 'swoop-right') {
        input.translateY = clamp(
          output.translateY + Math.abs(block.y),
          -8_000,
          8_000,
        );
      }
      if (block.kind === 'blur-in-right') {
        input.blurPx = clamp(block.value, 0, 60);
      }
      if (block.kind === 'slide-fade-left') input.opacity = 0;
      break;
    case 'slide-up':
    case 'gravity-fall':
    case 'headline-drop':
    case 'parachute':
    case 'drop-bounce':
      input.translateY = clamp(
        output.translateY - Math.abs(block.y),
        -8_000,
        8_000,
      );
      break;
    case 'slide-down':
    case 'rocket-rise':
      input.translateY = clamp(
        output.translateY + Math.abs(block.y),
        -8_000,
        8_000,
      );
      break;
    case 'arc-in':
      input.translateX = clamp(output.translateX - block.x, -8_000, 8_000);
      input.translateY = clamp(
        output.translateY + Math.abs(block.y),
        -8_000,
        8_000,
      );
      break;
    case 'roll':
      input.translateX = clamp(output.translateX - block.x, -8_000, 8_000);
      input.rotation = clamp(output.rotation + block.value, -1_440, 1_440);
      break;
    case 'overshoot':
      input.translateX = clamp(output.translateX - block.x, -8_000, 8_000);
      break;
    case 'jump':
      input.translateY = clamp(
        output.translateY + Math.abs(block.y),
        -8_000,
        8_000,
      );
      break;
    case 'rotate':
    case 'spin':
      input.rotation = clamp(output.rotation + block.value, -1_440, 1_440);
      break;
    case 'scale':
    case 'grow':
    case 'shrink':
    case 'spring':
    case 'zoom-in':
    case 'zoom-out':
      input.scale = clamp(block.value, 0.05, 4);
      break;
    case 'pop-in':
    case 'dialogue-pop':
      input.scale = clamp(block.value, 0.05, 4);
      input.opacity = 0;
      break;
    case 'opacity':
      input.opacity = clamp(block.value, 0, 1);
      break;
    case 'caption-slide': {
      const distance = Math.abs(block.x);
      if (block.direction === 'right') input.translateX -= distance;
      else if (block.direction === 'up') input.translateY += distance;
      else if (block.direction === 'down') input.translateY -= distance;
      else input.translateX += distance;
      input.opacity = 0;
      break;
    }
    case 'blur':
      input.blurPx = clamp(block.value, 0, 60);
      break;
    case 'brightness':
      input.brightness = clamp(block.value, 0, 4);
      break;
    case 'contrast':
      input.contrast = clamp(block.value, 0, 4);
      break;
    case 'saturate':
    case 'desaturate':
    case 'color-drain':
      input.saturation = clamp(block.value, 0, 4);
      break;
    case 'grayscale':
      input.grayscale = clamp(block.value, 0, 1);
      break;
    case 'sepia':
    case 'warm-up':
      input.sepia = clamp(block.value, 0, 1);
      break;
    case 'hue-rotate':
    case 'cool-down':
      input.hueRotate = clamp(block.value, -720, 720);
      break;
    case 'soft-focus':
      input.blurPx = clamp(block.value, 0, 60);
      break;
    case 'hard-focus':
      input.contrast = clamp(block.value, 0, 4);
      break;
    case 'reveal':
    case 'wipe':
    case 'text-reveal':
      setDirectionalClip(clamp(block.value, 0, 100));
      break;
    case 'type-on':
      input.clipRight = clamp(block.value, 0, 100);
      break;
    case 'curtain': {
      const half = clamp(block.value, 0, 100) / 2;
      input.clipLeft = half;
      input.clipRight = half;
      break;
    }
    case 'rise-in':
    case 'caption-rise':
    case 'fade-up':
      input.translateY = clamp(
        output.translateY + Math.abs(block.y),
        -8_000,
        8_000,
      );
      input.opacity = 0;
      break;
    case 'drop-in':
    case 'fade-down':
      input.translateY = clamp(
        output.translateY - Math.abs(block.y),
        -8_000,
        8_000,
      );
      input.opacity = 0;
      break;
    case 'fade-left':
      input.translateX = clamp(
        output.translateX + Math.abs(block.x),
        -8_000,
        8_000,
      );
      input.opacity = 0;
      break;
    case 'fade-right':
      input.translateX = clamp(
        output.translateX - Math.abs(block.x),
        -8_000,
        8_000,
      );
      input.opacity = 0;
      break;
    case 'zoom-bounce':
      input.scale = clamp(block.value, 0.05, 4);
      input.opacity = 0;
      break;
    case 'rotate-pop':
      input.rotation = clamp(output.rotation + block.value, -1_440, 1_440);
      input.scale = clamp(block.secondaryValue, 0.05, 4);
      input.opacity = 0;
      break;
    case 'flip-in-horizontal':
      input.scaleX = -1;
      input.opacity = 0;
      break;
    case 'flip-in-vertical':
      input.scaleY = -1;
      input.opacity = 0;
      break;
    case 'subtitle-fade':
      input.opacity = clamp(block.value, 0, 1);
      break;
    case 'dissolve':
      input.blurPx = clamp(block.value, 0, 60);
      input.opacity = 0;
      break;
    case 'bounce': {
      const travel = block.jumps.reduce(
        (total, jump) =>
          total + (jump.direction === 'left' ? -jump.spread : jump.spread),
        0,
      );
      input.translateX = clamp(output.translateX - travel, -8_000, 8_000);
      break;
    }
    default:
      break;
  }
  return input;
}

export function compileElementMotion(
  element: MotusElement,
): CompiledElementMotion {
  const instruction = migrateMotion(element.motion);
  const activeBlocks = instruction.blocks.filter(
    (
      block,
    ): block is MotionBlock & {
      kind: Exclude<MotionBlockKind, MotionEventBlockKind>;
    } => block.enabled && !isMotionEventBlockKind(block.kind),
  );
  let cursorMs = 0;
  let leadingDelayMs = 0;
  let encounteredAction = false;
  const steps: CompiledMotionStep[] = [];
  for (const block of activeBlocks) {
    const requestedDurationMs = getBlockDuration(block);
    const durationMs = Math.min(
      requestedDurationMs,
      Math.max(0, 60_000 - cursorMs),
    );
    if (block.kind === 'wait' && !encounteredAction)
      leadingDelayMs += durationMs;
    if (block.kind !== 'wait') encounteredAction = true;
    steps.push({
      blockId: block.id,
      kind: block.kind,
      startsAtMs: cursorMs,
      durationMs,
      easing: block.easing,
    });
    cursorMs += durationMs;
  }
  const actionDurationMs = steps
    .filter((step) => step.kind !== 'wait')
    .reduce((total, step) => total + step.durationMs, 0);
  const finalState: MotionFrameState = {
    translateX: 0,
    translateY: 0,
    opacity: clamp(element.opacity, 0, 1),
    scale: 1,
    scaleX: 1,
    scaleY: 1,
    rotation: clamp(element.rotation, -360, 360),
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
  const inputStates = Array.from({ length: activeBlocks.length }, () =>
    copyMotionState(finalState),
  );
  const outputStates = Array.from({ length: activeBlocks.length }, () =>
    copyMotionState(finalState),
  );
  let reverseState = copyMotionState(finalState);
  for (let index = activeBlocks.length - 1; index >= 0; index -= 1) {
    outputStates[index] = copyMotionState(reverseState);
    inputStates[index] = getBlockInputState(activeBlocks[index], reverseState);
    reverseState = inputStates[index];
  }
  const legacyFromState: MotionFrameState = {
    ...finalState,
    translateX: clamp(-instruction.moveX, -8_000, 8_000),
    translateY: clamp(-instruction.moveY, -8_000, 8_000),
    opacity: clamp(instruction.fromOpacity, 0, 1),
    scale: clamp(instruction.fromScale, 0.05, 4),
    rotation: clamp(element.rotation + instruction.fromRotation, -1_440, 1_440),
  };
  const initialState = inputStates[0] ?? legacyFromState;
  const from = {
    translateX: initialState.translateX,
    translateY: initialState.translateY,
    opacity: initialState.opacity,
    scale: initialState.scale,
    rotation: initialState.rotation,
  };
  const to = {
    translateX: 0 as const,
    translateY: 0 as const,
    opacity: finalState.opacity,
    scale: 1 as const,
    rotation: finalState.rotation,
  };
  const sequenceDurationMs = clamp(
    cursorMs || Math.round(instruction.durationMs),
    0,
    60_000,
  );
  let frameState = copyMotionState(initialState);
  const keyframes: CompiledMotionKeyframe[] = [
    {
      offset: 0,
      ...frameState,
      easing:
        steps[0]?.kind === 'wait'
          ? 'steps(1, end)'
          : (steps[0]?.easing ?? instruction.easing),
    },
  ];

  const pushFrame = (
    state: MotionFrameState,
    elapsedMs: number,
    easing: Easing | 'steps(1, end)',
  ) => {
    if (sequenceDurationMs <= 0) return;
    keyframes[keyframes.length - 1].easing = easing;
    keyframes.push({
      offset: clamp(elapsedMs / sequenceDurationMs, 0, 1),
      ...copyMotionState(state),
      easing,
    });
  };

  for (let index = 0; index < steps.length; index += 1) {
    const step = steps[index];
    const block = activeBlocks[index];
    if (step.durationMs <= 0 || sequenceDurationMs <= 0) continue;
    const output = outputStates[index];
    const endMs = step.startsAtMs + step.durationMs;

    if (block.kind === 'bounce') {
      let localMs = 0;
      let groundX = inputStates[index].translateX;
      const groundY = inputStates[index].translateY;
      for (const jump of block.jumps) {
        if (localMs >= step.durationMs) break;
        const jumpDuration = Math.min(
          normalizeBounceJumpNumericField(jump, 'durationMs', jump.durationMs),
          step.durationMs - localMs,
        );
        const dx =
          (jump.direction === 'left' ? -1 : 1) *
          normalizeBounceJumpNumericField(jump, 'spread', jump.spread);
        const height = normalizeBounceJumpNumericField(
          jump,
          'height',
          jump.height,
        );
        const apex = {
          ...frameState,
          translateX: groundX + dx / 2,
          translateY: groundY - height,
        };
        pushFrame(
          apex,
          step.startsAtMs + localMs + jumpDuration / 2,
          jump.easing,
        );
        const landing = {
          ...frameState,
          translateX: groundX + dx,
          translateY: groundY,
        };
        pushFrame(
          landing,
          step.startsAtMs + localMs + jumpDuration,
          jump.easing,
        );
        frameState = landing;
        groundX += dx;
        localMs += jumpDuration;
      }
      frameState = copyMotionState(output);
      if (
        keyframes.at(-1)?.offset !== clamp(endMs / sequenceDurationMs, 0, 1)
      ) {
        pushFrame(frameState, endMs, step.easing);
      } else {
        Object.assign(keyframes[keyframes.length - 1], frameState);
      }
      continue;
    }

    const repetitions = normalizeMotionBlockNumericField(
      block,
      'repetitions',
      block.repetitions,
    );
    const runRepeatedAccent = (
      mutate: (
        accent: MotionFrameState,
        beat: number,
        strength: number,
      ) => void,
    ) => {
      const beatDuration = step.durationMs / repetitions;
      for (let beat = 0; beat < repetitions; beat += 1) {
        const strength = 1 - (beat / repetitions) * 0.7;
        const accent = copyMotionState(output);
        mutate(accent, beat, strength);
        pushFrame(
          accent,
          step.startsAtMs + beat * beatDuration + beatDuration / 2,
          step.easing,
        );
        pushFrame(
          output,
          step.startsAtMs + (beat + 1) * beatDuration,
          step.easing,
        );
      }
      frameState = copyMotionState(output);
    };

    if (
      block.kind === 'shake' ||
      block.kind === 'tremble' ||
      block.kind === 'text-jitter'
    ) {
      runRepeatedAccent((accent, beat, strength) => {
        const sign = beat % 2 === 0 ? 1 : -1;
        accent.translateX +=
          normalizeMotionBlockNumericField(block, 'x', block.x) *
          sign *
          strength;
        accent.translateY +=
          normalizeMotionBlockNumericField(
            block,
            'secondaryValue',
            block.secondaryValue,
          ) *
          -sign *
          strength;
      });
      continue;
    }

    if (
      block.kind === 'float' ||
      block.kind === 'bob' ||
      block.kind === 'thought-float' ||
      block.kind === 'letter-hop' ||
      block.kind === 'speech-bounce'
    ) {
      runRepeatedAccent((accent, beat, strength) => {
        const direction = block.kind === 'bob' && beat % 2 ? 1 : -1;
        accent.translateY +=
          direction *
          Math.abs(normalizeMotionBlockNumericField(block, 'y', block.y)) *
          strength;
      });
      continue;
    }

    if (
      block.kind === 'pulse' ||
      block.kind === 'breathe' ||
      block.kind === 'word-pulse' ||
      block.kind === 'loop-scale' ||
      block.kind === 'heartbeat' ||
      block.kind === 'throb' ||
      block.kind === 'inflate' ||
      block.kind === 'deflate' ||
      block.kind === 'rubber-band'
    ) {
      runRepeatedAccent((accent, beat, strength) => {
        const target = clamp(block.value, 0.05, 4);
        const weightedTarget = 1 + (target - 1) * strength;
        accent.scale =
          block.kind === 'heartbeat' && beat % 2
            ? 1 + (target - 1) * 0.55
            : weightedTarget;
      });
      continue;
    }

    if (
      block.kind === 'flash' ||
      block.kind === 'flicker' ||
      block.kind === 'loop-opacity' ||
      block.kind === 'blink' ||
      block.kind === 'ghost' ||
      block.kind === 'text-blink'
    ) {
      runRepeatedAccent((accent) => {
        accent.opacity = clamp(block.value, 0, 1);
      });
      continue;
    }

    if (block.kind === 'blur-pulse' || block.kind === 'focus-pull') {
      runRepeatedAccent((accent, _beat, strength) => {
        accent.blurPx = clamp(block.value * strength, 0, 60);
      });
      continue;
    }

    if (
      block.kind === 'glow' ||
      block.kind === 'neon' ||
      block.kind === 'shadow-pulse'
    ) {
      runRepeatedAccent((accent, _beat, strength) => {
        accent.glowPx = clamp(block.value * strength, 0, 80);
      });
      continue;
    }

    if (block.kind === 'shimmer' || block.kind === 'exposure-flash') {
      runRepeatedAccent((accent) => {
        accent.brightness = clamp(block.value, 0, 4);
      });
      continue;
    }

    if (block.kind === 'sparkle') {
      runRepeatedAccent((accent, _beat, strength) => {
        accent.brightness = clamp(block.value, 0, 4);
        accent.glowPx = clamp(block.secondaryValue * strength, 0, 80);
      });
      continue;
    }

    if (block.kind === 'spotlight') {
      runRepeatedAccent((accent) => {
        accent.brightness = clamp(block.value, 0, 4);
        accent.contrast = clamp(block.secondaryValue, 0, 4);
      });
      continue;
    }

    if (block.kind === 'color-pop') {
      runRepeatedAccent((accent) => {
        accent.saturation = clamp(block.value, 0, 4);
      });
      continue;
    }

    if (block.kind === 'silhouette') {
      runRepeatedAccent((accent) => {
        accent.brightness = clamp(block.value, 0, 1);
      });
      continue;
    }

    if (block.kind === 'prism' || block.kind === 'chromatic-pulse') {
      runRepeatedAccent((accent, beat) => {
        const sign = beat % 2 === 0 ? 1 : -1;
        accent.hueRotate = clamp(block.value * sign, -720, 720);
        if (block.kind === 'chromatic-pulse') {
          accent.saturation = clamp(block.secondaryValue, 0, 4);
        }
      });
      continue;
    }

    if (
      block.kind === 'sway' ||
      block.kind === 'swing' ||
      block.kind === 'loop-rotate' ||
      block.kind === 'wobble' ||
      block.kind === 'pendulum' ||
      block.kind === 'tilt-left' ||
      block.kind === 'tilt-right' ||
      block.kind === 'hinge'
    ) {
      runRepeatedAccent((accent, beat, strength) => {
        const fixedDirection =
          block.kind === 'tilt-left'
            ? -1
            : block.kind === 'tilt-right'
              ? 1
              : null;
        const sign = fixedDirection ?? (beat % 2 === 0 ? 1 : -1);
        accent.rotation +=
          normalizeMotionBlockNumericField(block, 'value', block.value) *
          sign *
          strength;
      });
      continue;
    }

    if (
      block.kind === 'squash' ||
      block.kind === 'stretch' ||
      block.kind === 'jello' ||
      block.kind === 'compress'
    ) {
      runRepeatedAccent((accent, beat, strength) => {
        const amountValue = clamp(block.value, 0, 0.9) * strength;
        const swap = block.kind === 'jello' && beat % 2 === 1;
        const widen = block.kind === 'squash' || swap;
        accent.scaleX = widen ? 1 + amountValue : 1 - amountValue;
        accent.scaleY = widen ? 1 - amountValue : 1 + amountValue;
        if (block.kind === 'compress') {
          accent.scaleX = 1 + amountValue * 0.35;
          accent.scaleY = 1 - amountValue;
        }
      });
      continue;
    }

    if (
      block.kind === 'flip-horizontal' ||
      block.kind === 'card-flip' ||
      block.kind === 'flip-vertical' ||
      block.kind === 'coin-flip'
    ) {
      runRepeatedAccent((accent) => {
        if (block.kind === 'flip-horizontal' || block.kind === 'card-flip') {
          accent.scaleX = -1;
        } else {
          accent.scaleY = -1;
        }
      });
      continue;
    }

    if (block.kind === 'spin-pulse') {
      runRepeatedAccent((accent, beat) => {
        const sign = beat % 2 === 0 ? 1 : -1;
        accent.rotation += clamp(block.value, -720, 720) * sign;
        accent.scale = clamp(block.secondaryValue, 0.05, 4);
      });
      continue;
    }

    if (
      block.kind === 'yoyo' ||
      block.kind === 'loop-move' ||
      block.kind === 'backtrack' ||
      block.kind === 'boomerang'
    ) {
      runRepeatedAccent((accent, beat) => {
        const sign = block.kind === 'backtrack' && beat % 2 ? -1 : 1;
        accent.translateX += clamp(block.x, -2_000, 2_000) * sign;
        accent.translateY += clamp(block.y, -2_000, 2_000) * sign;
      });
      continue;
    }

    if (
      block.kind === 'drift-left' ||
      block.kind === 'drift-right' ||
      block.kind === 'drift-up' ||
      block.kind === 'drift-down'
    ) {
      runRepeatedAccent((accent, _beat, strength) => {
        if (block.kind === 'drift-left')
          accent.translateX -= block.x * strength;
        if (block.kind === 'drift-right')
          accent.translateX += block.x * strength;
        if (block.kind === 'drift-up') accent.translateY -= block.y * strength;
        if (block.kind === 'drift-down')
          accent.translateY += block.y * strength;
      });
      continue;
    }

    if (block.kind === 'recoil') {
      runRepeatedAccent((accent, beat, strength) => {
        const sign = beat % 2 === 0 ? -1 : 1;
        accent.translateX += Math.abs(block.x) * sign * strength;
      });
      continue;
    }

    if (block.kind === 'settle') {
      runRepeatedAccent((accent, beat, strength) => {
        const delta = clamp(block.value, 1, 2) - 1;
        accent.scale = 1 + delta * (beat % 2 === 0 ? 1 : -0.55) * strength;
      });
      continue;
    }

    const pushRelativePath = (
      points: Array<
        Partial<
          Pick<
            MotionFrameState,
            | 'translateX'
            | 'translateY'
            | 'rotation'
            | 'scale'
            | 'scaleX'
            | 'scaleY'
            | 'opacity'
            | 'blurPx'
          >
        >
      >,
    ) => {
      points.forEach((point, pointIndex) => {
        const pathFrame = copyMotionState(output);
        if (point.translateX !== undefined) {
          pathFrame.translateX += point.translateX;
        }
        if (point.translateY !== undefined) {
          pathFrame.translateY += point.translateY;
        }
        if (point.rotation !== undefined) {
          pathFrame.rotation += point.rotation;
        }
        if (point.scale !== undefined) pathFrame.scale = point.scale;
        if (point.scaleX !== undefined) pathFrame.scaleX = point.scaleX;
        if (point.scaleY !== undefined) pathFrame.scaleY = point.scaleY;
        if (point.opacity !== undefined) pathFrame.opacity = point.opacity;
        if (point.blurPx !== undefined) pathFrame.blurPx = point.blurPx;
        pushFrame(
          pathFrame,
          step.startsAtMs +
            step.durationMs * ((pointIndex + 1) / points.length),
          step.easing,
        );
      });
      frameState = copyMotionState(output);
    };

    if (
      block.kind === 'arc-in' ||
      block.kind === 'swoop-left' ||
      block.kind === 'swoop-right'
    ) {
      const input = inputStates[index];
      const arcHeight = Math.abs(block.y);
      const midpoint = copyMotionState(output);
      midpoint.translateX = (input.translateX + output.translateX) / 2;
      midpoint.translateY =
        Math.min(input.translateY, output.translateY) - arcHeight;
      pushFrame(midpoint, step.startsAtMs + step.durationMs * 0.5, step.easing);
      frameState = copyMotionState(output);
      pushFrame(frameState, endMs, step.easing);
      continue;
    }

    if (block.kind === 'spring' || block.kind === 'zoom-bounce') {
      const accent = copyMotionState(output);
      accent.scale = clamp(block.secondaryValue, 1, 2);
      pushFrame(accent, step.startsAtMs + step.durationMs * 0.72, step.easing);
      frameState = copyMotionState(output);
      pushFrame(frameState, endMs, step.easing);
      continue;
    }

    if (block.kind === 'jump') {
      const apex = copyMotionState(output);
      apex.translateY -= Math.abs(clamp(block.y, -2_000, 2_000));
      pushFrame(apex, step.startsAtMs + step.durationMs * 0.52, step.easing);
      frameState = copyMotionState(output);
      pushFrame(frameState, endMs, step.easing);
      continue;
    }

    if (
      block.kind === 'overshoot' ||
      block.kind === 'dash-in' ||
      block.kind === 'skid-in' ||
      block.kind === 'snap-in' ||
      block.kind === 'magnetic-snap' ||
      block.kind === 'elastic-slide'
    ) {
      const settles = block.kind === 'elastic-slide' ? repetitions : 1;
      for (let settle = 0; settle < settles; settle += 1) {
        const strength = 1 - settle / settles;
        const accent = copyMotionState(output);
        const direction = block.x < 0 ? -1 : 1;
        accent.translateX +=
          clamp(block.secondaryValue, -400, 400) * direction * strength;
        pushFrame(
          accent,
          step.startsAtMs +
            step.durationMs * (0.58 + ((settle + 0.5) / settles) * 0.38),
          step.easing,
        );
      }
      frameState = copyMotionState(output);
      pushFrame(frameState, endMs, step.easing);
      continue;
    }

    if (
      block.kind === 'drop-bounce' ||
      block.kind === 'gravity-fall' ||
      block.kind === 'headline-drop' ||
      block.kind === 'rocket-rise'
    ) {
      const bounceCount = block.kind === 'drop-bounce' ? repetitions : 1;
      const points = Array.from(
        { length: bounceCount * 2 },
        (_, pointIndex) => {
          const bounceIndex = Math.floor(pointIndex / 2);
          const strength = 1 - bounceIndex / Math.max(bounceCount, 1);
          return pointIndex % 2 === 0
            ? {
                translateY:
                  (block.kind === 'rocket-rise' ? 1 : -1) *
                  Math.abs(block.secondaryValue) *
                  strength,
              }
            : { translateY: 0 };
        },
      );
      pushRelativePath(points);
      continue;
    }

    if (block.kind === 'rubber-stamp') {
      const points = Array.from({ length: repetitions * 2 }, (_, pointIndex) =>
        pointIndex % 2 === 0
          ? {
              translateY: Math.abs(block.y),
              scaleX: 1 + clamp(block.value, 0, 0.9),
              scaleY: 1 - clamp(block.value, 0, 0.9),
            }
          : { translateY: 0, scaleX: 1, scaleY: 1 },
      );
      pushRelativePath(points);
      continue;
    }

    if (
      block.kind === 'hop-left' ||
      block.kind === 'hop-right' ||
      block.kind === 'toss' ||
      block.kind === 'fling' ||
      block.kind === 'slingshot'
    ) {
      const points: Array<{ translateX: number; translateY: number }> = [];
      const trips = block.kind === 'slingshot' ? 1 : repetitions;
      for (let trip = 0; trip < trips; trip += 1) {
        if (block.kind === 'slingshot') {
          points.push({
            translateX: -Math.sign(block.x || 1) * block.secondaryValue,
            translateY: Math.abs(block.secondaryValue) / 2,
          });
        }
        const direction = block.kind === 'hop-left' ? -1 : 1;
        points.push({
          translateX:
            block.kind === 'hop-left' || block.kind === 'hop-right'
              ? direction * Math.abs(block.x)
              : block.x,
          translateY: -Math.abs(block.y),
        });
        points.push({ translateX: 0, translateY: 0 });
      }
      pushRelativePath(points);
      continue;
    }

    if (block.kind === 'parachute') {
      const input = inputStates[index];
      const points = Array.from({ length: repetitions }, (_, pointIndex) => {
        const progress = (pointIndex + 1) / repetitions;
        return {
          translateX:
            Math.abs(block.x) *
            (pointIndex % 2 === 0 ? 1 : -1) *
            (1 - progress * 0.5),
          translateY:
            input.translateY -
            output.translateY +
            (output.translateY - input.translateY) * progress,
        };
      });
      points.push({ translateX: 0, translateY: 0 });
      pushRelativePath(points);
      continue;
    }

    if (
      block.kind === 'orbit' ||
      block.kind === 'spiral' ||
      block.kind === 'corkscrew' ||
      block.kind === 'circle-clockwise' ||
      block.kind === 'circle-counterclockwise' ||
      block.kind === 'ellipse-loop'
    ) {
      const segments = repetitions * 8;
      const points = Array.from({ length: segments }, (_, pointIndex) => {
        const progress = (pointIndex + 1) / segments;
        const counter = block.kind === 'circle-counterclockwise' ? -1 : 1;
        const angle = progress * Math.PI * 2 * repetitions * counter;
        const decay = block.kind === 'spiral' ? 1 - progress : 1;
        const radiusX = Math.abs(block.x);
        const radiusY =
          block.kind === 'circle-clockwise' ||
          block.kind === 'circle-counterclockwise'
            ? radiusX
            : Math.abs(block.y);
        return {
          translateX: radiusX * (Math.cos(angle) - 1) * decay,
          translateY: radiusY * Math.sin(angle) * decay,
          rotation:
            block.kind === 'corkscrew' ? block.value * progress : undefined,
        };
      });
      points.push({ translateX: 0, translateY: 0, rotation: 0 });
      pushRelativePath(points);
      continue;
    }

    if (
      block.kind === 'figure-eight' ||
      block.kind === 'infinity-loop' ||
      block.kind === 'wave' ||
      block.kind === 'letter-wave'
    ) {
      const segments = repetitions * 8;
      const points = Array.from({ length: segments }, (_, pointIndex) => {
        const angle = ((pointIndex + 1) / segments) * Math.PI * 2 * repetitions;
        if (block.kind === 'wave' || block.kind === 'letter-wave') {
          return {
            translateX: Math.abs(block.x) * Math.sin(angle),
            translateY: -Math.abs(block.y) * Math.sin(angle * 2),
          };
        }
        return {
          translateX: Math.abs(block.x) * Math.sin(angle),
          translateY: Math.abs(block.y) * Math.sin(angle * 2),
        };
      });
      points.push({ translateX: 0, translateY: 0 });
      pushRelativePath(points);
      continue;
    }

    if (
      block.kind === 'zigzag' ||
      block.kind === 'snake' ||
      block.kind === 'sawtooth' ||
      block.kind === 'ricochet' ||
      block.kind === 'pinball'
    ) {
      const points = Array.from({ length: repetitions }, (_, pointIndex) => {
        const sign = pointIndex % 2 === 0 ? 1 : -1;
        return {
          translateX: Math.abs(block.x) * sign,
          translateY:
            block.kind === 'sawtooth'
              ? pointIndex % 2 === 0
                ? -Math.abs(block.y)
                : Math.abs(block.y) * 0.25
              : Math.abs(block.y) * (pointIndex % 3 === 0 ? -1 : 1),
        };
      });
      points.push({ translateX: 0, translateY: 0 });
      pushRelativePath(points);
      continue;
    }

    if (
      block.kind === 'ladder-up' ||
      block.kind === 'ladder-down' ||
      block.kind === 'stair-step'
    ) {
      const verticalDirection = block.kind === 'ladder-down' ? 1 : -1;
      const points: Array<{ translateX: number; translateY: number }> = [];
      for (let stair = 0; stair < repetitions; stair += 1) {
        const level = stair + 1;
        points.push({
          translateX: block.x * level,
          translateY: verticalDirection * block.y * stair,
        });
        points.push({
          translateX: block.x * level,
          translateY: verticalDirection * block.y * level,
        });
      }
      points.push({ translateX: 0, translateY: 0 });
      pushRelativePath(points);
      continue;
    }

    if (
      block.kind === 'triangle-path' ||
      block.kind === 'square-path' ||
      block.kind === 'diamond-path'
    ) {
      const width = Math.abs(block.x);
      const height = Math.abs(block.y);
      const shape =
        block.kind === 'triangle-path'
          ? [
              { translateX: 0, translateY: -height },
              { translateX: width, translateY: height / 2 },
              { translateX: -width, translateY: height / 2 },
            ]
          : block.kind === 'square-path'
            ? [
                { translateX: width, translateY: 0 },
                { translateX: width, translateY: height },
                { translateX: 0, translateY: height },
              ]
            : [
                { translateX: 0, translateY: -height },
                { translateX: width, translateY: 0 },
                { translateX: 0, translateY: height },
                { translateX: -width, translateY: 0 },
              ];
      const points = Array.from({ length: repetitions }, () => [
        ...shape,
        { translateX: 0, translateY: 0 },
      ]).flat();
      pushRelativePath(points);
      continue;
    }

    if (
      block.kind === 'flip-in-horizontal' ||
      block.kind === 'flip-in-vertical'
    ) {
      const points = Array.from({ length: repetitions }, (_, pointIndex) => ({
        scaleX:
          block.kind === 'flip-in-horizontal' && pointIndex % 2 === 0
            ? -0.2
            : 1,
        scaleY:
          block.kind === 'flip-in-vertical' && pointIndex % 2 === 0 ? -0.2 : 1,
        opacity: output.opacity,
      }));
      points.push({ scaleX: 1, scaleY: 1, opacity: output.opacity });
      pushRelativePath(points);
      continue;
    }

    frameState = copyMotionState(output);
    pushFrame(
      frameState,
      endMs,
      block.kind === 'wait' ? 'steps(1, end)' : step.easing,
    );
  }
  const finalKeyframe = keyframes.at(-1);
  if (finalKeyframe?.offset !== 1) {
    keyframes.push({ offset: 1, ...finalState, easing: instruction.easing });
  } else if (finalKeyframe) {
    Object.assign(finalKeyframe, finalState);
  }
  return {
    schemaVersion: MOTION_SCHEMA_VERSION,
    event: instruction.event,
    eventSourceElementId:
      instruction.event === 'animation-finish'
        ? (instruction.blocks[0]?.sourceElementId ?? null)
        : null,
    durationMs: clamp(
      actionDurationMs || Math.round(instruction.durationMs),
      200,
      30_000,
    ),
    delayMs: clamp(
      leadingDelayMs || Math.round(instruction.delayMs),
      0,
      10_000,
    ),
    easing:
      steps.find((step) => step.kind !== 'wait')?.easing ?? instruction.easing,
    sequenceDurationMs,
    steps,
    keyframes,
    from,
    to,
  };
}

export function createElement(
  type: ElementType,
  index: number,
  overrides: Partial<MotusElement> = {},
): MotusElement {
  const labels: Record<ElementType, string> = {
    shape: 'Shape',
    text: 'Text',
    speech: 'Speech bubble',
    image: 'Image',
  };
  const typography = normalizeElementTypography(type, overrides.typography);

  return constrainElementToCanvas({
    id: `${type}-${Date.now()}-${index}`,
    name: `${labels[type]} ${index}`,
    type,
    x: 350,
    y: 560,
    width: type === 'text' ? 440 : 260,
    height: type === 'text' ? 120 : 220,
    rotation: 0,
    opacity: 1,
    fill: type === 'speech' ? '#fffaf0' : '#8c74ff',
    text:
      type === 'speech'
        ? 'Add your dialogue…'
        : type === 'text'
          ? 'A new moment'
          : undefined,
    visible: true,
    locked: false,
    motion: motion(80, 0, 900, 0.15),
    ...overrides,
    typography,
  });
}

export function createCopyName(name: string, maxLength: number): string {
  const safeLength = Number.isFinite(maxLength)
    ? Math.max(1, Math.floor(maxLength))
    : 1;
  const base = name.trim() || 'Untitled';
  const suffix = ' copy';
  if (safeLength <= suffix.length) return base.slice(0, safeLength);
  return `${base.slice(0, safeLength - suffix.length)}${suffix}`;
}

export function createElementCopy(
  source: MotusElement,
  id: string,
  offset = 28,
): MotusElement {
  const copy = structuredClone(source);
  return constrainElementToCanvas({
    ...copy,
    id,
    name: createCopyName(source.name, MAX_ELEMENT_NAME_LENGTH),
    x: source.x + offset,
    y: source.y + offset,
  });
}

const scene = (
  id: string,
  name: string,
  background: string,
  title: string,
  speech: string,
  glow: string,
): MotusScene => ({
  id,
  name,
  background,
  elements: [
    createElement('text', 1, {
      id: `${id}-title`,
      name: 'Scene title',
      x: 95,
      y: 150,
      width: 620,
      height: 190,
      fill: '#ffffff',
      text: title,
      locked: false,
      motion: motion(0, 34, 700, 0),
    }),
    createElement('shape', 2, {
      id: `${id}-orb`,
      name: 'Signal orb',
      x: 670,
      y: 580,
      width: 150,
      height: 150,
      fill: glow,
      motion: motion(140, -20, 1200, 0.08),
    }),
    createElement('speech', 3, {
      id: `${id}-speech`,
      name: 'Speech bubble',
      x: 560,
      y: 1020,
      width: 390,
      height: 170,
      text: speech,
      fill: '#fffaf0',
      rotation: -2,
      motion: motion(0, 28, 650, 0),
    }),
  ],
});

export function createBlankChapter(input: {
  id: string;
  sceneId: string;
  title: string;
}): MotusChapter {
  return {
    id: input.id,
    title: input.title,
    scenes: [
      {
        id: input.sceneId,
        name: 'Opening scene',
        background: defaultSceneBackground,
        elements: [],
      },
    ],
  };
}

export const createDefaultProject = (): MotusProject => ({
  schemaVersion: PROJECT_SCHEMA_VERSION,
  id: 'signal-in-the-fog',
  title: 'Signal in the Fog',
  creatorName: 'Bahar Yüksel',
  description:
    'Three signals answer one another across a silent, shifting landscape.',
  tags: ['science fiction', 'mystery'],
  language: 'en',
  contentRating: 'all-ages',
  visibility: 'private',
  metadata: createWorkMetadata(
    {
      contributorNames: ['Bahar Yüksel'],
      workStatus: 'ongoing',
      origin: 'original',
      genres: ['Science fiction', 'Mystery'],
      characters: ['The Cartographer', 'The Signal'],
      themes: ['Connection', 'Memory'],
    },
    'Bahar Yüksel',
  ),
  format: 'vertical-scroll',
  coverSceneId: 'scene-1',
  publishedRevision: 0,
  publications: [],
  updatedAt: new Date().toISOString(),
  chapters: [
    {
      id: 'signal-in-the-fog-chapter-1',
      title: 'Chapter 1 · The Answering Light',
      scenes: [
        scene(
          'scene-1',
          'The signal',
          'linear-gradient(155deg, #24203b 0%, #151626 54%, #332b46 100%)',
          'Something moved beyond the fog.',
          'Did you see that?',
          '#8d71ff',
        ),
        scene(
          'scene-2',
          'The crossing',
          'linear-gradient(155deg, #38284c 0%, #1c1729 54%, #7d4e61 100%)',
          'The light waited on the other side.',
          'It knows we are here.',
          '#ff8ca6',
        ),
        scene(
          'scene-3',
          'The answer',
          'linear-gradient(155deg, #22293b 0%, #101d28 54%, #315a63 100%)',
          'A second pulse answered from below.',
          'That was not an echo.',
          '#67d6df',
        ),
      ],
    },
  ],
});

export function createBlankProject(
  id: string,
  updatedAt = new Date().toISOString(),
): MotusProject {
  const projectId = id.trim() || 'untitled-work';
  const openingChapterId = `${projectId}-chapter-1`;
  const openingSceneId = `${projectId}-scene-1`;
  return {
    schemaVersion: PROJECT_SCHEMA_VERSION,
    id: projectId,
    title: 'Untitled work',
    creatorName: 'New creator',
    description: '',
    tags: [],
    language: 'en',
    contentRating: 'all-ages',
    visibility: 'private',
    metadata: createWorkMetadata(
      { contributorNames: ['New creator'] },
      'New creator',
    ),
    format: 'vertical-scroll',
    coverSceneId: openingSceneId,
    publishedRevision: 0,
    publications: [],
    updatedAt,
    chapters: [
      createBlankChapter({
        id: openingChapterId,
        sceneId: openingSceneId,
        title: 'Chapter 1',
      }),
    ],
  };
}

export function createProjectBackupFileName(
  project: Pick<MotusProject, 'id' | 'title'>,
) {
  const fallback = project.id.trim() || 'untitled-work';
  const stem = (project.title.trim() || fallback)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
  return `${stem || 'untitled-work'}.motus.json`;
}

export function cloneProject(project: MotusProject): MotusProject {
  return structuredClone(project);
}

export type EditorSelection = {
  chapterId: string;
  sceneId: string;
  elementId: string;
};

export type ProjectHistoryEntry = {
  project: MotusProject;
  selection: EditorSelection;
  bytes: number;
};

export type ProjectHistoryState = {
  undoStack: ProjectHistoryEntry[];
  transactionKey: string | null;
};

export type ProjectTimelineState = ProjectHistoryState & {
  redoStack: ProjectHistoryEntry[];
};

export function createProjectHistoryEntry(
  project: MotusProject,
  selection: EditorSelection,
): ProjectHistoryEntry {
  const snapshot = cloneProject(project);
  return {
    project: snapshot,
    selection: resolveEditorSelection(
      project,
      selection.chapterId,
      selection.sceneId,
      selection.elementId,
    ),
    bytes: getProjectStorageBytes(snapshot),
  };
}

export function trimProjectHistory(
  entries: ProjectHistoryEntry[],
  entryLimit = MAX_PROJECT_HISTORY_ENTRIES,
  byteLimit = MAX_PROJECT_HISTORY_BYTES,
): ProjectHistoryEntry[] {
  const candidates = entries.slice(-Math.max(1, Math.floor(entryLimit)));
  const safeByteLimit = Math.max(1, Math.floor(byteLimit));
  const kept: ProjectHistoryEntry[] = [];
  let bytes = 0;

  for (let index = candidates.length - 1; index >= 0; index -= 1) {
    const entry = candidates[index];
    if (kept.length > 0 && bytes + entry.bytes > safeByteLimit) break;
    kept.unshift(entry);
    bytes += entry.bytes;
  }
  return kept;
}

export function recordProjectHistory(
  history: ProjectHistoryState,
  project: MotusProject,
  selection: EditorSelection,
  transactionKey: string | null = null,
  limit = MAX_PROJECT_HISTORY_ENTRIES,
  byteLimit = MAX_PROJECT_HISTORY_BYTES,
): ProjectHistoryState {
  const shouldCapture =
    transactionKey === null || history.transactionKey !== transactionKey;
  return {
    undoStack: shouldCapture
      ? trimProjectHistory(
          [...history.undoStack, createProjectHistoryEntry(project, selection)],
          limit,
          byteLimit,
        )
      : history.undoStack,
    transactionKey,
  };
}

export function resetProjectTimeline(
  _timeline: ProjectTimelineState,
): ProjectTimelineState {
  return {
    undoStack: [],
    redoStack: [],
    transactionKey: null,
  };
}

export function reorderScenes(
  scenes: MotusScene[],
  sceneId: string,
  direction: -1 | 1,
): MotusScene[] {
  const ordered = [...scenes];
  const index = ordered.findIndex((scene) => scene.id === sceneId);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= ordered.length) return ordered;
  [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
  return ordered;
}

export function reorderChapters(
  chapters: MotusChapter[],
  chapterId: string,
  direction: -1 | 1,
): MotusChapter[] {
  const ordered = [...chapters];
  const index = ordered.findIndex((chapter) => chapter.id === chapterId);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= ordered.length) return ordered;
  [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
  return ordered;
}

export function getTabIndexForKey(
  currentIndex: number,
  sceneCount: number,
  key: string,
): number | null {
  if (sceneCount <= 0) return null;
  if (key === 'Home') return 0;
  if (key === 'End') return sceneCount - 1;
  if (key === 'ArrowLeft') return (currentIndex - 1 + sceneCount) % sceneCount;
  if (key === 'ArrowRight') return (currentIndex + 1) % sceneCount;
  return null;
}

export function canAddSceneToProject(
  project: Pick<MotusProject, 'chapters'>,
): boolean {
  return getProjectScenes(project).length < MAX_PROJECT_SCENES;
}

export function canAddChapterToProject(
  project: Pick<MotusProject, 'chapters'>,
): boolean {
  return (
    project.chapters.length < MAX_PROJECT_CHAPTERS &&
    getProjectScenes(project).length < MAX_PROJECT_SCENES
  );
}

export function canAddElementToScene(
  scene: Pick<MotusScene, 'elements'>,
): boolean {
  return scene.elements.length < MAX_SCENE_ELEMENTS;
}

export function resolveSelectionAfterElementDeletion(
  elements: MotusElement[],
  deletedElementId: string,
): string {
  const deletedIndex = elements.findIndex(
    (element) => element.id === deletedElementId,
  );
  if (deletedIndex < 0) return '';
  return elements[deletedIndex + 1]?.id ?? elements[deletedIndex - 1]?.id ?? '';
}

export type RestoredDraft = {
  source: string;
  project: MotusProject;
};

export function restoreNewestProject(
  candidates: Array<{
    source: string;
    value: string | null;
    priority?: number;
  }>,
): RestoredDraft | null {
  const restored = candidates.flatMap(({ source, value, priority = 0 }) => {
    const project = restoreProject(value);
    return project ? [{ source, project, priority }] : [];
  });

  const winner = restored.sort((left, right) => {
    const leftTime = Date.parse(left.project.updatedAt);
    const rightTime = Date.parse(right.project.updatedAt);
    const timeDifference =
      (Number.isFinite(rightTime) ? rightTime : 0) -
      (Number.isFinite(leftTime) ? leftTime : 0);
    return timeDifference || right.priority - left.priority;
  })[0];
  return winner ? { source: winner.source, project: winner.project } : null;
}

export function resolveEditorSelection(
  project: MotusProject,
  requestedChapterId: string,
  requestedSceneId: string,
  requestedElementId: string,
): EditorSelection {
  const requestedChapter = project.chapters.find(
    (chapter) => chapter.id === requestedChapterId,
  );
  const exactScene = requestedChapter?.scenes.find(
    (scene) => scene.id === requestedSceneId,
  );
  const recovered = exactScene
    ? { chapter: requestedChapter!, scene: exactScene }
    : findProjectScene(project, requestedSceneId);
  const chapter = recovered?.chapter ?? project.chapters[0];
  const scene = recovered?.scene ?? chapter.scenes[0];
  const elementId = scene.elements.some(
    (item) => item.id === requestedElementId,
  )
    ? requestedElementId
    : (scene.elements.at(-1)?.id ?? '');
  return { chapterId: chapter.id, sceneId: scene.id, elementId };
}

export type DraftConflictChoice = 'keep-current' | 'load-saved';

export function resolveDraftConflict(
  currentProject: MotusProject,
  savedProject: MotusProject,
  choice: DraftConflictChoice,
  updatedAt = new Date().toISOString(),
): MotusProject {
  const resolved = cloneProject(
    choice === 'keep-current' ? currentProject : savedProject,
  );
  if (choice === 'keep-current') resolved.updatedAt = updatedAt;
  return resolved;
}

export type DraftAutosaveState = {
  hydrated: boolean;
  dirty: boolean;
  externalChange: boolean;
};

export function shouldAutosaveDraft(state: DraftAutosaveState): boolean {
  return state.hydrated && state.dirty && !state.externalChange;
}

export type DraftExitAction = 'none' | 'flush' | 'warn';

export function getDraftExitAction(state: {
  hydrated: boolean;
  dirty: boolean;
  externalChange: boolean;
}): DraftExitAction {
  if (!state.hydrated || !state.dirty) return 'none';
  return state.externalChange ? 'warn' : 'flush';
}

export type DraftSaveStatus = 'conflict' | 'failed' | 'saving' | 'saved';

export function getDraftSaveStatus(state: {
  dirty: boolean;
  externalChange: boolean;
  saveFailed: boolean;
}): DraftSaveStatus {
  if (state.externalChange) return 'conflict';
  if (state.saveFailed) return 'failed';
  return state.dirty ? 'saving' : 'saved';
}

export function createPublicationRevision(
  project: MotusProject,
  createdAt = new Date().toISOString(),
): MotusPublicationRevision {
  const highestRevision = project.publications.reduce(
    (highest, publication) => Math.max(highest, publication.revision),
    Math.max(project.publishedRevision, 0),
  );
  if (
    !Number.isSafeInteger(highestRevision) ||
    highestRevision < 0 ||
    highestRevision >= MAX_PUBLICATION_REVISION
  ) {
    throw new RangeError('Publication history has reached its supported limit');
  }
  const revision = highestRevision + 1;
  const occupiedIds = new Set(
    project.publications.map((publication) => publication.id),
  );
  const baseId = `${project.id}-revision-${revision}`;
  let id = baseId;
  for (let suffix = 2; occupiedIds.has(id); suffix += 1) {
    id = `${baseId}-${suffix}`;
  }
  const metadata = createWorkMetadata(project.metadata, project.creatorName);
  const creatorName = metadata.contributorNames[0] ?? project.creatorName;
  return {
    id,
    revision,
    createdAt,
    title: project.title,
    creatorName,
    description: project.description,
    tags: [...project.tags],
    language: project.language,
    contentRating: project.contentRating,
    visibility: project.visibility,
    metadata,
    format: project.format,
    coverSceneId: resolveProjectCoverSceneId(project, project.coverSceneId),
    chapters: structuredClone(project.chapters),
  };
}

export function hasUnpublishedChanges(project: MotusProject): boolean {
  const published =
    project.publications.find(
      (revision) => revision.revision === project.publishedRevision,
    ) ?? project.publications.at(-1);
  if (!published) return true;

  return (
    published.title !== project.title ||
    published.creatorName !==
      (project.metadata.contributorNames[0] ?? project.creatorName) ||
    published.description !== project.description ||
    JSON.stringify(published.tags) !== JSON.stringify(project.tags) ||
    published.language !== project.language ||
    published.contentRating !== project.contentRating ||
    published.visibility !== project.visibility ||
    JSON.stringify(published.metadata) !== JSON.stringify(project.metadata) ||
    published.format !== project.format ||
    published.coverSceneId !== project.coverSceneId ||
    JSON.stringify(published.chapters) !== JSON.stringify(project.chapters)
  );
}

export function restorePublicationToDraft(
  project: MotusProject,
  revisionId: string,
  updatedAt = new Date().toISOString(),
): MotusProject | null {
  const revision = project.publications.find((item) => item.id === revisionId);
  if (!revision) return null;

  const restored = cloneProject(project);
  restored.title = revision.title;
  restored.metadata = createWorkMetadata(
    revision.metadata,
    revision.creatorName,
  );
  restored.creatorName =
    restored.metadata.contributorNames[0] ?? revision.creatorName;
  restored.description = revision.description;
  restored.tags = [...revision.tags];
  restored.language = revision.language;
  restored.contentRating = revision.contentRating;
  restored.visibility = revision.visibility;
  restored.format = revision.format;
  restored.coverSceneId = revision.coverSceneId;
  restored.chapters = structuredClone(revision.chapters);
  restored.updatedAt = updatedAt;
  return restored;
}

export function removePublicationRevision(
  project: MotusProject,
  revisionId: string,
): MotusProject | null {
  const revision = project.publications.find((item) => item.id === revisionId);
  if (!revision || revision.revision === project.publishedRevision) return null;

  const next = cloneProject(project);
  next.publications = next.publications.filter(
    (item) => item.id !== revisionId,
  );
  return next;
}

type UnknownRecord = Record<string, unknown>;

export type ProjectRestoreResult =
  | { project: MotusProject; error: null }
  | { project: null; error: string };

const defaultSceneBackground =
  'linear-gradient(155deg, #24203b 0%, #151626 54%, #332b46 100%)';

const isRecord = (value: unknown): value is UnknownRecord =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const isElementType = (value: unknown): value is ElementType =>
  value === 'shape' ||
  value === 'text' ||
  value === 'speech' ||
  value === 'image';

const isSafeColor = (value: unknown): value is string =>
  typeof value === 'string' &&
  /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value);

const isSafeSceneBackground = (value: unknown): value is string =>
  typeof value === 'string' &&
  (/^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value) ||
    (value.length <= 500 && /^linear-gradient\([^;{}]+\)$/i.test(value)));

const isSafeImageSource = (value: unknown): value is string =>
  typeof value === 'string' &&
  value.length <= Math.ceil((MAX_IMAGE_BYTES * 4) / 3) + 128 &&
  /^data:image\/(?:png|webp);base64,[a-z0-9+/=\s]+$/i.test(value);

function validateMotion(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  if (!isRecord(value)) return 'Project contains invalid motion instructions';
  if (
    value.schemaVersion !== undefined &&
    value.schemaVersion !== MOTION_SCHEMA_VERSION
  ) {
    return 'Project uses an unsupported motion version';
  }
  if (value.event !== undefined && !isMotionEventBlockKind(value.event)) {
    return 'Project uses an unsupported motion trigger';
  }
  if (value.blocks !== undefined) {
    if (
      !Array.isArray(value.blocks) ||
      value.blocks.length > MAX_MOTION_BLOCKS
    ) {
      return 'Project contains an invalid animation block program';
    }
    const ids = new Set<string>();
    for (const block of value.blocks) {
      if (
        !isRecord(block) ||
        typeof block.id !== 'string' ||
        !block.id ||
        !isMotionBlockKind(block.kind) ||
        ids.has(block.id)
      ) {
        return 'Project contains an invalid animation block program';
      }
      if (
        block.sourceElementId !== undefined &&
        block.sourceElementId !== null &&
        (typeof block.sourceElementId !== 'string' ||
          !block.sourceElementId.trim() ||
          block.sourceElementId.length > MAX_MOTION_EVENT_SOURCE_ID_LENGTH)
      ) {
        return 'Project contains an invalid animation source layer';
      }
      if (block.kind === 'bounce' && block.jumps !== undefined) {
        if (
          !Array.isArray(block.jumps) ||
          block.jumps.length > MAX_BOUNCE_JUMPS
        ) {
          return 'Project contains an invalid bounce sequence';
        }
        const jumpIds = new Set<string>();
        for (const jump of block.jumps) {
          if (
            !isRecord(jump) ||
            typeof jump.id !== 'string' ||
            !jump.id ||
            jumpIds.has(jump.id) ||
            (jump.direction !== 'left' && jump.direction !== 'right')
          ) {
            return 'Project contains an invalid bounce sequence';
          }
          jumpIds.add(jump.id);
        }
      }
      ids.add(block.id);
    }
  }
  return null;
}

function validateScenes(
  value: unknown,
  context: string,
  projectSceneIds = new Set<string>(),
): string | null {
  if (!Array.isArray(value) || value.length === 0) {
    return `${context} needs at least one scene`;
  }
  if (value.length > MAX_PROJECT_SCENES) {
    return `${context} has more than ${MAX_PROJECT_SCENES} scenes`;
  }

  for (const sceneValue of value) {
    if (
      !isRecord(sceneValue) ||
      typeof sceneValue.id !== 'string' ||
      !sceneValue.id ||
      sceneValue.id !== sceneValue.id.trim() ||
      sceneValue.id.length > MAX_ELEMENT_ID_LENGTH
    ) {
      return `${context} contains an invalid scene`;
    }
    if (projectSceneIds.has(sceneValue.id))
      return `${context} has duplicate scene IDs`;
    projectSceneIds.add(sceneValue.id);
    if (sceneValue.name !== undefined && typeof sceneValue.name !== 'string') {
      return `${context} contains an invalid scene name`;
    }
    if (!Array.isArray(sceneValue.elements)) {
      return `${context} contains a scene with invalid layers`;
    }
    if (sceneValue.elements.length > MAX_SCENE_ELEMENTS) {
      return `${context} has a scene with more than ${MAX_SCENE_ELEMENTS} layers`;
    }

    const elementIds = new Set<string>();
    for (const elementValue of sceneValue.elements) {
      if (
        !isRecord(elementValue) ||
        typeof elementValue.id !== 'string' ||
        !elementValue.id ||
        elementValue.id !== elementValue.id.trim() ||
        elementValue.id.length > MAX_ELEMENT_ID_LENGTH
      ) {
        return `${context} contains an invalid layer`;
      }
      if (elementIds.has(elementValue.id))
        return `${context} has duplicate layer IDs`;
      elementIds.add(elementValue.id);
      if (
        elementValue.name !== undefined &&
        typeof elementValue.name !== 'string'
      ) {
        return `${context} contains an invalid layer name`;
      }
      if (!isElementType(elementValue.type)) {
        return `${context} contains an unsupported layer type`;
      }
      const motionError = validateMotion(elementValue.motion);
      if (motionError) return motionError;
      if (
        elementValue.text !== undefined &&
        (typeof elementValue.text !== 'string' ||
          elementValue.text.length > MAX_ELEMENT_TEXT_LENGTH)
      ) {
        return `${context} contains invalid or oversized text`;
      }
      if (
        elementValue.type === 'image' &&
        elementValue.src !== undefined &&
        !isSafeImageSource(elementValue.src)
      ) {
        return `${context} contains an unsafe or oversized image source`;
      }
    }
  }
  return null;
}

function validateChapters(value: unknown, context: string): string | null {
  if (!Array.isArray(value) || value.length === 0) {
    return `${context} needs at least one chapter`;
  }
  if (value.length > MAX_PROJECT_CHAPTERS) {
    return `${context} has more than ${MAX_PROJECT_CHAPTERS} chapters`;
  }

  const chapterIds = new Set<string>();
  const projectSceneIds = new Set<string>();
  let sceneCount = 0;
  for (const [index, chapterValue] of value.entries()) {
    if (
      !isRecord(chapterValue) ||
      typeof chapterValue.id !== 'string' ||
      !chapterValue.id ||
      chapterValue.id !== chapterValue.id.trim() ||
      chapterValue.id.length > MAX_ELEMENT_ID_LENGTH ||
      typeof chapterValue.title !== 'string'
    ) {
      return `${context} contains an invalid chapter`;
    }
    if (chapterIds.has(chapterValue.id)) {
      return `${context} has duplicate chapter IDs`;
    }
    chapterIds.add(chapterValue.id);
    const sceneError = validateScenes(
      chapterValue.scenes,
      `${context} chapter ${index + 1}`,
      projectSceneIds,
    );
    if (sceneError) return sceneError;
    sceneCount += (chapterValue.scenes as unknown[]).length;
    if (sceneCount > MAX_PROJECT_SCENES) {
      return `${context} has more than ${MAX_PROJECT_SCENES} scenes`;
    }
  }
  return null;
}

function normalizeEditableName(
  value: unknown,
  fallback: string,
  maxLength: number,
): string {
  if (typeof value !== 'string') return fallback;
  const normalized = value.trim();
  return normalized ? normalized.slice(0, maxLength) : fallback;
}

function normalizeScenes(value: unknown[]): MotusScene[] {
  return value.map((sceneValue) => {
    const item = sceneValue as UnknownRecord;
    return {
      id: item.id as string,
      name: normalizeEditableName(
        item.name,
        'Untitled scene',
        MAX_SCENE_NAME_LENGTH,
      ),
      background: isSafeSceneBackground(item.background)
        ? item.background
        : defaultSceneBackground,
      elements: (item.elements as UnknownRecord[]).map((elementValue) => {
        const type = elementValue.type as ElementType;
        const defaults = {
          width: type === 'text' ? 440 : 260,
          height: type === 'text' ? 120 : 220,
          fill: type === 'speech' ? '#fffaf0' : '#8c74ff',
        };
        return constrainElementToCanvas({
          id: elementValue.id as string,
          name: normalizeEditableName(
            elementValue.name,
            `${type[0].toUpperCase()}${type.slice(1)}`,
            MAX_ELEMENT_NAME_LENGTH,
          ),
          type,
          x: finite(elementValue.x, 0),
          y: finite(elementValue.y, 0),
          width: finite(elementValue.width, defaults.width),
          height: finite(elementValue.height, defaults.height),
          rotation: finite(elementValue.rotation, 0),
          opacity: finite(elementValue.opacity, 1),
          fill: isSafeColor(elementValue.fill)
            ? elementValue.fill
            : defaults.fill,
          text:
            typeof elementValue.text === 'string'
              ? elementValue.text
              : undefined,
          typography: normalizeElementTypography(type, elementValue.typography),
          src:
            type === 'image' && isSafeImageSource(elementValue.src)
              ? elementValue.src
              : undefined,
          visible: elementValue.visible !== false,
          locked: Boolean(elementValue.locked),
          motion: migrateMotion(
            isRecord(elementValue.motion)
              ? (elementValue.motion as Partial<ElementMotion>)
              : undefined,
          ),
        });
      }),
    };
  });
}

function normalizeChapters(value: unknown[]): MotusChapter[] {
  return value.map((chapterValue) => {
    const chapter = chapterValue as UnknownRecord;
    return {
      id: chapter.id as string,
      title: normalizeEditableName(
        chapter.title,
        'Untitled chapter',
        MAX_PROJECT_TITLE_LENGTH,
      ),
      scenes: normalizeScenes(chapter.scenes as unknown[]),
    };
  });
}

function normalizeTags(value: unknown): string[] {
  return Array.isArray(value) ? sanitizeProjectTags(value) : [];
}

function normalizeContentRating(value: unknown): ContentRating {
  return value === 'teen' || value === 'mature' || value === 'adults-only'
    ? value
    : 'all-ages';
}

function normalizeVisibility(value: unknown): PublicationVisibility {
  return value === 'public' ? 'public' : 'private';
}

function isProjectFormat(value: unknown): value is MotusProjectFormat {
  return value === 'vertical-scroll' || value === 'page';
}

const WORK_METADATA_LIST_FIELDS = [
  'genres',
  'characters',
  'relationships',
  'themes',
  'contentWarnings',
  'communityLinks',
] as const;

function validateMetadataStringList(
  value: unknown,
  maxItems: number,
  requireOne: boolean,
): boolean {
  if (!Array.isArray(value)) return false;
  if ((requireOne && value.length === 0) || value.length > maxItems) {
    return false;
  }
  const seen = new Set<string>();
  for (const item of value) {
    if (
      typeof item !== 'string' ||
      !item.trim() ||
      item.length > MAX_PROJECT_METADATA_VALUE_LENGTH
    ) {
      return false;
    }
    const key = item.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
  }
  return true;
}

function validateOptionalMetadataValue(value: unknown): boolean {
  return (
    value === null ||
    (typeof value === 'string' &&
      Boolean(value.trim()) &&
      value.length <= MAX_PROJECT_METADATA_VALUE_LENGTH)
  );
}

function validateWorkMetadata(
  value: unknown,
  label: string,
  requireContributor: boolean,
): string | null {
  if (!isRecord(value)) return `${label} work metadata is invalid`;
  if (
    !validateMetadataStringList(
      value.contributorNames,
      MAX_PROJECT_CONTRIBUTORS,
      requireContributor,
    ) ||
    (value.workStatus !== null &&
      !WORK_STATUSES.includes(value.workStatus as WorkStatus)) ||
    (value.origin !== null &&
      !WORK_ORIGINS.includes(value.origin as WorkOrigin))
  ) {
    return `${label} work metadata is invalid`;
  }
  for (const field of [
    'sourceWorkSlug',
    'sourceTitle',
    'sourceCreator',
    'fandom',
  ] as const) {
    if (!validateOptionalMetadataValue(value[field])) {
      return `${label} work metadata is invalid`;
    }
  }
  for (const field of WORK_METADATA_LIST_FIELDS) {
    if (
      !validateMetadataStringList(
        value[field],
        MAX_PROJECT_METADATA_ITEMS,
        false,
      )
    ) {
      return `${label} work metadata is invalid`;
    }
  }
  if (
    value.origin === 'original' &&
    (value.sourceWorkSlug !== null ||
      value.sourceTitle !== null ||
      value.sourceCreator !== null ||
      value.fandom !== null)
  ) {
    return `${label} original-work source metadata is invalid`;
  }
  if (value.origin !== 'motus-fanwork' && value.sourceWorkSlug !== null) {
    return `${label} source work relationship is invalid`;
  }
  return null;
}

export function restoreProjectWithError(
  value: string | null,
): ProjectRestoreResult {
  if (!value) return { project: null, error: 'Project file is empty' };
  if (new TextEncoder().encode(value).byteLength > MAX_PROJECT_FILE_BYTES) {
    return {
      project: null,
      error: `Project file is larger than ${Math.round(MAX_PROJECT_FILE_BYTES / 1_000_000)} MB`,
    };
  }

  let candidate: UnknownRecord;
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!isRecord(parsed)) {
      return {
        project: null,
        error: 'Project file must contain one Motus project',
      };
    }
    candidate = parsed;
  } catch {
    return { project: null, error: 'Project file is not valid JSON' };
  }

  if (
    candidate.schemaVersion !== 2 &&
    candidate.schemaVersion !== 3 &&
    candidate.schemaVersion !== 4 &&
    candidate.schemaVersion !== 5 &&
    candidate.schemaVersion !== 6 &&
    candidate.schemaVersion !== 7 &&
    candidate.schemaVersion !== PROJECT_SCHEMA_VERSION
  ) {
    return {
      project: null,
      error: 'Project uses an unsupported schema version',
    };
  }
  if (typeof candidate.title !== 'string') {
    return { project: null, error: 'Project title is missing' };
  }
  if (candidate.title.length > MAX_PROJECT_TITLE_LENGTH) {
    return { project: null, error: 'Project title is too long' };
  }

  const schemaVersion = candidate.schemaVersion as number;
  const usesChapterHierarchy = schemaVersion >= 7;
  const usesWorkMetadata = schemaVersion >= 8;
  if (usesChapterHierarchy && !isProjectFormat(candidate.format)) {
    return { project: null, error: 'Project uses an unsupported format' };
  }
  if (usesWorkMetadata) {
    const metadataError = validateWorkMetadata(
      candidate.metadata,
      'Project',
      false,
    );
    if (metadataError) return { project: null, error: metadataError };
  }

  const fallbackId = createProjectBackupFileName({
    id: 'imported-work',
    title: candidate.title,
  }).replace(/\.motus\.json$/, '');
  const projectId =
    typeof candidate.id === 'string' && candidate.id.trim()
      ? candidate.id.trim()
      : fallbackId;
  const legacyChapterId = `${projectId.slice(0, MAX_ELEMENT_ID_LENGTH - 10)}-chapter-1`;
  const hierarchyError = usesChapterHierarchy
    ? validateChapters(candidate.chapters, 'Project')
    : validateScenes(candidate.scenes, 'Project');
  if (hierarchyError) return { project: null, error: hierarchyError };

  const publicationValues = candidate.publications ?? [];
  if (!Array.isArray(publicationValues)) {
    return { project: null, error: 'Project publication history is invalid' };
  }
  const publicationIds = new Set<string>();
  const publicationNumbers = new Set<number>();
  for (const publicationValue of publicationValues) {
    if (
      !isRecord(publicationValue) ||
      typeof publicationValue.id !== 'string' ||
      !publicationValue.id ||
      !Number.isSafeInteger(publicationValue.revision) ||
      (publicationValue.revision as number) <= 0 ||
      (publicationValue.revision as number) > MAX_PUBLICATION_REVISION ||
      typeof publicationValue.createdAt !== 'string' ||
      typeof publicationValue.title !== 'string'
    ) {
      return { project: null, error: 'Project publication history is invalid' };
    }
    if (usesChapterHierarchy && !isProjectFormat(publicationValue.format)) {
      return { project: null, error: 'Project publication format is invalid' };
    }
    if (usesWorkMetadata) {
      const metadataError = validateWorkMetadata(
        publicationValue.metadata,
        `Publication revision ${publicationValue.revision as number}`,
        true,
      );
      if (metadataError) return { project: null, error: metadataError };
    }
    const revision = publicationValue.revision as number;
    if (
      publicationIds.has(publicationValue.id) ||
      publicationNumbers.has(revision)
    ) {
      return {
        project: null,
        error: 'Project has duplicate publication revisions',
      };
    }
    publicationIds.add(publicationValue.id);
    publicationNumbers.add(revision);
    const revisionError = usesChapterHierarchy
      ? validateChapters(
          publicationValue.chapters,
          `Publication revision ${revision}`,
        )
      : validateScenes(
          publicationValue.scenes,
          `Publication revision ${revision}`,
        );
    if (revisionError) return { project: null, error: revisionError };
  }

  const publications: MotusPublicationRevision[] = publicationValues.map(
    (publicationValue) => {
      const revision = publicationValue as UnknownRecord;
      const chapters = usesChapterHierarchy
        ? normalizeChapters(revision.chapters as unknown[])
        : [
            {
              id: legacyChapterId,
              title: normalizeEditableName(
                revision.chapterTitle,
                'Chapter 1',
                MAX_PROJECT_TITLE_LENGTH,
              ),
              scenes: normalizeScenes(revision.scenes as unknown[]),
            },
          ];
      const format: MotusProjectFormat = usesChapterHierarchy
        ? (revision.format as MotusProjectFormat)
        : 'vertical-scroll';
      const legacyCreatorName = normalizeEditableName(
        revision.creatorName,
        'Unknown creator',
        MAX_PROJECT_TITLE_LENGTH,
      );
      const metadata = usesWorkMetadata
        ? createWorkMetadata(
            revision.metadata as Partial<MotusWorkMetadata>,
            legacyCreatorName,
          )
        : createWorkMetadata(
            { contributorNames: [legacyCreatorName] },
            legacyCreatorName,
          );
      return {
        id: revision.id as string,
        revision: revision.revision as number,
        createdAt: revision.createdAt as string,
        title: revision.title as string,
        creatorName: metadata.contributorNames[0] ?? legacyCreatorName,
        description:
          typeof revision.description === 'string'
            ? revision.description.slice(0, MAX_PROJECT_DESCRIPTION_LENGTH)
            : '',
        tags: normalizeTags(revision.tags),
        language:
          typeof revision.language === 'string' ? revision.language : 'en',
        contentRating: normalizeContentRating(revision.contentRating),
        visibility: normalizeVisibility(revision.visibility),
        metadata,
        format,
        coverSceneId: resolveProjectCoverSceneId(
          { chapters },
          revision.coverSceneId,
        ),
        chapters,
      };
    },
  );
  const publishedRevision = publications.reduce(
    (highest, revision) => Math.max(highest, revision.revision),
    0,
  );
  const updatedAt =
    typeof candidate.updatedAt === 'string' &&
    Number.isFinite(Date.parse(candidate.updatedAt))
      ? candidate.updatedAt
      : new Date(0).toISOString();
  const chapters = usesChapterHierarchy
    ? normalizeChapters(candidate.chapters as unknown[])
    : [
        {
          id: legacyChapterId,
          title: normalizeEditableName(
            candidate.chapterTitle,
            'Chapter 1',
            MAX_PROJECT_TITLE_LENGTH,
          ),
          scenes: normalizeScenes(candidate.scenes as unknown[]),
        },
      ];
  const format: MotusProjectFormat = usesChapterHierarchy
    ? (candidate.format as MotusProjectFormat)
    : 'vertical-scroll';
  const legacyCreatorName = normalizeEditableName(
    candidate.creatorName,
    'Unknown creator',
    MAX_PROJECT_TITLE_LENGTH,
  );
  const metadata = usesWorkMetadata
    ? createWorkMetadata(
        candidate.metadata as Partial<MotusWorkMetadata>,
        legacyCreatorName,
      )
    : createWorkMetadata(
        { contributorNames: [legacyCreatorName] },
        legacyCreatorName,
      );

  return {
    error: null,
    project: {
      schemaVersion: PROJECT_SCHEMA_VERSION,
      id: projectId,
      title: candidate.title,
      creatorName: metadata.contributorNames[0] ?? legacyCreatorName,
      description:
        typeof candidate.description === 'string'
          ? candidate.description.slice(0, MAX_PROJECT_DESCRIPTION_LENGTH)
          : '',
      tags: normalizeTags(candidate.tags),
      language:
        typeof candidate.language === 'string' ? candidate.language : 'en',
      contentRating: normalizeContentRating(candidate.contentRating),
      visibility: normalizeVisibility(candidate.visibility),
      metadata,
      format,
      coverSceneId: resolveProjectCoverSceneId(
        { chapters },
        candidate.coverSceneId,
      ),
      publishedRevision,
      publications,
      chapters,
      updatedAt,
    },
  };
}

export function restoreProject(value: string | null): MotusProject | null {
  return restoreProjectWithError(value).project;
}
