import {
  isSafeRelativeAssetPath,
  isMotusAiModelManifest,
  type MotusAiFileManifest,
} from './model-manifest.ts';

export type ModelChunkManifestEntry = {
  path: string;
  bytes?: number;
  sha256?: string;
};

export type ModelChunkManifest = {
  schemaVersion: 1;
  id?: string;
  format?: string;
  bytes?: number;
  sha256?: string;
  chunks: ModelChunkManifestEntry[];
};

export type ModelChunkProgress = {
  loadedBytes: number;
  totalBytes?: number;
  chunkIndex: number;
  chunkCount: number;
};

export type ModelFileProgress = {
  loadedBytes: number;
  totalBytes: number;
};

export class ModelAssetError extends Error {
  readonly code: string;
  readonly details?: Record<string, unknown>;

  constructor(
    code: string,
    message: string,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'ModelAssetError';
    this.code = code;
    this.details = details;
  }
}

const MAX_MODEL_BYTES = 512 * 1024 * 1024;
const SHA_256_PATTERN = /^[a-f\d]{64}$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function parseOptionalBytes(value: unknown, field: string): number | undefined {
  if (value === undefined) return undefined;
  if (!Number.isSafeInteger(value) || (value as number) < 0) {
    throw new ModelAssetError(
      'INVALID_MODEL_MANIFEST',
      `Model manifest field "${field}" must be a non-negative integer.`,
    );
  }
  return value as number;
}

function parseOptionalSha256(
  value: unknown,
  field: string,
): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'string' || !SHA_256_PATTERN.test(value)) {
    throw new ModelAssetError(
      'INVALID_MODEL_MANIFEST',
      `Model manifest field "${field}" must be a 64-character SHA-256 hex digest.`,
    );
  }
  return value.toLowerCase();
}

export function parseModelChunkManifest(value: unknown): ModelChunkManifest {
  if (!isRecord(value) || value.schemaVersion !== 1) {
    throw new ModelAssetError(
      'INVALID_MODEL_MANIFEST',
      'The model manifest is missing supported schemaVersion 1.',
    );
  }
  if (!Array.isArray(value.chunks) || value.chunks.length === 0) {
    throw new ModelAssetError(
      'INVALID_MODEL_MANIFEST',
      'The model manifest must list at least one chunk.',
    );
  }

  const chunks = value.chunks.map((entry, index) => {
    if (!isRecord(entry) || !isSafeRelativeAssetPath(entry.path)) {
      throw new ModelAssetError(
        'INVALID_MODEL_MANIFEST',
        `Model chunk ${index + 1} is missing a relative path.`,
      );
    }
    const path = entry.path;
    const bytes = parseOptionalBytes(entry.bytes, `chunks[${index}].bytes`);
    const sha256 = parseOptionalSha256(entry.sha256, `chunks[${index}].sha256`);
    return {
      path,
      ...(bytes === undefined ? {} : { bytes }),
      ...(sha256 === undefined ? {} : { sha256 }),
    };
  });

  const bytes = parseOptionalBytes(value.bytes, 'bytes');
  if (bytes !== undefined && bytes > MAX_MODEL_BYTES) {
    throw new ModelAssetError(
      'MODEL_TOO_LARGE',
      `The declared model size exceeds the ${MAX_MODEL_BYTES}-byte safety limit.`,
      { declaredBytes: bytes },
    );
  }

  const sha256 = parseOptionalSha256(value.sha256, 'sha256');
  return {
    schemaVersion: 1,
    ...(typeof value.id === 'string' ? { id: value.id } : {}),
    ...(typeof value.format === 'string' ? { format: value.format } : {}),
    ...(bytes === undefined ? {} : { bytes }),
    ...(sha256 === undefined ? {} : { sha256 }),
    chunks,
  };
}

async function fetchOrThrow(
  url: string,
  description: string,
): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(url, { cache: 'force-cache' });
  } catch (error) {
    throw new ModelAssetError(
      'MODEL_ASSET_UNAVAILABLE',
      `Could not fetch ${description}. Make sure the local model assets are installed.`,
      { url, cause: error instanceof Error ? error.message : String(error) },
    );
  }
  if (!response.ok) {
    throw new ModelAssetError(
      'MODEL_ASSET_UNAVAILABLE',
      `Could not fetch ${description} (HTTP ${response.status}). Make sure the local model assets are installed.`,
      { url, status: response.status },
    );
  }
  return response;
}

