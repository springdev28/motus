import type { Application } from 'pixi.js';
import {
  getFramedCanvasSize,
  getFramedImageDrawRect,
  type MotusImageFrame,
} from './motus-image-framing';
import type { ElementImageRigPart } from './motus-model';
import {
  getImageRigMeshPositions,
  type ElementImageRigMesh,
} from './motus-mesh-warp';

const MAX_MESH_RASTER_EDGE = 768;
const MESH_UVS = new Float32Array([
  0, 0, 0.5, 0, 1, 0, 0, 0.5, 0.5, 0.5, 1, 0.5, 0, 1, 0.5, 1, 1, 1,
]);
const MESH_INDICES = new Uint32Array([
  0, 1, 3, 1, 4, 3, 1, 2, 4, 2, 5, 4, 3, 4, 6, 4, 7, 6, 4, 5, 7, 5, 8, 7,
]);

let applicationPromise: Promise<Application> | undefined;
let renderQueue: Promise<void> = Promise.resolve();

function abortIfNeeded(signal?: AbortSignal): void {
  if (signal?.aborted)
    throw new DOMException('Mesh render aborted', 'AbortError');
}

async function getSharedApplication(): Promise<Application> {
  applicationPromise ??= (async () => {
    const { Application } = await import('pixi.js');
    const application = new Application();
    await application.init({
      antialias: true,
      autoStart: false,
      backgroundAlpha: 0,
      height: 1,
      preference: 'webgl',
      preserveDrawingBuffer: true,
      resolution: 1,
      width: 1,
    });
    return application;
  })().catch((error) => {
    applicationPromise = undefined;
    throw error;
  });
  return applicationPromise;
}

function loadImage(
  src: string,
  signal?: AbortSignal,
): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const finish = () => {
      image.onload = null;
      image.onerror = null;
      signal?.removeEventListener('abort', onAbort);
    };
    const onAbort = () => {
      finish();
      reject(new DOMException('Mesh image load aborted', 'AbortError'));
    };
    image.onload = () => {
      finish();
      resolve(image);
    };
    image.onerror = () => {
      finish();
      reject(new Error('The rig-part image could not be decoded.'));
    };
    signal?.addEventListener('abort', onAbort, { once: true });
    image.decoding = 'async';
    image.src = src;
  });
}

function getRasterDimensions(width: number, height: number) {
  const safeWidth = Math.max(2, Math.round(width));
  const safeHeight = Math.max(2, Math.round(height));
  const scale = Math.min(
    1,
    MAX_MESH_RASTER_EDGE / Math.max(safeWidth, safeHeight),
  );
  return {
    width: Math.max(2, Math.round(safeWidth * scale)),
    height: Math.max(2, Math.round(safeHeight * scale)),
  };
}

async function rasterizeRigPart(
  src: string,
  crop: ElementImageRigPart,
  framing: MotusImageFrame,
  width: number,
  height: number,
  signal?: AbortSignal,
): Promise<HTMLCanvasElement> {
  abortIfNeeded(signal);
  const image = await loadImage(src, signal);
  abortIfNeeded(signal);
  const dimensions = getRasterDimensions(width, height);
  const canvas = document.createElement('canvas');
  canvas.width = dimensions.width;
  canvas.height = dimensions.height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('The browser has no 2D canvas renderer.');

  if (crop.maskPoints?.length) {
    context.beginPath();
    crop.maskPoints.forEach((point, index) => {
      const x = ((point.x - crop.cropX) / crop.cropWidth) * canvas.width;
      const y = ((point.y - crop.cropY) / crop.cropHeight) * canvas.height;
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    });
    context.closePath();
    context.clip();
  }

  const frame = getFramedCanvasSize(framing.aspectRatio);
  const draw = getFramedImageDrawRect(
    image.naturalWidth,
    image.naturalHeight,
    frame.width,
    frame.height,
    framing.fit,
    framing.focalX,
    framing.focalY,
  );
  const cropX = (crop.cropX / 100) * frame.width;
  const cropY = (crop.cropY / 100) * frame.height;
  const cropWidth = (crop.cropWidth / 100) * frame.width;
  const cropHeight = (crop.cropHeight / 100) * frame.height;
  context.drawImage(
    image,
    (draw.x - cropX) * (canvas.width / cropWidth),
    (draw.y - cropY) * (canvas.height / cropHeight),
    draw.width * (canvas.width / cropWidth),
    draw.height * (canvas.height / cropHeight),
  );
  return canvas;
}

async function renderMeshNow(
  src: string,
  crop: ElementImageRigPart,
  framing: MotusImageFrame,
  mesh: ElementImageRigMesh,
  width: number,
  height: number,
  signal?: AbortSignal,
): Promise<HTMLCanvasElement> {
  abortIfNeeded(signal);
  const [pixi, source] = await Promise.all([
    import('pixi.js'),
    rasterizeRigPart(src, crop, framing, width, height, signal),
  ]);
  abortIfNeeded(signal);
  const application = await getSharedApplication();
  abortIfNeeded(signal);
  const positions = getImageRigMeshPositions(mesh, source.width, source.height);
  const geometry = new pixi.MeshGeometry({
    positions,
    uvs: new Float32Array(MESH_UVS),
    indices: new Uint32Array(MESH_INDICES),
  });
  const texture = pixi.Texture.from(source, true);
  const renderedMesh = new pixi.Mesh({ geometry, texture });
  try {
    let extracted: HTMLCanvasElement;
    try {
      extracted = application.renderer.extract.canvas({
        antialias: true,
        clearColor: [0, 0, 0, 0],
        frame: new pixi.Rectangle(0, 0, source.width, source.height),
        resolution: 1,
        target: renderedMesh,
      }) as HTMLCanvasElement;
    } catch (error) {
      applicationPromise = undefined;
      application.destroy({ removeView: true });
      throw error;
    }
    abortIfNeeded(signal);
    const output = document.createElement('canvas');
    output.width = source.width;
    output.height = source.height;
    const context = output.getContext('2d');
    if (!context) throw new Error('The browser has no 2D canvas renderer.');
    context.drawImage(extracted, 0, 0);
    return output;
  } finally {
    renderedMesh.destroy({ texture: true, textureSource: true });
    geometry.destroy();
  }
}

export function renderImageRigMesh(
  src: string,
  crop: ElementImageRigPart,
  framing: MotusImageFrame,
  mesh: ElementImageRigMesh,
  width: number,
  height: number,
  signal?: AbortSignal,
): Promise<HTMLCanvasElement> {
  const result = renderQueue.then(() =>
    renderMeshNow(src, crop, framing, mesh, width, height, signal),
  );
  renderQueue = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}
