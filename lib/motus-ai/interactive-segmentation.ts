export const DEFAULT_INTERACTIVE_SEGMENTER_MANIFEST_URL =
  '/models/mediapipe/magic-touch/manifest.json';
export const DEFAULT_MEDIAPIPE_WASM_ROOT = '/vendor/mediapipe/wasm';
export const DEFAULT_SEGMENTATION_THRESHOLD = 0.5;
export const MAX_SEGMENTATION_POLYGON_POINTS = 512;

/** Coordinates supplied by the editor. Percent is the default. */
export type SegmentationPointSpace = 'percent' | 'normalized' | 'pixels';

export type SegmentationStrokeKind = 'include' | 'exclude' | 'lasso';

export type SegmentationPoint = {
  x: number;
  y: number;
};

export type SegmentationStroke = {
  kind: SegmentationStrokeKind;
  points: readonly SegmentationPoint[];
  /** Set false while a pointer is still down. Defaults to true. */
  isComplete?: boolean;
};

export type SegmentationCropBounds = {
  /** Source-image percentage in the 0..100 coordinate space. */
  x: number;
  /** Source-image percentage in the 0..100 coordinate space. */
  y: number;
  /** Source-image percentage in the 0..100 coordinate space. */
  width: number;
  /** Source-image percentage in the 0..100 coordinate space. */
  height: number;
};

export type InteractiveSegmentationResult = {
  /** Largest outer contour, normalized to source-image 0..100 coordinates. */
  polygon: SegmentationPoint[];
  /** Tight bounds around the selected component in 0..100 coordinates. */
  cropBounds: SegmentationCropBounds;
  mask: {
    width: number;
    height: number;
    threshold: number;
    foregroundPixels: number;
  };
  backend: 'gpu' | 'cpu';
};

export type InitializeInteractiveSegmenterRequest = {
  type: 'initialize';
  requestId: string;
  manifestUrl?: string;
  wasmRoot?: string;
  /** Defaults to true. Falls back to CPU when GPU initialization fails. */
  preferGpu?: boolean;
  /** Defaults to true when SubtleCrypto is available. */
  verifyIntegrity?: boolean;
};

export type SetInteractiveSegmenterImageRequest = {
  type: 'set-image';
  requestId: string;
  /** Transfer this bitmap when posting the message to avoid a pixel copy. */
  image: ImageBitmap;
};

export type RunInteractiveSegmentationRequest = {
  type: 'segment';
  requestId: string;
  strokes: readonly SegmentationStroke[];
  /** Defaults to `percent`; MediaPipe always receives normalized 0..1 points. */
  pointSpace?: SegmentationPointSpace;
  /** Confidence cutoff in the inclusive 0..1 range. Defaults to 0.5. */
  threshold?: number;
};

export type DisposeInteractiveSegmenterRequest = {
  type: 'dispose';
  requestId: string;
};

export type InteractiveSegmenterWorkerRequest =
  | InitializeInteractiveSegmenterRequest
  | SetInteractiveSegmenterImageRequest
  | RunInteractiveSegmentationRequest
  | DisposeInteractiveSegmenterRequest;

export type InteractiveSegmenterProgressPhase =
  | 'fetching-manifest'
  | 'downloading-model'
  | 'verifying-model'
  | 'loading-wasm'
  | 'initializing-gpu'
  | 'falling-back-to-cpu'
  | 'initializing-cpu'
  | 'encoding-image'
  | 'segmenting'
  | 'tracing-contour';

export type InteractiveSegmenterWorkerError = {
  code: string;
  message: string;
  recoverable: boolean;
  details?: Record<string, unknown>;
};

export type InteractiveSegmenterWorkerResponse =
  | {
      type: 'progress';
      requestId: string;
      phase: InteractiveSegmenterProgressPhase;
      message: string;
      loadedBytes?: number;
      totalBytes?: number;
      ratio?: number;
    }
  | {
      type: 'ready';
      requestId: string;
      backend: 'gpu' | 'cpu';
      modelBytes: number;
    }
  | {
      type: 'image-set';
      requestId: string;
      width: number;
      height: number;
    }
  | {
      type: 'result';
      requestId: string;
      result: InteractiveSegmentationResult;
    }
  | {
      type: 'disposed';
      requestId: string;
    }
  | {
      type: 'error';
      requestId: string;
      error: InteractiveSegmenterWorkerError;
    };
