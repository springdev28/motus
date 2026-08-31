export const IMAGE_RIG_MESH_COLUMNS = 3 as const;
export const IMAGE_RIG_MESH_ROWS = 3 as const;
export const IMAGE_RIG_MESH_POINT_COUNT =
  IMAGE_RIG_MESH_COLUMNS * IMAGE_RIG_MESH_ROWS;
export const MIN_IMAGE_RIG_MESH_OFFSET = -20;
export const MAX_IMAGE_RIG_MESH_OFFSET = 20;

export type ElementImageRigMeshPoint = {
  /** Local offset from the regular 3×3 grid, in part-relative percent. */
  x: number;
  /** Local offset from the regular 3×3 grid, in part-relative percent. */
  y: number;
};

export type ElementImageRigMesh = {
  columns: typeof IMAGE_RIG_MESH_COLUMNS;
  rows: typeof IMAGE_RIG_MESH_ROWS;
  offsets: ElementImageRigMeshPoint[];
};

export const IMAGE_RIG_MESH_PRESETS = [
  'rest',
  'wind-left',
  'wind-right',
  's-curve',
  'pinch',
] as const;

export type ImageRigMeshPreset = (typeof IMAGE_RIG_MESH_PRESETS)[number];

const PRESET_OFFSETS = {
  rest: [
    { x: 0, y: 0 },
    { x: 0, y: 0 },
    { x: 0, y: 0 },
    { x: 0, y: 0 },
    { x: 0, y: 0 },
    { x: 0, y: 0 },
    { x: 0, y: 0 },
    { x: 0, y: 0 },
    { x: 0, y: 0 },
  ],
  'wind-left': [
    { x: 0, y: 0 },
    { x: -10, y: 6 },
    { x: 0, y: 0 },
    { x: 0, y: -4 },
    { x: -6, y: -8 },
    { x: 0, y: 3 },
    { x: 0, y: 0 },
    { x: 7, y: -6 },
    { x: 0, y: 0 },
  ],
  'wind-right': [
    { x: 0, y: 0 },
    { x: 10, y: 6 },
    { x: 0, y: 0 },
    { x: 0, y: 3 },
    { x: 6, y: -8 },
    { x: 0, y: -4 },
    { x: 0, y: 0 },
    { x: -7, y: -6 },
    { x: 0, y: 0 },
  ],
  's-curve': [
    { x: 0, y: 0 },
    { x: 11, y: 4 },
    { x: 0, y: 0 },
    { x: 0, y: -7 },
    { x: -10, y: 0 },
    { x: 0, y: 7 },
    { x: 0, y: 0 },
    { x: 9, y: -4 },
    { x: 0, y: 0 },
  ],
  pinch: [
    { x: 0, y: 0 },
    { x: 0, y: 10 },
    { x: 0, y: 0 },
    { x: 12, y: 0 },
    { x: 0, y: 0 },
    { x: -12, y: 0 },
    { x: 0, y: 0 },
    { x: 0, y: -10 },
    { x: 0, y: 0 },
  ],
} as const satisfies Record<
  ImageRigMeshPreset,
  readonly ElementImageRigMeshPoint[]
>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const clampOffset = (value: number): number =>
  Math.round(
    Math.min(
      MAX_IMAGE_RIG_MESH_OFFSET,
      Math.max(MIN_IMAGE_RIG_MESH_OFFSET, value),
    ) * 1_000,
  ) / 1_000;

export function getImageRigMeshBasePoint(index: number): {
  x: number;
  y: number;
} {
  const safeIndex = Math.min(
    IMAGE_RIG_MESH_POINT_COUNT - 1,
    Math.max(0, Math.floor(index)),
  );
  return {
    x: (safeIndex % IMAGE_RIG_MESH_COLUMNS) * 50,
    y: Math.floor(safeIndex / IMAGE_RIG_MESH_COLUMNS) * 50,
  };
}

