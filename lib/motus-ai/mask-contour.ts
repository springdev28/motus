import type {
  InteractiveSegmentationResult,
  SegmentationPoint,
} from './interactive-segmentation';

type PixelBounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

type Edge = {
  start: number;
  end: number;
  direction: number;
  used: boolean;
};

export class EmptySegmentationMaskError extends Error {
  constructor() {
    super('The current prompts did not produce a foreground region.');
    this.name = 'EmptySegmentationMaskError';
  }
}

function assertMaskShape(
  confidence: Float32Array,
  width: number,
  height: number,
): void {
  if (
    !Number.isSafeInteger(width) ||
    !Number.isSafeInteger(height) ||
    width <= 0 ||
    height <= 0 ||
    confidence.length !== width * height
  ) {
    throw new Error(
      `Invalid confidence mask dimensions ${width}x${height} for ${confidence.length} values.`,
    );
  }
}

function labelLargestComponent(
  confidence: Float32Array,
  width: number,
  height: number,
  threshold: number,
): {
  labels: Int32Array;
  label: number;
  area: number;
  bounds: PixelBounds;
} {
  const size = width * height;
  const labels = new Int32Array(size);
  const queue = new Int32Array(size);
  let nextLabel = 0;
  let largestLabel = 0;
  let largestArea = 0;
  let largestBounds: PixelBounds | undefined;

  for (let start = 0; start < size; start += 1) {
    if (labels[start] !== 0 || !(confidence[start] >= threshold)) continue;
    nextLabel += 1;
    let head = 0;
    let tail = 1;
    queue[0] = start;
    labels[start] = nextLabel;
    let area = 0;
    let minX = width;
    let minY = height;
    let maxX = 0;
    let maxY = 0;

    while (head < tail) {
      const index = queue[head++];
      const x = index % width;
      const y = Math.floor(index / width);
      area += 1;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);

      const neighbors = [
        x > 0 ? index - 1 : -1,
        x + 1 < width ? index + 1 : -1,
        y > 0 ? index - width : -1,
        y + 1 < height ? index + width : -1,
      ];
      for (const neighbor of neighbors) {
        if (
          neighbor >= 0 &&
          labels[neighbor] === 0 &&
          confidence[neighbor] >= threshold
        ) {
          labels[neighbor] = nextLabel;
          queue[tail++] = neighbor;
        }
      }
    }

    if (area > largestArea) {
      largestArea = area;
      largestLabel = nextLabel;
      largestBounds = { minX, minY, maxX, maxY };
    }
  }

  if (!largestBounds) throw new EmptySegmentationMaskError();
  return {
    labels,
    label: largestLabel,
    area: largestArea,
    bounds: largestBounds,
  };
}

function polygonArea(points: readonly SegmentationPoint[]): number {
  let area = 0;
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    area += current.x * next.y - next.x * current.y;
  }
  return area / 2;
}

function traceLargestOuterBoundary(
  labels: Int32Array,
  componentLabel: number,
  width: number,
  height: number,
): SegmentationPoint[] {
  const vertexWidth = width + 1;
  const edges: Edge[] = [];
  const outgoing = new Map<number, number[]>();
  const isSelected = (x: number, y: number) =>
    x >= 0 &&
    y >= 0 &&
    x < width &&
    y < height &&
    labels[y * width + x] === componentLabel;
  const vertex = (x: number, y: number) => y * vertexWidth + x;
  const addEdge = (
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    direction: number,
  ) => {
    const edgeIndex = edges.length;
    const start = vertex(startX, startY);
    edges.push({ start, end: vertex(endX, endY), direction, used: false });
    const entries = outgoing.get(start);
    if (entries) entries.push(edgeIndex);
    else outgoing.set(start, [edgeIndex]);
  };

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (!isSelected(x, y)) continue;
      if (!isSelected(x, y - 1)) addEdge(x, y, x + 1, y, 0);
      if (!isSelected(x + 1, y)) addEdge(x + 1, y, x + 1, y + 1, 1);
      if (!isSelected(x, y + 1)) addEdge(x + 1, y + 1, x, y + 1, 2);
      if (!isSelected(x - 1, y)) addEdge(x, y + 1, x, y, 3);
    }
  }

  const loops: SegmentationPoint[][] = [];
  const turnPreference = [1, 0, 3, 2];
  for (
    let firstEdgeIndex = 0;
    firstEdgeIndex < edges.length;
    firstEdgeIndex += 1
  ) {
    if (edges[firstEdgeIndex].used) continue;
    const firstEdge = edges[firstEdgeIndex];
    const startVertex = firstEdge.start;
    const points: SegmentationPoint[] = [];
    let edgeIndex = firstEdgeIndex;

    for (let safety = 0; safety <= edges.length; safety += 1) {
      const edge = edges[edgeIndex];
      if (edge.used) break;
      edge.used = true;
      points.push({
        x: edge.start % vertexWidth,
        y: Math.floor(edge.start / vertexWidth),
      });
      if (edge.end === startVertex) {
        if (points.length >= 3) loops.push(points);
        break;
      }

      const candidates = (outgoing.get(edge.end) ?? []).filter(
        (candidate) => !edges[candidate].used,
      );
      if (candidates.length === 0) break;
      edgeIndex = candidates[0];
      for (const preferredTurn of turnPreference) {
        const preferred = candidates.find(
          (candidate) =>
            (edges[candidate].direction - edge.direction + 4) % 4 ===
            preferredTurn,
        );
        if (preferred !== undefined) {
          edgeIndex = preferred;
          break;
        }
      }
    }
  }

  if (loops.length === 0) {
    throw new Error(
      'Could not trace a closed contour from the segmentation mask.',
    );
  }
  return loops.reduce((largest, loop) =>
    Math.abs(polygonArea(loop)) > Math.abs(polygonArea(largest))
      ? loop
      : largest,
  );
}

