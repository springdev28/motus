import {
  FilesetResolver,
  InteractiveSegmenter,
  type Stroke,
} from '@mediapipe/tasks-vision';
import {
  DEFAULT_INTERACTIVE_SEGMENTER_MANIFEST_URL,
  DEFAULT_MEDIAPIPE_WASM_ROOT,
  DEFAULT_SEGMENTATION_THRESHOLD,
  MAX_SEGMENTATION_POLYGON_POINTS,
  type InteractiveSegmenterProgressPhase,
  type InteractiveSegmenterWorkerError,
  type InteractiveSegmenterWorkerRequest,
  type InteractiveSegmenterWorkerResponse,
  type RunInteractiveSegmentationRequest,
  type SegmentationPoint,
  type SegmentationPointSpace,
} from '../lib/motus-ai/interactive-segmentation';
import {
  EmptySegmentationMaskError,
  confidenceMaskToPolygon,
} from '../lib/motus-ai/mask-contour';
import {
  ModelAssetError,
  loadChunkedModel,
} from '../lib/motus-ai/model-chunks';

type WorkerScope = {
  location: Location;
  onmessage:
    | ((event: MessageEvent<InteractiveSegmenterWorkerRequest>) => void)
    | null;
  postMessage(message: InteractiveSegmenterWorkerResponse): void;
};

const workerScope = globalThis as unknown as WorkerScope;

let segmenter: InteractiveSegmenter | undefined;
let backend: 'gpu' | 'cpu' | undefined;
let imageWidth = 0;
let imageHeight = 0;
let operationQueue: Promise<void> = Promise.resolve();

function post(response: InteractiveSegmenterWorkerResponse): void {
  workerScope.postMessage(response);
}

function progress(
  requestId: string,
  phase: InteractiveSegmenterProgressPhase,
  message: string,
  bytes?: { loadedBytes: number; totalBytes?: number },
): void {
  const ratio = bytes?.totalBytes
    ? Math.min(1, bytes.loadedBytes / bytes.totalBytes)
    : undefined;
  post({
    type: 'progress',
    requestId,
    phase,
    message,
    ...(bytes ? { loadedBytes: bytes.loadedBytes } : {}),
    ...(bytes?.totalBytes === undefined
      ? {}
      : { totalBytes: bytes.totalBytes }),
    ...(ratio === undefined ? {} : { ratio }),
  });
}

function closeSegmenter(): void {
  segmenter?.close();
  segmenter = undefined;
  backend = undefined;
  imageWidth = 0;
  imageHeight = 0;
}

async function createSegmenter(
  model: Uint8Array,
  wasmRoot: string,
  preferGpu: boolean,
  requestId: string,
): Promise<{ segmenter: InteractiveSegmenter; backend: 'gpu' | 'cpu' }> {
  progress(requestId, 'loading-wasm', 'Loading the local MediaPipe runtime.');
  const fileset = await FilesetResolver.forVisionTasks(wasmRoot);
  let gpuError: unknown;

  if (preferGpu && typeof OffscreenCanvas !== 'undefined') {
    progress(requestId, 'initializing-gpu', 'Initializing GPU segmentation.');
    try {
      const instance = await InteractiveSegmenter.createFromOptions(fileset, {
        baseOptions: { modelAssetBuffer: model, delegate: 'GPU' },
        canvas: new OffscreenCanvas(1, 1),
      });
      return { segmenter: instance, backend: 'gpu' };
    } catch (error) {
      gpuError = error;
      progress(
        requestId,
        'falling-back-to-cpu',
        'GPU initialization failed; retrying with the CPU backend.',
      );
    }
  }

  progress(requestId, 'initializing-cpu', 'Initializing CPU segmentation.');
  try {
    const instance = await InteractiveSegmenter.createFromOptions(fileset, {
      baseOptions: { modelAssetBuffer: model, delegate: 'CPU' },
    });
    return { segmenter: instance, backend: 'cpu' };
  } catch (cpuError) {
    throw new EngineError(
      'SEGMENTER_INITIALIZATION_FAILED',
      'MediaPipe could not initialize the interactive segmentation model.',
      false,
      {
        gpuError: errorMessage(gpuError),
        cpuError: errorMessage(cpuError),
      },
    );
  }
}

class EngineError extends Error {
  readonly code: string;
  readonly recoverable: boolean;
  readonly details?: Record<string, unknown>;

