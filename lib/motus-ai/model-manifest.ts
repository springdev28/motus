export const MOTUS_AI_MODEL_IDS = [
  'mediapipe-magic-touch-int8',
  'mediapipe-holistic-landmarker-float16',
] as const;

export type MotusAiModelId = (typeof MOTUS_AI_MODEL_IDS)[number];
export type MotusAiManifestFormat = 'mediapipe-task' | 'mediapipe-task-chunks';

export type MotusAiSourceLink = {
  label: string;
  url: string;
};

export type MotusAiLicense = {
  name: string;
  spdx: string;
  url: string;
};

export type MotusAiModelDefinition = {
  id: MotusAiModelId;
  label: string;
  optional: boolean;
  taskClass: 'HolisticLandmarker' | 'InteractiveSegmenter';
  runtimePackage: '@mediapipe/tasks-vision';
  local: {
    manifestUrl: string;
    /** Null when the local asset is delivered only as manifest-listed chunks. */
    modelUrl: string | null;
  };
  purpose: string;
  license: MotusAiLicense;
  upstreamUrl: string;
  documentationUrl: string;
  modelCards: readonly MotusAiSourceLink[];
  attribution: string;
  limitations: readonly string[];
};

const APACHE_2_LICENSE = {
  name: 'Apache License 2.0',
  spdx: 'Apache-2.0',
  url: 'https://www.apache.org/licenses/LICENSE-2.0',
} as const satisfies MotusAiLicense;

export const MOTUS_AI_MODELS = {
  'mediapipe-magic-touch-int8': {
    id: 'mediapipe-magic-touch-int8',
    label: 'MagicTouch Interactive Segmenter',
    optional: false,
    taskClass: 'InteractiveSegmenter',
    runtimePackage: '@mediapipe/tasks-vision',
    local: {
      manifestUrl: '/models/mediapipe/magic-touch/manifest.json',
      modelUrl: null,
    },
    purpose:
      'Turn user points and strokes into a foreground mask for splitting uploaded artwork into editable rig layers.',
    license: APACHE_2_LICENSE,
    upstreamUrl:
      'https://storage.googleapis.com/mediapipe-models/interactive_segmenter_v2/magic_touch/int8/latest/interactive_segmentation.task',
    documentationUrl:
      'https://developers.google.com/edge/mediapipe/solutions/vision/interactive_segmenter',
    modelCards: [
      {
        label: 'MagicTouch model card',
        url: 'https://storage.googleapis.com/mediapipe-assets/Model%20Card%20MagicTouch.pdf',
      },
    ],
    attribution:
      'MagicTouch Interactive Segmenter model by Google MediaPipe contributors.',
    limitations: [
      'The model is optimized for photographic inputs. Stylized-art masks need user prompts and manual edge refinement.',
      'Thin details can be missed and adjacent objects can be merged into one mask.',
      'Segmentation does not infer a character rig, hidden artwork, layer order, pivots, bones, or skin weights.',
    ],
  },
  'mediapipe-holistic-landmarker-float16': {
    id: 'mediapipe-holistic-landmarker-float16',
    label: 'MediaPipe Holistic Landmarker',
    optional: true,
    taskClass: 'HolisticLandmarker',
    runtimePackage: '@mediapipe/tasks-vision',
    local: {
      manifestUrl: '/models/mediapipe/holistic/manifest.json',
      modelUrl: '/models/mediapipe/holistic/holistic-landmarker-float16.task',
    },
    purpose:
      "Optionally track a camera performer's face, pose, and hands so their motion can preview a manually authored Motus rig.",
    license: APACHE_2_LICENSE,
    upstreamUrl:
      'https://storage.googleapis.com/mediapipe-models/holistic_landmarker/holistic_landmarker/float16/1/holistic_landmarker.task',
    documentationUrl:
      'https://developers.google.com/edge/mediapipe/solutions/vision/holistic_landmarker/web_js',
    modelCards: [
      {
        label: 'BlazePose GHUM 3D model card',
        url: 'https://storage.googleapis.com/mediapipe-assets/Model%20Card%20BlazePose%20GHUM%203D.pdf',
      },
      {
        label: 'MediaPipe Face Mesh V2 model card',
        url: 'https://storage.googleapis.com/mediapipe-assets/Model%20Card%20MediaPipe%20Face%20Mesh%20V2.pdf',
      },
      {
        label: 'MediaPipe Hand Tracking model card',
        url: 'https://storage.googleapis.com/mediapipe-assets/Model%20Card%20Hand%20Tracking%20%28Lite_Full%29%20with%20Fairness%20Oct%202021.pdf',
      },
    ],
    attribution:
      'MediaPipe Holistic Landmarker and its component models by Google MediaPipe contributors.',
    limitations: [
      'This tracks a human performer; it does not auto-rig an illustration.',
      'The component models are trained for camera images of people, not direct landmark detection on stylized characters.',
      'Occlusion, fast motion, poor lighting, and out-of-frame body parts can reduce accuracy or introduce jitter.',
      'Every character still needs manual signal mapping, calibration, smoothing, deformation limits, and corrective poses.',
    ],
  },
} as const satisfies Record<MotusAiModelId, MotusAiModelDefinition>;

