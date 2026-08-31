'use client';

import {
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from 'react';
import { RotateCcw, Waves } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ElementImageRigPart } from '@/lib/motus-model';
import {
  createImageRigMesh,
  getImageRigMeshBasePoint,
  getImageRigMeshPoint,
  updateImageRigMeshPoint,
  type ElementImageRigMesh,
  type ImageRigMeshPreset,
} from '@/lib/motus-mesh-warp';

const POINT_LABELS = [
  'Top left',
  'Top',
  'Top right',
  'Left',
  'Center',
  'Right',
  'Bottom left',
  'Bottom',
  'Bottom right',
] as const;

const PRESET_OPTIONS: Array<{ label: string; value: ImageRigMeshPreset }> = [
  { label: 'Bend left', value: 'wind-left' },
  { label: 'Bend right', value: 'wind-right' },
  { label: 'S-curve', value: 's-curve' },
  { label: 'Pinch', value: 'pinch' },
];

type MotusMeshWarpEditorProps = {
  crop: ElementImageRigPart;
  focalX: number;
  focalY: number;
  imageFit: 'contain' | 'cover';
  imageName: string;
  imageSrc: string;
  mesh: ElementImageRigMesh;
  onChange: (mesh: ElementImageRigMesh) => void;
  onInteractionEnd: () => void;
};

