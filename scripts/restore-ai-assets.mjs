import { createHash } from 'node:crypto';
import { mkdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const trustedModelHost = 'storage.googleapis.com';

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

async function isValidFile(path, expectedBytes, expectedSha256) {
  try {
    const file = await stat(path);
    if (!file.isFile() || file.size !== expectedBytes) return false;
    return sha256(await readFile(path)) === expectedSha256;
  } catch (error) {
    if (error?.code === 'ENOENT') return false;
    throw error;
  }
}

function trustedSource(value) {
  const source = new URL(value);
  if (source.protocol !== 'https:' || source.hostname !== trustedModelHost) {
    throw new Error(`Untrusted MediaPipe model source: ${value}`);
  }
  return source;
}

async function downloadModel(sourceValue, expectedBytes, expectedSha256) {
  const source = trustedSource(sourceValue);
  const response = await fetch(source, { redirect: 'error' });
  if (!response.ok) {
    throw new Error(
      `MediaPipe model download failed with HTTP ${response.status}`,
    );
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.byteLength !== expectedBytes) {
    throw new Error(
      `MediaPipe model download expected ${expectedBytes} bytes, received ${bytes.byteLength}`,
    );
  }
  if (sha256(bytes) !== expectedSha256) {
    throw new Error('MediaPipe model download failed SHA-256 verification');
  }
  return bytes;
}

async function writeVerified(path, bytes, expectedSha256) {
  await mkdir(dirname(path), { recursive: true });
  const temporaryPath = `${path}.tmp-${process.pid}`;
  try {
    await writeFile(temporaryPath, bytes, { flag: 'wx' });
    if (sha256(await readFile(temporaryPath)) !== expectedSha256) {
      throw new Error(`Failed to verify restored asset: ${path}`);
    }
    await rename(temporaryPath, path);
  } finally {
    await rm(temporaryPath, { force: true });
  }
}

async function restoreMagicTouch() {
  const directory = resolve(root, 'public/models/mediapipe/magic-touch');
  const manifest = JSON.parse(
    await readFile(resolve(directory, 'manifest.json'), 'utf8'),
  );
  const chunksAreValid = (
    await Promise.all(
      manifest.chunks.map((chunk) =>
        isValidFile(
          resolve(directory, chunk.path),
          chunk.bytes,
          chunk.sha256,
        ),
      ),
    )
  ).every(Boolean);

  if (chunksAreValid) {
    console.log('MediaPipe MagicTouch model is already present');
    return;
  }

  const model = await downloadModel(
    manifest.source,
    manifest.bytes,
    manifest.sha256,
  );
  let offset = 0;
  for (const chunk of manifest.chunks) {
    const bytes = model.subarray(offset, offset + chunk.bytes);
    if (bytes.byteLength !== chunk.bytes || sha256(bytes) !== chunk.sha256) {
      throw new Error(`MagicTouch chunk verification failed: ${chunk.path}`);
    }
    await writeVerified(resolve(directory, chunk.path), bytes, chunk.sha256);
    offset += chunk.bytes;
  }
  if (offset !== model.byteLength) {
    throw new Error('MagicTouch manifest does not cover the complete model');
  }
  console.log('Restored and verified the MediaPipe MagicTouch model');
}

async function restoreHolistic() {
  const directory = resolve(root, 'public/models/mediapipe/holistic');
  const manifest = JSON.parse(
    await readFile(resolve(directory, 'manifest.json'), 'utf8'),
  );
  const path = resolve(directory, manifest.path);
  if (await isValidFile(path, manifest.bytes, manifest.sha256)) {
    console.log('MediaPipe Holistic model is already present');
    return;
  }

  const model = await downloadModel(
    manifest.source,
    manifest.bytes,
    manifest.sha256,
  );
  await writeVerified(path, model, manifest.sha256);
  console.log('Restored and verified the MediaPipe Holistic model');
}

await Promise.all([restoreMagicTouch(), restoreHolistic()]);
