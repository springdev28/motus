'use client';

import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import getStroke from 'perfect-freehand';
import simplify from 'simplify-js';
import {
  BrainCircuit,
  Check,
  LassoSelect,
  Minus,
  Plus,
  RotateCcw,
  Undo2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { InteractiveSegmenterWorkerResponse } from '@/lib/motus-ai/interactive-segmentation';
import {
  getFramedCanvasSize,
  getFramedImageDrawRect,
} from '@/lib/motus-image-framing';

export type SmartCutPoint = { x: number; y: number };

export type SmartCutResult = {
  cropX: number;
  cropY: number;
  cropWidth: number;
  cropHeight: number;
  maskPoints: SmartCutPoint[];
};

type SmartCutMode = 'include' | 'exclude' | 'lasso';
type SmartCutStatus =
  | 'idle'
  | 'loading'
  | 'preparing'
  | 'ready'
  | 'analyzing'
  | 'complete'
  | 'error';

type SmartCutStroke = {
  id: string;
  mode: SmartCutMode;
  points: SmartCutPoint[];
};

type MotusSmartCutProps = {
  aspectRatio: number;
  focalX: number;
  focalY: number;
  imageFit: 'contain' | 'cover';
  imageName: string;
  imageSrc: string;
  onApply: (result: SmartCutResult) => void;
};

const MODE_LABELS: Record<SmartCutMode, string> = {
  include: 'Include',
  exclude: 'Exclude',
  lasso: 'Lasso',
};

function clampUnit(value: number) {
  return Math.max(0, Math.min(1, value));
}

function pointerPoint(event: PointerEvent<HTMLButtonElement>): SmartCutPoint {
  const bounds = event.currentTarget.getBoundingClientRect();
  return {
    x: clampUnit((event.clientX - bounds.left) / bounds.width),
    y: clampUnit((event.clientY - bounds.top) / bounds.height),
  };
}

function distance(left: SmartCutPoint, right: SmartCutPoint) {
  return Math.hypot(left.x - right.x, left.y - right.y);
}

function simplifyStroke(stroke: SmartCutStroke) {
  const simplified = simplify(stroke.points, 0.002, true);
  return {
    ...stroke,
    points:
      stroke.mode === 'lasso' && simplified.length >= 3
        ? [...simplified, simplified[0]]
        : simplified,
  };
}

function resultFromLasso(stroke: SmartCutStroke): SmartCutResult | null {
  const points = stroke.points.slice(
    0,
    stroke.points.at(-1) === stroke.points[0] ? -1 : undefined,
  );
  if (points.length < 3) return null;
  const percentPoints = points.map((point) => ({
    x: point.x * 100,
    y: point.y * 100,
  }));
  const xs = percentPoints.map((point) => point.x);
  const ys = percentPoints.map((point) => point.y);
  const cropX = Math.min(...xs);
  const cropY = Math.min(...ys);
  return {
    cropX,
    cropY,
    cropWidth: Math.max(0.1, Math.max(...xs) - cropX),
    cropHeight: Math.max(0.1, Math.max(...ys) - cropY),
    maskPoints: percentPoints,
  };
}

function strokePath(stroke: SmartCutStroke) {
  if (!stroke.points.length) return '';
  if (stroke.mode === 'lasso') {
    return `M ${stroke.points
      .map((point) => `${point.x * 1000} ${point.y * 1000}`)
      .join(' L ')}`;
  }
  const outline = getStroke(
    stroke.points.map((point) => [point.x * 1000, point.y * 1000]),
    {
      size: 18,
      smoothing: 0.75,
      streamline: 0.6,
      thinning: 0,
      start: { cap: true },
      end: { cap: true },
    },
  );
  if (!outline.length) return '';
  return `M${outline.map((point) => point.join(',')).join('L')}Z`;
}

export function MotusSmartCut({
  aspectRatio,
  focalX,
  focalY,
  imageFit,
  imageName,
  imageSrc,
  onApply,
}: MotusSmartCutProps) {
  const [mode, setMode] = useState<SmartCutMode>('include');
  const [strokes, setStrokes] = useState<SmartCutStroke[]>([]);
  const [activeStroke, setActiveStroke] = useState<SmartCutStroke | null>(null);
  const [status, setStatus] = useState<SmartCutStatus>('idle');
  const [statusText, setStatusText] = useState('Local model not loaded');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<SmartCutResult | null>(null);
  const [keyboardPoint, setKeyboardPoint] = useState<SmartCutPoint>({
    x: 0.5,
    y: 0.5,
  });
  const [keyboardActive, setKeyboardActive] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const workerReady = useRef(false);
  const imageReady = useRef(false);
  const analyzeQueued = useRef(false);
  const strokesRef = useRef(strokes);
  const requestSequence = useRef(0);
  const activePointerId = useRef<number | null>(null);

  const displayStrokes = useMemo(
    () => (activeStroke ? [...strokes, activeStroke] : strokes),
    [activeStroke, strokes],
  );
  const lastLasso = [...strokes]
    .reverse()
    .find((stroke) => stroke.mode === 'lasso');
  const directLassoResult = lastLasso ? resultFromLasso(lastLasso) : null;
  const busy =
    status === 'loading' || status === 'preparing' || status === 'analyzing';
  const hasPositivePrompt = strokes.some(
    (stroke) =>
      stroke.mode === 'include' ||
      (stroke.mode === 'lasso' && stroke.points.length >= 4),
  );

  useEffect(() => {
    return () => {
      workerRef.current?.postMessage({
        type: 'dispose',
        requestId: 'smart-cut-dispose',
      });
      workerRef.current?.terminate();
    };
  }, []);

  useEffect(() => {
    strokesRef.current = strokes;
  }, [strokes]);

  const sendImage = async (worker: Worker) => {
    setStatus('preparing');
    setStatusText('Preparing artwork');
    try {
      const response = await fetch(imageSrc);
      if (!response.ok) throw new Error('The image could not be opened');
      const source = await createImageBitmap(await response.blob());
      const { width: targetWidth, height: targetHeight } = getFramedCanvasSize(
        Number.isFinite(aspectRatio) && aspectRatio > 0
          ? aspectRatio
          : source.width / source.height,
      );
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const context = canvas.getContext('2d');
      if (!context) {
        source.close();
        throw new Error('The image renderer is unavailable');
      }
      const draw = getFramedImageDrawRect(
        source.width,
        source.height,
        targetWidth,
        targetHeight,
        imageFit,
        focalX,
        focalY,
      );
      context.drawImage(source, draw.x, draw.y, draw.width, draw.height);
      source.close();
      const bitmap = await createImageBitmap(canvas);
      requestSequence.current += 1;
      worker.postMessage(
        {
          type: 'set-image',
          requestId: `smart-cut-image-${requestSequence.current}`,
          image: bitmap,
        },
        [bitmap],
      );
    } catch (error) {
      setStatus('error');
      setStatusText(
        error instanceof Error
          ? error.message
          : 'The image could not be opened',
      );
    }
  };

  const postSegment = (worker: Worker) => {
    if (!strokesRef.current.length) {
      analyzeQueued.current = false;
      setStatus('error');
      setStatusText('Draw at least one include point or lasso');
      return;
    }
    setStatus('analyzing');
    setStatusText('Finding editable part');
    requestSequence.current += 1;
    worker.postMessage({
      type: 'segment',
      requestId: `smart-cut-segment-${requestSequence.current}`,
      pointSpace: 'normalized',
      strokes: strokesRef.current.map((stroke) => ({
        kind: stroke.mode,
        points: stroke.points,
        isComplete: true,
      })),
    });
    analyzeQueued.current = false;
  };

  const ensureWorker = () => {
    if (workerRef.current) return workerRef.current;
    let worker: Worker;
    try {
      worker = new Worker(
        new URL(
          '../workers/motus-interactive-segmenter.worker.ts',
          import.meta.url,
        ),
        { type: 'module' },
      );
    } catch {
      setStatus('error');
      setStatusText('Local selection engine could not start');
      return null;
    }
    worker.onmessage = (
      event: MessageEvent<InteractiveSegmenterWorkerResponse>,
    ) => {
      const message = event.data;
      if (message.type === 'progress') {
        setStatus(
          message.phase === 'encoding-image'
            ? 'preparing'
            : message.phase === 'segmenting' ||
                message.phase === 'tracing-contour'
              ? 'analyzing'
              : 'loading',
        );
        setProgress((current) => clampUnit(message.ratio ?? current));
        setStatusText(message.message);
        return;
      }
      if (message.type === 'ready') {
        workerReady.current = true;
        setProgress(1);
        setStatus('ready');
        setStatusText(`Local model ready · ${message.backend.toUpperCase()}`);
        if (analyzeQueued.current) void sendImage(worker);
        return;
      }
      if (message.type === 'image-set') {
        imageReady.current = true;
        setStatus('ready');
        setStatusText('Artwork ready');
        if (analyzeQueued.current) postSegment(worker);
        return;
      }
      if (message.type === 'result') {
        const nextResult = {
          cropX: message.result.cropBounds.x,
          cropY: message.result.cropBounds.y,
          cropWidth: message.result.cropBounds.width,
          cropHeight: message.result.cropBounds.height,
          maskPoints: message.result.polygon,
        };
        setResult(nextResult);
        setStatus('complete');
        setStatusText(
          `Selection ready · ${nextResult.maskPoints.length} points`,
        );
        return;
      }
      if (message.type === 'error') {
        setStatus('error');
        setStatusText(message.error.message);
        analyzeQueued.current = false;
      }
    };
    worker.onerror = () => {
      worker.terminate();
      if (workerRef.current === worker) workerRef.current = null;
      workerReady.current = false;
      imageReady.current = false;
      setStatus('error');
      setStatusText('Local selection engine could not start');
      analyzeQueued.current = false;
    };
    workerRef.current = worker;
    return worker;
  };

  const analyze = () => {
    if (busy) return;
    if (!hasPositivePrompt) {
      setStatus('error');
      setStatusText('Add an include point or closed lasso first');
      return;
    }
    const worker = ensureWorker();
    if (!worker) return;
    analyzeQueued.current = true;
    setResult(null);
    if (!workerReady.current) {
      setStatus('loading');
      setStatusText('Loading local model');
      setProgress(0);
      requestSequence.current += 1;
      worker.postMessage({
        type: 'initialize',
        requestId: `smart-cut-init-${requestSequence.current}`,
      });
    } else if (!imageReady.current) {
      void sendImage(worker);
    } else {
      postSegment(worker);
    }
  };

  const finishStroke = (
    event: PointerEvent<HTMLButtonElement>,
    commit: boolean,
  ) => {
    if (activePointerId.current !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    activePointerId.current = null;
    if (commit && activeStroke) {
      const completed = simplifyStroke(activeStroke);
      if (completed.points.length >= (completed.mode === 'lasso' ? 4 : 1)) {
        setStrokes((current) => {
          const next = [...current, completed];
          strokesRef.current = next;
          return next;
        });
      }
    }
    setActiveStroke(null);
    setResult(null);
  };

  const addKeyboardPrompt = () => {
    if (busy) return;
    if (mode === 'lasso') {
      setStatus('error');
      setStatusText('Choose Include or Exclude for keyboard points');
      return;
    }
    const nextStroke: SmartCutStroke = {
      id: `keyboard-${Date.now()}`,
      mode,
      points: [keyboardPoint],
    };
    setStrokes((current) => {
      const next = [...current, nextStroke];
      strokesRef.current = next;
      return next;
    });
    setResult(null);
    setStatus(workerReady.current ? 'ready' : 'idle');
    setStatusText(`${MODE_LABELS[mode]} point added`);
  };

  return (
    <div className="smart-cut-editor">
      <div
        className="smart-cut-tools"
        role="toolbar"
        aria-label="Selection tools"
      >
        {(['include', 'exclude', 'lasso'] as const).map((candidate) => {
          const Icon =
            candidate === 'include'
              ? Plus
              : candidate === 'exclude'
                ? Minus
                : LassoSelect;
          return (
            <button
              aria-pressed={mode === candidate}
              data-active={mode === candidate || undefined}
              disabled={busy}
              key={candidate}
              onClick={() => setMode(candidate)}
              type="button"
            >
              <Icon aria-hidden="true" />
              {MODE_LABELS[candidate]}
            </button>
          );
        })}
        <button
          aria-label="Undo last selection stroke"
          disabled={!strokes.length || busy}
          onClick={() => {
            setStrokes((current) => {
              const next = current.slice(0, -1);
              strokesRef.current = next;
              return next;
            });
            setResult(null);
          }}
          title="Undo stroke"
          type="button"
        >
          <Undo2 aria-hidden="true" />
        </button>
        <button
          aria-label="Clear selection strokes"
          disabled={!strokes.length || busy}
          onClick={() => {
            setStrokes([]);
            strokesRef.current = [];
            setResult(null);
          }}
          title="Clear strokes"
          type="button"
        >
          <RotateCcw aria-hidden="true" />
        </button>
      </div>
      <div
        className="smart-cut-stage"
        style={{
          aspectRatio,
          backgroundImage: `url(${imageSrc})`,
          backgroundPosition: `${focalX}% ${focalY}%`,
          backgroundSize: imageFit,
        }}
      >
        <button
          aria-label={`Selection canvas for ${imageName}. Arrow keys move the cursor. Enter or Space adds the active Include or Exclude point.`}
          data-keyboard-active={keyboardActive || undefined}
          onBlur={() => setKeyboardActive(false)}
          onFocus={() => setKeyboardActive(true)}
          onKeyDown={(event) => {
            const step = event.shiftKey ? 0.1 : 0.02;
            const delta =
              event.key === 'ArrowLeft'
                ? { x: -step, y: 0 }
                : event.key === 'ArrowRight'
                  ? { x: step, y: 0 }
                  : event.key === 'ArrowUp'
                    ? { x: 0, y: -step }
                    : event.key === 'ArrowDown'
                      ? { x: 0, y: step }
                      : null;
            if (delta) {
              event.preventDefault();
              setKeyboardPoint((current) => ({
                x: clampUnit(current.x + delta.x),
                y: clampUnit(current.y + delta.y),
              }));
              return;
            }
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              addKeyboardPrompt();
            }
          }}
          onPointerCancel={(event) => finishStroke(event, false)}
          onPointerDown={(event) => {
            if (
              busy ||
              !event.isPrimary ||
              event.button !== 0 ||
              activePointerId.current !== null
            ) {
              return;
            }
            event.preventDefault();
            activePointerId.current = event.pointerId;
            event.currentTarget.setPointerCapture(event.pointerId);
            setActiveStroke({
              id: `${Date.now()}-${event.pointerId}`,
              mode,
              points: [pointerPoint(event)],
            });
          }}
          onPointerMove={(event) => {
            if (
              busy ||
              activePointerId.current !== event.pointerId ||
              !activeStroke ||
              !event.currentTarget.hasPointerCapture(event.pointerId)
            ) {
              return;
            }
            const point = pointerPoint(event);
            const previous = activeStroke.points.at(-1);
            if (previous && distance(previous, point) < 0.0025) return;
            setActiveStroke((current) =>
              current
                ? { ...current, points: [...current.points, point] }
                : null,
            );
          }}
          onPointerUp={(event) => finishStroke(event, true)}
          type="button"
        >
          <svg
            aria-hidden="true"
            preserveAspectRatio="none"
            viewBox="0 0 1000 1000"
          >
            {result ? (
              <polygon
                className="smart-cut-result"
                points={result.maskPoints
                  .map((point) => `${point.x * 10},${point.y * 10}`)
                  .join(' ')}
              />
            ) : null}
            {displayStrokes.map((stroke) => (
              <path
                className={`smart-cut-stroke smart-cut-stroke-${stroke.mode}`}
                d={strokePath(stroke)}
                key={stroke.id}
              />
            ))}
            {keyboardActive ? (
              <circle
                className="smart-cut-keyboard-cursor"
                cx={keyboardPoint.x * 1000}
                cy={keyboardPoint.y * 1000}
                r="10"
              />
            ) : null}
          </svg>
        </button>
      </div>
      <output className="smart-cut-status" data-state={status}>
        <span>
          <BrainCircuit aria-hidden="true" />
          {statusText}
        </span>
        {status === 'loading' ? (
          <progress aria-label="Local model loading" max="1" value={progress} />
        ) : null}
      </output>
      <div className="smart-cut-actions">
        <Button
          disabled={!hasPositivePrompt || busy}
          onClick={analyze}
          type="button"
          variant="outline"
        >
          <BrainCircuit aria-hidden="true" />
          Smart select
        </Button>
        <Button
          disabled={!result || busy}
          onClick={() => result && onApply(result)}
          type="button"
        >
          <Check aria-hidden="true" />
          Cut selected part
        </Button>
      </div>
      {directLassoResult ? (
        <button
          className="smart-cut-manual"
          disabled={busy}
          onClick={() => onApply(directLassoResult)}
          type="button"
        >
          Use lasso directly — no model
        </button>
      ) : null}
    </div>
  );
}
