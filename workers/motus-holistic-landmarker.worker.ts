import { FilesetResolver, HolisticLandmarker } from '@mediapipe/tasks-vision';
import {
  DEFAULT_HOLISTIC_MANIFEST_URL,
  DEFAULT_HOLISTIC_WASM_ROOT,
  HOLISTIC_MODEL_ID,
  extractHolisticRigJoints,
  type HolisticWorkerRequest,
  type HolisticWorkerResponse,
} from '../lib/motus-ai/holistic-joints';
import {
  ModelAssetError,
  loadSingleFileModel,
} from '../lib/motus-ai/model-chunks';

type WorkerScope = {
  onmessage: ((event: MessageEvent<HolisticWorkerRequest>) => void) | null;
  postMessage(message: HolisticWorkerResponse): void;
};

const workerScope = globalThis as unknown as WorkerScope;
let landmarker: HolisticLandmarker | undefined;
let backend: 'gpu' | 'cpu' | undefined;
let operationQueue: Promise<void> = Promise.resolve();

function post(response: HolisticWorkerResponse): void {
  workerScope.postMessage(response);
}

function progress(requestId: string, message: string, ratio?: number): void {
  post({
    type: 'progress',
    requestId,
    message,
    ...(ratio === undefined ? {} : { ratio }),
  });
}

function messageFor(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function postError(requestId: string, error: unknown): void {
  post({
    type: 'error',
    requestId,
    error: {
      code:
        error instanceof ModelAssetError
          ? error.code
          : 'HOLISTIC_LANDMARKER_ERROR',
      message:
        error instanceof ModelAssetError
          ? error.message
          : 'MediaPipe could not analyze this image for body joints.',
      recoverable: true,
    },
  });
}

function closeLandmarker(): void {
  landmarker?.close();
  landmarker = undefined;
  backend = undefined;
}

async function createLandmarker(
  model: Uint8Array,
  wasmRoot: string,
  preferGpu: boolean,
  requestId: string,
): Promise<{ landmarker: HolisticLandmarker; backend: 'gpu' | 'cpu' }> {
  progress(requestId, 'Loading the local MediaPipe runtime.');
  const fileset = await FilesetResolver.forVisionTasks(wasmRoot);
  let gpuError: unknown;
  if (preferGpu && typeof OffscreenCanvas !== 'undefined') {
    progress(requestId, 'Initializing GPU body tracking.');
    try {
      const instance = await HolisticLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetBuffer: model, delegate: 'GPU' },
        canvas: new OffscreenCanvas(1, 1),
        outputFaceBlendshapes: false,
        outputPoseSegmentationMasks: false,
        runningMode: 'IMAGE',
      });
      return { landmarker: instance, backend: 'gpu' };
    } catch (error) {
      gpuError = error;
      progress(requestId, 'GPU unavailable; retrying body tracking on CPU.');
    }
  }

  progress(requestId, 'Initializing CPU body tracking.');
  try {
    const instance = await HolisticLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetBuffer: model, delegate: 'CPU' },
      outputFaceBlendshapes: false,
      outputPoseSegmentationMasks: false,
      runningMode: 'IMAGE',
    });
    return { landmarker: instance, backend: 'cpu' };
  } catch (cpuError) {
    throw new Error(
      `Holistic initialization failed. GPU: ${messageFor(gpuError)}. CPU: ${messageFor(cpuError)}.`,
    );
  }
}

async function initialize(
  request: Extract<HolisticWorkerRequest, { type: 'initialize' }>,
): Promise<void> {
  closeLandmarker();
  progress(request.requestId, 'Reading the local Holistic model manifest.');
  const model = await loadSingleFileModel(
    request.manifestUrl ?? DEFAULT_HOLISTIC_MANIFEST_URL,
    {
      expectedId: HOLISTIC_MODEL_ID,
      verifyIntegrity: request.verifyIntegrity,
      onProgress: ({ loadedBytes, totalBytes }) =>
        progress(
          request.requestId,
          'Loading the local 13.7 MB body-tracking model.',
          Math.min(1, loadedBytes / totalBytes),
        ),
      onVerifying: () =>
        progress(request.requestId, 'Verifying the local model file.'),
    },
  );
  const initialized = await createLandmarker(
    model,
    request.wasmRoot ?? DEFAULT_HOLISTIC_WASM_ROOT,
    request.preferGpu !== false,
    request.requestId,
  );
  landmarker = initialized.landmarker;
  backend = initialized.backend;
  post({
    type: 'ready',
    requestId: request.requestId,
    backend,
    modelBytes: model.byteLength,
  });
}

function detect(
  request: Extract<HolisticWorkerRequest, { type: 'detect' }>,
): void {
  if (!landmarker || !backend) {
    request.image.close();
    throw new Error('Initialize body tracking before detecting joints.');
  }
  if (!(request.image instanceof ImageBitmap) || request.image.width <= 0) {
    request.image.close();
    throw new Error('Body tracking requires a non-empty image.');
  }
  const { width, height } = request.image;
  try {
    progress(request.requestId, 'Finding body joints in the artwork.');
    const result = landmarker.detect(request.image);
    const joints = result.poseLandmarks[0]
      ? extractHolisticRigJoints(result.poseLandmarks[0])
      : [];
    post({
      type: 'result',
      requestId: request.requestId,
      joints,
      imageWidth: width,
      imageHeight: height,
    });
  } finally {
    request.image.close();
  }
}

async function handle(request: HolisticWorkerRequest): Promise<void> {
  if (request.type === 'initialize') {
    await initialize(request);
    return;
  }
  if (request.type === 'detect') {
    detect(request);
    return;
  }
  closeLandmarker();
  post({ type: 'disposed', requestId: request.requestId });
}

workerScope.onmessage = (event) => {
  const request = event.data;
  operationQueue = operationQueue
    .then(() => handle(request))
    .catch((error) => postError(request.requestId, error));
};