export type MotusAiChunk = {
  path: string;
  bytes: number;
  sha256: string;
};

type MotusAiManifestBase = {
  schemaVersion: 1;
  id: string;
  label: string;
  format: MotusAiManifestFormat;
  bytes: number;
  sha256: string;
  source: string;
  license: string;
  documentation?: string;
  modelCard?: string;
};

export type MotusAiChunkManifest = MotusAiManifestBase & {
  format: 'mediapipe-task-chunks';
  chunks: MotusAiChunk[];
};

export type MotusAiFileManifest = MotusAiManifestBase & {
  format: 'mediapipe-task';
  path: string;
};

export type MotusAiModelManifest = MotusAiChunkManifest | MotusAiFileManifest;

export type MotusAiAttribution = {
  id: MotusAiModelId;
  label: string;
  notice: string;
  license: MotusAiLicense;
  sources: readonly MotusAiSourceLink[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function isSafeRelativeAssetPath(value: unknown): value is string {
  if (
    typeof value !== 'string' ||
    !value ||
    value.startsWith('/') ||
    value.includes('\\') ||
    value.includes('?') ||
    value.includes('#') ||
    !/^[A-Za-z0-9._/-]+$/.test(value)
  ) {
    return false;
  }
  return value
    .split('/')
    .every((segment) => segment && segment !== '.' && segment !== '..');
}

function isHttpsUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

function isSha256(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f0-9]{64}$/i.test(value);
}

function isPositiveSafeInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) > 0;
}

function hasValidManifestBase(candidate: Record<string, unknown>) {
  return (
    candidate.schemaVersion === 1 &&
    typeof candidate.id === 'string' &&
    Boolean(candidate.id.trim()) &&
    typeof candidate.label === 'string' &&
    Boolean(candidate.label.trim()) &&
    isPositiveSafeInteger(candidate.bytes) &&
    isSha256(candidate.sha256) &&
    isHttpsUrl(candidate.source) &&
    typeof candidate.license === 'string' &&
    Boolean(candidate.license.trim()) &&
    (candidate.documentation === undefined ||
      isHttpsUrl(candidate.documentation)) &&
    (candidate.modelCard === undefined || isHttpsUrl(candidate.modelCard))
  );
}

function isMotusAiChunk(value: unknown): value is MotusAiChunk {
  if (!isRecord(value)) return false;
  return (
    isSafeRelativeAssetPath(value.path) &&
    isPositiveSafeInteger(value.bytes) &&
    isSha256(value.sha256)
  );
}

/**
 * Validates the chunk metadata before a loader resolves or fetches any path.
 * Cryptographic verification of the fetched bytes remains the loader's job.
 */
export function isMotusAiChunkManifest(
  value: unknown,
  expectedId?: string,
): value is MotusAiChunkManifest {
  if (!isRecord(value) || !hasValidManifestBase(value)) return false;
  if (
    value.format !== 'mediapipe-task-chunks' ||
    !Array.isArray(value.chunks) ||
    value.chunks.length === 0 ||
    (expectedId !== undefined && value.id !== expectedId)
  ) {
    return false;
  }

  const paths = new Set<string>();
  let chunkBytes = 0;
  for (const chunk of value.chunks) {
    if (!isMotusAiChunk(chunk) || paths.has(chunk.path)) return false;
    if (chunkBytes > Number.MAX_SAFE_INTEGER - chunk.bytes) return false;
    paths.add(chunk.path);
    chunkBytes += chunk.bytes;
  }
  return chunkBytes === value.bytes;
}

export function isMotusAiModelManifest(
  value: unknown,
  expectedId?: string,
): value is MotusAiModelManifest {
  if (isMotusAiChunkManifest(value, expectedId)) return true;
  if (!isRecord(value) || !hasValidManifestBase(value)) return false;
  return (
    value.format === 'mediapipe-task' &&
    isSafeRelativeAssetPath(value.path) &&
    (expectedId === undefined || value.id === expectedId)
  );
}

export function getMotusAiModel(id: MotusAiModelId) {
  return MOTUS_AI_MODELS[id];
}

export function listMotusAiAttributions(
  modelIds: readonly MotusAiModelId[] = MOTUS_AI_MODEL_IDS,
): MotusAiAttribution[] {
  const seen = new Set<MotusAiModelId>();
  const attributions: MotusAiAttribution[] = [];
  for (const id of modelIds) {
    if (seen.has(id)) continue;
    seen.add(id);
    const model = MOTUS_AI_MODELS[id];
    attributions.push({
      id,
      label: model.label,
      notice: model.attribution,
      license: model.license,
      sources: [
        { label: 'Upstream model', url: model.upstreamUrl },
        { label: 'Documentation', url: model.documentationUrl },
        ...model.modelCards,
      ],
    });
  }
  return attributions;
}
