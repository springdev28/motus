export type MotusImageFit = 'contain' | 'cover';

export type MotusImageFrame = {
  aspectRatio: number;
  fit: MotusImageFit;
  focalX: number;
  focalY: number;
};

export type MotusImageDrawRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const clampPercent = (value: number) =>
  Math.min(100, Math.max(0, Number.isFinite(value) ? value : 50));

export function getFramedCanvasSize(
  aspectRatio: number,
  maxEdge = 1_024,
): { width: number; height: number } {
  const safeAspect =
    Number.isFinite(aspectRatio) && aspectRatio > 0 ? aspectRatio : 1;
  const safeMaxEdge = Math.max(1, Math.round(maxEdge));
  return safeAspect >= 1
    ? {
        width: safeMaxEdge,
        height: Math.max(1, Math.round(safeMaxEdge / safeAspect)),
      }
    : {
        width: Math.max(1, Math.round(safeMaxEdge * safeAspect)),
        height: safeMaxEdge,
      };
}

/** Matches CSS object-fit plus percentage object-position in a fixed frame. */
export function getFramedImageDrawRect(
  sourceWidth: number,
  sourceHeight: number,
  frameWidth: number,
  frameHeight: number,
  fit: MotusImageFit,
  focalX: number,
  focalY: number,
): MotusImageDrawRect {
  const safeSourceWidth = Math.max(1, sourceWidth);
  const safeSourceHeight = Math.max(1, sourceHeight);
  const safeFrameWidth = Math.max(1, frameWidth);
  const safeFrameHeight = Math.max(1, frameHeight);
  const scale =
    fit === 'cover'
      ? Math.max(
          safeFrameWidth / safeSourceWidth,
          safeFrameHeight / safeSourceHeight,
        )
      : Math.min(
          safeFrameWidth / safeSourceWidth,
          safeFrameHeight / safeSourceHeight,
        );
  const width = safeSourceWidth * scale;
  const height = safeSourceHeight * scale;
  return {
    x: (safeFrameWidth - width) * (clampPercent(focalX) / 100),
    y: (safeFrameHeight - height) * (clampPercent(focalY) / 100),
    width,
    height,
  };
}