export function createImageRigMesh(
  preset: ImageRigMeshPreset = 'rest',
): ElementImageRigMesh {
  return {
    columns: IMAGE_RIG_MESH_COLUMNS,
    rows: IMAGE_RIG_MESH_ROWS,
    offsets: PRESET_OFFSETS[preset].map((point) => ({ ...point })),
  };
}

export function getImageRigMeshPoint(
  mesh: ElementImageRigMesh,
  index: number,
): ElementImageRigMeshPoint {
  const base = getImageRigMeshBasePoint(index);
  const offset = mesh.offsets[index] ?? { x: 0, y: 0 };
  return { x: base.x + offset.x, y: base.y + offset.y };
}

export function isValidElementImageRigMesh(
  value: unknown,
): value is ElementImageRigMesh {
  if (
    !isRecord(value) ||
    value.columns !== IMAGE_RIG_MESH_COLUMNS ||
    value.rows !== IMAGE_RIG_MESH_ROWS ||
    !Array.isArray(value.offsets) ||
    value.offsets.length !== IMAGE_RIG_MESH_POINT_COUNT
  ) {
    return false;
  }
  return value.offsets.every((offset, index) => {
    if (
      !isRecord(offset) ||
      typeof offset.x !== 'number' ||
      !Number.isFinite(offset.x) ||
      offset.x < MIN_IMAGE_RIG_MESH_OFFSET ||
      offset.x > MAX_IMAGE_RIG_MESH_OFFSET ||
      typeof offset.y !== 'number' ||
      !Number.isFinite(offset.y) ||
      offset.y < MIN_IMAGE_RIG_MESH_OFFSET ||
      offset.y > MAX_IMAGE_RIG_MESH_OFFSET
    ) {
      return false;
    }
    const base = getImageRigMeshBasePoint(index);
    const x = base.x + offset.x;
    const y = base.y + offset.y;
    return x >= 0 && x <= 100 && y >= 0 && y <= 100;
  });
}

export function normalizeElementImageRigMesh(
  value: unknown,
): ElementImageRigMesh | undefined {
  if (!isValidElementImageRigMesh(value)) return undefined;
  return {
    columns: IMAGE_RIG_MESH_COLUMNS,
    rows: IMAGE_RIG_MESH_ROWS,
    offsets: value.offsets.map((offset) => ({
      x: clampOffset(offset.x),
      y: clampOffset(offset.y),
    })),
  };
}

export function updateImageRigMeshPoint(
  mesh: ElementImageRigMesh,
  index: number,
  point: ElementImageRigMeshPoint,
): ElementImageRigMesh {
  const normalized = normalizeElementImageRigMesh(mesh) ?? createImageRigMesh();
  if (
    !Number.isInteger(index) ||
    index < 0 ||
    index >= IMAGE_RIG_MESH_POINT_COUNT
  ) {
    return normalized;
  }
  const base = getImageRigMeshBasePoint(index);
  normalized.offsets[index] = {
    x: clampOffset(Math.min(100 - base.x, Math.max(-base.x, point.x - base.x))),
    y: clampOffset(Math.min(100 - base.y, Math.max(-base.y, point.y - base.y))),
  };
  return normalized;
}

export function getImageRigMeshPositions(
  mesh: ElementImageRigMesh,
  width: number,
  height: number,
): Float32Array {
  const safeWidth = Number.isFinite(width) ? Math.max(1, width) : 1;
  const safeHeight = Number.isFinite(height) ? Math.max(1, height) : 1;
  return new Float32Array(
    mesh.offsets.flatMap((_, index) => {
      const point = getImageRigMeshPoint(mesh, index);
      return [(point.x / 100) * safeWidth, (point.y / 100) * safeHeight];
    }),
  );
}

export function isIdentityImageRigMesh(
  value: ElementImageRigMesh | undefined,
): boolean {
  return (
    !value || value.offsets.every((point) => point.x === 0 && point.y === 0)
  );
}