async function readResponse(
  response: Response,
  onBytes: (byteCount: number) => void,
  maxBytes = MAX_MODEL_BYTES,
): Promise<Uint8Array> {
  if (!response.body) {
    const buffer = new Uint8Array(await response.arrayBuffer());
    if (buffer.byteLength > maxBytes) {
      throw new ModelAssetError(
        maxBytes < MAX_MODEL_BYTES ? 'MODEL_SIZE_MISMATCH' : 'MODEL_TOO_LARGE',
        `A model asset exceeded its ${maxBytes}-byte limit.`,
      );
    }
    onBytes(buffer.byteLength);
    return buffer;
  }

  const reader = response.body.getReader();
  const pieces: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    pieces.push(value);
    length += value.byteLength;
    onBytes(value.byteLength);
    if (length > maxBytes) {
      await reader.cancel();
      throw new ModelAssetError(
        maxBytes < MAX_MODEL_BYTES ? 'MODEL_SIZE_MISMATCH' : 'MODEL_TOO_LARGE',
        `A model asset exceeded its ${maxBytes}-byte limit.`,
      );
    }
  }

  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const piece of pieces) {
    bytes.set(piece, offset);
    offset += piece.byteLength;
  }
  return bytes;
}

function bytesToHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
}

async function verifySha256(
  bytes: Uint8Array,
  expected: string,
  description: string,
): Promise<void> {
  if (!globalThis.crypto?.subtle) return;
  // Copy into an ArrayBuffer-backed view; Uint8Array can otherwise be typed as
  // SharedArrayBuffer-backed, which SubtleCrypto deliberately does not accept.
  const source = new Uint8Array(new ArrayBuffer(bytes.byteLength));
  source.set(bytes);
  const digest = bytesToHex(
    await globalThis.crypto.subtle.digest('SHA-256', source),
  );
  if (digest !== expected.toLowerCase()) {
    throw new ModelAssetError(
      'MODEL_INTEGRITY_MISMATCH',
      `${description} failed its SHA-256 integrity check.`,
      { expected, actual: digest },
    );
  }
}

export async function loadChunkedModel(
  manifestUrl: string,
  options: {
    verifyIntegrity?: boolean;
    onManifest?: (manifest: ModelChunkManifest) => void;
    onProgress?: (progress: ModelChunkProgress) => void;
    onVerifying?: () => void;
  } = {},
): Promise<Uint8Array> {
  const absoluteManifestUrl = new URL(manifestUrl, globalThis.location.href);
  const manifestResponse = await fetchOrThrow(
    absoluteManifestUrl.href,
    'the model manifest',
  );
  let manifestJson: unknown;
  try {
    manifestJson = await manifestResponse.json();
  } catch (error) {
    throw new ModelAssetError(
      'INVALID_MODEL_MANIFEST',
      'The model manifest is not valid JSON.',
      { cause: error instanceof Error ? error.message : String(error) },
    );
  }
  const manifest = parseModelChunkManifest(manifestJson);
  options.onManifest?.(manifest);

  const declaredChunkBytes = manifest.chunks.reduce(
    (sum, chunk) => sum + (chunk.bytes ?? 0),
    0,
  );
  const totalBytes = manifest.bytes ?? (declaredChunkBytes || undefined);
  const chunks: Uint8Array[] = [];
  let loadedBytes = 0;

  for (let index = 0; index < manifest.chunks.length; index += 1) {
    const entry = manifest.chunks[index];
    const chunkUrl = new URL(entry.path, absoluteManifestUrl);
    const response = await fetchOrThrow(
      chunkUrl.href,
      `model chunk ${index + 1} of ${manifest.chunks.length}`,
    );
    const remainingDeclaredBytes =
      manifest.bytes === undefined
        ? MAX_MODEL_BYTES
        : Math.max(0, manifest.bytes - loadedBytes);
    const chunk = await readResponse(
      response,
      (increment) => {
        loadedBytes += increment;
        options.onProgress?.({
          loadedBytes,
          totalBytes,
          chunkIndex: index,
          chunkCount: manifest.chunks.length,
        });
      },
      entry.bytes ?? remainingDeclaredBytes,
    );
    if (entry.bytes !== undefined && chunk.byteLength !== entry.bytes) {
      throw new ModelAssetError(
        'MODEL_SIZE_MISMATCH',
        `Model chunk ${index + 1} has ${chunk.byteLength} bytes; expected ${entry.bytes}.`,
        { path: entry.path, expected: entry.bytes, actual: chunk.byteLength },
      );
    }
    if (options.verifyIntegrity !== false && entry.sha256) {
      options.onVerifying?.();
      await verifySha256(chunk, entry.sha256, `Model chunk ${index + 1}`);
    }
    chunks.push(chunk);
  }

  if (manifest.bytes !== undefined && loadedBytes !== manifest.bytes) {
    throw new ModelAssetError(
      'MODEL_SIZE_MISMATCH',
      `The assembled model has ${loadedBytes} bytes; expected ${manifest.bytes}.`,
      { expected: manifest.bytes, actual: loadedBytes },
    );
  }
  if (loadedBytes > MAX_MODEL_BYTES) {
    throw new ModelAssetError(
      'MODEL_TOO_LARGE',
      `The assembled model exceeds the ${MAX_MODEL_BYTES}-byte safety limit.`,
    );
  }

  const model = new Uint8Array(loadedBytes);
  let offset = 0;
  for (const chunk of chunks) {
    model.set(chunk, offset);
    offset += chunk.byteLength;
  }
  if (options.verifyIntegrity !== false && manifest.sha256) {
    options.onVerifying?.();
    await verifySha256(model, manifest.sha256, 'The assembled model');
  }
  return model;
}