function squaredDistanceToSegment(
  point: SegmentationPoint,
  start: SegmentationPoint,
  end: SegmentationPoint,
): number {
  const deltaX = end.x - start.x;
  const deltaY = end.y - start.y;
  if (deltaX === 0 && deltaY === 0) {
    return (point.x - start.x) ** 2 + (point.y - start.y) ** 2;
  }
  const position = Math.max(
    0,
    Math.min(
      1,
      ((point.x - start.x) * deltaX + (point.y - start.y) * deltaY) /
        (deltaX ** 2 + deltaY ** 2),
    ),
  );
  const closestX = start.x + position * deltaX;
  const closestY = start.y + position * deltaY;
  return (point.x - closestX) ** 2 + (point.y - closestY) ** 2;
}

function simplifyOpenPolyline(
  points: readonly SegmentationPoint[],
  tolerance: number,
): SegmentationPoint[] {
  if (points.length <= 2) return [...points];
  const keep = new Uint8Array(points.length);
  keep[0] = 1;
  keep[points.length - 1] = 1;
  const stack: Array<[number, number]> = [[0, points.length - 1]];
  const toleranceSquared = tolerance * tolerance;

  while (stack.length > 0) {
    const [startIndex, endIndex] = stack.pop()!;
    let farthestIndex = -1;
    let farthestDistance = toleranceSquared;
    for (let index = startIndex + 1; index < endIndex; index += 1) {
      const distance = squaredDistanceToSegment(
        points[index],
        points[startIndex],
        points[endIndex],
      );
      if (distance > farthestDistance) {
        farthestDistance = distance;
        farthestIndex = index;
      }
    }
    if (farthestIndex >= 0) {
      keep[farthestIndex] = 1;
      stack.push([startIndex, farthestIndex], [farthestIndex, endIndex]);
    }
  }
  return points.filter((_, index) => keep[index] === 1);
}

function circularSlice(
  points: readonly SegmentationPoint[],
  start: number,
  end: number,
): SegmentationPoint[] {
  const result = [points[start]];
  for (let index = start; index !== end;) {
    index = (index + 1) % points.length;
    result.push(points[index]);
  }
  return result;
}

function simplifyClosedPolygon(
  points: readonly SegmentationPoint[],
  tolerance: number,
): SegmentationPoint[] {
  if (points.length <= 3) return [...points];
  let left = 0;
  let right = 0;
  for (let index = 1; index < points.length; index += 1) {
    if (points[index].x < points[left].x) left = index;
    if (points[index].x > points[right].x) right = index;
  }
  if (left === right) {
    for (let index = 1; index < points.length; index += 1) {
      if (points[index].y < points[left].y) left = index;
      if (points[index].y > points[right].y) right = index;
    }
  }
  if (left === right) return points.slice(0, 3);

  const first = simplifyOpenPolyline(
    circularSlice(points, left, right),
    tolerance,
  );
  const second = simplifyOpenPolyline(
    circularSlice(points, right, left),
    tolerance,
  );
  return [...first.slice(0, -1), ...second.slice(0, -1)];
}

function capPolygonPoints(
  points: readonly SegmentationPoint[],
  maxPoints: number,
): SegmentationPoint[] {
  if (points.length <= maxPoints) return [...points];
  let tolerance = 0.5;
  let simplified = [...points];
  for (
    let attempt = 0;
    attempt < 24 && simplified.length > maxPoints;
    attempt += 1
  ) {
    simplified = simplifyClosedPolygon(points, tolerance);
    tolerance *= 1.5;
  }
  if (simplified.length <= maxPoints) return simplified;
  return Array.from(
    { length: maxPoints },
    (_, index) =>
      simplified[Math.floor((index * simplified.length) / maxPoints)],
  );
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, value));
}

export function confidenceMaskToPolygon(
  confidence: Float32Array,
  width: number,
  height: number,
  threshold: number,
  maxPoints: number,
  backend: 'gpu' | 'cpu',
): InteractiveSegmentationResult {
  assertMaskShape(confidence, width, height);
  const component = labelLargestComponent(confidence, width, height, threshold);
  const boundary = traceLargestOuterBoundary(
    component.labels,
    component.label,
    width,
    height,
  );
  const simplified = capPolygonPoints(boundary, maxPoints);
  if (simplified.length < 3) throw new EmptySegmentationMaskError();

  const polygon = simplified.map((point) => ({
    x: clampPercent((point.x / width) * 100),
    y: clampPercent((point.y / height) * 100),
  }));
  const { minX, minY, maxX, maxY } = component.bounds;
  return {
    polygon,
    cropBounds: {
      x: (minX / width) * 100,
      y: (minY / height) * 100,
      width: ((maxX + 1 - minX) / width) * 100,
      height: ((maxY + 1 - minY) / height) * 100,
    },
    mask: {
      width,
      height,
      threshold,
      foregroundPixels: component.area,
    },
    backend,
  };
}
