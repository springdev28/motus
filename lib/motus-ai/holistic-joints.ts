import type { NormalizedLandmark } from '@mediapipe/tasks-vision';

export const DEFAULT_HOLISTIC_MANIFEST_URL =
  '/models/mediapipe/holistic/manifest.json';
export const DEFAULT_HOLISTIC_WASM_ROOT = '/vendor/mediapipe/wasm';
export const HOLISTIC_MODEL_ID =
  'mediapipe-holistic-landmarker-float16' as const;

export const HOLISTIC_RIG_JOINT_IDS = [
  'head',
  'neck',
  'torso',
  'left-shoulder',
  'left-elbow',
  'left-wrist',
  'right-shoulder',
  'right-elbow',
  'right-wrist',
  'left-hip',
  'left-knee',
  'left-ankle',
  'right-hip',
  'right-knee',
  'right-ankle',
] as const;

export type HolisticRigJointId = (typeof HOLISTIC_RIG_JOINT_IDS)[number];

export type HolisticRigJoint = {
  id: HolisticRigJointId;
  label: string;
  /** Source-image normalized coordinate in the inclusive 0..1 range. */
  x: number;
  /** Source-image normalized coordinate in the inclusive 0..1 range. */
  y: number;
  confidence: number;
};

type JointDefinition = {
  id: HolisticRigJointId;
  label: string;
  landmarkIndices: readonly number[];
};

const JOINT_DEFINITIONS: readonly JointDefinition[] = [
  { id: 'head', label: 'Head center', landmarkIndices: [2, 5, 7, 8] },
  { id: 'neck', label: 'Neck', landmarkIndices: [11, 12] },
  { id: 'torso', label: 'Torso center', landmarkIndices: [11, 12, 23, 24] },
  {
    id: 'left-shoulder',
    label: 'Performer left shoulder',
    landmarkIndices: [11],
  },
  { id: 'left-elbow', label: 'Performer left elbow', landmarkIndices: [13] },
  { id: 'left-wrist', label: 'Performer left wrist', landmarkIndices: [15] },
  {
    id: 'right-shoulder',
    label: 'Performer right shoulder',
    landmarkIndices: [12],
  },
  { id: 'right-elbow', label: 'Performer right elbow', landmarkIndices: [14] },
  { id: 'right-wrist', label: 'Performer right wrist', landmarkIndices: [16] },
  { id: 'left-hip', label: 'Performer left hip', landmarkIndices: [23] },
  { id: 'left-knee', label: 'Performer left knee', landmarkIndices: [25] },
  { id: 'left-ankle', label: 'Performer left ankle', landmarkIndices: [27] },
  { id: 'right-hip', label: 'Performer right hip', landmarkIndices: [24] },
  { id: 'right-knee', label: 'Performer right knee', landmarkIndices: [26] },
  { id: 'right-ankle', label: 'Performer right ankle', landmarkIndices: [28] },
];

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

function pointIsInPolygon(
  x: number,
  y: number,
  points: readonly { x: number; y: number }[],
): boolean {
  let inside = false;
  for (
    let currentIndex = 0, previousIndex = points.length - 1;
    currentIndex < points.length;
    previousIndex = currentIndex, currentIndex += 1
  ) {
    const current = points[currentIndex];
    const previous = points[previousIndex];
    const cross =
      (x - previous.x) * (current.y - previous.y) -
      (y - previous.y) * (current.x - previous.x);
    const onEdge =
      Math.abs(cross) < 1e-7 &&
      x >= Math.min(previous.x, current.x) &&
      x <= Math.max(previous.x, current.x) &&
      y >= Math.min(previous.y, current.y) &&
      y <= Math.max(previous.y, current.y);
    if (onEdge) return true;
    const intersects =
      current.y > y !== previous.y > y &&
      x <
        ((previous.x - current.x) * (y - current.y)) /
          (previous.y - current.y) +
          current.x;
    if (intersects) inside = !inside;
  }
  return inside;
}

export function extractHolisticRigJoints(
  landmarks: readonly NormalizedLandmark[],
): HolisticRigJoint[] {
  if (landmarks.length < 29) return [];
  const joints: HolisticRigJoint[] = [];
  for (const definition of JOINT_DEFINITIONS) {
    const points = definition.landmarkIndices
      .map((index) => landmarks[index])
      .filter(
        (point): point is NormalizedLandmark =>
          Boolean(point) &&
          Number.isFinite(point.x) &&
          Number.isFinite(point.y) &&
          point.x >= 0 &&
          point.x <= 1 &&
          point.y >= 0 &&
          point.y <= 1,
      );
    if (points.length !== definition.landmarkIndices.length) continue;
    const x = points.reduce((sum, point) => sum + point.x, 0) / points.length;
    const y = points.reduce((sum, point) => sum + point.y, 0) / points.length;
    const confidence = Math.min(
      ...points.map((point) =>
        Number.isFinite(point.visibility) ? point.visibility : 0,
      ),
    );
    joints.push({
      id: definition.id,
      label: definition.label,
      x,
      y,
      confidence: clamp01(confidence),
    });
  }
  return joints;
}

export function getRigJointPivot(
  joint: Pick<HolisticRigJoint, 'x' | 'y'>,
  crop: {
    cropX: number;
    cropY: number;
    cropWidth: number;
    cropHeight: number;
    maskPoints?: readonly { x: number; y: number }[];
  },
): { x: number; y: number; inside: boolean } {
  const sourceX = joint.x * 100;
  const sourceY = joint.y * 100;
  const x = ((sourceX - crop.cropX) / crop.cropWidth) * 100;
  const y = ((sourceY - crop.cropY) / crop.cropHeight) * 100;
  const insideCrop = x >= 0 && x <= 100 && y >= 0 && y <= 100;
  const insideMask =
    !crop.maskPoints?.length ||
    pointIsInPolygon(sourceX, sourceY, crop.maskPoints);
  return {
    x: Math.min(100, Math.max(0, x)),
    y: Math.min(100, Math.max(0, y)),
    inside: insideCrop && insideMask,
  };
}

export type HolisticWorkerRequest =
  | {
      type: 'initialize';
      requestId: string;
      manifestUrl?: string;
      wasmRoot?: string;
      preferGpu?: boolean;
      verifyIntegrity?: boolean;
    }
  | { type: 'detect'; requestId: string; image: ImageBitmap }
  | { type: 'dispose'; requestId: string };

export type HolisticWorkerResponse =
  | {
      type: 'progress';
      requestId: string;
      message: string;
      ratio?: number;
    }
  | {
      type: 'ready';
      requestId: string;
      backend: 'gpu' | 'cpu';
      modelBytes: number;
    }
  | {
      type: 'result';
      requestId: string;
      joints: HolisticRigJoint[];
      imageWidth: number;
      imageHeight: number;
    }
  | { type: 'disposed'; requestId: string }
  | {
      type: 'error';
      requestId: string;
      error: { code: string; message: string; recoverable: boolean };
    };
