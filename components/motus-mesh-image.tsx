'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { renderImageRigMesh } from '@/lib/motus-image-mesh-renderer';
import type { MotusImageFrame } from '@/lib/motus-image-framing';
import type { ElementImageRigPart } from '@/lib/motus-model';
import type { ElementImageRigMesh } from '@/lib/motus-mesh-warp';

type MotusMeshImageProps = {
  crop: ElementImageRigPart;
  fallbackStyle: CSSProperties;
  framing: MotusImageFrame;
  mesh: ElementImageRigMesh;
  src: string;
};

type MeshDimensions = { width: number; height: number };

export function MotusMeshImage({
  crop,
  fallbackStyle,
  framing,
  mesh,
  src,
}: MotusMeshImageProps) {
  const surfaceRef = useRef<HTMLSpanElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState<MeshDimensions>({
    width: 0,
    height: 0,
  });
  const [visible, setVisible] = useState(true);
  const [state, setState] = useState<'idle' | 'rendering' | 'ready' | 'error'>(
    'idle',
  );
  const [hasRendered, setHasRendered] = useState(false);

  useEffect(() => {
    const surface = surfaceRef.current;
    if (!surface || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: '180px' },
    );
    observer.observe(surface);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const surface = surfaceRef.current;
    if (!surface) return;
    let frame = 0;
    const readSize = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const bounds = surface.getBoundingClientRect();
        const width = Math.round(bounds.width);
        const height = Math.round(bounds.height);
        setDimensions((current) =>
          current.width === width && current.height === height
            ? current
            : { width, height },
        );
      });
    };
    readSize();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', readSize);
      return () => {
        cancelAnimationFrame(frame);
        window.removeEventListener('resize', readSize);
      };
    }
    const observer = new ResizeObserver(readSize);
    observer.observe(surface);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!visible || dimensions.width < 2 || dimensions.height < 2) return;
    const controller = new AbortController();
    let active = true;
    queueMicrotask(() => {
      if (active) setState('rendering');
    });
    renderImageRigMesh(
      src,
      crop,
      framing,
      mesh,
      dimensions.width * Math.min(window.devicePixelRatio || 1, 2),
      dimensions.height * Math.min(window.devicePixelRatio || 1, 2),
      controller.signal,
    )
      .then((rendered) => {
        if (!active) return;
        const canvas = canvasRef.current;
        const context = canvas?.getContext('2d');
        if (!canvas || !context) throw new Error('Mesh canvas is unavailable.');
        canvas.width = rendered.width;
        canvas.height = rendered.height;
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(rendered, 0, 0);
        setHasRendered(true);
        setState('ready');
      })
      .catch((error: unknown) => {
        if (
          !active ||
          (error instanceof DOMException && error.name === 'AbortError')
        ) {
          return;
        }
        setState('error');
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [crop, dimensions.height, dimensions.width, framing, mesh, src, visible]);

  return (
    <span
      className="image-mesh-surface"
      data-mesh-rendered={hasRendered || undefined}
      data-mesh-state={state}
      ref={surfaceRef}
    >
      {/* The flat crop stays mounted as the authoritative no-WebGL fallback. */}
      {/* oxlint-disable-next-line next/no-img-element */}
      <img
        alt=""
        aria-hidden="true"
        className="image-mesh-fallback"
        draggable={false}
        src={src}
        style={fallbackStyle}
      />
      <canvas
        aria-hidden="true"
        className="image-mesh-canvas"
        ref={canvasRef}
      />
    </span>
  );
}
