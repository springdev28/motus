import { createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');

async function sha256(path) {
  return createHash('sha256')
    .update(await readFile(path))
    .digest('hex');
}

async function verifyFile(path, expectedBytes, expectedSha256) {
  const absolutePath = resolve(root, path);
  const file = await stat(absolutePath);
  if (file.size !== expectedBytes) {
    throw new Error(
      `${path}: expected ${expectedBytes} bytes, found ${file.size}`,
    );
  }
  const digest = await sha256(absolutePath);
  if (digest !== expectedSha256) {
    throw new Error(`${path}: SHA-256 mismatch`);
  }
  console.log(`verified ${path} (${file.size} bytes)`);
}

const interactiveManifestPath = resolve(
  root,
  'public/models/mediapipe/magic-touch/manifest.json',
);
const interactiveManifest = JSON.parse(
  await readFile(interactiveManifestPath, 'utf8'),
);
let combinedBytes = 0;
const combinedHash = createHash('sha256');
for (const chunk of interactiveManifest.chunks) {
  const relativePath = `public/models/mediapipe/magic-touch/${chunk.path}`;
  await verifyFile(relativePath, chunk.bytes, chunk.sha256);
  const bytes = await readFile(resolve(root, relativePath));
  combinedBytes += bytes.byteLength;
  combinedHash.update(bytes);
}
if (
  combinedBytes !== interactiveManifest.bytes ||
  combinedHash.digest('hex') !== interactiveManifest.sha256
) {
  throw new Error('MagicTouch chunks do not reconstruct the declared model');
}
console.log(`verified MagicTouch reconstruction (${combinedBytes} bytes)`);

const holisticManifestPath = resolve(
  root,
  'public/models/mediapipe/holistic/manifest.json',
);
const holisticManifest = JSON.parse(
  await readFile(holisticManifestPath, 'utf8'),
);
await verifyFile(
  `public/models/mediapipe/holistic/${holisticManifest.path}`,
  holisticManifest.bytes,
  holisticManifest.sha256,
);

for (const file of [
  'vision_wasm_internal.js',
  'vision_wasm_internal.wasm',
  'vision_wasm_module_internal.js',
  'vision_wasm_module_internal.wasm',
  'vision_wasm_nosimd_internal.js',
  'vision_wasm_nosimd_internal.wasm',
]) {
  const path = resolve(root, 'public/vendor/mediapipe/wasm', file);
  const asset = await stat(path);
  if (!asset.isFile() || asset.size === 0) {
    throw new Error(`Missing MediaPipe runtime asset: ${file}`);
  }
  console.log(`verified public/vendor/mediapipe/wasm/${file}`);
}