  constructor(
    code: string,
    message: string,
    recoverable: boolean,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'EngineError';
    this.code = code;
    this.recoverable = recoverable;
    this.details = details;
  }
}

function errorMessage(error: unknown): string | undefined {
  if (error === undefined) return undefined;
  if (error instanceof Error) return error.message;
  if (
    typeof error === 'string' ||
    typeof error === 'number' ||
    typeof error === 'boolean' ||
    typeof error === 'bigint' ||
    typeof error === 'symbol'
  ) {
    return String(error);
  }
  try {
    return JSON.stringify(error);
  } catch {
    return 'Unknown error';
  }
}

function serializeError(error: unknown): InteractiveSegmenterWorkerError {
  if (error instanceof EngineError) {
    return {
      code: error.code,
      message: error.message,
      recoverable: error.recoverable,
      ...(error.details ? { details: error.details } : {}),
    };
  }
  if (error instanceof ModelAssetError) {
    return {
      code: error.code,
      message: error.message,
      recoverable: true,
      ...(error.details ? { details: error.details } : {}),
    };
  }
  if (error instanceof EmptySegmentationMaskError) {
    return {
      code: 'EMPTY_SEGMENTATION',
      message: error.message,
      recoverable: true,
    };
  }
  return {
    code: 'SEGMENTATION_ENGINE_ERROR',
    message: errorMessage(error) ?? 'The segmentation worker failed.',
    recoverable: true,
  };
}

async function initialize(
  request: Extract<InteractiveSegmenterWorkerRequest, { type: 'initialize' }>,
): Promise<void> {
  closeSegmenter();
  const manifestUrl =
    request.manifestUrl ?? DEFAULT_INTERACTIVE_SEGMENTER_MANIFEST_URL;
  progress(
    request.requestId,
    'fetching-manifest',
    'Reading the local MagicTouch model manifest.',
  );
  const model = await loadChunkedModel(manifestUrl, {
    verifyIntegrity: request.verifyIntegrity,
    onProgress: ({ loadedBytes, totalBytes, chunkIndex, chunkCount }) => {
      progress(
        request.requestId,
        'downloading-model',
        `Loading model chunk ${chunkIndex + 1} of ${chunkCount}.`,
        { loadedBytes, totalBytes },
      );
    },
    onVerifying: () => {
      progress(
        request.requestId,
        'verifying-model',
        'Verifying the local model files.',
      );
    },
  });
  const initialized = await createSegmenter(
    model,
    request.wasmRoot ?? DEFAULT_MEDIAPIPE_WASM_ROOT,
    request.preferGpu !== false,
    request.requestId,
  );
  segmenter = initialized.segmenter;
  backend = initialized.backend;
  post({
    type: 'ready',
    requestId: request.requestId,
    backend,
    modelBytes: model.byteLength,
  });
}

function setImage(
  request: Extract<InteractiveSegmenterWorkerRequest, { type: 'set-image' }>,
): void {
  if (!segmenter) {
    request.image.close();
    throw new EngineError(
      'SEGMENTER_NOT_READY',
      'Initialize the segmentation worker before setting an image.',
      true,
    );
  }
  if (
    !(request.image instanceof ImageBitmap) ||
    request.image.width <= 0 ||
    request.image.height <= 0
  ) {
    request.image.close();
    throw new EngineError(
      'INVALID_IMAGE',
      'The set-image request must contain a non-empty ImageBitmap.',
      true,
    );
  }

  progress(request.requestId, 'encoding-image', 'Encoding the source image.');
  imageWidth = request.image.width;
  imageHeight = request.image.height;
  try {
    segmenter.setImage(request.image);
  } finally {
    request.image.close();
  }
  post({
    type: 'image-set',
    requestId: request.requestId,
    width: imageWidth,
    height: imageHeight,
  });
}

function normalizedPoint(
  point: SegmentationPoint,
  pointSpace: SegmentationPointSpace,
): SegmentationPoint {
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) {
    throw new EngineError(
      'INVALID_STROKE',
      'Every stroke point must have finite x and y coordinates.',
      true,
    );
  }
  let x = point.x;
  let y = point.y;
  if (pointSpace === 'percent') {
    x /= 100;
    y /= 100;
  } else if (pointSpace === 'pixels') {
    x /= imageWidth;
    y /= imageHeight;
  }
  return {
    x: Math.max(0, Math.min(1, x)),
    y: Math.max(0, Math.min(1, y)),
  };
}