export function MotusMeshWarpEditor({
  crop,
  focalX,
  focalY,
  imageFit,
  imageName,
  imageSrc,
  mesh,
  onChange,
  onInteractionEnd,
}: MotusMeshWarpEditorProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const activePointer = useRef<number | null>(null);
  const activePoint = useRef<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(4);
  const points = useMemo(
    () => mesh.offsets.map((_, index) => getImageRigMeshPoint(mesh, index)),
    [mesh],
  );
  const selectedPoint = points[selectedIndex];

  const changePoint = (index: number, x: number, y: number) => {
    onChange(updateImageRigMeshPoint(mesh, index, { x, y }));
  };

  const moveFromPointer = (event: PointerEvent<HTMLButtonElement>) => {
    const stage = stageRef.current;
    const index = activePoint.current;
    if (!stage || index === null || activePointer.current !== event.pointerId) {
      return;
    }
    const bounds = stage.getBoundingClientRect();
    if (bounds.width <= 0 || bounds.height <= 0) return;
    changePoint(
      index,
      ((event.clientX - bounds.left) / bounds.width) * 100,
      ((event.clientY - bounds.top) / bounds.height) * 100,
    );
  };

  const beginPointer = (
    event: PointerEvent<HTMLButtonElement>,
    index: number,
  ) => {
    if (event.button !== 0 || !event.isPrimary) return;
    event.preventDefault();
    event.stopPropagation();
    setSelectedIndex(index);
    activePointer.current = event.pointerId;
    activePoint.current = index;
    event.currentTarget.setPointerCapture(event.pointerId);
    const stage = stageRef.current;
    if (!stage) return;
    const bounds = stage.getBoundingClientRect();
    changePoint(
      index,
      ((event.clientX - bounds.left) / bounds.width) * 100,
      ((event.clientY - bounds.top) / bounds.height) * 100,
    );
  };

  const finishPointer = (event: PointerEvent<HTMLButtonElement>) => {
    if (activePointer.current !== event.pointerId) return;
    event.stopPropagation();
    activePointer.current = null;
    activePoint.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    onInteractionEnd();
  };

  const handleKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    const delta = event.shiftKey ? 5 : 1;
    const point = points[index];
    let x = point.x;
    let y = point.y;
    if (event.key === 'ArrowLeft') x -= delta;
    else if (event.key === 'ArrowRight') x += delta;
    else if (event.key === 'ArrowUp') y -= delta;
    else if (event.key === 'ArrowDown') y += delta;
    else if (event.key === 'Home') {
      const base = getImageRigMeshBasePoint(index);
      x = base.x;
      y = base.y;
    } else {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    setSelectedIndex(index);
    changePoint(index, x, y);
  };

  const rowPolylines = [0, 1, 2].map((row) =>
    points
      .slice(row * 3, row * 3 + 3)
      .map((point) => `${point.x},${point.y}`)
      .join(' '),
  );
  const columnPolylines = [0, 1, 2].map((column) =>
    [0, 1, 2]
      .map((row) => points[row * 3 + column])
      .map((point) => `${point.x},${point.y}`)
      .join(' '),
  );

  return (
    <div className="mesh-warp-editor">
      <div
        aria-label={`${imageName} warp mesh`}
        className="mesh-warp-stage"
        ref={stageRef}
        style={{ aspectRatio: `${crop.cropWidth} / ${crop.cropHeight}` }}
      >
        <span className="mesh-warp-image">
          {/* oxlint-disable-next-line next/no-img-element */}
          <img
            alt=""
            aria-hidden="true"
            draggable={false}
            src={imageSrc}
            style={{
              height: `${10_000 / crop.cropHeight}%`,
              left: `${(-crop.cropX / crop.cropWidth) * 100}%`,
              maxWidth: 'none',
              objectFit: imageFit,
              objectPosition: `${focalX}% ${focalY}%`,
              top: `${(-crop.cropY / crop.cropHeight) * 100}%`,
              width: `${10_000 / crop.cropWidth}%`,
            }}
          />
        </span>
        <svg aria-hidden="true" viewBox="0 0 100 100">
          {[...rowPolylines, ...columnPolylines].map((polyline, index) => (
            <polyline key={index} points={polyline} />
          ))}
        </svg>
        {points.map((point, index) => (
          <button
            aria-label={`${POINT_LABELS[index]} mesh point, X ${Math.round(point.x)} percent, Y ${Math.round(point.y)} percent`}
            aria-pressed={selectedIndex === index}
            className="mesh-warp-handle"
            data-selected={selectedIndex === index || undefined}
            key={POINT_LABELS[index]}
            onBlur={onInteractionEnd}
            onKeyDown={(event) => handleKeyDown(event, index)}
            onKeyUp={onInteractionEnd}
            onPointerCancel={finishPointer}
            onPointerDown={(event) => beginPointer(event, index)}
            onPointerMove={moveFromPointer}
            onPointerUp={finishPointer}
            style={{ left: `${point.x}%`, top: `${point.y}%` }}
            title={`${POINT_LABELS[index]} · ${Math.round(point.x)}, ${Math.round(point.y)}`}
            type="button"
          />
        ))}
      </div>

      <div className="mesh-warp-coordinate-grid">
        <label>
          <span>{POINT_LABELS[selectedIndex]} X</span>
          <Input
            max="100"
            min="0"
            onBlur={onInteractionEnd}
            onChange={(event) => {
              const value = event.target.valueAsNumber;
              if (Number.isFinite(value)) {
                changePoint(selectedIndex, value, selectedPoint.y);
              }
            }}
            onKeyUp={onInteractionEnd}
            step="1"
            type="number"
            value={Math.round(selectedPoint.x * 1_000) / 1_000}
          />
        </label>
        <label>
          <span>{POINT_LABELS[selectedIndex]} Y</span>
          <Input
            max="100"
            min="0"
            onBlur={onInteractionEnd}
            onChange={(event) => {
              const value = event.target.valueAsNumber;
              if (Number.isFinite(value)) {
                changePoint(selectedIndex, selectedPoint.x, value);
              }
            }}
            onKeyUp={onInteractionEnd}
            step="1"
            type="number"
            value={Math.round(selectedPoint.y * 1_000) / 1_000}
          />
        </label>
      </div>

      <div className="mesh-warp-presets">
        {PRESET_OPTIONS.map((preset) => (
          <Button
            key={preset.value}
            onClick={() => {
              onChange(createImageRigMesh(preset.value));
              onInteractionEnd();
            }}
            size="sm"
            type="button"
            variant="outline"
          >
            <Waves aria-hidden="true" />
            {preset.label}
          </Button>
        ))}
        <Button
          onClick={() => {
            onChange(createImageRigMesh());
            onInteractionEnd();
          }}
          size="sm"
          type="button"
          variant="outline"
        >
          <RotateCcw aria-hidden="true" />
          Reset grid
        </Button>
      </div>
    </div>
  );
}