export async function loadSingleFileModel(
  manifestUrl: string,
  options: {
    expectedId?: string;
    verifyIntegrity?: boolean;
    onManifest?: (manifest: MotusAiFileManifest) => void;
    onProgress?: (progress: ModelFileProgress) => void;
    onVerifying?: () => void;
  } = {},
): Promise<Uint8Array> {
  const absoluteManifestUrl = new URL(manifestUrl, globalThis.location.href);
  const manifestResponse = await fetchOrThrow(
    absoluteManifestUrl.href,
    'the model manifest',
  );
  let manifestJson: unknown;
  try {
    manifestJson = await manifestResponse.json();
  } catch (error) {
    throw new ModelAssetError(
      'INVALID_MODEL_MANIFEST',
      'The model manifest is not valid JSON.',
      { cause: error instanceof Error ? error.message : String(error) },
    );
  }
  if (
    !isMotusAiModelManifest(manifestJson, options.expectedId) ||
    manifestJson.format !== 'mediapipe-task'
  ) {
    throw new ModelAssetError(
      'INVALID_MODEL_MANIFEST',
      'The model manifest must describe one safe MediaPipe task file.',
    );
  }
  const manifest = manifestJson;
  options.onManifest?.(manifest);
  if (manifest.bytes > MAX_MODEL_BYTES) {
    throw new ModelAssetError(
      'MODEL_TOO_LARGE',
      `The declared model size exceeds the ${MAX_MODEL_BYTES}-byte safety limit.`,
      { declaredBytes: manifest.bytes },
    );
  }

  const modelUrl = new URL(manifest.path, absoluteManifestUrl);
  let loadedBytes = 0;
  const response = await fetchOrThrow(modelUrl.href, 'the model file');
  const model = await readResponse(
    response,
    (increment) => {
      loadedBytes += increment;
      options.onProgress?.({ loadedBytes, totalBytes: manifest.bytes });
    },
    manifest.bytes,
  );
  if (model.byteLength !== manifest.bytes) {
    throw new ModelAssetError(
      'MODEL_SIZE_MISMATCH',
      `The model has ${model.byteLength} bytes; expected ${manifest.bytes}.`,
      { expected: manifest.bytes, actual: model.byteLength },
    );
  }
  if (options.verifyIntegrity !== false) {
    options.onVerifying?.();
    await verifySha256(model, manifest.sha256, 'The model file');
  }
  return model;
}