function mediaPipeStrokes(
  request: RunInteractiveSegmentationRequest,
): Stroke[] {
  if (!Array.isArray(request.strokes) || request.strokes.length === 0) {
    throw new EngineError(
      'INVALID_STROKE',
      'At least one include, exclude, or lasso stroke is required.',
      true,
    );
  }
  const pointSpace = request.pointSpace ?? 'percent';
  if (!['percent', 'normalized', 'pixels'].includes(pointSpace)) {
    throw new EngineError(
      'INVALID_POINT_SPACE',
      `Unsupported stroke point space "${String(pointSpace)}".`,
      true,
    );
  }

  return request.strokes.map((stroke, index) => {
    if (!['include', 'exclude', 'lasso'].includes(stroke.kind)) {
      throw new EngineError(
        'INVALID_STROKE',
        `Stroke ${index + 1} has an unsupported brush kind.`,
        true,
      );
    }
    if (!Array.isArray(stroke.points) || stroke.points.length === 0) {
      throw new EngineError(
        'INVALID_STROKE',
        `Stroke ${index + 1} does not contain any points.`,
        true,
      );
    }
    if (stroke.kind === 'lasso' && stroke.points.length < 3) {
      throw new EngineError(
        'INVALID_STROKE',
        `Lasso stroke ${index + 1} needs at least three points.`,
        true,
      );
    }
    const brushMode =
      stroke.kind === 'include' ? 1 : stroke.kind === 'exclude' ? 2 : 3;
    return {
      brushMode: brushMode as Stroke['brushMode'],
      point: stroke.points.map((point: SegmentationPoint) =>
        normalizedPoint(point, pointSpace),
      ),
      isCompleted: stroke.isComplete !== false,
    };
  });
}

function segment(request: RunInteractiveSegmentationRequest): void {
  if (!segmenter || !backend) {
    throw new EngineError(
      'SEGMENTER_NOT_READY',
      'Initialize the segmentation worker before requesting a segment.',
      true,
    );
  }
  if (imageWidth <= 0 || imageHeight <= 0) {
    throw new EngineError(
      'IMAGE_NOT_SET',
      'Transfer an ImageBitmap with set-image before requesting a segment.',
      true,
    );
  }
  const threshold = request.threshold ?? DEFAULT_SEGMENTATION_THRESHOLD;
  if (!Number.isFinite(threshold) || threshold < 0 || threshold > 1) {
    throw new EngineError(
      'INVALID_THRESHOLD',
      'The confidence threshold must be between 0 and 1.',
      true,
    );
  }

  const strokes = mediaPipeStrokes(request);
  progress(request.requestId, 'segmenting', 'Refining the segmentation mask.');
  const mask = segmenter.segment(strokes);
  try {
    const confidence = mask.getAsFloat32Array();
    progress(
      request.requestId,
      'tracing-contour',
      'Tracing the largest selected region.',
    );
    const result = confidenceMaskToPolygon(
      confidence,
      mask.width,
      mask.height,
      threshold,
      MAX_SEGMENTATION_POLYGON_POINTS,
      backend,
    );
    post({ type: 'result', requestId: request.requestId, result });
  } finally {
    mask.close();
  }
}

async function handleMessage(
  request: InteractiveSegmenterWorkerRequest,
): Promise<void> {
  if (!request || typeof request.requestId !== 'string') {
    throw new EngineError(
      'INVALID_REQUEST',
      'Every worker request must include a string requestId.',
      true,
    );
  }
  switch (request.type) {
    case 'initialize':
      await initialize(request);
      break;
    case 'set-image':
      setImage(request);
      break;
    case 'segment':
      segment(request);
      break;
    case 'dispose':
      closeSegmenter();
      post({ type: 'disposed', requestId: request.requestId });
      break;
    default:
      throw new EngineError(
        'INVALID_REQUEST',
        'The segmentation worker received an unsupported request.',
        true,
      );
  }
}

workerScope.onmessage = (event) => {
  const request = event.data;
  operationQueue = operationQueue
    .then(() => handleMessage(request))
    .catch((error) => {
      post({
        type: 'error',
        requestId:
          request && typeof request.requestId === 'string'
            ? request.requestId
            : 'unknown',
        error: serializeError(error),
      });
    });
};
