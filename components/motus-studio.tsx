/* oxlint-disable next/no-html-link-for-pages -- Home navigation performs a full transition after synchronously flushing the draft. */
'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent as ReactChangeEvent,
  type CSSProperties,
  type FocusEvent as ReactFocusEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragCancelEvent,
  type DragEndEvent,
  type DragStartEvent,
  type DraggableAttributes,
  type DraggableSyntheticListeners,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS as DndCss } from '@dnd-kit/utilities';
import {
  Activity,
  AlignCenterHorizontal,
  AlignCenterVertical,
  AlignCenter,
  AlignEndHorizontal,
  AlignEndVertical,
  AlignHorizontalSpaceBetween,
  AlignLeft,
  AlignRight,
  AlignStartHorizontal,
  AlignStartVertical,
  AlignVerticalSpaceBetween,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  Circle,
  Clock3,
  Cloud,
  CloudOff,
  Code2,
  Copy,
  Download,
  Ellipsis,
  Eye,
  EyeOff,
  FileImage,
  FilePlus2,
  Flag,
  GripVertical,
  ImagePlus,
  LibraryBig,
  Layers3,
  Lock,
  Maximize2,
  MessageSquareText,
  MousePointer2,
  Move,
  Pencil,
  Play,
  Plus,
  Redo2,
  RotateCcw,
  Route,
  Search,
  Send,
  Sparkles,
  Square,
  Trash2,
  Type,
  Undo2,
  Unlock,
  Upload,
  Zap,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { MotusLogo } from '@/components/motus-logo';
import { MotusWorkDetailsDialog } from '@/components/motus-work-details-dialog';
import { MotusWorkMetadataSummary } from '@/components/motus-work-metadata-summary';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  MOTUS_LIBRARY_WORKS as workCatalog,
  createCatalogPreviewProject,
  getCatalogPreviewLayout,
  type LibraryWork as WorkCatalogEntry,
  type LibraryWorkFormat,
} from '@/lib/motus-library';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { Textarea } from '@/components/ui/textarea';
import {
  getDevicePublicationSlug,
  saveDevicePublication,
} from '@/lib/motus-device-publication';
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  ELEMENT_FONT_PRESETS,
  ELEMENT_FONT_WEIGHTS,
  ELEMENT_TEXT_ALIGNMENTS,
  MAX_ELEMENT_FONT_SIZE,
  MAX_ELEMENT_LETTER_SPACING,
  MAX_ELEMENT_LINE_HEIGHT,
  MAX_BOUNCE_JUMPS,
  MAX_COMPILED_MOTION_DURATION_MS,
  MAX_COMPILED_MOTION_KEYFRAMES,
  MAX_COMPILED_MOTION_STEPS,
  MAX_MOTION_NESTING_DEPTH,
  MAX_PARALLEL_MOTION_BLOCKS,
  MAX_MOTION_BLOCKS,
  MOTION_BLOCK_CATEGORIES,
  MOTION_BLOCK_CATALOG,
  MOTION_EVENT_BLOCK_KINDS,
  MAX_ELEMENT_NAME_LENGTH,
  MAX_ELEMENT_TEXT_LENGTH,
  MAX_PROJECT_FILE_BYTES,
  MAX_PROJECT_CHAPTERS,
  MAX_PROJECT_SCENES,
  MAX_PROJECT_TITLE_LENGTH,
  MAX_SCENE_ELEMENTS,
  MAX_SCENE_NAME_LENGTH,
  MAX_SCENE_THUMBNAIL_ELEMENTS,
  MIN_ELEMENT_HEIGHT,
  MIN_ELEMENT_FONT_SIZE,
  MIN_ELEMENT_LETTER_SPACING,
  MIN_ELEMENT_LINE_HEIGHT,
  MIN_ELEMENT_WIDTH,
  alignSelectedElements,
  canAddChapterToProject,
  canAddElementToScene,
  canAddSceneToProject,
  cloneProject,
  compileElementMotion,
  countMotionBlocks,
  constrainElementToCanvas,
  createBlankChapter,
  createBlankProject,
  createBounceJump,
  createCopyName,
  createDefaultProject,
  createElement,
  createElementCopy,
  createMotionBlock,
  createProjectHistoryEntry,
  createProjectBackupFileName,
  createPublicationRevision,
  describeElementForAccessibility,
  detectImageFormat,
  distributeSelectedElements,
  findProjectScene,
  findMotionBlock,
  findMotionBlockSiblings,
  findSupportedImageFile,
  getCompiledMotionKeyframeEstimate,
  getExpandedMotionStepCount,
  getPublicationReadiness,
  getDraftSaveStatus,
  getDraftExitAction,
  getDefaultElementTypography,
  getEditorShortcut,
  getFitCanvasWidth,
  getKeyboardNudgeDelta,
  getMotionProgramRuntimeIssue,
  getMotionProgramDurationMs,
  getProjectStorageBytes,
  getProjectScenes,
  getSceneThumbnailElements,
  getTabIndexForKey,
  hasFileDrag,
  hasExecutableMotionActions,
  hasPointerDragStarted,
  hasUnpublishedChanges,
  isMotionContainerBlockKind,
  isMotionEventBlockKind,
  isParallelMotionBlockKind,
  normalizeBounceJumpNumericField,
  normalizeElementTypography,
  normalizeMotionBlockNumericField,
  recordProjectHistory,
  removePublicationRevision,
  replaceMotionEvent,
  reorderChapters,
  reorderMotionActionBefore,
  reorderScenes,
  resetProjectTimeline,
  resolveDraftConflict,
  resolveEditorSelection,
  resolveProjectCoverSceneId,
  resolveReaderSource,
  resolveSelectionAfterElementDeletion,
  restorePublicationToDraft,
  restoreProject,
  restoreProjectWithError,
  shouldAutosaveDraft,
  shouldEndContinuousHistoryOnKey,
  snapSelectedElementMovement,
  trimProjectHistory,
  transformElementByPointer,
  translateSelectedElements,
  validateImageAsset,
  wouldCreateAnimationFinishCycle,
  writeDraftJournal,
  type BounceJump,
  type Easing,
  type ElementAlignmentGuide,
  type ElementPointerTransformMode,
  type ElementFontPreset,
  type ElementFontWeight,
  type ElementAlignment,
  type ElementDistributionAxis,
  type ElementTextAlignment,
  type ElementTypography,
  type ElementType,
  type MotusChapter,
  type MotusElement,
  type MotionBlock,
  type MotionBlockCategory,
  type MotionBlockCatalogEntry,
  type MotionBlockKind,
  type MotionEventBlockKind,
  type MotusProject,
  type MotusPublicationRevision,
  type MotusScene,
  type ProjectHistoryEntry,
  type PublicationVisibility,
  type MotionProgramRuntimeIssue,
} from '@/lib/motus-model';
import {
  DRAFT_POINTER_KEY,
  DRAFT_SLOT_A_KEY,
  DRAFT_SLOT_B_KEY,
  readNewestMotusDraft,
} from '@/lib/motus-draft-storage';
const MOTUS_LAYER_CLIPBOARD_TYPE = 'application/x-motus-layer';
const STUDIO_PANEL_LAYOUT_KEY = 'motus.studio.panel-layout.v1';
const BLOCK_WORKSPACE_LAYOUT_KEY = 'motus.studio.block-workspace-layout.v1';

type StudioPanelLayout = {
  left: number;
  center: number;
  right: number;
};

type StudioPanelLayouts = Record<'design' | 'motion', StudioPanelLayout>;

type BlockWorkspaceLayout = {
  library: number;
  script: number;
};

type StudioPanelPreset = 'balanced' | 'focus-stage' | 'focus-secondary';

const DEFAULT_STUDIO_PANEL_LAYOUTS: StudioPanelLayouts = {
  design: { left: 16, center: 52, right: 32 },
  motion: { left: 13, center: 57, right: 30 },
};

const DEFAULT_BLOCK_WORKSPACE_LAYOUT: BlockWorkspaceLayout = {
  library: 30,
  script: 70,
};

const ELEMENT_RESIZE_HANDLES = [
  'nw',
  'n',
  'ne',
  'e',
  'se',
  's',
  'sw',
  'w',
] as const;

const ELEMENT_FONT_LABELS: Record<ElementFontPreset, string> = {
  editorial: 'Editorial serif',
  modern: 'Modern sans',
  comic: 'Comic hand',
  condensed: 'Condensed display',
  mono: 'Monospace',
};

const ELEMENT_FONT_STACKS: Record<ElementFontPreset, string> = {
  editorial: "Georgia, 'Times New Roman', serif",
  modern:
    "Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  comic: "'Comic Sans MS', 'Bradley Hand', 'Chalkboard SE', cursive",
  condensed: "Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif",
  mono: "var(--font-mono), 'SFMono-Regular', Consolas, monospace",
};

const ELEMENT_WEIGHT_LABELS: Record<ElementFontWeight, string> = {
  400: 'Regular',
  500: 'Medium',
  600: 'Semibold',
  700: 'Bold',
  800: 'Extra bold',
  900: 'Black',
};

const ELEMENT_ALIGNMENT_ICONS: Record<ElementTextAlignment, typeof AlignLeft> =
  {
    left: AlignLeft,
    center: AlignCenter,
    right: AlignRight,
  };

function applyTypographyPatch(
  element: MotusElement,
  patch: Partial<ElementTypography>,
) {
  const typography = normalizeElementTypography(element.type, {
    ...element.typography,
    ...patch,
  });
  if (typography) element.typography = typography;
}

const STUDIO_PANEL_PRESETS: Record<
  'design' | 'motion',
  Record<StudioPanelPreset, StudioPanelLayout>
> = {
  design: {
    balanced: DEFAULT_STUDIO_PANEL_LAYOUTS.design,
    'focus-stage': { left: 12, center: 70, right: 18 },
    'focus-secondary': { left: 12, center: 34, right: 54 },
  },
  motion: {
    balanced: DEFAULT_STUDIO_PANEL_LAYOUTS.motion,
    'focus-stage': { left: 12, center: 38, right: 50 },
    'focus-secondary': { left: 12, center: 70, right: 18 },
  },
};

function studioPanelLayoutsMatch(
  left: StudioPanelLayout,
  right: StudioPanelLayout,
) {
  return (['left', 'center', 'right'] as const).every(
    (key) => Math.abs(left[key] - right[key]) < 0.75,
  );
}

function isStudioPanelLayout(value: unknown): value is StudioPanelLayout {
  if (!value || typeof value !== 'object') return false;
  const layout = value as Partial<StudioPanelLayout>;
  const values = [layout.left, layout.center, layout.right];
  const total = values.reduce<number>(
    (sum, candidate) =>
      sum + (typeof candidate === 'number' ? candidate : Number.NaN),
    0,
  );
  return (
    values.every(
      (candidate) =>
        typeof candidate === 'number' &&
        Number.isFinite(candidate) &&
        candidate > 0,
    ) && Math.abs(total - 100) < 1
  );
}

function isBlockWorkspaceLayout(value: unknown): value is BlockWorkspaceLayout {
  if (!value || typeof value !== 'object') return false;
  const layout = value as Partial<BlockWorkspaceLayout>;
  if (
    typeof layout.library !== 'number' ||
    !Number.isFinite(layout.library) ||
    typeof layout.script !== 'number' ||
    !Number.isFinite(layout.script)
  ) {
    return false;
  }
  return (
    layout.library > 0 &&
    layout.script > 0 &&
    Math.abs(layout.library + layout.script - 100) < 1
  );
}

function getStudioGridTemplate(
  workspace: 'design' | 'motion',
  layout: StudioPanelLayout,
) {
  const centerMinimum = workspace === 'motion' ? '460px' : '340px';
  return `60px minmax(112px, ${layout.left}fr) minmax(${centerMinimum}, ${layout.center}fr) minmax(260px, ${layout.right}fr)`;
}

function getBlockWorkspaceGridTemplate(layout: BlockWorkspaceLayout) {
  return `minmax(220px, ${layout.library}fr) minmax(240px, ${layout.script}fr)`;
}

type DeletionUndo = {
  message: string;
  chapterId: string;
  sceneId: string;
  elementId: string;
  elementIds?: string[];
};

type PendingProjectImport = {
  fileName: string;
  project: MotusProject;
};

const sceneBackgrounds = [
  {
    name: 'Amethyst fog',
    value: 'linear-gradient(155deg, #24203b 0%, #151626 54%, #332b46 100%)',
  },
  {
    name: 'Rose crossing',
    value: 'linear-gradient(155deg, #38284c 0%, #1c1729 54%, #7d4e61 100%)',
  },
  {
    name: 'Tidal signal',
    value: 'linear-gradient(155deg, #22293b 0%, #101d28 54%, #315a63 100%)',
  },
  {
    name: 'Ember night',
    value: 'linear-gradient(155deg, #3d231e 0%, #1d1518 54%, #6b3d2d 100%)',
  },
  {
    name: 'Electric dusk',
    value: 'linear-gradient(155deg, #1f2850 0%, #121526 54%, #55438b 100%)',
  },
] as const;

type CatalogTab = 'works' | 'assets' | 'templates' | 'motion';
type ReaderMode = 'scroll' | 'page';
type PreviewScope = 'selected' | 'scene';
type MobileStudioPane = 'blocks' | 'stage' | 'layers';

const MOBILE_STUDIO_PANES: MobileStudioPane[] = ['blocks', 'stage', 'layers'];

function formatPreviewDuration(durationMs: number) {
  if (durationMs < 1_000) return `${durationMs} ms`;
  const precision = durationMs >= 10_000 ? 1 : 2;
  return `${Number((durationMs / 1_000).toFixed(precision))} s`;
}

type AddableMotionBlockCategory = Exclude<MotionBlockCategory, 'event'>;
type BlockPaletteCategory = 'all' | AddableMotionBlockCategory;

const MOTION_PROGRAM_DROP_ID = 'motion-program-dropzone';

type ActiveMotionDrag = {
  source: 'palette' | 'program';
  elementId: string;
  label: string;
  category: MotionBlockCategory;
  kind?: MotionBlockKind;
  blockId?: string;
};

type MotionBlockDragHandle = {
  attributes: DraggableAttributes;
  listeners: DraggableSyntheticListeners;
  setActivatorNodeRef: (element: HTMLElement | null) => void;
  isDragging: boolean;
};

function paletteDragId(kind: MotionBlockKind) {
  return `palette:${kind}`;
}

function programDragId(blockId: string) {
  return `program:${blockId}`;
}

function motionContainerDropId(blockId: string) {
  return `motion-container:${blockId}`;
}

function readMotionDragData(value: unknown): ActiveMotionDrag | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Partial<ActiveMotionDrag>;
  if (
    (candidate.source !== 'palette' && candidate.source !== 'program') ||
    typeof candidate.elementId !== 'string' ||
    typeof candidate.label !== 'string' ||
    typeof candidate.category !== 'string'
  )
    return null;
  return candidate as ActiveMotionDrag;
}

function DraggableBlockPaletteCard({
  disabled,
  dragDisabled = false,
  elementId,
  entry,
  onAdd,
}: {
  disabled: boolean;
  dragDisabled?: boolean;
  elementId: string;
  entry: MotionBlockCatalogEntry;
  onAdd: () => void;
}) {
  const { attributes, isDragging, listeners, setNodeRef } = useDraggable({
    id: paletteDragId(entry.kind),
    data: {
      source: 'palette',
      elementId,
      kind: entry.kind,
      label: entry.label,
      category: entry.category,
    } satisfies ActiveMotionDrag,
    disabled: disabled || dragDisabled,
  });

  return (
    <div
      className="block-palette-card"
      data-category={entry.category}
      data-disabled={disabled || undefined}
      data-dragging={isDragging || undefined}
      ref={setNodeRef}
      title={entry.description}
    >
      <button
        aria-label={`Add ${entry.label} block. ${entry.description}`}
        className="block-palette-card-add"
        disabled={disabled}
        onClick={onAdd}
        type="button"
      >
        <span className="block-palette-card-icon">
          <BlockCategoryIcon
            category={entry.category as AddableMotionBlockCategory}
          />
        </span>
        <span className="block-palette-card-copy">
          <strong>{entry.label}</strong>
          <small className="block-palette-card-fields">
            {entry.parameters.length
              ? entry.parameters.map((parameter) => parameter.label).join(' · ')
              : entry.kind === 'wait'
                ? 'Editable wait time'
                : entry.kind === 'repeat'
                  ? 'Holds a sequential block stack'
                  : entry.kind === 'parallel'
                    ? 'Holds compatible simultaneous blocks'
                    : 'Editable duration and easing'}
          </small>
        </span>
        <Plus aria-hidden="true" />
      </button>
      <button
        {...attributes}
        {...(listeners ?? {})}
        aria-label={`Drag ${entry.label} into the program`}
        className="block-palette-drag-handle"
        disabled={disabled || dragDisabled}
        title="Drag into the program"
        type="button"
      >
        <GripVertical aria-hidden="true" />
      </button>
    </div>
  );
}

function SortableMotionBlock({
  block,
  children,
  elementId,
}: {
  block: MotionBlock;
  children: (handle: MotionBlockDragHandle) => ReactNode;
  elementId: string;
}) {
  const {
    attributes,
    isDragging,
    isOver,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id: programDragId(block.id),
    data: {
      source: 'program',
      elementId,
      blockId: block.id,
      label: block.label,
      category: block.category,
    } satisfies ActiveMotionDrag,
  });
  const style: CSSProperties = {
    transform: DndCss.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 8 : undefined,
  };

  return (
    <li
      className={`motion-block block-${block.category}`}
      data-disabled={!block.enabled || undefined}
      data-dragging={isDragging || undefined}
      data-drag-over={isOver || undefined}
      data-kind={block.kind}
      ref={setNodeRef}
      style={style}
    >
      {children({
        attributes,
        isDragging,
        listeners,
        setActivatorNodeRef,
      })}
    </li>
  );
}

function StaticMotionBlock({
  block,
  children,
}: {
  block: MotionBlock;
  children: ReactNode;
}) {
  return (
    <li
      className={`motion-block block-${block.category}`}
      data-disabled={!block.enabled || undefined}
      data-kind={block.kind}
    >
      {children}
    </li>
  );
}

type MotionTreeEditorActions = {
  addBounceJump: (blockId: string) => void;
  chooseInsertion: (containerId: string) => void;
  duplicateBounceJump: (blockId: string, jumpId: string) => void;
  duplicate: (blockId: string) => void;
  move: (blockId: string, direction: -1 | 1) => void;
  moveBounceJump: (blockId: string, jumpId: string, direction: -1 | 1) => void;
  moveNextInside: (containerId: string) => void;
  moveOut: (blockId: string) => void;
  numericDraftProps: (
    key: string,
    value: number,
    normalize: (candidate: number) => number,
    commit: (candidate: number) => void,
  ) => {
    onBlur: (event: ReactFocusEvent<HTMLInputElement>) => void;
    onChange: (event: ReactChangeEvent<HTMLInputElement>) => void;
    onKeyDown: (event: ReactKeyboardEvent<HTMLInputElement>) => void;
    onKeyUp: (event: ReactKeyboardEvent<HTMLInputElement>) => void;
    onPointerCancel: () => void;
    onPointerUp: () => void;
    value: string;
  };
  removeBounceJump: (blockId: string, jumpId: string) => void;
  remove: (blockId: string) => void;
  setParallelTiming: (
    containerId: string,
    field: 'durationMs' | 'easing',
    value: number | Easing,
    transactionKey?: string | null,
  ) => void;
  update: (
    blockId: string,
    mutate: (block: MotionBlock) => void,
    transactionKey?: string | null,
  ) => void;
  updateBounceJump: (
    blockId: string,
    jumpId: string,
    mutate: (jump: BounceJump) => void,
    transactionKey?: string | null,
  ) => void;
};

/* oxlint-disable react/react-compiler -- dnd-kit supplies an imperative activator ref and listener object for the root container grip. */
function MotionTreeBlockContent({
  actions,
  block,
  depth,
  dragHandle,
  indexLabel,
  parentKind,
  siblingCount,
  siblingIndex,
}: {
  actions: MotionTreeEditorActions;
  block: MotionBlock;
  depth: number;
  dragHandle: MotionBlockDragHandle | null;
  indexLabel: string;
  parentKind: MotionBlockKind | null;
  siblingCount: number;
  siblingIndex: number;
}) {
  const catalogEntry = MOTION_BLOCK_CATALOG.find(
    (entry) => entry.kind === block.kind,
  );
  const isContainer = isMotionContainerBlockKind(block.kind);
  const isParallelChild = parentKind === 'parallel';
  const parallelDuration = block.durationMs;
  const parallelEasing = block.easing;
  const canAddInside =
    isContainer &&
    depth < MAX_MOTION_NESTING_DEPTH &&
    (block.kind !== 'parallel' ||
      block.children.length < MAX_PARALLEL_MOTION_BLOCKS);
  const { isOver: isContainerDropOver, setNodeRef: setContainerDropRef } =
    useDroppable({
      id: motionContainerDropId(block.id),
      data: {
        source: 'motion-container-dropzone',
        containerId: block.id,
      },
      disabled: !canAddInside,
    });

  const numericBlockProps = (
    field:
      | 'durationMs'
      | 'x'
      | 'y'
      | 'value'
      | 'secondaryValue'
      | 'repetitions',
  ) =>
    actions.numericDraftProps(
      `block:${block.id}:${field}`,
      block[field],
      (candidate) => normalizeMotionBlockNumericField(block, field, candidate),
      (candidate) =>
        actions.update(
          block.id,
          (item) => {
            item[field] = normalizeMotionBlockNumericField(
              item,
              field,
              candidate,
            );
          },
          `block:${block.id}:${field}`,
        ),
    );

  return (
    <>
      <div className="motion-block-head motion-tree-block-head">
        {dragHandle ? (
          <button
            {...dragHandle.attributes}
            {...(dragHandle.listeners ?? {})}
            aria-label={`Drag ${block.label}, step ${indexLabel}`}
            className="motion-block-grip motion-block-drag-handle"
            data-dragging={dragHandle.isDragging || undefined}
            ref={dragHandle.setActivatorNodeRef}
            title="Drag this whole block group"
            type="button"
          >
            {indexLabel}
          </button>
        ) : (
          <span className="motion-block-grip">{indexLabel}</span>
        )}

        <div className="motion-block-title">
          <small>{block.category.toUpperCase()}</small>
          <strong>{block.label}</strong>
        </div>

        <div className="motion-block-inline-fields motion-tree-inline-fields">
          {block.kind === 'repeat' ? (
            <div className="motion-inline-field">
              <span>Times</span>
              <span className="motion-inline-number">
                <Input
                  {...numericBlockProps('repetitions')}
                  aria-label={`${block.label} repetitions`}
                  max="20"
                  min="1"
                  step="1"
                  type="number"
                />
                <small aria-hidden="true">×</small>
              </span>
            </div>
          ) : block.kind === 'parallel' ? (
            <>
              <span className="motion-inline-token">
                {block.children.length} together
              </span>
              <div className="motion-inline-field">
                <span>Time</span>
                <span className="motion-inline-number">
                  <Input
                    {...actions.numericDraftProps(
                      `block:${block.id}:parallel-duration`,
                      parallelDuration,
                      (candidate) =>
                        normalizeMotionBlockNumericField(
                          block,
                          'durationMs',
                          candidate,
                        ),
                      (candidate) =>
                        actions.setParallelTiming(
                          block.id,
                          'durationMs',
                          candidate,
                          `block:${block.id}:parallel-duration`,
                        ),
                    )}
                    aria-label="Run together duration"
                    max="10000"
                    min="100"
                    step="50"
                    type="number"
                  />
                  <small aria-hidden="true">ms</small>
                </span>
              </div>
              <div className="motion-inline-field">
                <span>Easing</span>
                <NativeSelect
                  aria-label="Run together easing"
                  onChange={(event) =>
                    actions.setParallelTiming(
                      block.id,
                      'easing',
                      event.target.value as Easing,
                    )
                  }
                  size="sm"
                  value={parallelEasing}
                >
                  <NativeSelectOption value="linear">Linear</NativeSelectOption>
                  <NativeSelectOption value="ease-out">
                    Ease out
                  </NativeSelectOption>
                  <NativeSelectOption value="ease-in-out">
                    Ease in/out
                  </NativeSelectOption>
                </NativeSelect>
              </div>
            </>
          ) : (
            <>
              {catalogEntry?.usesDirection ? (
                <div className="motion-inline-field">
                  <span>Direction</span>
                  <NativeSelect
                    aria-label={`${block.label} direction`}
                    onChange={(event) =>
                      actions.update(block.id, (item) => {
                        item.direction = event.target
                          .value as MotionBlock['direction'];
                      })
                    }
                    size="sm"
                    value={block.direction}
                  >
                    <NativeSelectOption value="left">Left</NativeSelectOption>
                    <NativeSelectOption value="right">Right</NativeSelectOption>
                    <NativeSelectOption value="up">Up</NativeSelectOption>
                    <NativeSelectOption value="down">Down</NativeSelectOption>
                  </NativeSelect>
                </div>
              ) : null}
              {catalogEntry?.parameters.map((parameter) => (
                <div className="motion-inline-field" key={parameter.field}>
                  <span>{parameter.label}</span>
                  <span className="motion-inline-number">
                    <Input
                      {...numericBlockProps(parameter.field)}
                      aria-label={`${block.label} ${parameter.label}`}
                      max={parameter.max}
                      min={parameter.min}
                      step={parameter.step}
                      type="number"
                    />
                    {parameter.unit ? (
                      <small aria-hidden="true">{parameter.unit}</small>
                    ) : null}
                  </span>
                </div>
              ))}
              {isParallelChild ? (
                <span className="motion-inline-token">Shared timing</span>
              ) : block.kind !== 'bounce' ? (
                <>
                  <div className="motion-inline-field">
                    <span>{block.kind === 'wait' ? 'Wait' : 'Time'}</span>
                    <span className="motion-inline-number">
                      <Input
                        {...numericBlockProps('durationMs')}
                        aria-label={`${block.label} duration`}
                        max="10000"
                        min={block.kind === 'wait' ? '0' : '100'}
                        step="50"
                        type="number"
                      />
                      <small aria-hidden="true">ms</small>
                    </span>
                  </div>
                  {block.kind !== 'wait' ? (
                    <div className="motion-inline-field">
                      <span>Easing</span>
                      <NativeSelect
                        aria-label={`${block.label} easing`}
                        onChange={(event) =>
                          actions.update(block.id, (item) => {
                            item.easing = event.target.value as Easing;
                          })
                        }
                        size="sm"
                        value={block.easing}
                      >
                        <NativeSelectOption value="linear">
                          Linear
                        </NativeSelectOption>
                        <NativeSelectOption value="ease-out">
                          Ease out
                        </NativeSelectOption>
                        <NativeSelectOption value="ease-in-out">
                          Ease in/out
                        </NativeSelectOption>
                      </NativeSelect>
                    </div>
                  ) : null}
                </>
              ) : null}
            </>
          )}
        </div>

        <div className="motion-block-actions motion-tree-actions">
          <button
            aria-label={`${block.enabled ? 'Disable' : 'Enable'} ${block.label}`}
            onClick={() =>
              actions.update(block.id, (item) => {
                item.enabled = !item.enabled;
              })
            }
            title={block.enabled ? 'Disable' : 'Enable'}
            type="button"
          >
            {block.enabled ? <Eye /> : <EyeOff />}
          </button>
          <button
            aria-label={`Move ${block.label} earlier`}
            disabled={siblingIndex === 0}
            onClick={() => actions.move(block.id, -1)}
            title="Move earlier"
            type="button"
          >
            <ArrowUp />
          </button>
          <button
            aria-label={`Move ${block.label} later`}
            disabled={siblingIndex === siblingCount - 1}
            onClick={() => actions.move(block.id, 1)}
            title="Move later"
            type="button"
          >
            <ArrowDown />
          </button>
          {depth > 0 ? (
            <button
              aria-label={`Move ${block.label} out one level`}
              onClick={() => actions.moveOut(block.id)}
              title="Move out one level"
              type="button"
            >
              <ArrowLeft />
            </button>
          ) : null}
          {isContainer ? (
            <button
              aria-label={`Move next block inside ${block.label}`}
              disabled={siblingIndex >= siblingCount - 1 || !canAddInside}
              onClick={() => actions.moveNextInside(block.id)}
              title="Move next block inside"
              type="button"
            >
              <ArrowRight />
            </button>
          ) : null}
          <button
            aria-label={`Duplicate ${block.label}`}
            disabled={parentKind === 'parallel'}
            onClick={() => actions.duplicate(block.id)}
            title="Duplicate"
            type="button"
          >
            <Copy />
          </button>
          <button
            aria-label={`Delete ${block.label}`}
            onClick={() => actions.remove(block.id)}
            title="Delete"
            type="button"
          >
            <Trash2 />
          </button>
        </div>
      </div>

      {block.kind === 'bounce' ? (
        <details className="motion-tree-bounce">
          <summary>{block.jumps.length} editable jumps</summary>
          <BouncePathPreview jumps={block.jumps} />
          <div className="motion-tree-jumps">
            {block.jumps.map((jump, jumpIndex) => (
              <fieldset key={jump.id}>
                <legend>Jump {jumpIndex + 1}</legend>
                <div className="motion-tree-jump-actions">
                  <button
                    aria-label={`Move jump ${jumpIndex + 1} earlier`}
                    disabled={jumpIndex === 0}
                    onClick={() =>
                      actions.moveBounceJump(block.id, jump.id, -1)
                    }
                    type="button"
                  >
                    <ArrowUp />
                  </button>
                  <button
                    aria-label={`Move jump ${jumpIndex + 1} later`}
                    disabled={jumpIndex === block.jumps.length - 1}
                    onClick={() => actions.moveBounceJump(block.id, jump.id, 1)}
                    type="button"
                  >
                    <ArrowDown />
                  </button>
                  <button
                    aria-label={`Duplicate jump ${jumpIndex + 1}`}
                    disabled={block.jumps.length >= MAX_BOUNCE_JUMPS}
                    onClick={() =>
                      actions.duplicateBounceJump(block.id, jump.id)
                    }
                    type="button"
                  >
                    <Copy />
                  </button>
                  <button
                    aria-label={`Delete jump ${jumpIndex + 1}`}
                    disabled={block.jumps.length <= 1}
                    onClick={() => actions.removeBounceJump(block.id, jump.id)}
                    type="button"
                  >
                    <Trash2 />
                  </button>
                </div>
                <div className="motion-tree-jump-field">
                  <span>Direction</span>
                  <NativeSelect
                    aria-label={`Jump ${jumpIndex + 1} direction`}
                    onChange={(event) =>
                      actions.updateBounceJump(block.id, jump.id, (item) => {
                        item.direction = event.target
                          .value as BounceJump['direction'];
                      })
                    }
                    size="sm"
                    value={jump.direction}
                  >
                    <NativeSelectOption value="left">← Left</NativeSelectOption>
                    <NativeSelectOption value="right">
                      Right →
                    </NativeSelectOption>
                  </NativeSelect>
                </div>
                {(['height', 'spread', 'durationMs'] as const).map((field) => (
                  <label key={field}>
                    <span>
                      {field === 'durationMs'
                        ? 'Time'
                        : field === 'height'
                          ? 'Height'
                          : 'Spread'}
                    </span>
                    <Input
                      {...actions.numericDraftProps(
                        `jump:${jump.id}:${field}`,
                        jump[field],
                        (candidate) =>
                          normalizeBounceJumpNumericField(
                            jump,
                            field,
                            candidate,
                          ),
                        (candidate) =>
                          actions.updateBounceJump(
                            block.id,
                            jump.id,
                            (item) => {
                              item[field] = normalizeBounceJumpNumericField(
                                item,
                                field,
                                candidate,
                              );
                            },
                            `jump:${jump.id}:${field}`,
                          ),
                      )}
                      aria-label={`Jump ${jumpIndex + 1} ${field}`}
                      max={field === 'durationMs' ? 10000 : 2000}
                      min={field === 'durationMs' ? 80 : 0}
                      step={field === 'durationMs' ? 20 : 5}
                      type="number"
                    />
                  </label>
                ))}
                <div className="motion-tree-jump-field">
                  <span>Easing</span>
                  <NativeSelect
                    aria-label={`Jump ${jumpIndex + 1} easing`}
                    onChange={(event) =>
                      actions.updateBounceJump(block.id, jump.id, (item) => {
                        item.easing = event.target.value as Easing;
                      })
                    }
                    size="sm"
                    value={jump.easing}
                  >
                    <NativeSelectOption value="linear">
                      Linear
                    </NativeSelectOption>
                    <NativeSelectOption value="ease-out">
                      Ease out
                    </NativeSelectOption>
                    <NativeSelectOption value="ease-in-out">
                      Ease in/out
                    </NativeSelectOption>
                  </NativeSelect>
                </div>
              </fieldset>
            ))}
            <Button
              disabled={block.jumps.length >= MAX_BOUNCE_JUMPS}
              onClick={() => actions.addBounceJump(block.id)}
              size="sm"
              variant="outline"
            >
              <Plus /> Add jump
            </Button>
          </div>
        </details>
      ) : null}

      {isContainer ? (
        <section className="motion-block-children-shell">
          <header>
            <span>
              {block.kind === 'repeat'
                ? 'RUN IN ORDER'
                : 'START AT THE SAME TIME'}
            </span>
            <Button
              disabled={!canAddInside}
              onClick={() => actions.chooseInsertion(block.id)}
              size="sm"
              variant="secondary"
            >
              <Plus /> Add block inside
            </Button>
          </header>
          <ol
            aria-label={`${block.label} nested blocks`}
            className="motion-block-children"
          >
            {block.children.map((child, childIndex) => (
              <NestedMotionTreeBlock
                actions={actions}
                block={child}
                depth={depth + 1}
                indexLabel={`${indexLabel}.${childIndex + 1}`}
                key={child.id}
                parentKind={block.kind}
                siblingCount={block.children.length}
                siblingIndex={childIndex}
              />
            ))}
            {block.children.length === 0 ? (
              <li className="motion-block-children-empty">
                Add a block from the library. This container is currently
                skipped during playback.
              </li>
            ) : null}
            <li
              aria-label={`Drop a block inside ${block.label}`}
              className="motion-container-drop-target"
              data-over={isContainerDropOver || undefined}
              ref={setContainerDropRef}
            >
              <Plus aria-hidden="true" />
              <span>Drop block inside</span>
            </li>
          </ol>
        </section>
      ) : null}
    </>
  );
}

function NestedMotionTreeBlock({
  actions,
  block,
  depth,
  indexLabel,
  parentKind,
  siblingCount,
  siblingIndex,
}: {
  actions: MotionTreeEditorActions;
  block: MotionBlock;
  depth: number;
  indexLabel: string;
  parentKind: MotionBlockKind;
  siblingCount: number;
  siblingIndex: number;
}) {
  return (
    <li
      className={`motion-block motion-tree-child block-${block.category}`}
      data-depth={depth}
      data-disabled={!block.enabled || undefined}
      data-kind={block.kind}
    >
      <MotionTreeBlockContent
        actions={actions}
        block={block}
        depth={depth}
        dragHandle={null}
        indexLabel={indexLabel}
        parentKind={parentKind}
        siblingCount={siblingCount}
        siblingIndex={siblingIndex}
      />
    </li>
  );
}
/* oxlint-enable react/react-compiler */

function MotionProgramDropzone({
  active,
  children,
  itemIds,
  label,
}: {
  active: boolean;
  children: ReactNode;
  itemIds: string[];
  label: string;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: MOTION_PROGRAM_DROP_ID,
    data: { source: 'program-dropzone' },
  });

  return (
    <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
      <ol
        aria-label={label}
        className="block-program"
        data-drag-active={active || undefined}
        data-drag-over={isOver || undefined}
        ref={setNodeRef}
      >
        {children}
        <li aria-hidden={!active} className="block-program-drop-hint">
          <Plus aria-hidden="true" />
          <span>{active ? 'Drop at end' : 'Add block'}</span>
        </li>
      </ol>
    </SortableContext>
  );
}

function MotionDragPreview({ drag }: { drag: ActiveMotionDrag }) {
  return (
    <div
      aria-hidden="true"
      className={`motion-drag-preview block-${drag.category}`}
    >
      <BlockCategoryIcon
        category={
          drag.category === 'event'
            ? 'all'
            : (drag.category as AddableMotionBlockCategory)
        }
      />
      <span>
        <small>{drag.category.toUpperCase()}</small>
        <strong>{drag.label}</strong>
      </span>
    </div>
  );
}

const ADDABLE_MOTION_BLOCK_CATALOG = MOTION_BLOCK_CATALOG.filter(
  (entry) => entry.category !== 'event',
);
const ADDABLE_MOTION_BLOCK_CATEGORIES = MOTION_BLOCK_CATEGORIES.filter(
  (category) => category.id !== 'event',
);

function BlockCategoryIcon({ category }: { category: BlockPaletteCategory }) {
  if (category === 'all') return <LibraryBig aria-hidden="true" />;
  if (category === 'motion') return <Move aria-hidden="true" />;
  if (category === 'paths') return <Route aria-hidden="true" />;
  if (category === 'physics') return <Zap aria-hidden="true" />;
  if (category === 'looks') return <Eye aria-hidden="true" />;
  if (category === 'emphasis') return <Activity aria-hidden="true" />;
  if (category === 'effects') return <Sparkles aria-hidden="true" />;
  if (category === 'transitions') return <ArrowRight aria-hidden="true" />;
  if (category === 'text') return <Type aria-hidden="true" />;
  if (category === 'control') return <RotateCcw aria-hidden="true" />;
  return <Clock3 aria-hidden="true" />;
}

type ProjectImageAsset = {
  id: string;
  name: string;
  src: string;
  width: number;
  height: number;
  uses: number;
};

const sceneTemplates = [
  {
    id: 'reveal',
    name: 'Dramatic reveal',
    description: 'A title, focal glow, and dialogue beat staged for a reveal.',
    background: sceneBackgrounds[4].value,
    title: 'Everything changed here.',
    speech: 'You knew this whole time?',
    accent: '#e5ff73',
  },
  {
    id: 'quiet',
    name: 'Quiet conversation',
    description:
      'Balanced text and speech placement for a slower character beat.',
    background: sceneBackgrounds[1].value,
    title: 'For a while, neither of us spoke.',
    speech: 'Can we start again?',
    accent: '#ff9db3',
  },
  {
    id: 'impact',
    name: 'Impact beat',
    description:
      'A bold focal object and compact caption for action or surprise.',
    background: sceneBackgrounds[3].value,
    title: 'THOOM',
    speech: 'Move!',
    accent: '#ffb45e',
  },
] as const;

const motionPresets: Array<{
  id: string;
  name: string;
  description: string;
  blocks: Array<{
    kind: MotionBlockKind;
    durationMs?: number;
    x?: number;
    y?: number;
    value?: number;
    secondaryValue?: number;
    repetitions?: number;
    direction?: MotionBlock['direction'];
    jumps?: BounceJump[];
  }>;
}> = [
  {
    id: 'soft-reveal',
    name: 'Soft reveal',
    description: 'Wait briefly, drift upward, and fade in.',
    blocks: [
      { kind: 'scene-enter' },
      { kind: 'wait', durationMs: 180 },
      { kind: 'move', durationMs: 700, y: 54 },
      { kind: 'opacity', durationMs: 600, value: 0 },
    ],
  },
  {
    id: 'comic-pop',
    name: 'Comic pop',
    description: 'Scale and rotate into place for bubbles and impact text.',
    blocks: [
      { kind: 'scene-enter' },
      { kind: 'scale', durationMs: 420, value: 0.55 },
      { kind: 'rotate', durationMs: 320, value: -10 },
    ],
  },
  {
    id: 'cinematic-slide',
    name: 'Cinematic slide',
    description: 'A measured horizontal move with a delayed fade.',
    blocks: [
      { kind: 'scene-enter' },
      { kind: 'move', durationMs: 1000, x: 150 },
      { kind: 'wait', durationMs: 120 },
      { kind: 'opacity', durationMs: 650, value: 0.12 },
    ],
  },
  {
    id: 'rule-breaker-bounce',
    name: 'Rule-breaker bounce',
    description:
      'Three independent jumps: reverse the middle jump, then finish higher and wider.',
    blocks: [
      { kind: 'scene-enter' },
      {
        kind: 'bounce',
        jumps: [
          {
            id: 'preset-jump-1',
            direction: 'left',
            height: 105,
            spread: 90,
            durationMs: 360,
            easing: 'ease-out',
          },
          {
            id: 'preset-jump-2',
            direction: 'right',
            height: 70,
            spread: 55,
            durationMs: 300,
            easing: 'ease-in-out',
          },
          {
            id: 'preset-jump-3',
            direction: 'left',
            height: 220,
            spread: 260,
            durationMs: 520,
            easing: 'linear',
          },
        ],
      },
    ],
  },
  {
    id: 'impact-rattle',
    name: 'Impact rattle',
    description: 'A fast editable shake followed by a two-beat pulse.',
    blocks: [
      { kind: 'scene-enter' },
      {
        kind: 'shake',
        durationMs: 620,
        x: 30,
        secondaryValue: 12,
        repetitions: 7,
      },
      { kind: 'pulse', durationMs: 520, value: 1.22, repetitions: 2 },
    ],
  },
  {
    id: 'focus-wipe',
    name: 'Focus wipe',
    description: 'Reveal from the right while the layer sharpens from blur.',
    blocks: [
      { kind: 'scene-enter' },
      { kind: 'reveal', durationMs: 680, value: 100, direction: 'right' },
      { kind: 'blur', durationMs: 520, value: 22 },
    ],
  },
];

function uniqueId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

type MotionBlockLocation = {
  block: MotionBlock;
  depth: number;
  index: number;
  parent: MotionBlock | null;
  siblings: MotionBlock[];
};

function findMotionBlockLocation(
  blocks: MotionBlock[],
  blockId: string,
  parent: MotionBlock | null = null,
  depth = 0,
): MotionBlockLocation | null {
  const index = blocks.findIndex((block) => block.id === blockId);
  if (index >= 0) {
    return { block: blocks[index], depth, index, parent, siblings: blocks };
  }
  for (const block of blocks) {
    const nested = findMotionBlockLocation(
      block.children,
      blockId,
      block,
      depth + 1,
    );
    if (nested) return nested;
  }
  return null;
}

function cloneMotionBlockSubtree(block: MotionBlock): MotionBlock {
  const copy = structuredClone(block);
  const refreshIds = (item: MotionBlock) => {
    item.id = uniqueId(`block-${item.kind}`);
    item.jumps = item.jumps.map((jump) => ({
      ...jump,
      id: uniqueId('jump'),
    }));
    item.children.forEach(refreshIds);
  };
  refreshIds(copy);
  return copy;
}

function getMotionSubtreeDepth(block: MotionBlock): number {
  return block.children.reduce(
    (deepest, child) => Math.max(deepest, 1 + getMotionSubtreeDepth(child)),
    0,
  );
}

function describeMotionRuntimeIssue(issue: MotionProgramRuntimeIssue): string {
  if (issue === 'expanded-steps') {
    return `This change would exceed the ${MAX_COMPILED_MOTION_STEPS}-step playback limit`;
  }
  if (issue === 'keyframes') {
    return `This change would exceed the ${MAX_COMPILED_MOTION_KEYFRAMES}-keyframe playback limit`;
  }
  return `This change would run longer than ${MAX_COMPILED_MOTION_DURATION_MS / 1_000} seconds`;
}

function getBlockingMotionRuntimeIssue(
  currentBlocks: readonly MotionBlock[],
  candidateBlocks: readonly MotionBlock[],
): MotionProgramRuntimeIssue | null {
  const candidateIssue = getMotionProgramRuntimeIssue(candidateBlocks);
  if (!candidateIssue) return null;

  const currentExcess = [
    Math.max(
      0,
      getExpandedMotionStepCount(currentBlocks) - MAX_COMPILED_MOTION_STEPS,
    ),
    Math.max(
      0,
      getCompiledMotionKeyframeEstimate(currentBlocks) -
        MAX_COMPILED_MOTION_KEYFRAMES,
    ),
    Math.max(
      0,
      getMotionProgramDurationMs(currentBlocks) -
        MAX_COMPILED_MOTION_DURATION_MS,
    ),
  ];
  const candidateExcess = [
    Math.max(
      0,
      getExpandedMotionStepCount(candidateBlocks) - MAX_COMPILED_MOTION_STEPS,
    ),
    Math.max(
      0,
      getCompiledMotionKeyframeEstimate(candidateBlocks) -
        MAX_COMPILED_MOTION_KEYFRAMES,
    ),
    Math.max(
      0,
      getMotionProgramDurationMs(candidateBlocks) -
        MAX_COMPILED_MOTION_DURATION_MS,
    ),
  ];
  const doesNotWorsen = candidateExcess.every(
    (value, index) => value <= currentExcess[index],
  );
  const improves = candidateExcess.some(
    (value, index) => value < currentExcess[index],
  );
  return doesNotWorsen && improves ? null : candidateIssue;
}

function nowIso() {
  return new Date().toISOString();
}

async function decodeImageDimensions(file: File) {
  if (typeof createImageBitmap === 'function') {
    const bitmap = await createImageBitmap(file);
    const dimensions = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return dimensions;
  }

  const url = URL.createObjectURL(file);
  try {
    return await new Promise<{ width: number; height: number }>(
      (resolve, reject) => {
        const image = new Image();
        image.onload = () =>
          resolve({ width: image.naturalWidth, height: image.naturalHeight });
        image.onerror = () => reject(new Error('Image decoding failed'));
        image.src = url;
      },
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function readFileAsDataUrl(file: File) {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      typeof reader.result === 'string'
        ? resolve(reader.result)
        : reject(new Error('Image reading failed'));
    reader.onerror = () =>
      reject(reader.error ?? new Error('Image reading failed'));
    reader.readAsDataURL(file);
  });
}

const toolItems = [
  { id: 'select', label: 'Select', icon: MousePointer2 },
  { id: 'image', label: 'Image', icon: ImagePlus },
  { id: 'text', label: 'Text', icon: Type },
  { id: 'shape', label: 'Shape', icon: Square },
  { id: 'speech', label: 'Speech', icon: MessageSquareText },
  { id: 'motion', label: 'Blocks', icon: Code2 },
  { id: 'catalog', label: 'Catalogs', icon: LibraryBig },
] as const;

function findElement(
  project: MotusProject,
  sceneId: string,
  elementId: string,
) {
  return findProjectScene(project, sceneId)?.scene.elements.find(
    (element) => element.id === elementId,
  );
}

function elementIcon(type: ElementType) {
  if (type === 'text') return Type;
  if (type === 'speech') return MessageSquareText;
  if (type === 'image') return FileImage;
  return Circle;
}

function renderElementContent(element: MotusElement) {
  if (element.type === 'image' && element.src) {
    // Data URLs from the local project file are not compatible with optimized image loaders.
    // oxlint-disable-next-line next/no-img-element
    return <img alt="" draggable={false} src={element.src} />;
  }
  if (element.type === 'text' || element.type === 'speech') {
    return <span className="element-text-content">{element.text}</span>;
  }
  return <span className="orb-highlight" />;
}

type CanvasTextEditorProps = {
  element: MotusElement;
  onChange?: (elementId: string, value: string) => void;
  onFinish?: (elementId: string, restoreFocus: boolean) => void;
};

function CanvasTextEditor({
  element,
  onChange,
  onFinish,
}: CanvasTextEditorProps) {
  const editor = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const node = editor.current;
    if (!node) return;
    node.focus({ preventScroll: true });
    const caret = node.value.length;
    node.setSelectionRange(caret, caret);
  }, [element.id]);

  return (
    <textarea
      aria-label={`Edit ${element.name} text`}
      className="canvas-text-editor"
      maxLength={MAX_ELEMENT_TEXT_LENGTH}
      onBlur={() => onFinish?.(element.id, false)}
      onChange={(event) => onChange?.(element.id, event.target.value)}
      onClick={(event) => event.stopPropagation()}
      onDoubleClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => {
        if (
          event.key === 'Escape' ||
          (event.key === 'Enter' && (event.metaKey || event.ctrlKey))
        ) {
          event.preventDefault();
          event.stopPropagation();
          onFinish?.(element.id, true);
        }
      }}
      onPointerDown={(event) => event.stopPropagation()}
      ref={editor}
      value={element.text ?? ''}
    />
  );
}

function BouncePathPreview({ jumps }: { jumps: BounceJump[] }) {
  const landingPoints = [0];
  for (const jump of jumps) {
    const signedSpread = jump.direction === 'left' ? -jump.spread : jump.spread;
    landingPoints.push(landingPoints.at(-1)! + signedSpread);
  }
  const minimumX = Math.min(...landingPoints);
  const maximumX = Math.max(...landingPoints);
  const rangeX = Math.max(maximumX - minimumX, 1);
  const maximumHeight = Math.max(...jumps.map((jump) => jump.height), 1);
  const plotX = (value: number) => 24 + ((value - minimumX) / rangeX) * 312;
  const plotY = (height: number) => 184 - (height / maximumHeight) * 142;
  const path = jumps
    .map((jump, index) => {
      const startX = landingPoints[index];
      const nextX = landingPoints[index + 1];
      return `Q ${plotX((startX + nextX) / 2)} ${plotY(jump.height)} ${plotX(nextX)} 184`;
    })
    .join(' ');

  return (
    <figure className="bounce-preview">
      <svg
        aria-label={`Bounce path with ${jumps.length} editable jumps`}
        viewBox="0 0 360 208"
      >
        <line className="bounce-ground" x1="12" x2="348" y1="184" y2="184" />
        <path d={`M ${plotX(landingPoints[0])} 184 ${path}`} />
        {landingPoints.map((point, index) => (
          <g key={`${point}-${index}`}>
            <circle cx={plotX(point)} cy="184" r="9" />
            <text x={plotX(point)} y="188">
              {index}
            </text>
          </g>
        ))}
      </svg>
      <figcaption>{jumps.length} jump path</figcaption>
    </figure>
  );
}

function animateElementProgram(
  element: MotusElement,
  node: HTMLDivElement,
): Animation | null {
  if (
    !node.animate ||
    !element.visible ||
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  ) {
    return null;
  }
  const compiled = compileElementMotion(element);
  if (!compiled.steps.some((step) => step.kind !== 'wait')) return null;
  return node.animate(
    compiled.keyframes.map((frame) => ({
      offset: frame.offset,
      easing: frame.easing,
      filter: [
        `blur(${frame.blurPx}px)`,
        `brightness(${frame.brightness})`,
        `contrast(${frame.contrast})`,
        `saturate(${frame.saturation})`,
        `grayscale(${frame.grayscale})`,
        `sepia(${frame.sepia})`,
        `hue-rotate(${frame.hueRotate}deg)`,
        `drop-shadow(0 0 ${frame.glowPx}px rgb(229 255 115 / 85%))`,
      ].join(' '),
      opacity: frame.opacity,
      clipPath: `inset(${frame.clipTop}% ${frame.clipRight}% ${frame.clipBottom}% ${frame.clipLeft}%)`,
      transform: `translate(${frame.translateX}px, ${frame.translateY}px) rotate(${frame.rotation}deg) scale(${frame.scale * frame.scaleX}, ${frame.scale * frame.scaleY})`,
    })),
    {
      duration: Math.max(compiled.sequenceDurationMs, 1),
      fill: 'both',
    },
  );
}

type SceneViewProps = {
  scene: MotusScene;
  alignmentGuides?: readonly ElementAlignmentGuide[];
  elementLimit?: number;
  selectedId?: string;
  selectedIds?: ReadonlySet<string>;
  playingKey?: number;
  playingElementId?: string;
  onPlaybackComplete?: () => void;
  interactive?: boolean;
  readerTriggers?: boolean;
  onSelect?: (id: string, additive?: boolean) => void;
  editingTextId?: string | null;
  onBeginTextEdit?: (elementId: string) => void;
  onTextChange?: (elementId: string, value: string) => void;
  onEndTextEdit?: (elementId: string, restoreFocus: boolean) => void;
  onKeyboardNudge?: (
    elementId: string,
    key: string,
    accelerated: boolean,
  ) => void;
  onKeyboardNudgeEnd?: () => void;
  onElementRef?: (elementId: string, node: HTMLDivElement | null) => void;
  onPointerAction?: (
    event: ReactPointerEvent<HTMLElement>,
    elementId: string,
    mode: ElementPointerTransformMode,
  ) => void;
};

type ReaderTriggerElement = (
  elementId: string,
  restart?: boolean,
  visited?: ReadonlySet<string>,
) => void;

function SceneView({
  scene,
  alignmentGuides = [],
  elementLimit,
  selectedId,
  selectedIds,
  playingKey = 0,
  playingElementId,
  onPlaybackComplete,
  interactive = false,
  readerTriggers = false,
  onSelect,
  editingTextId,
  onBeginTextEdit,
  onTextChange,
  onEndTextEdit,
  onKeyboardNudge,
  onKeyboardNudgeEnd,
  onElementRef,
  onPointerAction,
}: SceneViewProps) {
  const elementNodes = useRef(new Map<string, HTMLDivElement>());
  const runningAnimations = useRef<Animation[]>([]);
  const readerAnimations = useRef(new Map<string, Animation>());
  const triggerReaderElementRef = useRef<ReaderTriggerElement>(() => undefined);
  const onPlaybackCompleteRef = useRef(onPlaybackComplete);
  const renderedElements = useMemo(
    () =>
      elementLimit === undefined
        ? scene.elements
        : getSceneThumbnailElements(scene, elementLimit),
    [elementLimit, scene],
  );

  useEffect(() => {
    onPlaybackCompleteRef.current = onPlaybackComplete;
  }, [onPlaybackComplete]);

  useEffect(() => {
    runningAnimations.current.forEach((animation) => animation.cancel());
    runningAnimations.current = [];

    if (!playingKey || readerTriggers) return;

    let disposed = false;
    let completed = false;
    const animations: Animation[] = [];
    const completePlayback = () => {
      if (disposed || completed) return;
      completed = true;
      onPlaybackCompleteRef.current?.();
    };
    const cleanup = () => {
      disposed = true;
      animations.forEach((animation) => animation.cancel());
      if (runningAnimations.current === animations) {
        runningAnimations.current = [];
      }
    };

    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      queueMicrotask(completePlayback);
      return cleanup;
    }

    for (const element of renderedElements) {
      if (playingElementId && element.id !== playingElementId) continue;
      const node = elementNodes.current.get(element.id);
      if (!node) continue;
      const animation = animateElementProgram(element, node);
      if (!animation) continue;
      animations.push(animation);
    }

    runningAnimations.current = animations;
    if (animations.length === 0) {
      queueMicrotask(completePlayback);
    } else {
      void Promise.allSettled(
        animations.map((animation) => animation.finished),
      ).then(completePlayback);
    }

    return cleanup;
  }, [playingElementId, playingKey, readerTriggers, renderedElements]);

  const triggerReaderElement = useCallback<ReaderTriggerElement>(
    (elementId, restart = false, visited = new Set()) => {
      if (!readerTriggers) return;
      if (visited.has(elementId)) return;
      const element = renderedElements.find(
        (candidate) => candidate.id === elementId,
      );
      const node = elementNodes.current.get(elementId);
      if (!element || !node) return;
      const current = readerAnimations.current.get(elementId);
      if (current) {
        if (!restart) return;
        current.cancel();
        readerAnimations.current.delete(elementId);
      }
      const animation = animateElementProgram(element, node);
      if (!animation) return;
      const nextVisited = new Set(visited);
      nextVisited.add(elementId);
      readerAnimations.current.set(elementId, animation);
      void animation.finished.then(
        () => {
          if (readerAnimations.current.get(elementId) === animation) {
            readerAnimations.current.delete(elementId);
            for (const dependent of renderedElements) {
              const compiled = compileElementMotion(dependent);
              if (
                compiled.event === 'animation-finish' &&
                compiled.eventSourceElementId === elementId
              ) {
                triggerReaderElementRef.current(
                  dependent.id,
                  false,
                  nextVisited,
                );
              }
            }
          }
        },
        () => {
          if (readerAnimations.current.get(elementId) === animation) {
            readerAnimations.current.delete(elementId);
          }
        },
      );
    },
    [readerTriggers, renderedElements],
  );

  useEffect(() => {
    triggerReaderElementRef.current = triggerReaderElement;
  }, [triggerReaderElement]);

  useEffect(() => {
    if (!readerTriggers) return;
    for (const element of renderedElements) {
      if (compileElementMotion(element).event === 'page-open') {
        triggerReaderElement(element.id);
      }
    }
  }, [readerTriggers, renderedElements, triggerReaderElement]);

  useEffect(() => {
    if (!readerTriggers || !playingKey) return;
    for (const element of renderedElements) {
      if (compileElementMotion(element).event === 'scene-enter') {
        triggerReaderElement(element.id, true);
      }
    }
  }, [playingKey, readerTriggers, renderedElements, triggerReaderElement]);

  useEffect(() => {
    if (!readerTriggers) return;
    const appearElements = renderedElements.filter(
      (element) => compileElementMotion(element).event === 'element-appear',
    );
    if (appearElements.length === 0) return;
    if (!('IntersectionObserver' in window)) {
      appearElements.forEach((element) => triggerReaderElement(element.id));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const elementId = (entry.target as HTMLElement).dataset.elementId;
          if (elementId) triggerReaderElement(elementId);
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.25 },
    );
    appearElements.forEach((element) => {
      const node = elementNodes.current.get(element.id);
      if (node) observer.observe(node);
    });
    return () => observer.disconnect();
  }, [readerTriggers, renderedElements, triggerReaderElement]);

  useEffect(() => {
    const animations = readerAnimations.current;
    return () => {
      animations.forEach((animation) => animation.cancel());
      animations.clear();
    };
  }, [scene.id]);

  return (
    <section
      aria-label={interactive ? `${scene.name} layers` : undefined}
      className="artboard"
      style={{ background: scene.background }}
    >
      <div className="artboard-grid" />
      <div className="artboard-horizon" />
      {alignmentGuides.map((guide, index) => (
        <span
          aria-hidden="true"
          className={`alignment-guide alignment-guide-${guide.axis}`}
          data-target={guide.target}
          key={`${guide.axis}-${guide.position}-${index}`}
          style={
            guide.axis === 'vertical'
              ? { left: `${(guide.position / CANVAS_WIDTH) * 100}%` }
              : { top: `${(guide.position / CANVAS_HEIGHT) * 100}%` }
          }
        />
      ))}
      {renderedElements.map((element) => {
        if (!element.visible) return null;
        const selected =
          selectedIds?.has(element.id) ?? selectedId === element.id;
        const primarySelected = selectedId === element.id;
        const textEditable =
          element.type === 'text' || element.type === 'speech';
        const editingText =
          interactive && textEditable && editingTextId === element.id;
        const compiledMotion = compileElementMotion(element);
        const readerTap =
          readerTriggers && compiledMotion.event === 'element-tap';
        const readerHover =
          readerTriggers && compiledMotion.event === 'element-hover';
        const readerInteractive = readerTap || readerHover;
        const typography = normalizeElementTypography(
          element.type,
          element.typography,
        );
        const elementStyle = {
          left: `${(element.x / CANVAS_WIDTH) * 100}%`,
          top: `${(element.y / CANVAS_HEIGHT) * 100}%`,
          width: `${(element.width / CANVAS_WIDTH) * 100}%`,
          height: `${(element.height / CANVAS_HEIGHT) * 100}%`,
          transform: `rotate(${element.rotation}deg)`,
          opacity: element.opacity,
          '--element-fill': element.fill,
          '--motion-from-x': `${compiledMotion.from.translateX}px`,
          '--motion-from-y': `${compiledMotion.from.translateY}px`,
          '--motion-from-opacity': compiledMotion.from.opacity,
          '--motion-from-scale': compiledMotion.from.scale,
          '--motion-from-rotation': `${compiledMotion.from.rotation}deg`,
          '--motion-to-opacity': compiledMotion.to.opacity,
          '--motion-to-rotation': `${compiledMotion.to.rotation}deg`,
          '--motion-duration': `${compiledMotion.durationMs}ms`,
          '--motion-delay': `${compiledMotion.delayMs}ms`,
          '--motion-easing': compiledMotion.easing,
          ...(typography
            ? {
                '--element-font-family':
                  ELEMENT_FONT_STACKS[typography.fontPreset],
                '--element-font-size-min': `${typography.fontSize * 0.5}px`,
                '--element-font-size-fluid': `${typography.fontSize * 0.09}vw`,
                '--element-font-size-max': `${typography.fontSize}px`,
                '--element-thumbnail-font-size': `${
                  typography.fontSize *
                  (element.type === 'text' ? 4 / 34 : 3 / 16)
                }px`,
                '--element-font-weight': typography.fontWeight,
                '--element-letter-spacing': `${typography.letterSpacing}em`,
                '--element-line-height': typography.lineHeight,
                '--element-text-align': typography.textAlign,
              }
            : {}),
        } as CSSProperties;

        return (
          // The role and handlers are conditional because reader scenes are display-only.
          // oxlint-disable-next-line jsx-a11y/no-static-element-interactions
          <div
            aria-describedby={interactive ? 'canvas-instructions' : undefined}
            aria-keyshortcuts={
              interactive
                ? 'ArrowLeft ArrowRight ArrowUp ArrowDown Enter Space Shift+Enter Shift+Space Meta+A Control+A Meta+C Control+C Meta+X Control+X Meta+V Control+V'
                : readerTap
                  ? 'Enter Space'
                  : undefined
            }
            aria-label={`${
              interactive && selected
                ? primarySelected
                  ? 'Primary selected layer. '
                  : 'Selected layer. '
                : ''
            }${describeElementForAccessibility(element)}${
              interactive && textEditable && primarySelected
                ? ' Press Enter to edit text.'
                : readerTap
                  ? ' Activate to play this animation.'
                  : readerHover
                    ? ' Focus or hover to play this animation.'
                    : ''
            }`}
            aria-current={interactive && primarySelected ? 'true' : undefined}
            className={`canvas-element element-${element.type}`}
            data-element-id={element.id}
            data-edge-bottom={
              element.y + element.height >= CANVAS_HEIGHT - 48 || undefined
            }
            data-edge-left={element.x <= 48 || undefined}
            data-edge-right={
              element.x + element.width >= CANVAS_WIDTH - 48 || undefined
            }
            data-edge-top={element.y <= 140 || undefined}
            data-editing={editingText || undefined}
            data-interactive={interactive || undefined}
            data-locked={element.locked || undefined}
            data-motion-trigger={
              readerTriggers ? compiledMotion.event : undefined
            }
            data-primary-selected={primarySelected || undefined}
            data-selected={selected || undefined}
            key={readerTriggers ? element.id : `${element.id}-${playingKey}`}
            onClick={
              interactive && !editingText
                ? (event) => {
                    event.stopPropagation();
                    onSelect?.(
                      element.id,
                      event.shiftKey || event.metaKey || event.ctrlKey,
                    );
                  }
                : readerTap
                  ? () => triggerReaderElement(element.id)
                  : undefined
            }
            onDoubleClick={
              interactive && textEditable && !element.locked
                ? (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onBeginTextEdit?.(element.id);
                  }
                : undefined
            }
            onKeyDown={
              interactive && !editingText
                ? (event) => {
                    const nudge = getKeyboardNudgeDelta(
                      event.key,
                      event.shiftKey,
                    );
                    if (nudge) {
                      event.preventDefault();
                      event.stopPropagation();
                      if (!selected) onSelect?.(element.id);
                      onKeyboardNudge?.(element.id, event.key, event.shiftKey);
                      return;
                    }
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      event.stopPropagation();
                      if (
                        event.key === 'Enter' &&
                        !event.shiftKey &&
                        !event.metaKey &&
                        !event.ctrlKey &&
                        primarySelected &&
                        textEditable &&
                        !element.locked
                      ) {
                        onBeginTextEdit?.(element.id);
                        return;
                      }
                      onSelect?.(
                        element.id,
                        event.shiftKey || event.metaKey || event.ctrlKey,
                      );
                    }
                  }
                : readerTap
                  ? (event) => {
                      if (event.key !== 'Enter' && event.key !== ' ') return;
                      event.preventDefault();
                      triggerReaderElement(element.id);
                    }
                  : undefined
            }
            onKeyUp={
              interactive
                ? (event) => {
                    if (getKeyboardNudgeDelta(event.key, event.shiftKey)) {
                      onKeyboardNudgeEnd?.();
                    }
                  }
                : undefined
            }
            onBlur={interactive ? onKeyboardNudgeEnd : undefined}
            onFocus={
              readerHover ? () => triggerReaderElement(element.id) : undefined
            }
            onPointerEnter={
              readerHover ? () => triggerReaderElement(element.id) : undefined
            }
            onPointerDown={
              interactive && !editingText
                ? (event) => {
                    if (!element.locked) {
                      onPointerAction?.(event, element.id, 'move');
                    }
                  }
                : undefined
            }
            role={
              interactive
                ? editingText
                  ? 'group'
                  : 'button'
                : readerInteractive
                  ? 'button'
                  : 'img'
            }
            ref={(node) => {
              if (node) elementNodes.current.set(element.id, node);
              else elementNodes.current.delete(element.id);
              if (interactive) onElementRef?.(element.id, node);
            }}
            style={elementStyle}
            tabIndex={
              (interactive && !editingText) || readerInteractive ? 0 : undefined
            }
            title={
              readerTap
                ? 'Tap to play this layer animation'
                : readerHover
                  ? 'Hover or focus to play this layer animation'
                  : undefined
            }
          >
            {editingText ? (
              <CanvasTextEditor
                element={element}
                onChange={onTextChange}
                onFinish={onEndTextEdit}
              />
            ) : (
              renderElementContent(element)
            )}
            {primarySelected &&
            interactive &&
            textEditable &&
            !element.locked &&
            !editingText ? (
              // The selected layer itself is the keyboard control; this chip is a direct pointer affordance.
              // oxlint-disable-next-line jsx-a11y/no-static-element-interactions
              <span
                aria-hidden="true"
                className="canvas-edit-text-control"
                onClick={(event) => event.stopPropagation()}
                onPointerDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onBeginTextEdit?.(element.id);
                }}
                title={`Edit ${element.name} text`}
              >
                <Pencil />
                Edit text
              </span>
            ) : null}
            {primarySelected &&
            interactive &&
            !element.locked &&
            !editingText ? (
              <>
                {ELEMENT_RESIZE_HANDLES.map((handle) => (
                  // Pointer transforms are visual; keyboard users retain exact inspector controls.
                  // oxlint-disable-next-line jsx-a11y/no-static-element-interactions
                  <span
                    aria-hidden="true"
                    className={`resize-handle resize-handle-${handle}`}
                    key={handle}
                    onClick={(event) => event.stopPropagation()}
                    onPointerDown={(event) => {
                      event.stopPropagation();
                      onPointerAction?.(event, element.id, `resize-${handle}`);
                    }}
                    title={`Drag ${handle.toUpperCase()} handle to resize ${element.name}`}
                  />
                ))}
                {/* oxlint-disable-next-line jsx-a11y/no-static-element-interactions */}
                <span
                  aria-hidden="true"
                  className="rotate-handle"
                  onClick={(event) => event.stopPropagation()}
                  onPointerDown={(event) => {
                    event.stopPropagation();
                    onPointerAction?.(event, element.id, 'rotate');
                  }}
                  title={`Drag to rotate ${element.name}; hold Shift to snap`}
                >
                  <RotateCcw />
                </span>
              </>
            ) : null}
          </div>
        );
      })}
    </section>
  );
}

type ReaderSceneProps = {
  scene: MotusScene;
  index: number;
  sessionKey: number;
  anchorId?: string;
  onEnter?: (index: number) => void;
};

export function ReaderScene({
  scene,
  index,
  sessionKey,
  anchorId,
  onEnter,
}: ReaderSceneProps) {
  const sceneRef = useRef<HTMLElement>(null);
  const [playingKey, setPlayingKey] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const element = sceneRef.current;
    if (!element) return;

    const prefersReducedMotion = window.matchMedia?.(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    if (prefersReducedMotion) {
      queueMicrotask(() => {
        setReducedMotion(true);
      });
    }

    if (!('IntersectionObserver' in window)) {
      queueMicrotask(() => {
        setPlayingKey(sessionKey || 1);
        onEnter?.(index);
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        if (!prefersReducedMotion) setPlayingKey(sessionKey || 1);
        onEnter?.(index);
        observer.disconnect();
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.35 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [index, onEnter, sessionKey]);

  return (
    <article
      aria-label={`Scene ${index + 1}: ${scene.name}`}
      className="reader-scene"
      data-played={playingKey > 0 || undefined}
      id={anchorId}
      ref={sceneRef}
    >
      <div className="reader-scene-meta">
        <span className="reader-scene-number">
          SCENE {String(index + 1).padStart(2, '0')}
        </span>
        <span className="reader-trigger-state">
          {reducedMotion
            ? 'Motion reduced'
            : playingKey
              ? 'Played'
              : 'Plays on view'}
        </span>
      </div>
      <SceneView playingKey={playingKey} readerTriggers scene={scene} />
    </article>
  );
}

export function MotusStudio() {
  const [project, setProject] = useState<MotusProject>(createDefaultProject);
  const [activeChapterId, setActiveChapterId] = useState(
    'signal-in-the-fog-chapter-1',
  );
  const [activeSceneId, setActiveSceneId] = useState('scene-1');
  const [selectedElementId, setPrimarySelectedElementId] =
    useState('scene-1-orb');
  const [selectedElementIds, setSelectedElementIds] = useState<string[]>([
    'scene-1-orb',
  ]);
  const setSelectedElementId = useCallback((elementId: string) => {
    setPrimarySelectedElementId(elementId);
    setSelectedElementIds(elementId ? [elementId] : []);
  }, []);
  const [editingTextElementId, setEditingTextElementId] = useState<
    string | null
  >(null);
  const [inspectorTab, setInspectorTab] = useState<'design' | 'motion'>(
    'design',
  );
  const [zoom, setZoom] = useState(100);
  const [fitCanvasWidth, setFitCanvasWidth] = useState(430);
  const [imageDropActive, setImageDropActive] = useState(false);
  const [activeAlignmentGuides, setActiveAlignmentGuides] = useState<
    ElementAlignmentGuide[]
  >([]);
  const [canvasPreviewKey, setCanvasPreviewKey] = useState(0);
  const [readerPreviewKey, setReaderPreviewKey] = useState(0);
  const [previewScope, setPreviewScope] = useState<PreviewScope>('selected');
  const [previewRunning, setPreviewRunning] = useState(false);
  const [mobileStudioPane, setMobileStudioPane] =
    useState<MobileStudioPane>('stage');
  const [desktopPanelsEnabled, setDesktopPanelsEnabled] = useState(false);
  const [studioPanelLayouts, setStudioPanelLayouts] =
    useState<StudioPanelLayouts>(DEFAULT_STUDIO_PANEL_LAYOUTS);
  const [panelLayoutRevision, setPanelLayoutRevision] = useState(0);
  const [blockWorkspaceLayout, setBlockWorkspaceLayout] =
    useState<BlockWorkspaceLayout>(DEFAULT_BLOCK_WORKSPACE_LAYOUT);
  const [blockWorkspaceLayoutRevision, setBlockWorkspaceLayoutRevision] =
    useState(0);
  const [readerOpen, setReaderOpen] = useState(false);
  const [readerMatureConfirmed, setReaderMatureConfirmed] = useState(false);
  const [readerMode, setReaderMode] = useState<ReaderMode>('scroll');
  const [readerChapterId, setReaderChapterId] = useState(
    'signal-in-the-fog-chapter-1',
  );
  const [readerPageIndex, setReaderPageIndex] = useState(0);
  const [publishOpen, setPublishOpen] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [catalogTab, setCatalogTab] = useState<CatalogTab>('works');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [blockPaletteCategory, setBlockPaletteCategory] =
    useState<BlockPaletteCategory>('motion');
  const [blockPaletteSearch, setBlockPaletteSearch] = useState('');
  const [numericDrafts, setNumericDrafts] = useState<Record<string, string>>(
    {},
  );
  const [activeMotionDrag, setActiveMotionDrag] =
    useState<ActiveMotionDrag | null>(null);
  const [expandedMotionBlockId, setExpandedMotionBlockId] = useState<
    string | null
  >(null);
  const [motionInsertionParentId, setMotionInsertionParentId] = useState<
    string | null
  >(null);
  const [projectDetailsOpen, setProjectDetailsOpen] = useState(false);
  const [pendingProjectImport, setPendingProjectImport] =
    useState<PendingProjectImport | null>(null);
  const [pendingRevisionRemoval, setPendingRevisionRemoval] =
    useState<MotusPublicationRevision | null>(null);
  const [newWorkOpen, setNewWorkOpen] = useState(false);
  const [conflictOpen, setConflictOpen] = useState(false);
  const [externalDraftChange, setExternalDraftChange] = useState(false);
  const [readerRevision, setReaderRevision] =
    useState<MotusPublicationRevision | null>(null);
  const [readerCatalogProject, setReaderCatalogProject] =
    useState<MotusProject | null>(null);
  const [readerCatalogFormat, setReaderCatalogFormat] =
    useState<LibraryWorkFormat | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [notice, setNotice] = useState('Ready');
  const [saveFailed, setSaveFailed] = useState(false);
  const [deletionUndo, setDeletionUndo] = useState<DeletionUndo | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const undoStack = useRef<ProjectHistoryEntry[]>([]);
  const redoStack = useRef<ProjectHistoryEntry[]>([]);
  const historyTransaction = useRef<string | null>(null);
  const imageInput = useRef<HTMLInputElement>(null);
  const projectInput = useRef<HTMLInputElement>(null);
  const blockPaletteSearchInput = useRef<HTMLInputElement>(null);
  const canvasStage = useRef<HTMLDivElement>(null);
  const studioGrid = useRef<HTMLDivElement>(null);
  const motionProperties = useRef<HTMLDivElement>(null);
  const readerScroll = useRef<HTMLDivElement>(null);
  const canvasElementRefs = useRef(new Map<string, HTMLDivElement>());
  const chapterButtonRefs = useRef(new Map<string, HTMLButtonElement>());
  const sceneButtonRefs = useRef(new Map<string, HTMLButtonElement>());
  const deletionUndoTimer = useRef<number | null>(null);
  const activePointerCleanup = useRef<(() => void) | null>(null);
  const copiedElements = useRef<MotusElement[]>([]);
  const motionSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 7 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) setMotionInsertionParentId(null);
    });
    return () => {
      active = false;
    };
  }, [activeSceneId, selectedElementId]);

  const resetTransientCanvasState = useCallback(() => {
    activePointerCleanup.current?.();
    setActiveAlignmentGuides([]);
    setPreviewRunning(false);
    setCanvasPreviewKey(0);
    setEditingTextElementId(null);
  }, []);

  const resetEditorHistory = useCallback(() => {
    const reset = resetProjectTimeline({
      undoStack: undoStack.current,
      redoStack: redoStack.current,
      transactionKey: historyTransaction.current,
    });
    undoStack.current = reset.undoStack;
    redoStack.current = reset.redoStack;
    historyTransaction.current = reset.transactionKey;
    setCanUndo(false);
    setCanRedo(false);
  }, []);

  const handleInspectorTabKeyDown = (
    event: ReactKeyboardEvent<HTMLButtonElement>,
  ) => {
    const currentIndex = inspectorTab === 'design' ? 0 : 1;
    const nextIndex = getTabIndexForKey(currentIndex, 2, event.key);
    if (nextIndex === null) return;
    const nextTab = nextIndex === 0 ? 'design' : 'motion';

    event.preventDefault();
    setInspectorTab(nextTab);
    requestAnimationFrame(() => {
      document.getElementById(`inspector-tab-${nextTab}`)?.focus();
    });
  };

  const handleMobilePaneKeyDown = (
    event: ReactKeyboardEvent<HTMLButtonElement>,
  ) => {
    const currentIndex = MOBILE_STUDIO_PANES.indexOf(mobileStudioPane);
    const nextIndex = getTabIndexForKey(
      currentIndex,
      MOBILE_STUDIO_PANES.length,
      event.key,
    );
    if (nextIndex === null) return;
    const nextPane = MOBILE_STUDIO_PANES[nextIndex];

    event.preventDefault();
    setMobileStudioPane(nextPane);
    requestAnimationFrame(() => {
      document.getElementById(`mobile-pane-${nextPane}`)?.focus();
    });
  };

  const clearDeletionUndo = useCallback(() => {
    if (deletionUndoTimer.current !== null) {
      window.clearTimeout(deletionUndoTimer.current);
      deletionUndoTimer.current = null;
    }
    setDeletionUndo(null);
  }, []);

  const showDeletionUndo = useCallback((recovery: DeletionUndo) => {
    if (deletionUndoTimer.current !== null) {
      window.clearTimeout(deletionUndoTimer.current);
    }
    setDeletionUndo(recovery);
    deletionUndoTimer.current = window.setTimeout(() => {
      deletionUndoTimer.current = null;
      setDeletionUndo(null);
    }, 8_000);
  }, []);

  const focusEditorTarget = (sceneId: string, elementId = '') => {
    window.requestAnimationFrame(() => {
      const element = canvasElementRefs.current.get(elementId);
      if (element?.isConnected) {
        element.focus();
        return;
      }
      sceneButtonRefs.current.get(sceneId)?.focus();
    });
  };

  const activeChapter =
    project.chapters.find((chapter) => chapter.id === activeChapterId) ??
    project.chapters[0];
  const activeScene =
    activeChapter.scenes.find((scene) => scene.id === activeSceneId) ??
    activeChapter.scenes[0];
  const chapterIndex = Math.max(
    project.chapters.findIndex((chapter) => chapter.id === activeChapter.id),
    0,
  );
  const sceneIndex = Math.max(
    activeChapter.scenes.findIndex((scene) => scene.id === activeScene.id),
    0,
  );
  const allScenes = useMemo(() => getProjectScenes(project), [project]);
  const projectCoverScene =
    findProjectScene(project, project.coverSceneId)?.scene ?? allScenes[0];
  const selectedElement = useMemo(
    () =>
      activeScene.elements.find((element) => element.id === selectedElementId),
    [activeScene.elements, selectedElementId],
  );
  const selectedElementIdSet = useMemo(
    () => new Set(selectedElementIds),
    [selectedElementIds],
  );
  const selectedElements = useMemo(
    () =>
      activeScene.elements.filter((element) =>
        selectedElementIdSet.has(element.id),
      ),
    [activeScene.elements, selectedElementIdSet],
  );
  const unlockedSelectedElementIds = useMemo(
    () =>
      selectedElements
        .filter((element) => !element.locked)
        .map((element) => element.id),
    [selectedElements],
  );
  const selectElement = (elementId: string, additive = false) => {
    if (!additive) {
      if (
        selectedElementIds.length > 1 &&
        selectedElementIdSet.has(elementId)
      ) {
        setPrimarySelectedElementId(elementId);
        setEditingTextElementId(null);
        endHistoryTransaction();
        const primary = activeScene.elements.find(
          (element) => element.id === elementId,
        );
        setNotice(
          `${primary?.name ?? 'Layer'} is primary · ${selectedElementIds.length} layers selected`,
        );
        return;
      }
      setSelectedElementId(elementId);
      return;
    }
    const validSelection = selectedElementIds.filter((id) =>
      activeScene.elements.some((element) => element.id === id),
    );
    const nextSelection = validSelection.includes(elementId)
      ? validSelection.filter((id) => id !== elementId)
      : [...validSelection, elementId];
    setSelectedElementIds(nextSelection);
    setPrimarySelectedElementId(
      nextSelection.includes(elementId)
        ? elementId
        : (nextSelection.at(-1) ?? ''),
    );
    setEditingTextElementId(null);
    endHistoryTransaction();
    setNotice(
      nextSelection.length > 1
        ? `${nextSelection.length} layers selected`
        : nextSelection.length === 1
          ? '1 layer selected'
          : 'Selection cleared',
    );
  };
  const selectAllLayers = () => {
    const elementIds = activeScene.elements.map((element) => element.id);
    setSelectedElementIds(elementIds);
    setPrimarySelectedElementId(elementIds.at(-1) ?? '');
    setEditingTextElementId(null);
    endHistoryTransaction();
    setNotice(
      elementIds.length
        ? `${elementIds.length} layers selected`
        : 'This scene has no layers',
    );
  };
  const selectedTypography = selectedElement
    ? (normalizeElementTypography(
        selectedElement.type,
        selectedElement.typography,
      ) ?? getDefaultElementTypography(selectedElement.type))
    : undefined;
  const projectImageAssets = useMemo(() => {
    const assets = new Map<string, ProjectImageAsset>();
    for (const scene of allScenes) {
      for (const element of scene.elements) {
        if (element.type !== 'image' || !element.src) continue;
        const existing = assets.get(element.src);
        if (existing) {
          existing.uses += 1;
          continue;
        }
        assets.set(element.src, {
          id: element.id,
          name: element.name,
          src: element.src,
          width: element.width,
          height: element.height,
          uses: 1,
        });
      }
    }
    return [...assets.values()];
  }, [allScenes]);
  const normalizedBlockPaletteSearch = blockPaletteSearch
    .trim()
    .toLocaleLowerCase();
  const blockPaletteCategoryCounts = useMemo(
    () =>
      new Map(
        ADDABLE_MOTION_BLOCK_CATEGORIES.map((category) => [
          category.id,
          ADDABLE_MOTION_BLOCK_CATALOG.filter(
            (entry) => entry.category === category.id,
          ).length,
        ]),
      ),
    [],
  );
  const visibleBlockPaletteEntries = useMemo(() => {
    if (normalizedBlockPaletteSearch) {
      return ADDABLE_MOTION_BLOCK_CATALOG.filter((entry) => {
        const searchableText = [
          entry.label,
          entry.description,
          entry.category,
          ...entry.parameters.flatMap((parameter) => [
            parameter.label,
            parameter.unit ?? '',
          ]),
        ]
          .join(' ')
          .toLocaleLowerCase();
        return searchableText.includes(normalizedBlockPaletteSearch);
      });
    }
    if (blockPaletteCategory === 'all') return ADDABLE_MOTION_BLOCK_CATALOG;
    return ADDABLE_MOTION_BLOCK_CATALOG.filter(
      (entry) => entry.category === blockPaletteCategory,
    );
  }, [blockPaletteCategory, normalizedBlockPaletteSearch]);
  const visibleBlockPaletteGroups = useMemo(
    () =>
      ADDABLE_MOTION_BLOCK_CATEGORIES.map((category) => ({
        ...category,
        entries: visibleBlockPaletteEntries.filter(
          (entry) => entry.category === category.id,
        ),
      })).filter((group) => group.entries.length > 0),
    [visibleBlockPaletteEntries],
  );
  const activeTool = inspectorTab === 'motion' ? 'motion' : 'select';

  function persistProject(
    candidate: MotusProject,
    announce = true,
    trackFailure = true,
    mirrorRecovery = false,
  ) {
    try {
      const encoded = JSON.stringify(candidate);
      writeDraftJournal(
        window.localStorage,
        {
          pointer: DRAFT_POINTER_KEY,
          slotA: DRAFT_SLOT_A_KEY,
          slotB: DRAFT_SLOT_B_KEY,
        },
        encoded,
        (value) => Boolean(restoreProject(value)),
        mirrorRecovery,
      );
      setSaveFailed(false);
      if (announce) setNotice('Saved with recovery');
      return true;
    } catch {
      if (trackFailure) setSaveFailed(true);
      if (announce) setNotice('Save failed — export a backup');
      return false;
    }
  }

  function readSavedDraft() {
    try {
      return readNewestMotusDraft(window.localStorage);
    } catch {
      setSaveFailed(true);
      setNotice('Browser storage unavailable — export a backup');
      return null;
    }
  }

  useEffect(() => {
    return () => {
      if (deletionUndoTimer.current !== null) {
        window.clearTimeout(deletionUndoTimer.current);
      }
      activePointerCleanup.current?.();
    };
  }, []);

  useEffect(() => {
    let active = true;
    const desktopQuery = window.matchMedia('(min-width: 901px)');
    const syncDesktopState = () => {
      if (active) setDesktopPanelsEnabled(desktopQuery.matches);
    };

    queueMicrotask(() => {
      if (!active) return;
      syncDesktopState();
      try {
        const encoded = window.localStorage.getItem(STUDIO_PANEL_LAYOUT_KEY);
        if (encoded) {
          const saved = JSON.parse(encoded) as Partial<StudioPanelLayouts>;
          if (
            isStudioPanelLayout(saved.design) &&
            isStudioPanelLayout(saved.motion)
          ) {
            setStudioPanelLayouts({
              design: { ...saved.design },
              motion: { ...saved.motion },
            });
          }
        }
        const encodedBlockWorkspace = window.localStorage.getItem(
          BLOCK_WORKSPACE_LAYOUT_KEY,
        );
        if (encodedBlockWorkspace) {
          const savedBlockWorkspace = JSON.parse(encodedBlockWorkspace);
          if (isBlockWorkspaceLayout(savedBlockWorkspace)) {
            setBlockWorkspaceLayout({ ...savedBlockWorkspace });
          }
        }
      } catch {
        // A malformed preference should never prevent the editor from opening.
      }
    });
    desktopQuery.addEventListener('change', syncDesktopState);
    return () => {
      active = false;
      desktopQuery.removeEventListener('change', syncDesktopState);
    };
  }, []);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      const restored = readSavedDraft();
      if (restored) {
        resetEditorHistory();
        setProject(restored.project);
        setIsDirty(false);
        setActiveChapterId(restored.project.chapters[0].id);
        setActiveSceneId(restored.project.chapters[0].scenes[0].id);
        setSelectedElementId(
          restored.project.chapters[0].scenes[0].elements.at(-1)?.id ?? '',
        );
        setNotice(
          restored.source === 'legacy'
            ? 'Legacy draft recovered'
            : 'Saved draft recovered',
        );
      }
      setHydrated(true);
    });
    return () => {
      active = false;
    };
  }, [resetEditorHistory, setSelectedElementId]);

  useEffect(() => {
    if (
      !shouldAutosaveDraft({
        hydrated,
        dirty: isDirty,
        externalChange: externalDraftChange,
      })
    )
      return;
    const timer = window.setTimeout(() => {
      if (persistProject(project)) setIsDirty(false);
    }, 180);
    return () => window.clearTimeout(timer);
  }, [externalDraftChange, hydrated, isDirty, project]);

  useEffect(() => {
    if (
      !shouldAutosaveDraft({
        hydrated,
        dirty: isDirty,
        externalChange: externalDraftChange,
      })
    )
      return;
    const flush = () => {
      if (persistProject(project, false)) setIsDirty(false);
    };
    const flushWhenHidden = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', flushWhenHidden);
    return () => {
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', flushWhenHidden);
    };
  }, [externalDraftChange, hydrated, isDirty, project]);

  useEffect(() => {
    const action = getDraftExitAction({
      hydrated,
      dirty: isDirty,
      externalChange: externalDraftChange,
    });
    if (action === 'none') return;

    const protectDraftBeforeExit = (event: BeforeUnloadEvent) => {
      if (action === 'flush' && persistProject(project, false)) {
        setIsDirty(false);
        return;
      }
      event.preventDefault();
    };
    window.addEventListener('beforeunload', protectDraftBeforeExit);
    return () =>
      window.removeEventListener('beforeunload', protectDraftBeforeExit);
  }, [externalDraftChange, hydrated, isDirty, project]);

  useEffect(() => {
    if (!hydrated) return;
    const handleStorage = (event: StorageEvent) => {
      if (
        event.storageArea !== window.localStorage ||
        event.key !== DRAFT_POINTER_KEY
      ) {
        return;
      }
      if (!isDirty) {
        const saved = readSavedDraft();
        if (saved) {
          resetTransientCanvasState();
          const selection = resolveEditorSelection(
            saved.project,
            activeChapterId,
            activeSceneId,
            selectedElementId,
          );
          setActiveChapterId(selection.chapterId);
          setActiveSceneId(selection.sceneId);
          setSelectedElementId(selection.elementId);
          clearDeletionUndo();
          resetEditorHistory();
          setProject(saved.project);
          setIsDirty(false);
          setSaveFailed(false);
          setExternalDraftChange(false);
          setConflictOpen(false);
          setNotice('Draft updated from another tab · undo history reset');
        }
        return;
      }
      setExternalDraftChange(true);
      setPendingProjectImport(null);
      setPendingRevisionRemoval(null);
      setConflictOpen(true);
      setNotice('Autosave paused · draft changed in another tab');
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [
    activeChapterId,
    activeSceneId,
    clearDeletionUndo,
    hydrated,
    isDirty,
    resetEditorHistory,
    resetTransientCanvasState,
    selectedElementId,
    setSelectedElementId,
  ]);

  const commitProject = (
    mutate: (draft: MotusProject) => void,
    transactionKey: string | null = null,
  ) => {
    activePointerCleanup.current?.();
    clearDeletionUndo();
    setIsDirty(true);
    setCanUndo(true);
    setCanRedo(false);
    const history = recordProjectHistory(
      {
        undoStack: undoStack.current,
        transactionKey: historyTransaction.current,
      },
      project,
      {
        chapterId: activeChapter.id,
        sceneId: activeScene.id,
        elementId: selectedElementId,
      },
      transactionKey,
    );
    undoStack.current = history.undoStack;
    historyTransaction.current = history.transactionKey;
    redoStack.current = [];
    setProject((current) => {
      const next = cloneProject(current);
      mutate(next);
      next.updatedAt = new Date().toISOString();
      return next;
    });
  };

  const updateElement = (
    elementId: string,
    mutate: (element: MotusElement) => void,
    transactionKey: string | null = null,
  ) => {
    commitProject((draft) => {
      const element = findElement(draft, activeScene.id, elementId);
      if (element) {
        mutate(element);
        Object.assign(element, constrainElementToCanvas(element));
      }
    }, transactionKey);
  };

  const commitProjectWithStoragePreflight = (
    mutate: (draft: MotusProject) => void,
    failureMessage: string,
  ) => {
    activePointerCleanup.current?.();
    const candidate = cloneProject(project);
    mutate(candidate);
    candidate.updatedAt = nowIso();
    if (!persistProject(candidate, false, false, true)) {
      const megabytes = (getProjectStorageBytes(candidate) / 1_000_000).toFixed(
        1,
      );
      setNotice(
        `${failureMessage} · ${megabytes} MB draft · download a backup`,
      );
      return false;
    }
    clearDeletionUndo();
    const history = recordProjectHistory(
      {
        undoStack: undoStack.current,
        transactionKey: historyTransaction.current,
      },
      project,
      {
        chapterId: activeChapter.id,
        sceneId: activeScene.id,
        elementId: selectedElementId,
      },
      null,
    );
    undoStack.current = history.undoStack;
    historyTransaction.current = history.transactionKey;
    redoStack.current = [];
    setCanUndo(true);
    setCanRedo(false);
    setProject(candidate);
    setIsDirty(false);
    return true;
  };

  const endHistoryTransaction = () => {
    historyTransaction.current = null;
  };

  const beginTextEditing = (elementId: string) => {
    const element = findElement(project, activeScene.id, elementId);
    if (
      !element ||
      element.locked ||
      (element.type !== 'text' && element.type !== 'speech')
    ) {
      return;
    }
    activePointerCleanup.current?.();
    endHistoryTransaction();
    setSelectedElementId(elementId);
    setEditingTextElementId(elementId);
    setNotice(`Editing ${element.name}`);
  };

  const changeTextOnCanvas = (elementId: string, value: string) => {
    updateElement(
      elementId,
      (element) => {
        element.text = value.slice(0, MAX_ELEMENT_TEXT_LENGTH);
      },
      `element:${elementId}:text`,
    );
  };

  const finishTextEditing = (elementId: string, restoreFocus: boolean) => {
    setEditingTextElementId((current) =>
      current === elementId ? null : current,
    );
    endHistoryTransaction();
    setNotice('Text updated');
    if (restoreFocus) focusEditorTarget(activeScene.id, elementId);
  };

  const reconcileSelection = (candidate: MotusProject) => {
    resetTransientCanvasState();
    const selection = resolveEditorSelection(
      candidate,
      activeChapterId,
      activeSceneId,
      selectedElementId,
    );
    setActiveChapterId(selection.chapterId);
    setActiveSceneId(selection.sceneId);
    setSelectedElementId(selection.elementId);
  };

  const restoreHistorySelection = (
    candidate: MotusProject,
    chapterId: string,
    sceneId: string,
    elementId: string,
  ) => {
    resetTransientCanvasState();
    const selection = resolveEditorSelection(
      candidate,
      chapterId,
      sceneId,
      elementId,
    );
    const scene = findProjectScene(candidate, selection.sceneId)?.scene;
    const preservedSelection = selectedElementIds.filter((id) =>
      scene?.elements.some((element) => element.id === id),
    );
    setActiveChapterId(selection.chapterId);
    setActiveSceneId(selection.sceneId);
    if (preservedSelection.length > 1) {
      setSelectedElementIds(preservedSelection);
      setPrimarySelectedElementId(
        preservedSelection.includes(selection.elementId)
          ? selection.elementId
          : preservedSelection.at(-1)!,
      );
      return;
    }
    setSelectedElementId(selection.elementId);
  };

  const undo = () => {
    activePointerCleanup.current?.();
    clearDeletionUndo();
    endHistoryTransaction();
    const previous = undoStack.current.pop();
    if (!previous) return;
    redoStack.current = trimProjectHistory([
      ...redoStack.current,
      createProjectHistoryEntry(project, {
        chapterId: activeChapter.id,
        sceneId: activeScene.id,
        elementId: selectedElementId,
      }),
    ]);
    setCanUndo(undoStack.current.length > 0);
    setCanRedo(true);
    setIsDirty(true);
    restoreHistorySelection(
      previous.project,
      previous.selection.chapterId,
      previous.selection.sceneId,
      previous.selection.elementId,
    );
    setProject(previous.project);
    setNotice('Undid change');
  };

  const redo = () => {
    activePointerCleanup.current?.();
    clearDeletionUndo();
    endHistoryTransaction();
    const next = redoStack.current.pop();
    if (!next) return;
    undoStack.current = trimProjectHistory([
      ...undoStack.current,
      createProjectHistoryEntry(project, {
        chapterId: activeChapter.id,
        sceneId: activeScene.id,
        elementId: selectedElementId,
      }),
    ]);
    setCanUndo(true);
    setCanRedo(redoStack.current.length > 0);
    setIsDirty(true);
    restoreHistorySelection(
      next.project,
      next.selection.chapterId,
      next.selection.sceneId,
      next.selection.elementId,
    );
    setProject(next.project);
    setNotice('Redid change');
  };

  const undoDeletion = () => {
    if (!deletionUndo) return;
    const recovery = deletionUndo;
    undo();
    setActiveChapterId(recovery.chapterId);
    setActiveSceneId(recovery.sceneId);
    if (recovery.elementIds && recovery.elementIds.length > 1) {
      setSelectedElementIds(recovery.elementIds);
      setPrimarySelectedElementId(recovery.elementId);
    } else {
      setSelectedElementId(recovery.elementId);
    }
    focusEditorTarget(recovery.sceneId, recovery.elementId);
  };

  const addElement = (
    type: ElementType,
    overrides: Partial<MotusElement> = {},
    requireStoragePreflight = false,
  ) => {
    if (!canAddElementToScene(activeScene)) {
      setNotice(`This scene has reached the ${MAX_SCENE_ELEMENTS}-layer limit`);
      return false;
    }
    const index = activeScene.elements.length + 1;
    const element = createElement(type, index, overrides);
    const addToDraft = (draft: MotusProject) => {
      findProjectScene(draft, activeScene.id)?.scene.elements.push(element);
    };
    if (requireStoragePreflight) {
      if (
        !commitProjectWithStoragePreflight(
          addToDraft,
          'Image cannot fit in device storage',
        )
      ) {
        return false;
      }
    } else {
      commitProject(addToDraft);
    }
    setSelectedElementId(element.id);
    setInspectorTab('design');
    setNotice(`${element.name} added`);
    focusEditorTarget(activeScene.id, element.id);
    return true;
  };

  const deleteElement = (
    elementId: string,
    action: 'delete' | 'cut' = 'delete',
  ) => {
    const deletedElement = findElement(project, activeScene.id, elementId);
    if (!deletedElement) {
      setSelectedElementId('');
      setNotice('Layer is no longer available');
      return;
    }
    const nextSelectedElementId = resolveSelectionAfterElementDeletion(
      activeScene.elements,
      elementId,
    );
    commitProject((draft) => {
      const scene = findProjectScene(draft, activeScene.id)?.scene;
      if (!scene) return;
      scene.elements = scene.elements.filter(
        (element) => element.id !== elementId,
      );
    });
    setSelectedElementId(nextSelectedElementId);
    setNotice(
      action === 'cut'
        ? `${deletedElement.name} cut · paste to move it`
        : 'Layer deleted',
    );
    showDeletionUndo({
      message: `${deletedElement.name} ${action === 'cut' ? 'cut' : 'deleted'}`,
      chapterId: activeChapter.id,
      sceneId: activeScene.id,
      elementId,
    });
    focusEditorTarget(activeScene.id, nextSelectedElementId);
  };

  const deleteSelection = (action: 'delete' | 'cut' = 'delete') => {
    if (selectedElements.length < 2) {
      if (selectedElementId) deleteElement(selectedElementId, action);
      return;
    }
    const deletedIds = selectedElements.map((element) => element.id);
    const deletedIdSet = new Set(deletedIds);
    const remainingElements = activeScene.elements.filter(
      (element) => !deletedIdSet.has(element.id),
    );
    const nextSelectedElementId = remainingElements.at(-1)?.id ?? '';
    const primaryElementId = selectedElementId || deletedIds.at(-1)!;
    commitProject((draft) => {
      const scene = findProjectScene(draft, activeScene.id)?.scene;
      if (!scene) return;
      scene.elements = scene.elements.filter(
        (element) => !deletedIdSet.has(element.id),
      );
    });
    setSelectedElementId(nextSelectedElementId);
    setNotice(
      action === 'cut'
        ? `${deletedIds.length} layers cut · paste to move them`
        : `${deletedIds.length} layers deleted`,
    );
    showDeletionUndo({
      message: `${deletedIds.length} layers ${action === 'cut' ? 'cut' : 'deleted'}`,
      chapterId: activeChapter.id,
      sceneId: activeScene.id,
      elementId: primaryElementId,
      elementIds: deletedIds,
    });
    focusEditorTarget(activeScene.id, nextSelectedElementId);
  };

  const moveLayer = (elementId: string, direction: -1 | 1) => {
    commitProject((draft) => {
      const elements = findProjectScene(draft, activeScene.id)?.scene.elements;
      if (!elements) return;
      const index = elements.findIndex((element) => element.id === elementId);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= elements.length) return;
      [elements[index], elements[target]] = [elements[target], elements[index]];
    });
  };

  const nudgeElement = (
    elementId: string,
    key: string,
    accelerated: boolean,
  ) => {
    const delta = getKeyboardNudgeDelta(key, accelerated);
    const element = findElement(project, activeScene.id, elementId);
    if (!delta || !element) return;
    if (
      selectedElements.length > 1 &&
      selectedElementIdSet.has(elementId) &&
      unlockedSelectedElementIds.length > 0
    ) {
      const selectionIds = [...unlockedSelectedElementIds];
      commitProject(
        (draft) => {
          const scene = findProjectScene(draft, activeScene.id)?.scene;
          if (!scene) return;
          scene.elements = translateSelectedElements(
            scene.elements,
            selectionIds,
            delta.x,
            delta.y,
          );
        },
        `selection:${[...selectionIds].sort().join(',')}:keyboard-position`,
      );
      setNotice(
        `${selectionIds.length} unlocked ${selectionIds.length === 1 ? 'layer' : 'layers'} moved${accelerated ? ' 10 px' : ' 1 px'}`,
      );
      return;
    }
    if (element.locked) {
      setNotice(`Unlock ${element.name} to move it`);
      return;
    }
    updateElement(
      elementId,
      (item) => {
        Object.assign(
          item,
          transformElementByPointer(item, 'move', delta.x, delta.y),
        );
      },
      `element:${elementId}:keyboard-position`,
    );
    setNotice(`${element.name} moved${accelerated ? ' 10 px' : ' 1 px'}`);
  };

  const alignSelection = (alignment: ElementAlignment) => {
    if (unlockedSelectedElementIds.length < 2) {
      setNotice('Select at least two unlocked layers to align them');
      return;
    }
    const nextElements = alignSelectedElements(
      activeScene.elements,
      unlockedSelectedElementIds,
      alignment,
    );
    if (
      nextElements.every(
        (element, index) => element === activeScene.elements[index],
      )
    ) {
      setNotice(`Layers are already aligned ${alignment}`);
      return;
    }
    endHistoryTransaction();
    commitProject((draft) => {
      const scene = findProjectScene(draft, activeScene.id)?.scene;
      if (!scene) return;
      scene.elements = alignSelectedElements(
        scene.elements,
        unlockedSelectedElementIds,
        alignment,
      );
    });
    setNotice(
      `${unlockedSelectedElementIds.length} layers aligned ${alignment}`,
    );
  };

  const distributeSelection = (axis: ElementDistributionAxis) => {
    if (unlockedSelectedElementIds.length < 3) {
      setNotice('Select at least three unlocked layers to distribute them');
      return;
    }
    const nextElements = distributeSelectedElements(
      activeScene.elements,
      unlockedSelectedElementIds,
      axis,
    );
    if (
      nextElements.every(
        (element, index) => element === activeScene.elements[index],
      )
    ) {
      setNotice(
        `Spacing unchanged · layers are already even or need more ${axis} room`,
      );
      return;
    }
    endHistoryTransaction();
    commitProject((draft) => {
      const scene = findProjectScene(draft, activeScene.id)?.scene;
      if (!scene) return;
      scene.elements = distributeSelectedElements(
        scene.elements,
        unlockedSelectedElementIds,
        axis,
      );
    });
    setNotice(
      `${unlockedSelectedElementIds.length} layers distributed ${axis}`,
    );
  };

  const moveScene = (direction: -1 | 1) => {
    const targetIndex = sceneIndex + direction;
    if (targetIndex < 0 || targetIndex >= activeChapter.scenes.length) {
      setNotice('Scene is already at the edge');
      return;
    }
    commitProject((draft) => {
      const chapter = draft.chapters.find(
        (item) => item.id === activeChapter.id,
      );
      if (chapter) {
        chapter.scenes = reorderScenes(
          chapter.scenes,
          activeScene.id,
          direction,
        );
      }
    });
    setNotice(direction < 0 ? 'Scene moved earlier' : 'Scene moved later');
  };

  const selectChapter = (chapter: MotusChapter) => {
    resetTransientCanvasState();
    endHistoryTransaction();
    const firstScene = chapter.scenes[0];
    setActiveChapterId(chapter.id);
    setActiveSceneId(firstScene.id);
    setSelectedElementId(firstScene.elements.at(-1)?.id ?? '');
    setNotice(`${chapter.title} selected`);
  };

  const addChapter = () => {
    if (!canAddChapterToProject(project)) {
      setNotice(
        project.chapters.length >= MAX_PROJECT_CHAPTERS
          ? `This work has reached the ${MAX_PROJECT_CHAPTERS}-chapter limit`
          : `This work has reached the ${MAX_PROJECT_SCENES}-scene limit`,
      );
      return;
    }
    resetTransientCanvasState();
    endHistoryTransaction();
    const id = uniqueId('chapter');
    const sceneId = uniqueId('scene');
    const chapter = createBlankChapter({
      id,
      sceneId,
      title: `Chapter ${project.chapters.length + 1}`,
    });
    commitProject((draft) => draft.chapters.push(chapter));
    setActiveChapterId(id);
    setActiveSceneId(sceneId);
    setSelectedElementId('');
    setNotice(`${chapter.title} added`);
    window.requestAnimationFrame(() => {
      chapterButtonRefs.current.get(id)?.focus();
    });
  };

  const moveChapter = (direction: -1 | 1) => {
    const targetIndex = chapterIndex + direction;
    if (targetIndex < 0 || targetIndex >= project.chapters.length) {
      setNotice('Chapter is already at the edge');
      return;
    }
    commitProject((draft) => {
      draft.chapters = reorderChapters(
        draft.chapters,
        activeChapter.id,
        direction,
      );
    });
    setNotice(direction < 0 ? 'Chapter moved earlier' : 'Chapter moved later');
  };

  const deleteChapter = () => {
    if (project.chapters.length === 1) {
      setNotice('A work needs at least one chapter');
      return;
    }
    resetTransientCanvasState();
    endHistoryTransaction();
    const nextChapter =
      project.chapters[chapterIndex === 0 ? 1 : chapterIndex - 1];
    const nextScene = nextChapter.scenes[0];
    commitProject((draft) => {
      draft.chapters = draft.chapters.filter(
        (chapter) => chapter.id !== activeChapter.id,
      );
      draft.coverSceneId = resolveProjectCoverSceneId(
        draft,
        draft.coverSceneId,
      );
    });
    setActiveChapterId(nextChapter.id);
    setActiveSceneId(nextScene.id);
    const nextElementId = nextScene.elements.at(-1)?.id ?? '';
    setSelectedElementId(nextElementId);
    showDeletionUndo({
      message: `${activeChapter.title} deleted`,
      chapterId: activeChapter.id,
      sceneId: activeScene.id,
      elementId: selectedElementId,
    });
    setNotice(`${activeChapter.title} deleted`);
    focusEditorTarget(nextScene.id, nextElementId);
  };

  const addMotionBlock = (
    kind: MotionBlockKind,
    beforeBlockId: string | null = null,
    parentBlockId: string | null = motionInsertionParentId,
  ) => {
    if (!selectedElement) {
      setNotice('Select a layer before adding an animation block');
      return;
    }
    if (isMotionEventBlockKind(kind)) {
      setNotice('Choose the trigger from the fixed event block');
      return;
    }
    if (countMotionBlocks(selectedElement.motion.blocks) >= MAX_MOTION_BLOCKS) {
      setNotice(
        `A layer can contain up to ${MAX_MOTION_BLOCKS} animation blocks`,
      );
      return;
    }
    const block = createMotionBlock(kind, uniqueId(`block-${kind}`));
    const requestedParent = parentBlockId
      ? findMotionBlock(selectedElement.motion.blocks, parentBlockId)
      : null;
    if (parentBlockId && !requestedParent) {
      setMotionInsertionParentId(null);
      setNotice('That control block is no longer available');
      return;
    }
    if (
      requestedParent &&
      (!isMotionContainerBlockKind(requestedParent.kind) ||
        (requestedParent.kind === 'parallel' &&
          (!isParallelMotionBlockKind(kind) ||
            requestedParent.children.some((child) => child.kind === kind) ||
            requestedParent.children.length >= MAX_PARALLEL_MOTION_BLOCKS)))
    ) {
      setNotice(
        requestedParent.kind === 'parallel'
          ? 'Run together accepts one Move, Rotate, Scale, Opacity, Blur, or Reveal block per channel'
          : 'Only Repeat and Run together can contain blocks',
      );
      return;
    }
    const candidateBlocks = structuredClone(selectedElement.motion.blocks);
    if (parentBlockId) {
      const parentLocation = findMotionBlockLocation(
        candidateBlocks,
        parentBlockId,
      );
      const parent = parentLocation?.block;
      if (
        !parentLocation ||
        !parent ||
        !isMotionContainerBlockKind(parent.kind)
      ) {
        setMotionInsertionParentId(null);
        setNotice('That control block is no longer available');
        return;
      }
      if (parentLocation.depth >= MAX_MOTION_NESTING_DEPTH) {
        setNotice(
          `Control blocks can be nested ${MAX_MOTION_NESTING_DEPTH} levels deep`,
        );
        return;
      }
      if (parent.kind === 'parallel') {
        const sharedDuration =
          parent.children[0]?.durationMs ??
          normalizeMotionBlockNumericField(
            parent,
            'durationMs',
            parent.durationMs,
          );
        const sharedEasing = parent.children[0]?.easing ?? parent.easing;
        parent.durationMs = sharedDuration;
        parent.easing = sharedEasing;
        block.durationMs = sharedDuration;
        block.easing = sharedEasing;
      }
      parent.children.push(block);
    } else {
      const insertionIndex = beforeBlockId
        ? candidateBlocks.findIndex(
            (candidate) => candidate.id === beforeBlockId,
          )
        : candidateBlocks.length;
      if (insertionIndex <= 0) {
        setNotice('That block insertion point is no longer available');
        return;
      }
      candidateBlocks.splice(insertionIndex, 0, block);
    }
    const runtimeIssue = getBlockingMotionRuntimeIssue(
      selectedElement.motion.blocks,
      candidateBlocks,
    );
    if (runtimeIssue) {
      setNotice(describeMotionRuntimeIssue(runtimeIssue));
      return;
    }
    updateElement(selectedElement.id, (item) => {
      item.motion.blocks = candidateBlocks;
    });
    setMotionInsertionParentId(null);
    setNotice(
      requestedParent
        ? `${block.label} added inside ${requestedParent.label}`
        : beforeBlockId
          ? `${block.label} block inserted into the program`
          : `${block.label} block added`,
    );
    setExpandedMotionBlockId(kind === 'bounce' ? block.id : null);
  };

  const moveRootMotionBlockInside = (blockId: string, containerId: string) => {
    if (!selectedElement) return;
    const candidateBlocks = structuredClone(selectedElement.motion.blocks);
    const sourceLocation = findMotionBlockLocation(candidateBlocks, blockId);
    const containerLocation = findMotionBlockLocation(
      candidateBlocks,
      containerId,
    );
    if (
      !sourceLocation ||
      sourceLocation.parent ||
      sourceLocation.index <= 0 ||
      !containerLocation ||
      !isMotionContainerBlockKind(containerLocation.block.kind) ||
      sourceLocation.block.id === containerLocation.block.id ||
      findMotionBlock([sourceLocation.block], containerId)
    ) {
      setNotice('That block cannot be moved into this container');
      return;
    }
    if (
      containerLocation.depth +
        1 +
        getMotionSubtreeDepth(sourceLocation.block) >
      MAX_MOTION_NESTING_DEPTH
    ) {
      setNotice(
        `Control blocks can be nested ${MAX_MOTION_NESTING_DEPTH} levels deep`,
      );
      return;
    }
    if (
      containerLocation.block.kind === 'parallel' &&
      (!isParallelMotionBlockKind(sourceLocation.block.kind) ||
        containerLocation.block.children.some(
          (child) => child.kind === sourceLocation.block.kind,
        ) ||
        containerLocation.block.children.length >= MAX_PARALLEL_MOTION_BLOCKS)
    ) {
      setNotice('Run together only accepts one compatible block per channel');
      return;
    }
    const [movedBlock] = sourceLocation.siblings.splice(
      sourceLocation.index,
      1,
    );
    if (!movedBlock) return;
    if (containerLocation.block.kind === 'parallel') {
      const sharedDuration =
        containerLocation.block.children[0]?.durationMs ??
        normalizeMotionBlockNumericField(
          containerLocation.block,
          'durationMs',
          containerLocation.block.durationMs,
        );
      const sharedEasing =
        containerLocation.block.children[0]?.easing ??
        containerLocation.block.easing;
      containerLocation.block.durationMs = sharedDuration;
      containerLocation.block.easing = sharedEasing;
      movedBlock.durationMs = sharedDuration;
      movedBlock.easing = sharedEasing;
    }
    containerLocation.block.children.push(movedBlock);
    const runtimeIssue = getBlockingMotionRuntimeIssue(
      selectedElement.motion.blocks,
      candidateBlocks,
    );
    if (runtimeIssue) {
      setNotice(describeMotionRuntimeIssue(runtimeIssue));
      return;
    }
    updateElement(selectedElement.id, (item) => {
      item.motion.blocks = candidateBlocks;
    });
    setNotice(
      `${movedBlock.label} moved inside ${containerLocation.block.label}`,
    );
  };

  const startMotionDrag = (event: DragStartEvent) => {
    activePointerCleanup.current?.();
    endHistoryTransaction();
    const drag = readMotionDragData(event.active.data.current);
    setActiveMotionDrag(drag);
    if (drag) setNotice(`${drag.label} picked up`);
  };

  const cancelMotionDrag = (_event?: DragCancelEvent) => {
    setActiveMotionDrag(null);
    setNotice('Block move cancelled');
  };

  const finishMotionDrag = (event: DragEndEvent) => {
    const drag = readMotionDragData(event.active.data.current);
    const overData = event.over?.data.current;
    const overSource =
      overData && typeof overData.source === 'string' ? overData.source : null;
    const overBlockId =
      overSource === 'program' && typeof overData?.blockId === 'string'
        ? overData.blockId
        : null;
    const overContainerId =
      overSource === 'motion-container-dropzone' &&
      typeof overData?.containerId === 'string'
        ? overData.containerId
        : null;
    const droppedInProgram =
      event.over?.id === MOTION_PROGRAM_DROP_ID ||
      overSource === 'program' ||
      Boolean(overContainerId);

    setActiveMotionDrag(null);
    if (
      !drag ||
      !selectedElement ||
      drag.elementId !== selectedElement.id ||
      !droppedInProgram
    ) {
      setNotice(
        drag ? `${drag.label} returned to its previous position` : 'Ready',
      );
      return;
    }

    if (drag.source === 'palette' && drag.kind) {
      addMotionBlock(drag.kind, overBlockId, overContainerId);
      return;
    }

    if (drag.source !== 'program' || !drag.blockId) return;
    if (overContainerId) {
      moveRootMotionBlockInside(drag.blockId, overContainerId);
      return;
    }
    const sourceIndex = selectedElement.motion.blocks.findIndex(
      (block) => block.id === drag.blockId,
    );
    const overIndex = overBlockId
      ? selectedElement.motion.blocks.findIndex(
          (block) => block.id === overBlockId,
        )
      : selectedElement.motion.blocks.length - 1;
    if (sourceIndex <= 0 || overIndex <= 0 || sourceIndex === overIndex) {
      setNotice(`${drag.label} stayed in position`);
      return;
    }

    updateElement(selectedElement.id, (item) => {
      const currentIndex = item.motion.blocks.findIndex(
        (block) => block.id === drag.blockId,
      );
      const targetIndex = overBlockId
        ? item.motion.blocks.findIndex((block) => block.id === overBlockId)
        : item.motion.blocks.length - 1;
      if (currentIndex <= 0 || targetIndex <= 0) return;
      const beforeActionId =
        overBlockId && currentIndex < targetIndex
          ? (item.motion.blocks[targetIndex + 1]?.id ?? null)
          : overBlockId;
      item.motion.blocks = reorderMotionActionBefore(
        item.motion.blocks,
        drag.blockId!,
        beforeActionId,
      );
    });
    setNotice(`${drag.label} moved to step ${overIndex}`);
  };

  const updateMotionBlock = (
    blockId: string,
    mutate: (block: MotionBlock) => void,
    transactionKey: string | null = null,
  ) => {
    if (!selectedElement) return false;
    const candidateBlocks = structuredClone(selectedElement.motion.blocks);
    const candidateBlock = findMotionBlock(candidateBlocks, blockId);
    if (!candidateBlock) return false;
    mutate(candidateBlock);
    const runtimeIssue = getBlockingMotionRuntimeIssue(
      selectedElement.motion.blocks,
      candidateBlocks,
    );
    if (runtimeIssue) {
      setNotice(describeMotionRuntimeIssue(runtimeIssue));
      return false;
    }
    updateElement(
      selectedElement.id,
      (item) => {
        item.motion.blocks = candidateBlocks;
      },
      transactionKey,
    );
    return true;
  };

  const changeMotionEvent = (eventKind: MotionEventBlockKind) => {
    if (!selectedElement) return;
    const catalogEntry = MOTION_BLOCK_CATALOG.find(
      (entry) => entry.kind === eventKind,
    );
    updateElement(selectedElement.id, (item) => {
      item.motion.blocks = replaceMotionEvent(item.motion.blocks, eventKind);
      item.motion.event = eventKind;
    });
    setNotice(`${catalogEntry?.label ?? 'Event'} trigger selected`);
  };

  const changeMotionEventSource = (sourceElementId: string) => {
    if (!selectedElement) return;
    updateElement(selectedElement.id, (item) => {
      const eventBlock = item.motion.blocks[0];
      if (eventBlock?.kind !== 'animation-finish') return;
      eventBlock.sourceElementId = sourceElementId || null;
    });
    const source = activeScene.elements.find(
      (element) => element.id === sourceElementId,
    );
    setNotice(
      source
        ? `${selectedElement.name} now starts after ${source.name}`
        : 'Choose a source layer for this trigger',
    );
  };

  const duplicateMotionBlock = (blockId: string) => {
    if (!selectedElement) return;
    const source = findMotionBlock(selectedElement.motion.blocks, blockId);
    if (!source || isMotionEventBlockKind(source.kind)) return;
    const subtreeSize = countMotionBlocks([source]);
    if (
      countMotionBlocks(selectedElement.motion.blocks) + subtreeSize >
      MAX_MOTION_BLOCKS
    ) {
      setNotice(
        `A layer can contain up to ${MAX_MOTION_BLOCKS} animation blocks`,
      );
      return;
    }
    const candidateBlocks = structuredClone(selectedElement.motion.blocks);
    const location = findMotionBlockLocation(candidateBlocks, blockId);
    if (
      !location ||
      isMotionEventBlockKind(location.block.kind) ||
      location.parent?.kind === 'parallel'
    ) {
      return;
    }
    location.siblings.splice(
      location.index + 1,
      0,
      cloneMotionBlockSubtree(location.block),
    );
    const runtimeIssue = getBlockingMotionRuntimeIssue(
      selectedElement.motion.blocks,
      candidateBlocks,
    );
    if (runtimeIssue) {
      setNotice(describeMotionRuntimeIssue(runtimeIssue));
      return;
    }
    updateElement(selectedElement.id, (item) => {
      item.motion.blocks = candidateBlocks;
    });
    setNotice('Animation block duplicated');
  };

  const updateBounceJump = (
    blockId: string,
    jumpId: string,
    mutate: (jump: BounceJump) => void,
    transactionKey: string | null = null,
  ) => {
    updateMotionBlock(
      blockId,
      (block) => {
        const jump = block.jumps.find((candidate) => candidate.id === jumpId);
        if (jump) mutate(jump);
      },
      transactionKey,
    );
  };

  const addBounceJump = (blockId: string) => {
    const updated = updateMotionBlock(blockId, (block) => {
      if (block.jumps.length >= MAX_BOUNCE_JUMPS) return;
      block.jumps.push(
        createBounceJump(block.jumps.length, { id: uniqueId('jump') }),
      );
    });
    if (updated) setNotice('Bounce jump added');
  };

  const duplicateBounceJump = (blockId: string, jumpId: string) => {
    const updated = updateMotionBlock(blockId, (block) => {
      if (block.jumps.length >= MAX_BOUNCE_JUMPS) return;
      const index = block.jumps.findIndex((jump) => jump.id === jumpId);
      const source = block.jumps[index];
      if (!source) return;
      block.jumps.splice(index + 1, 0, { ...source, id: uniqueId('jump') });
    });
    if (updated) setNotice('Bounce jump duplicated');
  };

  const moveBounceJump = (
    blockId: string,
    jumpId: string,
    direction: -1 | 1,
  ) => {
    const updated = updateMotionBlock(blockId, (block) => {
      const index = block.jumps.findIndex((jump) => jump.id === jumpId);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= block.jumps.length) return;
      [block.jumps[index], block.jumps[target]] = [
        block.jumps[target],
        block.jumps[index],
      ];
    });
    if (updated) setNotice('Bounce path reordered');
  };

  const removeBounceJump = (blockId: string, jumpId: string) => {
    const updated = updateMotionBlock(blockId, (block) => {
      if (block.jumps.length <= 1) return;
      block.jumps = block.jumps.filter((jump) => jump.id !== jumpId);
    });
    if (updated) setNotice('Bounce jump removed');
  };

  const moveMotionBlock = (blockId: string, direction: -1 | 1) => {
    if (!selectedElement) return;
    updateElement(selectedElement.id, (item) => {
      const siblings = findMotionBlockSiblings(item.motion.blocks, blockId);
      if (!siblings) return;
      const index = siblings.findIndex((block) => block.id === blockId);
      const target = index + direction;
      const fixedEventOffset = isMotionEventBlockKind(siblings[0]?.kind)
        ? 1
        : 0;
      if (
        index < fixedEventOffset ||
        target < fixedEventOffset ||
        target >= siblings.length
      )
        return;
      [siblings[index], siblings[target]] = [siblings[target], siblings[index]];
    });
    setNotice('Animation sequence reordered');
  };

  const removeMotionBlock = (blockId: string) => {
    if (!selectedElement) return;
    const removedBlock = findMotionBlock(
      selectedElement.motion.blocks,
      blockId,
    );
    const removesInsertionTarget = Boolean(
      removedBlock &&
      motionInsertionParentId &&
      findMotionBlock([removedBlock], motionInsertionParentId),
    );
    updateElement(selectedElement.id, (item) => {
      const location = findMotionBlockLocation(item.motion.blocks, blockId);
      if (!location || isMotionEventBlockKind(location.block.kind)) return;
      location.siblings.splice(location.index, 1);
    });
    if (removesInsertionTarget) setMotionInsertionParentId(null);
    setNotice('Animation block removed');
  };

  const chooseMotionInsertion = (containerId: string) => {
    if (!selectedElement) return;
    const location = findMotionBlockLocation(
      selectedElement.motion.blocks,
      containerId,
    );
    if (
      !location ||
      !isMotionContainerBlockKind(location.block.kind) ||
      location.depth >= MAX_MOTION_NESTING_DEPTH
    ) {
      setNotice(
        `Control blocks can be nested ${MAX_MOTION_NESTING_DEPTH} levels deep`,
      );
      return;
    }
    setMotionInsertionParentId(containerId);
    setBlockPaletteCategory(
      location.block.kind === 'parallel' ? 'all' : 'motion',
    );
    setBlockPaletteSearch('');
    setNotice(`Choose a block to add inside ${location.block.label}`);
    window.requestAnimationFrame(() => {
      blockPaletteSearchInput.current?.focus();
    });
  };

  const moveMotionBlockOut = (blockId: string) => {
    if (!selectedElement) return;
    const candidateBlocks = structuredClone(selectedElement.motion.blocks);
    const location = findMotionBlockLocation(candidateBlocks, blockId);
    if (!location?.parent) return;
    const parentLocation = findMotionBlockLocation(
      candidateBlocks,
      location.parent.id,
    );
    if (!parentLocation) return;
    const [block] = location.siblings.splice(location.index, 1);
    if (!block) return;
    parentLocation.siblings.splice(parentLocation.index + 1, 0, block);
    const runtimeIssue = getBlockingMotionRuntimeIssue(
      selectedElement.motion.blocks,
      candidateBlocks,
    );
    if (runtimeIssue) {
      setNotice(describeMotionRuntimeIssue(runtimeIssue));
      return;
    }
    updateElement(selectedElement.id, (item) => {
      item.motion.blocks = candidateBlocks;
    });
    setNotice(`${block.label} moved out one level`);
  };

  const moveNextMotionBlockInside = (containerId: string) => {
    if (!selectedElement) return;
    const candidateBlocks = structuredClone(selectedElement.motion.blocks);
    const location = findMotionBlockLocation(candidateBlocks, containerId);
    if (
      !location ||
      !isMotionContainerBlockKind(location.block.kind) ||
      location.depth >= MAX_MOTION_NESTING_DEPTH
    ) {
      setNotice('No following block can be moved inside');
      return;
    }
    const next = location.siblings[location.index + 1];
    if (!next || isMotionEventBlockKind(next.kind)) {
      setNotice('No following block can be moved inside');
      return;
    }
    if (
      location.depth + 1 + getMotionSubtreeDepth(next) >
      MAX_MOTION_NESTING_DEPTH
    ) {
      setNotice(
        `Control blocks can be nested ${MAX_MOTION_NESTING_DEPTH} levels deep`,
      );
      return;
    }
    if (
      location.block.kind === 'parallel' &&
      (!isParallelMotionBlockKind(next.kind) ||
        location.block.children.some((child) => child.kind === next.kind) ||
        location.block.children.length >= MAX_PARALLEL_MOTION_BLOCKS)
    ) {
      setNotice('Run together only accepts one compatible block per channel');
      return;
    }
    location.siblings.splice(location.index + 1, 1);
    if (location.block.kind === 'parallel') {
      const sharedDuration =
        location.block.children[0]?.durationMs ??
        normalizeMotionBlockNumericField(
          location.block,
          'durationMs',
          location.block.durationMs,
        );
      const sharedEasing =
        location.block.children[0]?.easing ?? location.block.easing;
      location.block.durationMs = sharedDuration;
      location.block.easing = sharedEasing;
      next.durationMs = sharedDuration;
      next.easing = sharedEasing;
    }
    location.block.children.push(next);
    const runtimeIssue = getBlockingMotionRuntimeIssue(
      selectedElement.motion.blocks,
      candidateBlocks,
    );
    if (runtimeIssue) {
      setNotice(describeMotionRuntimeIssue(runtimeIssue));
      return;
    }
    updateElement(selectedElement.id, (item) => {
      item.motion.blocks = candidateBlocks;
    });
    setNotice(`${next.label} moved inside ${location.block.label}`);
  };

  const setParallelMotionTiming = (
    containerId: string,
    field: 'durationMs' | 'easing',
    value: number | Easing,
    transactionKey: string | null = null,
  ) => {
    const updated = updateMotionBlock(
      containerId,
      (container) => {
        if (container.kind !== 'parallel') return;
        if (field === 'durationMs') {
          container.durationMs = normalizeMotionBlockNumericField(
            container,
            'durationMs',
            value,
          );
        } else {
          container.easing = value as Easing;
        }
        for (const child of container.children) {
          if (field === 'durationMs') {
            child.durationMs = normalizeMotionBlockNumericField(
              child,
              'durationMs',
              value,
            );
          } else {
            child.easing = value as Easing;
          }
        }
      },
      transactionKey,
    );
    if (updated) setNotice('Run together timing updated');
  };

  const applyMotionPreset = (presetId: string, mode: 'replace' | 'append') => {
    if (!selectedElement) {
      setCatalogOpen(false);
      setInspectorTab('motion');
      setNotice('Select a layer, then choose a motion preset');
      return;
    }
    const preset = motionPresets.find((candidate) => candidate.id === presetId);
    if (!preset) return;
    const generatedBlocks = preset.blocks.map((source, index) => ({
      ...createMotionBlock(
        source.kind,
        uniqueId(`preset-${source.kind}-${index}`),
      ),
      ...(source.durationMs === undefined
        ? {}
        : { durationMs: source.durationMs }),
      ...(source.x === undefined ? {} : { x: source.x }),
      ...(source.y === undefined ? {} : { y: source.y }),
      ...(source.value === undefined ? {} : { value: source.value }),
      ...(source.secondaryValue === undefined
        ? {}
        : { secondaryValue: source.secondaryValue }),
      ...(source.repetitions === undefined
        ? {}
        : { repetitions: source.repetitions }),
      ...(source.direction === undefined
        ? {}
        : { direction: source.direction }),
      ...(source.jumps === undefined
        ? {}
        : {
            jumps: source.jumps.map((jump) => ({
              ...jump,
              id: uniqueId('jump'),
            })),
          }),
    }));
    const generatedActions = generatedBlocks.filter(
      (block) => !isMotionEventBlockKind(block.kind),
    );
    if (
      mode === 'append' &&
      countMotionBlocks(selectedElement.motion.blocks) +
        generatedActions.length >
        MAX_MOTION_BLOCKS
    ) {
      setNotice('This preset does not fit in the remaining block slots');
      return;
    }
    const candidateBlocks =
      mode === 'replace'
        ? generatedBlocks
        : [...selectedElement.motion.blocks, ...generatedActions];
    const runtimeIssue = getBlockingMotionRuntimeIssue(
      selectedElement.motion.blocks,
      candidateBlocks,
    );
    if (runtimeIssue) {
      setNotice(describeMotionRuntimeIssue(runtimeIssue));
      return;
    }
    updateElement(selectedElement.id, (item) => {
      item.motion.blocks = candidateBlocks;
      if (mode === 'replace') {
        const eventKind = generatedBlocks[0]?.kind;
        if (isMotionEventBlockKind(eventKind)) item.motion.event = eventKind;
      }
    });
    setCatalogOpen(false);
    setInspectorTab('motion');
    setPreviewScope('selected');
    setPreviewRunning(true);
    setMobileStudioPane('stage');
    setCanvasPreviewKey((key) => key + 1);
    setNotice(
      mode === 'replace'
        ? `${preset.name} replaced ${selectedElement.name}’s program`
        : `${preset.name} appended to ${selectedElement.name}`,
    );
  };

  const addSceneFromTemplate = (templateId: string) => {
    if (!canAddSceneToProject(project)) {
      setNotice(`This work has reached the ${MAX_PROJECT_SCENES}-scene limit`);
      return;
    }
    const template = sceneTemplates.find(
      (candidate) => candidate.id === templateId,
    );
    if (!template) return;
    resetTransientCanvasState();
    endHistoryTransaction();
    const id = uniqueId('scene');
    const nextScene: MotusScene = {
      id,
      name: template.name,
      background: template.background,
      elements: [
        createElement('text', 1, {
          id: `${id}-title`,
          name: 'Scene title',
          x: 92,
          y: 138,
          width: 670,
          height: 210,
          fill: '#ffffff',
          text: template.title,
        }),
        createElement('shape', 2, {
          id: `${id}-focus`,
          name: 'Focal accent',
          x: 660,
          y: 565,
          width: template.id === 'impact' ? 240 : 160,
          height: template.id === 'impact' ? 240 : 160,
          fill: template.accent,
        }),
        createElement('speech', 3, {
          id: `${id}-speech`,
          name: 'Speech bubble',
          x: 510,
          y: 1020,
          width: 430,
          height: 180,
          text: template.speech,
        }),
      ],
    };
    commitProject((draft) => {
      draft.chapters
        .find((chapter) => chapter.id === activeChapter.id)
        ?.scenes.push(nextScene);
    });
    setActiveSceneId(id);
    setSelectedElementId(nextScene.elements[0].id);
    setCatalogOpen(false);
    setNotice(`${template.name} scene added`);
    focusEditorTarget(id, nextScene.elements[0].id);
  };

  const runTool = (toolId: string) => {
    if (toolId === 'select') {
      setInspectorTab('design');
      return;
    }
    if (
      ['image', 'text', 'shape', 'speech'].includes(toolId) &&
      !canAddElementToScene(activeScene)
    ) {
      setNotice(`This scene has reached the ${MAX_SCENE_ELEMENTS}-layer limit`);
      return;
    }
    if (toolId === 'image') {
      imageInput.current?.click();
      return;
    }
    if (toolId === 'text') addElement('text');
    if (toolId === 'shape') addElement('shape');
    if (toolId === 'speech') addElement('speech');
    if (toolId === 'motion') setInspectorTab('motion');
    if (toolId === 'catalog') {
      setCatalogTab('templates');
      setCatalogOpen(true);
    }
  };

  const uploadImage = async (file?: File) => {
    if (!file) return;
    if (!canAddElementToScene(activeScene)) {
      setNotice(`This scene has reached the ${MAX_SCENE_ELEMENTS}-layer limit`);
      return;
    }
    const envelopeError = validateImageAsset({
      mime: file.type,
      size: file.size,
    });
    if (envelopeError) {
      setNotice(envelopeError);
      return;
    }

    try {
      const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());
      const detectedMime = detectImageFormat(header);
      if (!detectedMime || detectedMime !== file.type) {
        setNotice('Image contents do not match a valid PNG or WebP');
        return;
      }

      const dimensions = await decodeImageDimensions(file);
      const decodedError = validateImageAsset({
        mime: detectedMime,
        size: file.size,
        ...dimensions,
      });
      if (decodedError) {
        setNotice(decodedError);
        return;
      }

      const src = await readFileAsDataUrl(file);
      const scale = Math.min(420 / dimensions.width, 420 / dimensions.height);
      const added = addElement(
        'image',
        {
          name: file.name,
          src,
          width: Math.max(8, Math.round(dimensions.width * scale)),
          height: Math.max(8, Math.round(dimensions.height * scale)),
          fill: '#ffffff',
        },
        true,
      );
      if (added) {
        setNotice(
          `${file.name} added · ${dimensions.width}×${dimensions.height}`,
        );
      }
    } catch {
      setNotice('Image could not be decoded');
    }
  };

  const addProjectImageAsset = (asset: ProjectImageAsset) => {
    const added = addElement(
      'image',
      {
        name: createCopyName(asset.name, MAX_ELEMENT_NAME_LENGTH),
        src: asset.src,
        width: asset.width,
        height: asset.height,
        fill: '#ffffff',
      },
      true,
    );
    if (!added) return;
    setCatalogOpen(false);
    setNotice(`${asset.name} reused in ${activeScene.name}`);
  };

  const importProject = (file?: File) => {
    if (!file) return;
    if (file.size > MAX_PROJECT_FILE_BYTES) {
      setNotice('Project files must be 12 MB or smaller');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        setNotice('Project could not be read');
        return;
      }
      const result = restoreProjectWithError(reader.result);
      if (!result.project) {
        setNotice(result.error);
        return;
      }
      setPendingProjectImport({
        fileName: file.name,
        project: result.project,
      });
      setNotice('Project ready to import');
    };
    reader.onerror = () => setNotice('Project file could not be read');
    reader.readAsText(file);
  };

  const addElementCopy = (source: MotusElement, successMessage: string) => {
    if (!canAddElementToScene(activeScene)) {
      setNotice(`This scene has reached the ${MAX_SCENE_ELEMENTS}-layer limit`);
      return false;
    }
    const copy = createElementCopy(source, uniqueId(source.type));
    const addCopyToDraft = (draft: MotusProject) => {
      findProjectScene(draft, activeScene.id)?.scene.elements.push(copy);
    };
    if (
      !commitProjectWithStoragePreflight(
        addCopyToDraft,
        'Layer copy cannot fit in device storage',
      )
    ) {
      return false;
    }
    setSelectedElementId(copy.id);
    setNotice(successMessage);
    focusEditorTarget(activeScene.id, copy.id);
    return true;
  };

  const duplicateElement = (elementId: string) => {
    const source = findElement(project, activeScene.id, elementId);
    if (source) addElementCopy(source, 'Layer duplicated');
  };

  const addElementCopies = (
    sources: readonly MotusElement[],
    successMessage: string,
  ) => {
    if (sources.length === 0) return false;
    if (activeScene.elements.length + sources.length > MAX_SCENE_ELEMENTS) {
      setNotice(
        `Not enough layer slots · this scene allows ${MAX_SCENE_ELEMENTS}`,
      );
      return false;
    }
    const copyIds = sources.map((source) => uniqueId(source.type));
    const copiedElementIds = new Map(
      sources.map((source, index) => [source.id, copyIds[index]]),
    );
    const copyOrigins = sources.map((source, index) => {
      const copy = createElementCopy(source, copyIds[index], 0);
      const eventBlock = copy.motion.blocks[0];
      if (
        eventBlock?.kind === 'animation-finish' &&
        eventBlock.sourceElementId
      ) {
        eventBlock.sourceElementId =
          copiedElementIds.get(eventBlock.sourceElementId) ??
          eventBlock.sourceElementId;
      }
      return {
        ...copy,
        locked: false,
      };
    });
    const copies = translateSelectedElements(copyOrigins, copyIds, 28, 28).map(
      (copy, index) => ({
        ...copy,
        locked: sources[index].locked,
      }),
    );
    if (
      !commitProjectWithStoragePreflight((draft) => {
        findProjectScene(draft, activeScene.id)?.scene.elements.push(...copies);
      }, 'Layer copies cannot fit in device storage')
    ) {
      return false;
    }
    setSelectedElementIds(copyIds);
    setPrimarySelectedElementId(copyIds.at(-1)!);
    setEditingTextElementId(null);
    setNotice(successMessage);
    focusEditorTarget(activeScene.id, copyIds.at(-1)!);
    return true;
  };

  const duplicateSelection = () => {
    if (selectedElements.length > 1) {
      addElementCopies(
        selectedElements,
        `${selectedElements.length} layers duplicated`,
      );
      return;
    }
    if (selectedElementId) duplicateElement(selectedElementId);
  };

  const addScene = () => {
    if (!canAddSceneToProject(project)) {
      setNotice(`This work has reached the ${MAX_PROJECT_SCENES}-scene limit`);
      return;
    }
    resetTransientCanvasState();
    endHistoryTransaction();
    const id = uniqueId('scene');
    const nextScene: MotusScene = {
      id,
      name: `Scene ${allScenes.length + 1}`,
      background:
        'linear-gradient(155deg, #28213d 0%, #12131e 54%, #3c3350 100%)',
      elements: [],
    };
    commitProject((draft) => {
      draft.chapters
        .find((chapter) => chapter.id === activeChapter.id)
        ?.scenes.push(nextScene);
    });
    setActiveSceneId(id);
    setSelectedElementId('');
    setNotice('Blank scene added');
    focusEditorTarget(id);
  };

  const duplicateScene = () => {
    if (!canAddSceneToProject(project)) {
      setNotice(`This work has reached the ${MAX_PROJECT_SCENES}-scene limit`);
      return;
    }
    resetTransientCanvasState();
    endHistoryTransaction();
    const copy = structuredClone(activeScene);
    copy.id = uniqueId('scene');
    copy.name = createCopyName(activeScene.name, MAX_SCENE_NAME_LENGTH);
    const duplicatedElementIds = new Map(
      copy.elements.map((element, index) => [
        element.id,
        `${copy.id}-${element.type}-${index}`,
      ]),
    );
    copy.elements = copy.elements.map((element) => {
      const eventBlock = element.motion.blocks[0];
      if (
        eventBlock?.kind === 'animation-finish' &&
        eventBlock.sourceElementId
      ) {
        eventBlock.sourceElementId =
          duplicatedElementIds.get(eventBlock.sourceElementId) ?? null;
      }
      return {
        ...element,
        id: duplicatedElementIds.get(element.id) ?? uniqueId(element.type),
      };
    });
    if (
      !commitProjectWithStoragePreflight((draft) => {
        draft.chapters
          .find((chapter) => chapter.id === activeChapter.id)
          ?.scenes.splice(sceneIndex + 1, 0, copy);
      }, 'Scene copy cannot fit in device storage')
    ) {
      return;
    }
    setActiveSceneId(copy.id);
    const selectedCopyId = copy.elements.at(-1)?.id ?? '';
    setSelectedElementId(selectedCopyId);
    setNotice('Scene duplicated');
    focusEditorTarget(copy.id, selectedCopyId);
  };

  const deleteScene = () => {
    if (activeChapter.scenes.length === 1) {
      setNotice('Each chapter needs at least one scene');
      return;
    }
    resetTransientCanvasState();
    endHistoryTransaction();
    const nextScene =
      activeChapter.scenes[sceneIndex === 0 ? 1 : sceneIndex - 1];
    commitProject((draft) => {
      const chapter = draft.chapters.find(
        (item) => item.id === activeChapter.id,
      );
      if (!chapter) return;
      chapter.scenes = chapter.scenes.filter(
        (scene) => scene.id !== activeScene.id,
      );
      draft.coverSceneId = resolveProjectCoverSceneId(
        draft,
        draft.coverSceneId,
      );
    });
    setActiveSceneId(nextScene.id);
    const nextSelectedElementId = nextScene.elements.at(-1)?.id ?? '';
    setSelectedElementId(nextSelectedElementId);
    setNotice('Scene deleted');
    showDeletionUndo({
      message: `${activeScene.name} deleted`,
      chapterId: activeChapter.id,
      sceneId: activeScene.id,
      elementId: selectedElementId,
    });
    focusEditorTarget(nextScene.id, nextSelectedElementId);
  };

  const downloadProject = (candidate: MotusProject) => {
    const blob = new Blob([JSON.stringify(candidate, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = createProjectBackupFileName(candidate);
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const confirmProjectImport = () => {
    if (!pendingProjectImport) return;
    if (externalDraftChange) {
      setPendingProjectImport(null);
      setConflictOpen(true);
      return;
    }

    resetTransientCanvasState();
    downloadProject(project);
    const restored = cloneProject(pendingProjectImport.project);
    restored.updatedAt = nowIso();
    if (!persistProject(restored, false, false, true)) {
      setPendingProjectImport(null);
      setNotice(
        'Imported project could not be saved — current draft kept and backed up',
      );
      return;
    }

    undoStack.current = [
      createProjectHistoryEntry(project, {
        chapterId: activeChapter.id,
        sceneId: activeScene.id,
        elementId: selectedElementId,
      }),
    ];
    redoStack.current = [];
    endHistoryTransaction();
    setCanUndo(true);
    setCanRedo(false);
    clearDeletionUndo();
    setProject(restored);
    setIsDirty(false);
    setActiveChapterId(restored.chapters[0].id);
    setActiveSceneId(restored.chapters[0].scenes[0].id);
    setSelectedElementId(
      restored.chapters[0].scenes[0].elements.at(-1)?.id ?? '',
    );
    setPendingProjectImport(null);
    setNotice('Project imported · previous draft downloaded');
  };

  const confirmRevisionRemoval = () => {
    if (!pendingRevisionRemoval) return;
    if (externalDraftChange) {
      setPendingRevisionRemoval(null);
      setConflictOpen(true);
      return;
    }

    const candidate = removePublicationRevision(
      project,
      pendingRevisionRemoval.id,
    );
    if (!candidate) {
      setPendingRevisionRemoval(null);
      setNotice('The current published revision cannot be removed');
      return;
    }

    downloadProject(project);
    const removedRevision = pendingRevisionRemoval.revision;
    if (
      !commitProjectWithStoragePreflight((draft) => {
        draft.publications = candidate.publications;
      }, 'Revision removal could not be saved')
    ) {
      setPendingRevisionRemoval(null);
      setNotice('Revision was not removed · project backup downloaded');
      return;
    }

    setPendingRevisionRemoval(null);
    setPublishOpen(true);
    setNotice(
      `Revision ${removedRevision} removed · project backup downloaded`,
    );
  };

  const exportProject = () => {
    activePointerCleanup.current?.();
    endHistoryTransaction();
    downloadProject(project);
    setNotice('Project exported');
  };

  const loadOtherTabDraft = () => {
    const saved = readSavedDraft();
    if (!saved) {
      setNotice('The other tab’s draft could not be recovered');
      return;
    }
    downloadProject(project);
    const resolved = resolveDraftConflict(project, saved.project, 'load-saved');
    resetEditorHistory();
    clearDeletionUndo();
    reconcileSelection(resolved);
    setProject(resolved);
    setIsDirty(false);
    setSaveFailed(false);
    setExternalDraftChange(false);
    setConflictOpen(false);
    setNotice(
      'Other tab’s draft loaded · backup downloaded · undo history reset',
    );
  };

  const keepCurrentDraft = () => {
    const resolved = resolveDraftConflict(
      project,
      project,
      'keep-current',
      nowIso(),
    );
    if (!persistProject(resolved, false)) {
      setNotice('This draft could not be saved — export a backup');
      return;
    }
    setProject(resolved);
    setIsDirty(false);
    setExternalDraftChange(false);
    setConflictOpen(false);
    setNotice('This tab’s draft kept');
  };

  const startNewWork = () => {
    resetTransientCanvasState();
    downloadProject(project);
    const blank = createBlankProject(uniqueId('work'), nowIso());
    if (!persistProject(blank, false, false)) {
      setNotice('New work could not be saved — backup downloaded');
      return;
    }

    undoStack.current = [
      createProjectHistoryEntry(project, {
        chapterId: activeChapter.id,
        sceneId: activeScene.id,
        elementId: selectedElementId,
      }),
    ];
    redoStack.current = [];
    endHistoryTransaction();
    setCanUndo(true);
    setCanRedo(false);
    clearDeletionUndo();
    setProject(blank);
    setIsDirty(false);
    setActiveChapterId(blank.chapters[0].id);
    setActiveSceneId(blank.chapters[0].scenes[0].id);
    setSelectedElementId('');
    setInspectorTab('design');
    setNewWorkOpen(false);
    setNotice('New work started · previous draft downloaded');
  };

  const openReader = (revision: MotusPublicationRevision | null = null) => {
    activePointerCleanup.current?.();
    endHistoryTransaction();
    setReaderCatalogProject(null);
    setReaderCatalogFormat(null);
    setReaderRevision(revision ? structuredClone(revision) : null);
    setReaderMatureConfirmed(false);
    const source = resolveReaderSource(project, revision);
    setReaderMode(source.format === 'page' ? 'page' : 'scroll');
    setReaderChapterId(source.chapters[0].id);
    setReaderPageIndex(0);
    setReaderPreviewKey((key) => key + 1);
    setReaderOpen(true);
    setNotice(
      revision ? `Viewing revision ${revision.revision}` : 'Previewing draft',
    );
  };

  const openCatalogWork = (work: WorkCatalogEntry, catalogIndex: number) => {
    const catalogProject = createCatalogPreviewProject(work, catalogIndex);
    setCatalogOpen(false);
    setReaderCatalogProject(catalogProject);
    setReaderCatalogFormat(work.format);
    setReaderRevision(null);
    setReaderMatureConfirmed(false);
    setReaderMode(catalogProject.format === 'page' ? 'page' : 'scroll');
    setReaderChapterId(catalogProject.chapters[0].id);
    setReaderPageIndex(0);
    setReaderPreviewKey((key) => key + 1);
    setReaderOpen(true);
    setNotice(`Previewing ${work.title}`);
  };

  useEffect(() => {
    if (!hydrated) return;
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      const parameters = new URLSearchParams(window.location.search);
      const readerTarget = parameters.get('reader');
      const catalogTarget = parameters.get('catalog');
      const newWorkRequested = parameters.get('new') === '1';
      const requestedWorkValue = parameters.get('work');
      const requestedWork =
        requestedWorkValue === null ? Number.NaN : Number(requestedWorkValue);

      if (newWorkRequested) {
        const saved = readSavedDraft();
        if (saved) {
          setNewWorkOpen(true);
        } else {
          const blank = createBlankProject(uniqueId('work'), nowIso());
          if (persistProject(blank, false, false)) {
            resetTransientCanvasState();
            resetEditorHistory();
            setProject(blank);
            setIsDirty(false);
            setActiveChapterId(blank.chapters[0].id);
            setActiveSceneId(blank.chapters[0].scenes[0].id);
            setSelectedElementId('');
            setInspectorTab('design');
            setMobileStudioPane('stage');
            setNotice('Blank work ready');
          }
        }
      } else if (readerTarget === 'draft') {
        setReaderCatalogProject(null);
        setReaderCatalogFormat(null);
        setReaderRevision(null);
        setReaderMatureConfirmed(false);
        setReaderMode(project.format === 'page' ? 'page' : 'scroll');
        setReaderChapterId(project.chapters[0].id);
        setReaderPageIndex(0);
        setReaderPreviewKey((key) => key + 1);
        setReaderOpen(true);
        setNotice('Previewing draft');
      } else if (
        catalogTarget === 'works' &&
        Number.isInteger(requestedWork) &&
        requestedWork >= 0 &&
        requestedWork < workCatalog.length
      ) {
        const work = workCatalog[requestedWork];
        const catalogProject = createCatalogPreviewProject(work, requestedWork);
        setCatalogOpen(false);
        setReaderCatalogProject(catalogProject);
        setReaderCatalogFormat(work.format);
        setReaderRevision(null);
        setReaderMatureConfirmed(false);
        setReaderMode(catalogProject.format === 'page' ? 'page' : 'scroll');
        setReaderChapterId(catalogProject.chapters[0].id);
        setReaderPageIndex(0);
        setReaderPreviewKey((key) => key + 1);
        setReaderOpen(true);
        setNotice(`Previewing ${work.title}`);
      } else if (catalogTarget === 'works' || catalogTarget === 'motion') {
        setCatalogTab(catalogTarget);
        setCatalogOpen(true);
      }

      if (newWorkRequested || readerTarget || catalogTarget) {
        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete('new');
        cleanUrl.searchParams.delete('reader');
        cleanUrl.searchParams.delete('catalog');
        cleanUrl.searchParams.delete('work');
        window.history.replaceState(
          window.history.state,
          '',
          `${cleanUrl.pathname}${cleanUrl.search}${cleanUrl.hash}`,
        );
      }
    });
    return () => {
      active = false;
    };
  }, [
    hydrated,
    project,
    resetEditorHistory,
    resetTransientCanvasState,
    setSelectedElementId,
  ]);

  const publishRevision = () => {
    if (externalDraftChange) {
      setConflictOpen(true);
      return;
    }
    const readiness = getPublicationReadiness(project);
    if (!readiness.ready) {
      setNotice(readiness.issues[0]);
      return;
    }
    if (!hasUnpublishedChanges(project)) {
      setNotice('Published revision is already current');
      return;
    }
    const createdAt = nowIso();
    const revision = createPublicationRevision(project, createdAt);
    const addRevisionToDraft = (draft: MotusProject) => {
      const snapshot = createPublicationRevision(draft, createdAt);
      draft.publications.push(snapshot);
      draft.publishedRevision = snapshot.revision;
    };
    if (
      !commitProjectWithStoragePreflight(
        addRevisionToDraft,
        'Revision cannot fit in device storage',
      )
    ) {
      return;
    }
    const retainedInDeviceLibrary = saveDevicePublication(
      window.localStorage,
      project.id,
      revision,
    );
    resetEditorHistory();
    setPublishOpen(false);
    setReaderCatalogProject(null);
    setReaderCatalogFormat(null);
    setReaderRevision(revision);
    setReaderMatureConfirmed(false);
    setReaderMode(revision.format === 'page' ? 'page' : 'scroll');
    setReaderChapterId(revision.chapters[0].id);
    setReaderPageIndex(0);
    setReaderPreviewKey((key) => key + 1);
    setReaderOpen(true);
    setNotice(
      retainedInDeviceLibrary
        ? `Revision ${revision.revision} published in this browser`
        : `Revision ${revision.revision} published · browser library copy unavailable`,
    );
  };

  const restoreRevision = (revision: MotusPublicationRevision) => {
    resetTransientCanvasState();
    const restored = restorePublicationToDraft(project, revision.id, nowIso());
    if (!restored) {
      setNotice('Revision could not be restored');
      return;
    }
    undoStack.current = trimProjectHistory([
      ...undoStack.current,
      createProjectHistoryEntry(project, {
        chapterId: activeChapter.id,
        sceneId: activeScene.id,
        elementId: selectedElementId,
      }),
    ]);
    redoStack.current = [];
    endHistoryTransaction();
    setCanUndo(true);
    setCanRedo(false);
    clearDeletionUndo();
    setProject(restored);
    setIsDirty(true);
    setActiveChapterId(restored.chapters[0].id);
    setActiveSceneId(restored.chapters[0].scenes[0].id);
    setSelectedElementId(
      restored.chapters[0].scenes[0].elements.at(-1)?.id ?? '',
    );
    setPublishOpen(false);
    setNotice(`Revision ${revision.revision} restored to draft`);
  };

  const beginPointerAction = (
    event: ReactPointerEvent<HTMLElement>,
    elementId: string,
    mode: ElementPointerTransformMode,
  ) => {
    if (mode === 'move' && (event.shiftKey || event.metaKey || event.ctrlKey)) {
      return;
    }
    const element = findElement(project, activeScene.id, elementId);
    const artboard = event.currentTarget.closest(
      '.artboard',
    ) as HTMLElement | null;
    if (
      !event.isPrimary ||
      event.button !== 0 ||
      !element ||
      element.locked ||
      !artboard
    )
      return;
    event.preventDefault();
    event.stopPropagation();
    activePointerCleanup.current?.();
    setActiveAlignmentGuides([]);
    const groupMove =
      mode === 'move' &&
      selectedElementIdSet.has(elementId) &&
      selectedElements.length > 1;
    const moveSelectionIds = groupMove
      ? [...unlockedSelectedElementIds]
      : [elementId];
    if (groupMove) {
      setPrimarySelectedElementId(elementId);
      setEditingTextElementId(null);
      endHistoryTransaction();
    } else {
      setSelectedElementId(elementId);
    }

    const bounds = artboard.getBoundingClientRect();
    if (bounds.width <= 0 || bounds.height <= 0) return;
    const originGeometry = new Map(
      activeScene.elements
        .filter((item) => moveSelectionIds.includes(item.id))
        .map((item) => [
          item.id,
          {
            x: item.x,
            y: item.y,
            width: item.width,
            height: item.height,
            rotation: item.rotation,
          },
        ]),
    );
    const originSceneElements = activeScene.elements.map((item) => {
      const geometry = originGeometry.get(item.id);
      return geometry ? { ...item, ...geometry } : item;
    });
    const pointerId = event.pointerId;
    const pointerType = event.pointerType;
    const startX = event.clientX;
    const startY = event.clientY;
    const origin = {
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height,
      rotation: element.rotation,
    };
    const centerX = origin.x + origin.width / 2;
    const centerY = origin.y + origin.height / 2;
    const startCanvasX = ((startX - bounds.left) / bounds.width) * CANVAS_WIDTH;
    const startCanvasY =
      ((startY - bounds.top) / bounds.height) * CANVAS_HEIGHT;
    const startRotationAngle = Math.atan2(
      startCanvasY - centerY,
      startCanvasX - centerX,
    );
    let moved = false;
    let aligned = false;

    function onMove(pointer: PointerEvent) {
      if (pointer.pointerId !== pointerId) return;
      const clientDeltaX = pointer.clientX - startX;
      const clientDeltaY = pointer.clientY - startY;
      if (
        !moved &&
        !hasPointerDragStarted(clientDeltaX, clientDeltaY, pointerType)
      ) {
        return;
      }
      if (!moved) {
        undoStack.current = trimProjectHistory([
          ...undoStack.current,
          createProjectHistoryEntry(project, {
            chapterId: activeChapter.id,
            sceneId: activeScene.id,
            elementId,
          }),
        ]);
        redoStack.current = [];
        endHistoryTransaction();
        setCanUndo(true);
        setCanRedo(false);
        clearDeletionUndo();
        setIsDirty(true);
        moved = true;
      }
      const deltaX = (clientDeltaX / bounds.width) * CANVAS_WIDTH;
      const deltaY = (clientDeltaY / bounds.height) * CANVAS_HEIGHT;
      let transformDeltaX = deltaX;
      let transformDeltaY = deltaY;
      if (mode === 'move') {
        if (pointer.altKey) {
          aligned = false;
          setActiveAlignmentGuides([]);
        } else {
          const snapped = snapSelectedElementMovement(
            originSceneElements,
            moveSelectionIds,
            deltaX,
            deltaY,
            (6 / bounds.width) * CANVAS_WIDTH,
            (6 / bounds.height) * CANVAS_HEIGHT,
          );
          transformDeltaX = snapped.deltaX;
          transformDeltaY = snapped.deltaY;
          aligned = snapped.guides.length > 0;
          setActiveAlignmentGuides(snapped.guides);
        }
      } else if (mode === 'rotate') {
        const pointerCanvasX =
          ((pointer.clientX - bounds.left) / bounds.width) * CANVAS_WIDTH;
        const pointerCanvasY =
          ((pointer.clientY - bounds.top) / bounds.height) * CANVAS_HEIGHT;
        const pointerAngle = Math.atan2(
          pointerCanvasY - centerY,
          pointerCanvasX - centerX,
        );
        const rawAngleDelta =
          ((pointerAngle - startRotationAngle) * 180) / Math.PI;
        transformDeltaX = ((((rawAngleDelta + 180) % 360) + 360) % 360) - 180;
        if (pointer.shiftKey) {
          const snappedRotation =
            Math.round((origin.rotation + transformDeltaX) / 15) * 15;
          transformDeltaX = snappedRotation - origin.rotation;
        }
        transformDeltaY = 0;
      }
      setProject((current) => {
        const next = cloneProject(current);
        if (groupMove) {
          const scene = findProjectScene(next, activeScene.id)?.scene;
          if (!scene) return current;
          scene.elements = translateSelectedElements(
            originSceneElements,
            moveSelectionIds,
            transformDeltaX,
            transformDeltaY,
          );
          next.updatedAt = new Date().toISOString();
          return next;
        }
        const target = findElement(next, activeScene.id, elementId);
        if (!target) return current;
        Object.assign(
          target,
          transformElementByPointer(
            { ...target, ...origin },
            mode,
            transformDeltaX,
            transformDeltaY,
          ),
        );
        next.updatedAt = new Date().toISOString();
        return next;
      });
    }

    function cleanup() {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', finish);
      window.removeEventListener('pointercancel', finish);
      window.removeEventListener('blur', finish);
      if (activePointerCleanup.current === cleanup) {
        activePointerCleanup.current = null;
      }
      setActiveAlignmentGuides([]);
    }

    function finish(pointer?: PointerEvent | Event) {
      if (pointer instanceof PointerEvent && pointer.pointerId !== pointerId)
        return;
      cleanup();
      if (moved) {
        setNotice(
          groupMove
            ? `${moveSelectionIds.length} unlocked ${moveSelectionIds.length === 1 ? 'layer' : 'layers'} moved${aligned ? ' · aligned' : ''}`
            : mode === 'move'
              ? `Element moved${aligned ? ' · aligned' : ''}`
              : mode === 'rotate'
                ? 'Element rotated'
                : 'Element resized',
        );
      }
    }

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', finish);
    window.addEventListener('pointercancel', finish);
    window.addEventListener('blur', finish, { once: true });
    activePointerCleanup.current = cleanup;
  };

  const saveCurrentProject = () => {
    activePointerCleanup.current?.();
    endHistoryTransaction();
    if (externalDraftChange) {
      setConflictOpen(true);
      return;
    }
    if (persistProject(project)) setIsDirty(false);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      const modalOpen =
        readerOpen ||
        publishOpen ||
        projectDetailsOpen ||
        Boolean(pendingProjectImport) ||
        Boolean(pendingRevisionRemoval) ||
        newWorkOpen ||
        conflictOpen;
      const insideNativeControl = target?.closest(
        'input, textarea, select, button, a, [role="separator"], [contenteditable="true"], [contenteditable="plaintext-only"]',
      );
      const insideTextControl = target?.closest(
        'input, textarea, select, [contenteditable="true"], [contenteditable="plaintext-only"]',
      );
      if (event.defaultPrevented || event.isComposing) return;

      const shortcut = getEditorShortcut(
        event.key,
        event.metaKey || event.ctrlKey,
        event.shiftKey,
      );
      if (shortcut === 'save') {
        event.preventDefault();
        if (!event.repeat) saveCurrentProject();
        return;
      }
      if (modalOpen) return;

      if (
        (event.metaKey || event.ctrlKey) &&
        !event.shiftKey &&
        !insideTextControl &&
        event.key.toLocaleLowerCase() === 'a'
      ) {
        event.preventDefault();
        selectAllLayers();
        return;
      }
      if (insideTextControl) return;

      if (shortcut === 'undo' || shortcut === 'redo') {
        event.preventDefault();
        if (shortcut === 'redo') redo();
        else undo();
        return;
      }
      if (shortcut === 'duplicate' && selectedElementId) {
        event.preventDefault();
        duplicateSelection();
        return;
      }
      if (
        (event.key === 'Backspace' || event.key === 'Delete') &&
        selectedElementId
      ) {
        event.preventDefault();
        deleteSelection();
        return;
      }
      if (insideNativeControl) return;
      if (selectedElement && getKeyboardNudgeDelta(event.key, event.shiftKey)) {
        event.preventDefault();
        nudgeElement(selectedElement.id, event.key, event.shiftKey);
        return;
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      const insideNativeControl = target?.closest(
        'input, textarea, select, button, a, [role="separator"], [contenteditable="true"], [contenteditable="plaintext-only"]',
      );
      if (
        !insideNativeControl &&
        getKeyboardNudgeDelta(event.key, event.shiftKey)
      ) {
        endHistoryTransaction();
      }
    };

    const writeSelectedLayerToClipboard = (event: ClipboardEvent) => {
      if (event.defaultPrevented || !selectedElement || !event.clipboardData) {
        return null;
      }
      const target = event.target instanceof Element ? event.target : null;
      const insideTextControl = target?.closest(
        'input, textarea, select, [contenteditable="true"], [contenteditable="plaintext-only"]',
      );
      const modalOpen =
        readerOpen ||
        publishOpen ||
        projectDetailsOpen ||
        Boolean(pendingProjectImport) ||
        Boolean(pendingRevisionRemoval) ||
        newWorkOpen ||
        conflictOpen;
      const textSelection = window.getSelection();
      if (
        insideTextControl ||
        modalOpen ||
        (textSelection && !textSelection.isCollapsed)
      ) {
        return null;
      }

      const sources =
        selectedElements.length > 1 ? selectedElements : [selectedElement];
      copiedElements.current = structuredClone(sources);
      event.clipboardData.setData(
        MOTUS_LAYER_CLIPBOARD_TYPE,
        JSON.stringify(sources.map((source) => source.id)),
      );
      event.preventDefault();
      return sources;
    };

    const onCopy = (event: ClipboardEvent) => {
      const sources = writeSelectedLayerToClipboard(event);
      if (!sources) return;
      setNotice(
        sources.length > 1
          ? `${sources.length} layers copied`
          : `${sources[0].name} copied`,
      );
    };

    const onCut = (event: ClipboardEvent) => {
      const sources = writeSelectedLayerToClipboard(event);
      if (!sources) return;
      if (sources.length > 1) deleteSelection('cut');
      else deleteElement(sources[0].id, 'cut');
    };

    const onPaste = (event: ClipboardEvent) => {
      if (event.defaultPrevented) return;
      const target = event.target instanceof Element ? event.target : null;
      const insideTextControl = target?.closest(
        'input, textarea, select, [contenteditable="true"], [contenteditable="plaintext-only"]',
      );
      const modalOpen =
        readerOpen ||
        publishOpen ||
        projectDetailsOpen ||
        Boolean(pendingProjectImport) ||
        Boolean(pendingRevisionRemoval) ||
        newWorkOpen ||
        conflictOpen;
      const clipboard = event.clipboardData;
      if (insideTextControl || modalOpen || !clipboard) return;

      const files = Array.from(clipboard.files);
      if (files.length === 0) {
        files.push(
          ...Array.from(clipboard.items)
            .map((item) => (item.kind === 'file' ? item.getAsFile() : null))
            .filter((file): file is File => file !== null),
        );
      }
      const image = findSupportedImageFile(files);
      if (image) {
        event.preventDefault();
        void uploadImage(image);
        return;
      }
      if (files.length > 0) return;

      const sources = copiedElements.current;
      const marker = clipboard.getData(MOTUS_LAYER_CLIPBOARD_TYPE);
      if (
        sources.length === 0 ||
        marker !== JSON.stringify(sources.map((source) => source.id))
      )
        return;
      event.preventDefault();
      if (sources.length > 1) {
        addElementCopies(sources, `${sources.length} layers pasted`);
      } else {
        addElementCopy(sources[0], 'Layer pasted');
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('copy', onCopy);
    window.addEventListener('cut', onCut);
    window.addEventListener('paste', onPaste);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('copy', onCopy);
      window.removeEventListener('cut', onCut);
      window.removeEventListener('paste', onPaste);
    };
  });

  useEffect(() => {
    const stage = canvasStage.current;
    if (!stage) return;

    const updateFitWidth = () => {
      const style = window.getComputedStyle(stage);
      const horizontalPadding =
        Number.parseFloat(style.paddingLeft) +
        Number.parseFloat(style.paddingRight);
      const verticalPadding =
        Number.parseFloat(style.paddingTop) +
        Number.parseFloat(style.paddingBottom);
      const nextWidth = getFitCanvasWidth(
        stage.clientWidth,
        stage.clientHeight,
        horizontalPadding,
        verticalPadding,
      );
      setFitCanvasWidth((current) =>
        current === nextWidth ? current : nextWidth,
      );
    };

    updateFitWidth();
    if (!('ResizeObserver' in window)) return;
    const observer = new ResizeObserver(updateFitWidth);
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  const artboardWidth = Math.round(fitCanvasWidth * (zoom / 100));
  const normalizedCatalogSearch = catalogSearch.trim().toLocaleLowerCase();
  const filteredWorkCatalog = workCatalog.filter(
    (work) =>
      !normalizedCatalogSearch ||
      [
        work.title,
        work.creator,
        work.genre,
        work.format,
        work.status,
        ...work.tags,
      ]
        .join(' ')
        .toLocaleLowerCase()
        .includes(normalizedCatalogSearch),
  );
  const filteredProjectImageAssets = projectImageAssets.filter(
    (asset) =>
      !normalizedCatalogSearch ||
      asset.name.toLocaleLowerCase().includes(normalizedCatalogSearch),
  );
  const publicationHasChanges = hasUnpublishedChanges(project);
  const publicationReadiness = getPublicationReadiness(project);
  const draftSaveStatus = getDraftSaveStatus({
    dirty: isDirty,
    externalChange: externalDraftChange,
    saveFailed,
  });
  const pendingImportSceneCount = pendingProjectImport
    ? getProjectScenes(pendingProjectImport.project).length
    : 0;
  const readerSource = resolveReaderSource(
    readerCatalogProject ?? project,
    readerCatalogProject ? null : readerRevision,
  );
  const readerCatalogPreviewLayout = readerCatalogFormat
    ? getCatalogPreviewLayout(readerCatalogFormat)
    : null;
  const readerPublicationState = readerCatalogProject
    ? readerCatalogPreviewLayout && !readerCatalogPreviewLayout.native
      ? `Curated catalog preview · Prototype ${readerCatalogPreviewLayout.label.toLowerCase()} layout`
      : 'Curated catalog preview'
    : readerSource.mode === 'revision'
      ? `Published revision ${readerSource.revision} · ${readerSource.visibility}`
      : project.publishedRevision === 0
        ? 'Unpublished draft preview'
        : publicationHasChanges
          ? `Draft preview · changes since published revision ${project.publishedRevision}`
          : `Draft preview · matches published revision ${project.publishedRevision}`;
  const readerChapter =
    readerSource.chapters.find((chapter) => chapter.id === readerChapterId) ??
    readerSource.chapters[0];
  const readerChapterIndex = Math.max(
    readerSource.chapters.findIndex(
      (chapter) => chapter.id === readerChapter.id,
    ),
    0,
  );
  const readerScenes = readerChapter.scenes;
  const readerDescription = `${readerSource.chapters.length} ${readerSource.chapters.length === 1 ? 'chapter' : 'chapters'} · by ${readerSource.creatorName} · ${readerPublicationState}`;
  const resolvedReaderPageIndex = Math.min(
    Math.max(readerPageIndex, 0),
    Math.max(readerScenes.length - 1, 0),
  );
  const selectedPreviewDurationMs = useMemo(() => {
    if (!selectedElement?.visible) return 0;
    const compiled = compileElementMotion(selectedElement);
    return compiled.steps.some((step) => step.kind !== 'wait')
      ? compiled.sequenceDurationMs
      : 0;
  }, [selectedElement]);
  const scenePreviewDurationMs = useMemo(
    () =>
      activeScene.elements.reduce((longestDuration, element) => {
        if (!element.visible) return longestDuration;
        const compiled = compileElementMotion(element);
        if (!compiled.steps.some((step) => step.kind !== 'wait')) {
          return longestDuration;
        }
        return Math.max(longestDuration, compiled.sequenceDurationMs);
      }, 0),
    [activeScene.elements],
  );
  const previewDurationMs =
    previewScope === 'selected'
      ? selectedPreviewDurationMs
      : scenePreviewDurationMs;

  const finishCanvasPreview = useCallback(() => {
    setPreviewRunning(false);
    setCanvasPreviewKey(0);
    setNotice('Preview finished');
  }, []);

  const stopCanvasPreview = useCallback(() => {
    setPreviewRunning(false);
    setCanvasPreviewKey(0);
    setNotice('Preview stopped');
  }, []);

  const startCanvasPreview = (scope: PreviewScope = previewScope) => {
    activePointerCleanup.current?.();
    endHistoryTransaction();
    const duration =
      scope === 'selected' ? selectedPreviewDurationMs : scenePreviewDurationMs;
    if (duration <= 0) {
      setNotice(
        scope === 'selected'
          ? 'Select a visible layer with an enabled motion block'
          : 'Add an enabled motion block to a visible layer',
      );
      return;
    }
    setPreviewScope(scope);
    setPreviewRunning(true);
    setMobileStudioPane('stage');
    setCanvasPreviewKey((key) => key + 1);
    setNotice(
      `${scope === 'selected' ? selectedElement?.name : 'Scene'} preview · ${formatPreviewDuration(duration)}`,
    );
  };
  const replayReader = () => {
    setReaderChapterId(readerSource.chapters[0].id);
    if (readerMode === 'page') setReaderPageIndex(0);
    readerScroll.current?.scrollTo({ top: 0, behavior: 'auto' });
    setReaderPreviewKey((key) => key + 1);
    setNotice('Reader replayed from the first scene');
  };

  const selectReaderChapter = (chapter: MotusChapter) => {
    setReaderChapterId(chapter.id);
    setReaderPageIndex(0);
    readerScroll.current?.scrollTo({ top: 0, behavior: 'auto' });
    setReaderPreviewKey((key) => key + 1);
  };

  const moveReaderPage = (direction: -1 | 1) => {
    if (direction < 0 && resolvedReaderPageIndex > 0) {
      setReaderPageIndex(resolvedReaderPageIndex - 1);
    } else if (
      direction > 0 &&
      resolvedReaderPageIndex < readerScenes.length - 1
    ) {
      setReaderPageIndex(resolvedReaderPageIndex + 1);
    } else {
      const targetChapterIndex = readerChapterIndex + direction;
      const targetChapter = readerSource.chapters[targetChapterIndex];
      if (!targetChapter) return;
      setReaderChapterId(targetChapter.id);
      setReaderPageIndex(direction < 0 ? targetChapter.scenes.length - 1 : 0);
    }
    readerScroll.current?.scrollTo({ top: 0, behavior: 'auto' });
  };
  const requestNewWork = () => {
    activePointerCleanup.current?.();
    endHistoryTransaction();
    if (externalDraftChange) setConflictOpen(true);
    else setNewWorkOpen(true);
  };
  const requestProjectImport = () => {
    activePointerCleanup.current?.();
    endHistoryTransaction();
    if (externalDraftChange) setConflictOpen(true);
    else projectInput.current?.click();
  };
  const openPublish = () => {
    activePointerCleanup.current?.();
    endHistoryTransaction();
    if (externalDraftChange) {
      setConflictOpen(true);
      return;
    }
    setPublishOpen(true);
  };
  const openProjectDetails = () => {
    activePointerCleanup.current?.();
    endHistoryTransaction();
    if (externalDraftChange) {
      setConflictOpen(true);
      return;
    }
    setProjectDetailsOpen(true);
  };
  const displayedNotice =
    draftSaveStatus === 'conflict'
      ? 'Autosave paused · draft changed in another tab'
      : draftSaveStatus === 'failed'
        ? 'Draft not saved · back up now'
        : draftSaveStatus === 'saving'
          ? 'Saving changes…'
          : notice;
  const textHistoryProps = { onBlur: endHistoryTransaction };
  const continuousHistoryProps = {
    onBlur: endHistoryTransaction,
    onKeyUp: (event: ReactKeyboardEvent<HTMLInputElement>) => {
      if (shouldEndContinuousHistoryOnKey(event.key)) endHistoryTransaction();
    },
    onPointerCancel: endHistoryTransaction,
    onPointerUp: endHistoryTransaction,
  };
  const numericDraftProps = (
    key: string,
    value: number,
    normalize: (candidate: number) => number,
    commit: (candidate: number) => void,
  ) => ({
    onBlur: (event: ReactFocusEvent<HTMLInputElement>) => {
      const normalized = normalize(event.currentTarget.valueAsNumber);
      if (normalized !== value) commit(normalized);
      setNumericDrafts((current) => {
        if (!(key in current)) return current;
        const next = { ...current };
        delete next[key];
        return next;
      });
      endHistoryTransaction();
    },
    onChange: (event: ReactChangeEvent<HTMLInputElement>) => {
      const rawValue = event.currentTarget.value;
      const numericValue = event.currentTarget.valueAsNumber;
      setNumericDrafts((current) => ({ ...current, [key]: rawValue }));
      if (!Number.isFinite(numericValue)) return;
      const normalized = normalize(numericValue);
      if (normalized === numericValue && normalized !== value) {
        commit(normalized);
      }
    },
    onKeyDown: (event: ReactKeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') event.currentTarget.blur();
      if (event.key !== 'Escape') return;
      event.preventDefault();
      setNumericDrafts((current) => {
        if (!(key in current)) return current;
        const next = { ...current };
        delete next[key];
        return next;
      });
      event.currentTarget.blur();
    },
    onKeyUp: (event: ReactKeyboardEvent<HTMLInputElement>) => {
      if (shouldEndContinuousHistoryOnKey(event.key)) endHistoryTransaction();
    },
    onPointerCancel: endHistoryTransaction,
    onPointerUp: endHistoryTransaction,
    value: numericDrafts[key] ?? String(value),
  });
  // oxlint-disable react/react-compiler -- numeric draft refs intentionally preserve in-progress typography values until commit.
  const typographyFontSizeDraftProps =
    selectedElement && selectedTypography
      ? numericDraftProps(
          `element:${selectedElement.id}:typography:fontSize`,
          selectedTypography.fontSize,
          (candidate) =>
            normalizeElementTypography(selectedElement.type, {
              ...selectedTypography,
              fontSize: candidate,
            })?.fontSize ?? selectedTypography.fontSize,
          (candidate) =>
            updateElement(
              selectedElement.id,
              (item) => {
                applyTypographyPatch(item, { fontSize: candidate });
              },
              `element:${selectedElement.id}:typography:fontSize`,
            ),
        )
      : undefined;
  const typographyLineHeightDraftProps =
    selectedElement && selectedTypography
      ? numericDraftProps(
          `element:${selectedElement.id}:typography:lineHeight`,
          selectedTypography.lineHeight,
          (candidate) =>
            normalizeElementTypography(selectedElement.type, {
              ...selectedTypography,
              lineHeight: candidate,
            })?.lineHeight ?? selectedTypography.lineHeight,
          (candidate) =>
            updateElement(
              selectedElement.id,
              (item) => {
                applyTypographyPatch(item, { lineHeight: candidate });
              },
              `element:${selectedElement.id}:typography:lineHeight`,
            ),
        )
      : undefined;
  const typographyLetterSpacingDraftProps =
    selectedElement && selectedTypography
      ? numericDraftProps(
          `element:${selectedElement.id}:typography:letterSpacing`,
          selectedTypography.letterSpacing,
          (candidate) =>
            normalizeElementTypography(selectedElement.type, {
              ...selectedTypography,
              letterSpacing: candidate,
            })?.letterSpacing ?? selectedTypography.letterSpacing,
          (candidate) =>
            updateElement(
              selectedElement.id,
              (item) => {
                applyTypographyPatch(item, { letterSpacing: candidate });
              },
              `element:${selectedElement.id}:typography:letterSpacing`,
            ),
        )
      : undefined;
  // oxlint-enable react/react-compiler
  const activePanelLayout = studioPanelLayouts[inspectorTab];
  const activePanelPreset = (
    Object.keys(STUDIO_PANEL_PRESETS[inspectorTab]) as StudioPanelPreset[]
  ).find((preset) =>
    studioPanelLayoutsMatch(
      activePanelLayout,
      STUDIO_PANEL_PRESETS[inspectorTab][preset],
    ),
  );
  const studioGridStyle = desktopPanelsEnabled
    ? ({
        gridTemplateColumns: getStudioGridTemplate(
          inspectorTab,
          activePanelLayout,
        ),
      } satisfies CSSProperties)
    : undefined;
  const blockWorkspaceStyle = desktopPanelsEnabled
    ? ({
        gridTemplateColumns:
          getBlockWorkspaceGridTemplate(blockWorkspaceLayout),
      } satisfies CSSProperties)
    : undefined;
  const applyStudioPanelLayout = (layout: Record<string, number>) => {
    const candidate = {
      left: layout.left,
      center: layout.center,
      right: layout.right,
    };
    if (!isStudioPanelLayout(candidate)) return;
    if (studioGrid.current) {
      studioGrid.current.style.gridTemplateColumns = getStudioGridTemplate(
        inspectorTab,
        candidate,
      );
    }
  };
  const rememberStudioPanelLayout = (layout: Record<string, number>) => {
    const candidate = {
      left: layout.left,
      center: layout.center,
      right: layout.right,
    };
    if (!isStudioPanelLayout(candidate)) return;
    const nextLayouts = {
      ...studioPanelLayouts,
      [inspectorTab]: candidate,
    };
    setStudioPanelLayouts(nextLayouts);
    try {
      window.localStorage.setItem(
        STUDIO_PANEL_LAYOUT_KEY,
        JSON.stringify(nextLayouts),
      );
    } catch {
      // Panel sizing remains usable for this session without local storage.
    }
  };
  const applyBlockWorkspaceLayout = (layout: Record<string, number>) => {
    const candidate = {
      library: layout.library,
      script: layout.script,
    };
    if (!isBlockWorkspaceLayout(candidate)) return;
    if (motionProperties.current) {
      motionProperties.current.style.gridTemplateColumns =
        getBlockWorkspaceGridTemplate(candidate);
    }
  };
  const rememberBlockWorkspaceLayout = (layout: Record<string, number>) => {
    const candidate = {
      library: layout.library,
      script: layout.script,
    };
    if (!isBlockWorkspaceLayout(candidate)) return;
    setBlockWorkspaceLayout(candidate);
    try {
      window.localStorage.setItem(
        BLOCK_WORKSPACE_LAYOUT_KEY,
        JSON.stringify(candidate),
      );
    } catch {
      // The inner divider remains usable for this session without local storage.
    }
  };
  const applyStudioPanelPreset = (preset: StudioPanelPreset) => {
    const nextLayout = {
      ...STUDIO_PANEL_PRESETS[inspectorTab][preset],
    };
    const nextLayouts = {
      ...studioPanelLayouts,
      [inspectorTab]: nextLayout,
    };
    setStudioPanelLayouts(nextLayouts);
    setPanelLayoutRevision((revision) => revision + 1);
    try {
      window.localStorage.setItem(
        STUDIO_PANEL_LAYOUT_KEY,
        JSON.stringify(nextLayouts),
      );
    } catch {
      // Applying the live preset still succeeds without local storage.
    }
    setNotice(
      preset === 'balanced'
        ? `${inspectorTab === 'motion' ? 'Blocks' : 'Design'} layout balanced`
        : preset === 'focus-stage'
          ? 'Stage focused'
          : `${inspectorTab === 'motion' ? 'Blocks' : 'Properties'} focused`,
    );
  };
  const resetStudioPanelLayouts = () => {
    setStudioPanelLayouts({
      design: { ...DEFAULT_STUDIO_PANEL_LAYOUTS.design },
      motion: { ...DEFAULT_STUDIO_PANEL_LAYOUTS.motion },
    });
    setPanelLayoutRevision((revision) => revision + 1);
    setBlockWorkspaceLayout({ ...DEFAULT_BLOCK_WORKSPACE_LAYOUT });
    setBlockWorkspaceLayoutRevision((revision) => revision + 1);
    try {
      window.localStorage.removeItem(STUDIO_PANEL_LAYOUT_KEY);
      window.localStorage.removeItem(BLOCK_WORKSPACE_LAYOUT_KEY);
    } catch {
      // Resetting the live layout still succeeds without local storage.
    }
    setNotice('Panel layouts reset');
  };

  const selectedMotionBlockCount = selectedElement
    ? countMotionBlocks(selectedElement.motion.blocks)
    : 0;
  const motionInsertionParent =
    selectedElement && motionInsertionParentId
      ? findMotionBlock(selectedElement.motion.blocks, motionInsertionParentId)
      : null;
  const canAddPaletteBlock = (kind: MotionBlockKind) => {
    if (!selectedElement || selectedMotionBlockCount >= MAX_MOTION_BLOCKS) {
      return false;
    }
    if (!motionInsertionParent) return true;
    if (motionInsertionParent.kind !== 'parallel') return true;
    return (
      isParallelMotionBlockKind(kind) &&
      motionInsertionParent.children.length < MAX_PARALLEL_MOTION_BLOCKS &&
      !motionInsertionParent.children.some((child) => child.kind === kind)
    );
  };
  const motionTreeEditorActions: MotionTreeEditorActions = {
    addBounceJump,
    chooseInsertion: chooseMotionInsertion,
    duplicateBounceJump,
    duplicate: duplicateMotionBlock,
    move: moveMotionBlock,
    moveBounceJump,
    moveNextInside: moveNextMotionBlockInside,
    moveOut: moveMotionBlockOut,
    numericDraftProps,
    removeBounceJump,
    remove: removeMotionBlock,
    setParallelTiming: setParallelMotionTiming,
    update: (blockId, mutate, transactionKey) =>
      updateMotionBlock(blockId, mutate, transactionKey),
    updateBounceJump,
  };

  return (
    <main className="studio-shell">
      <input
        accept=".png,.webp,image/png,image/webp"
        className="sr-only"
        onChange={(event) => {
          void uploadImage(event.target.files?.[0]);
          event.target.value = '';
        }}
        ref={imageInput}
        type="file"
      />
      <input
        accept=".json,.motus.json,application/json"
        className="sr-only"
        onChange={(event) => {
          importProject(event.target.files?.[0]);
          event.target.value = '';
        }}
        ref={projectInput}
        type="file"
      />

      <header className="studio-topbar">
        <a
          aria-label="Motus home"
          className="brand-lockup"
          href="/"
          onClick={(event) => {
            activePointerCleanup.current?.();
            endHistoryTransaction();
            if (externalDraftChange) {
              event.preventDefault();
              setConflictOpen(true);
              return;
            }
            if (isDirty && !persistProject(project, false)) {
              event.preventDefault();
            }
          }}
        >
          <MotusLogo className="brand-mark" />
          <span className="brand-name">MOTUS</span>
          <span className="brand-product">STUDIO</span>
        </a>

        <Input
          {...textHistoryProps}
          aria-label="Project title"
          className="project-title-input"
          maxLength={MAX_PROJECT_TITLE_LENGTH}
          onChange={(event) =>
            commitProject((draft) => {
              draft.title = event.target.value;
            }, 'project:title')
          }
          value={project.title}
        />

        <div className="topbar-actions">
          <button
            aria-keyshortcuts="Meta+S Control+S"
            className="save-state"
            onClick={saveCurrentProject}
            title="Save draft now (⌘/Ctrl+S)"
            type="button"
          >
            <Cloud />
            {displayedNotice}
          </button>
          <Button
            aria-label="Start a new work"
            className="topbar-mobile-hide"
            onClick={requestNewWork}
            size="icon"
            variant="outline"
          >
            <FilePlus2 />
          </Button>
          <Button
            aria-label="Undo"
            disabled={!canUndo}
            onClick={undo}
            size="icon"
            variant="ghost"
          >
            <Undo2 />
          </Button>
          <Button
            aria-label="Redo"
            disabled={!canRedo}
            onClick={redo}
            size="icon"
            variant="ghost"
          >
            <Redo2 />
          </Button>
          <Button
            className="topbar-mobile-hide"
            onClick={() => startCanvasPreview('scene')}
            variant="secondary"
          >
            <Play data-icon="inline-start" fill="currentColor" />
            Preview
          </Button>
          <Button
            aria-label="Open Motus catalogs"
            className="topbar-mobile-hide"
            onClick={() => {
              setCatalogTab('works');
              setCatalogOpen(true);
            }}
            variant="secondary"
          >
            <LibraryBig data-icon="inline-start" />
            Catalogs
          </Button>
          <Button
            aria-label="Edit work details"
            className="topbar-mobile-hide"
            onClick={openProjectDetails}
            variant="secondary"
          >
            <Pencil data-icon="inline-start" />
            Details
          </Button>
          <Button
            aria-label="Open draft reader"
            className="topbar-reader"
            onClick={() => openReader()}
            variant="secondary"
          >
            <Layers3 data-icon="inline-start" />
            <span>Draft reader</span>
          </Button>
          <Button
            aria-label="Publish work"
            className="topbar-publish"
            onClick={openPublish}
          >
            <Send data-icon="inline-start" />
            <span>Publish</span>
          </Button>
          <Button
            aria-label="Import Motus project"
            className="topbar-mobile-hide"
            onClick={requestProjectImport}
            size="icon"
            variant="outline"
          >
            <Upload />
          </Button>
          <Button
            aria-label="Export Motus project"
            onClick={exportProject}
            size="icon"
            variant="outline"
          >
            <Download />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  aria-label="Panel layout"
                  className="topbar-layout"
                  variant="outline"
                />
              }
            >
              <Maximize2 />
              <span>Layout</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="min-w-56"
              sideOffset={8}
            >
              <DropdownMenuItem
                aria-current={
                  activePanelPreset === 'balanced' ? 'true' : undefined
                }
                className="layout-preset-item min-h-10 px-2.5"
                data-active={activePanelPreset === 'balanced' || undefined}
                onClick={() => applyStudioPanelPreset('balanced')}
              >
                <Maximize2 />
                Balanced
                <span>All panes</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                aria-current={
                  activePanelPreset === 'focus-stage' ? 'true' : undefined
                }
                className="layout-preset-item min-h-10 px-2.5"
                data-active={activePanelPreset === 'focus-stage' || undefined}
                onClick={() => applyStudioPanelPreset('focus-stage')}
              >
                <Maximize2 />
                Focus Stage
                <span>Largest canvas</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                aria-current={
                  activePanelPreset === 'focus-secondary' ? 'true' : undefined
                }
                className="layout-preset-item min-h-10 px-2.5"
                data-active={
                  activePanelPreset === 'focus-secondary' || undefined
                }
                onClick={() => applyStudioPanelPreset('focus-secondary')}
              >
                <Maximize2 />
                Focus {inspectorTab === 'motion' ? 'Blocks' : 'Properties'}
                <span>Largest editor</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="min-h-10 px-2.5"
                onClick={resetStudioPanelLayouts}
              >
                <RotateCcw />
                Reset both workspaces
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  aria-label="More project actions"
                  className="topbar-mobile-more"
                  size="icon"
                  variant="outline"
                />
              }
            >
              <Ellipsis />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="min-w-48"
              sideOffset={8}
            >
              <DropdownMenuItem
                className="min-h-10 px-2.5"
                onClick={openProjectDetails}
              >
                <Pencil />
                Work details
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="min-h-10 px-2.5"
                onClick={saveCurrentProject}
              >
                <Cloud />
                Save now
              </DropdownMenuItem>
              <DropdownMenuItem
                className="min-h-10 px-2.5"
                onClick={() => startCanvasPreview('scene')}
              >
                <Play />
                Replay canvas preview
              </DropdownMenuItem>
              <DropdownMenuItem
                className="min-h-10 px-2.5"
                onClick={resetStudioPanelLayouts}
              >
                <Maximize2 />
                Reset panel widths
              </DropdownMenuItem>
              <DropdownMenuItem
                className="min-h-10 px-2.5"
                onClick={() => {
                  setCatalogTab('works');
                  setCatalogOpen(true);
                }}
              >
                <LibraryBig />
                Open catalogs
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="min-h-10 px-2.5"
                onClick={requestNewWork}
              >
                <FilePlus2 />
                New work
              </DropdownMenuItem>
              <DropdownMenuItem
                className="min-h-10 px-2.5"
                onClick={requestProjectImport}
              >
                <Upload />
                Import project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <nav aria-label="Studio panes" className="mobile-pane-switcher">
        <button
          aria-controls="blocks-pane"
          aria-pressed={mobileStudioPane === 'blocks'}
          className="mobile-pane-tab"
          id="mobile-pane-blocks"
          onClick={() => setMobileStudioPane('blocks')}
          onKeyDown={handleMobilePaneKeyDown}
          type="button"
        >
          {inspectorTab === 'motion' ? (
            <Code2 aria-hidden="true" />
          ) : (
            <Pencil aria-hidden="true" />
          )}
          {inspectorTab === 'motion' ? 'Blocks' : 'Properties'}
        </button>
        <button
          aria-controls="stage-pane"
          aria-pressed={mobileStudioPane === 'stage'}
          className="mobile-pane-tab"
          id="mobile-pane-stage"
          onClick={() => setMobileStudioPane('stage')}
          onKeyDown={handleMobilePaneKeyDown}
          type="button"
        >
          <Maximize2 aria-hidden="true" />
          Stage
        </button>
        <button
          aria-controls="layers-pane"
          aria-pressed={mobileStudioPane === 'layers'}
          className="mobile-pane-tab"
          id="mobile-pane-layers"
          onClick={() => setMobileStudioPane('layers')}
          onKeyDown={handleMobilePaneKeyDown}
          type="button"
        >
          <Layers3 aria-hidden="true" />
          Layers
        </button>
      </nav>

      <div
        className="studio-grid"
        data-mobile-pane={mobileStudioPane}
        data-workspace={inspectorTab}
        ref={studioGrid}
        style={studioGridStyle}
      >
        <aside className="tool-rail" aria-label="Add and edit elements">
          {toolItems.map(({ id, label, icon: Icon }) => (
            <button
              aria-pressed={
                id === 'select' || id === 'motion'
                  ? activeTool === id
                  : undefined
              }
              className="tool-button"
              data-active={activeTool === id || undefined}
              key={id}
              onClick={() => runTool(id)}
              type="button"
            >
              <Icon />
              <span>{label}</span>
            </button>
          ))}
        </aside>

        <aside
          className="layers-panel"
          aria-label="Scene layers"
          id="layers-pane"
        >
          <div className="panel-heading">
            <div>
              <span className="eyebrow">
                SCENE {String(sceneIndex + 1).padStart(2, '0')}
              </span>
              <h1>Layers</h1>
            </div>
            <Button
              aria-label="Add shape"
              onClick={() => addElement('shape')}
              size="icon-sm"
              variant="outline"
            >
              <Plus />
            </Button>
          </div>

          <div className="scene-settings">
            <label htmlFor="active-scene-name">
              <span>Scene name</span>
              <Input
                {...textHistoryProps}
                id="active-scene-name"
                maxLength={MAX_SCENE_NAME_LENGTH}
                onChange={(event) =>
                  commitProject((draft) => {
                    const scene = findProjectScene(
                      draft,
                      activeScene.id,
                    )?.scene;
                    if (scene) scene.name = event.target.value;
                  }, `scene:${activeScene.id}:name`)
                }
                value={activeScene.name}
              />
            </label>
            <fieldset className="scene-palette">
              <legend className="sr-only">Scene background</legend>
              {sceneBackgrounds.map((background) => (
                <button
                  aria-label={`Use ${background.name} background`}
                  aria-pressed={activeScene.background === background.value}
                  data-active={
                    activeScene.background === background.value || undefined
                  }
                  key={background.name}
                  onClick={() =>
                    commitProject((draft) => {
                      const scene = findProjectScene(
                        draft,
                        activeScene.id,
                      )?.scene;
                      if (scene) scene.background = background.value;
                    })
                  }
                  style={{ background: background.value }}
                  type="button"
                />
              ))}
            </fieldset>
          </div>

          <div className="layer-list">
            {[...activeScene.elements].reverse().map((element) => {
              const Icon = elementIcon(element.type);
              const originalIndex = activeScene.elements.findIndex(
                (item) => item.id === element.id,
              );
              return (
                <div
                  className="layer-row"
                  data-primary-selected={
                    selectedElementId === element.id || undefined
                  }
                  data-selected={
                    selectedElementIdSet.has(element.id) || undefined
                  }
                  key={element.id}
                >
                  <button
                    aria-label={
                      selectedElementIdSet.has(element.id)
                        ? `Remove ${element.name} from selection`
                        : `Add ${element.name} to selection`
                    }
                    aria-pressed={selectedElementIdSet.has(element.id)}
                    className="layer-multi-toggle"
                    onClick={() => selectElement(element.id, true)}
                    title={
                      selectedElementIdSet.has(element.id)
                        ? 'Remove from selection'
                        : 'Add to selection'
                    }
                    type="button"
                  >
                    {selectedElementIdSet.has(element.id) ? (
                      <Check aria-hidden="true" />
                    ) : (
                      <Plus aria-hidden="true" />
                    )}
                  </button>
                  <button
                    aria-current={
                      selectedElementId === element.id ? 'true' : undefined
                    }
                    aria-label={
                      selectedElementId === element.id
                        ? `Edit ${element.name}, primary layer`
                        : `Edit ${element.name} and make it primary`
                    }
                    className="layer-select"
                    onClick={(event) =>
                      selectElement(
                        element.id,
                        event.shiftKey || event.metaKey || event.ctrlKey,
                      )
                    }
                    type="button"
                  >
                    <span className="layer-icon">
                      <Icon />
                    </span>
                    <span className="layer-copy">
                      <strong>{element.name}</strong>
                      <small>{element.type}</small>
                    </span>
                  </button>
                  <div className="layer-actions">
                    <button
                      aria-label={`${element.name} visibility`}
                      aria-pressed={element.visible}
                      onClick={() =>
                        updateElement(element.id, (item) => {
                          item.visible = !item.visible;
                        })
                      }
                      title={
                        element.visible
                          ? `Hide ${element.name}`
                          : `Show ${element.name}`
                      }
                      type="button"
                    >
                      {element.visible ? <Eye /> : <EyeOff />}
                    </button>
                    <button
                      aria-label={`${element.name} locked`}
                      aria-pressed={element.locked}
                      onClick={() =>
                        updateElement(element.id, (item) => {
                          item.locked = !item.locked;
                        })
                      }
                      title={
                        element.locked
                          ? `Unlock ${element.name}`
                          : `Lock ${element.name}`
                      }
                      type="button"
                    >
                      {element.locked ? <Lock /> : <Unlock />}
                    </button>
                    <button
                      aria-label={`Move ${element.name} up`}
                      disabled={
                        originalIndex === activeScene.elements.length - 1
                      }
                      onClick={() => moveLayer(element.id, 1)}
                      type="button"
                    >
                      <ArrowUp />
                    </button>
                    <button
                      aria-label={`Move ${element.name} down`}
                      disabled={originalIndex === 0}
                      onClick={() => moveLayer(element.id, -1)}
                      type="button"
                    >
                      <ArrowDown />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {activeScene.elements.length === 0 ? (
            <div className="empty-layers">
              <Square />
              <strong>Blank scene</strong>
              <p>Add from the toolbar, or drop or paste a PNG or WebP.</p>
            </div>
          ) : null}
        </aside>

        <section
          className="workspace"
          aria-label="Comic scene editor"
          id="stage-pane"
        >
          <div className="workspace-toolbar">
            <div className="canvas-status">
              <Move />
              <span>
                {inspectorTab === 'motion'
                  ? 'Stage · select layers, then edit their blocks'
                  : selectedElements.length > 1
                    ? `Stage · ${selectedElements.length} layers selected · drag together`
                    : 'Stage · drag layers · double-click text to edit'}
              </span>
              <span className="canvas-sr-instructions" id="canvas-instructions">
                Select a layer on the stage. Use arrow keys to move it one
                pixel, or hold Shift to move it ten pixels. Use Control or
                Command with C, X, and V to copy, cut, and paste the layer. Hold
                Shift, Control, or Command while clicking to add or remove a
                layer from the current selection. Selected unlocked layers move
                together. The add/remove buttons in Layers provide the same
                control on touch screens. Press Control or Command plus A to
                select every layer. Dragged layers snap to canvas and visible
                layer edges and centers; hold Alt or Option for free movement.
                Double-click text, or press Enter on selected text, to edit it
                directly on the stage. For exact keyboard resizing and rotation,
                use Width, Height, and Rotation in the Design inspector.
              </span>
              {inspectorTab === 'design' ? (
                <>
                  <kbd>⌘/Ctrl+S save</kbd>
                  <kbd>⌘/Ctrl+C/X/V layer</kbd>
                  <kbd>⌫ delete</kbd>
                  <kbd>⌥ bypass snap</kbd>
                </>
              ) : null}
            </div>
            <output aria-live="polite" className="workspace-notice">
              {displayedNotice}
            </output>
            <fieldset className="zoom-control" aria-label="Canvas zoom">
              <button
                aria-label="Zoom out"
                disabled={zoom <= 50}
                onClick={() => setZoom((value) => Math.max(50, value - 10))}
                type="button"
              >
                −
              </button>
              <span>{zoom}%</span>
              <button
                aria-label="Zoom in"
                disabled={zoom >= 160}
                onClick={() => setZoom((value) => Math.min(160, value + 10))}
                type="button"
              >
                +
              </button>
              <button
                aria-label="Fit canvas"
                className="zoom-fit"
                disabled={zoom === 100}
                onClick={() => setZoom(100)}
                type="button"
              >
                Fit
              </button>
            </fieldset>
          </div>

          <div
            className="canvas-stage"
            id="scene-canvas"
            onClick={() => setSelectedElementId('')}
            onDragEnter={(event) => {
              if (!hasFileDrag(event.dataTransfer.types)) return;
              event.preventDefault();
              setImageDropActive(true);
            }}
            onDragLeave={(event) => {
              const nextTarget = event.relatedTarget;
              if (
                nextTarget instanceof Node &&
                event.currentTarget.contains(nextTarget)
              )
                return;
              setImageDropActive(false);
            }}
            onDragOver={(event) => {
              if (!hasFileDrag(event.dataTransfer.types)) return;
              event.preventDefault();
              event.dataTransfer.dropEffect = 'copy';
              setImageDropActive(true);
            }}
            onDrop={(event) => {
              if (!hasFileDrag(event.dataTransfer.types)) return;
              event.preventDefault();
              setImageDropActive(false);
              const files = Array.from(event.dataTransfer.files);
              const image = findSupportedImageFile(files) ?? files[0];
              void uploadImage(image);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Escape') setSelectedElementId('');
            }}
            ref={canvasStage}
            role="presentation"
          >
            {imageDropActive ? (
              <output aria-live="polite" className="canvas-drop-overlay">
                <ImagePlus aria-hidden="true" />
                <strong>Drop image onto this scene</strong>
                <span>PNG or WebP · validated before it is added</span>
              </output>
            ) : null}
            <div
              className="artboard-frame"
              style={{ width: `${artboardWidth}px` }}
            >
              <SceneView
                alignmentGuides={activeAlignmentGuides}
                editingTextId={editingTextElementId}
                interactive
                onBeginTextEdit={beginTextEditing}
                onEndTextEdit={finishTextEditing}
                onElementRef={(elementId, node) => {
                  if (node) canvasElementRefs.current.set(elementId, node);
                  else canvasElementRefs.current.delete(elementId);
                }}
                onKeyboardNudge={nudgeElement}
                onKeyboardNudgeEnd={endHistoryTransaction}
                onPlaybackComplete={finishCanvasPreview}
                onPointerAction={beginPointerAction}
                onSelect={selectElement}
                onTextChange={changeTextOnCanvas}
                playingElementId={
                  previewScope === 'selected'
                    ? (selectedElement?.id ?? '__no-selection__')
                    : undefined
                }
                playingKey={canvasPreviewKey}
                scene={activeScene}
                selectedId={selectedElementId}
                selectedIds={selectedElementIdSet}
              />
            </div>
          </div>

          {inspectorTab === 'motion' ? (
            <section
              aria-label="Preview controls"
              className="preview-dock"
              data-running={previewRunning || undefined}
            >
              <div className="preview-controls">
                <button
                  aria-label={
                    previewRunning ? 'Replay preview' : 'Play preview'
                  }
                  className="preview-play-button"
                  onClick={() => startCanvasPreview()}
                  type="button"
                >
                  <Flag aria-hidden="true" fill="currentColor" />
                  <span>{previewRunning ? 'Replay' : 'Play'}</span>
                </button>
                <button
                  aria-label="Stop preview"
                  className="preview-stop-button"
                  disabled={!previewRunning}
                  onClick={stopCanvasPreview}
                  type="button"
                >
                  <Square aria-hidden="true" fill="currentColor" />
                  <span>Stop</span>
                </button>
              </div>

              <fieldset aria-label="Preview scope" className="preview-scope">
                <button
                  aria-pressed={previewScope === 'selected'}
                  disabled={previewRunning}
                  onClick={() => setPreviewScope('selected')}
                  type="button"
                >
                  Selected
                </button>
                <button
                  aria-pressed={previewScope === 'scene'}
                  disabled={previewRunning}
                  onClick={() => setPreviewScope('scene')}
                  type="button"
                >
                  Scene
                </button>
              </fieldset>

              <div aria-live="polite" className="preview-status">
                <span>{previewRunning ? 'Playing' : 'Ready'}</span>
                <strong>
                  {previewScope === 'selected'
                    ? (selectedElement?.name ?? 'No layer selected')
                    : activeScene.name}
                </strong>
                <small>{formatPreviewDuration(previewDurationMs)}</small>
                <span aria-hidden="true" className="preview-progress">
                  <span
                    className="preview-progress-fill"
                    key={canvasPreviewKey}
                    style={
                      {
                        '--preview-duration': `${Math.max(previewDurationMs, 1)}ms`,
                      } as CSSProperties
                    }
                  />
                </span>
              </div>
            </section>
          ) : null}

          <nav aria-label="Chapters" className="chapter-strip">
            <div className="chapter-strip-copy">
              <span>WORK STRUCTURE</span>
              <strong>
                Chapter {chapterIndex + 1} / {project.chapters.length}
              </strong>
            </div>
            <div aria-label="Chapters" className="chapter-tabs" role="tablist">
              {project.chapters.map((chapter, index) => (
                <button
                  aria-label={`Chapter ${index + 1}: ${chapter.title}`}
                  aria-selected={chapter.id === activeChapter.id}
                  className="chapter-tab"
                  data-active={chapter.id === activeChapter.id || undefined}
                  key={chapter.id}
                  onClick={() => selectChapter(chapter)}
                  onKeyDown={(event) => {
                    const nextIndex = getTabIndexForKey(
                      index,
                      project.chapters.length,
                      event.key,
                    );
                    if (nextIndex === null) return;
                    event.preventDefault();
                    const nextChapter = project.chapters[nextIndex];
                    selectChapter(nextChapter);
                    window.requestAnimationFrame(() =>
                      chapterButtonRefs.current.get(nextChapter.id)?.focus(),
                    );
                  }}
                  ref={(node) => {
                    if (node) chapterButtonRefs.current.set(chapter.id, node);
                    else chapterButtonRefs.current.delete(chapter.id);
                  }}
                  role="tab"
                  tabIndex={chapter.id === activeChapter.id ? 0 : -1}
                  type="button"
                >
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <strong>{chapter.title}</strong>
                  <small>
                    {chapter.scenes.length}{' '}
                    {chapter.scenes.length === 1 ? 'scene' : 'scenes'}
                  </small>
                </button>
              ))}
            </div>
            <Button
              className="chapter-action"
              onClick={addChapter}
              variant="outline"
            >
              <Plus />
              Chapter
            </Button>
            <Button
              aria-label="Move chapter earlier"
              className="chapter-icon-action"
              disabled={chapterIndex === 0}
              onClick={() => moveChapter(-1)}
              size="icon"
              variant="outline"
            >
              <ArrowLeft />
            </Button>
            <Button
              aria-label="Move chapter later"
              className="chapter-icon-action"
              disabled={chapterIndex === project.chapters.length - 1}
              onClick={() => moveChapter(1)}
              size="icon"
              variant="outline"
            >
              <ArrowRight />
            </Button>
            <Button
              aria-label="Delete chapter"
              className="chapter-icon-action"
              disabled={project.chapters.length === 1}
              onClick={deleteChapter}
              size="icon"
              variant="destructive"
            >
              <Trash2 />
            </Button>
          </nav>

          <footer className="scene-strip">
            <div className="scene-strip-copy" title={activeChapter.title}>
              <span>{activeChapter.title}</span>
              <strong>
                Scene {sceneIndex + 1} / {activeChapter.scenes.length}
              </strong>
            </div>
            <div aria-label="Scenes" className="scene-tabs" role="tablist">
              {activeChapter.scenes.map((scene, index) => (
                <button
                  aria-controls="scene-canvas"
                  aria-label={`Scene ${index + 1}: ${scene.name}`}
                  aria-selected={scene.id === activeScene.id}
                  className="scene-thumbnail"
                  data-active={scene.id === activeScene.id || undefined}
                  key={scene.id}
                  onClick={() => {
                    resetTransientCanvasState();
                    endHistoryTransaction();
                    setActiveSceneId(scene.id);
                    setSelectedElementId(scene.elements.at(-1)?.id ?? '');
                  }}
                  onKeyDown={(event) => {
                    const nextIndex = getTabIndexForKey(
                      index,
                      activeChapter.scenes.length,
                      event.key,
                    );
                    if (nextIndex === null) return;
                    event.preventDefault();
                    const nextScene = activeChapter.scenes[nextIndex];
                    resetTransientCanvasState();
                    endHistoryTransaction();
                    setActiveSceneId(nextScene.id);
                    setSelectedElementId(nextScene.elements.at(-1)?.id ?? '');
                    window.requestAnimationFrame(() =>
                      sceneButtonRefs.current.get(nextScene.id)?.focus(),
                    );
                  }}
                  ref={(node) => {
                    if (node) sceneButtonRefs.current.set(scene.id, node);
                    else sceneButtonRefs.current.delete(scene.id);
                  }}
                  role="tab"
                  style={{ background: scene.background }}
                  tabIndex={scene.id === activeScene.id ? 0 : -1}
                  type="button"
                >
                  <div aria-hidden="true" className="scene-thumbnail-preview">
                    <SceneView
                      elementLimit={MAX_SCENE_THUMBNAIL_ELEMENTS}
                      scene={scene}
                    />
                  </div>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <small>{scene.name}</small>
                </button>
              ))}
            </div>
            <Button
              className="scene-action"
              onClick={addScene}
              variant="outline"
            >
              <Plus />
              New
            </Button>
            <Button
              aria-label="Move scene earlier"
              className="scene-icon-action"
              disabled={sceneIndex === 0}
              onClick={() => moveScene(-1)}
              size="icon"
              variant="outline"
            >
              <ArrowLeft />
            </Button>
            <Button
              aria-label="Move scene later"
              className="scene-icon-action"
              disabled={sceneIndex === activeChapter.scenes.length - 1}
              onClick={() => moveScene(1)}
              size="icon"
              variant="outline"
            >
              <ArrowRight />
            </Button>
            <Button
              aria-label="Duplicate scene"
              className="scene-icon-action"
              onClick={duplicateScene}
              size="icon"
              variant="outline"
            >
              <Copy />
            </Button>
            <Button
              aria-label="Delete scene"
              className="scene-icon-action"
              disabled={activeChapter.scenes.length === 1}
              onClick={deleteScene}
              size="icon"
              variant="destructive"
            >
              <Trash2 />
            </Button>
          </footer>
        </section>

        <aside
          className="inspector-panel"
          aria-label="Selected element settings"
          data-workspace={inspectorTab}
          id="blocks-pane"
        >
          <div
            aria-label="Element property sections"
            className="inspector-tabs"
            role="tablist"
          >
            <button
              aria-controls="inspector-panel"
              aria-selected={inspectorTab === 'design'}
              id="inspector-tab-design"
              onClick={() => setInspectorTab('design')}
              onKeyDown={handleInspectorTabKeyDown}
              role="tab"
              tabIndex={inspectorTab === 'design' ? 0 : -1}
              type="button"
            >
              Design
            </button>
            <button
              aria-controls="inspector-panel"
              aria-selected={inspectorTab === 'motion'}
              id="inspector-tab-motion"
              onClick={() => setInspectorTab('motion')}
              onKeyDown={handleInspectorTabKeyDown}
              role="tab"
              tabIndex={inspectorTab === 'motion' ? 0 : -1}
              type="button"
            >
              Blocks
            </button>
          </div>

          <div
            aria-labelledby={`inspector-tab-${inspectorTab}`}
            className="inspector-content"
            id="inspector-panel"
            role="tabpanel"
          >
            {!selectedElement ? (
              inspectorTab === 'motion' ? (
                <div className="empty-inspector block-empty-state">
                  <Code2 />
                  <strong>Choose a layer to attach blocks</strong>
                  <p>
                    The block workspace stays visible here. Pick a layer, then
                    build its animation program.
                  </p>
                  <div className="block-layer-picker">
                    {activeScene.elements
                      .filter((element) => element.visible)
                      .map((element) => (
                        <Button
                          key={element.id}
                          onClick={() => setSelectedElementId(element.id)}
                          variant="outline"
                        >
                          {element.name}
                        </Button>
                      ))}
                    {activeScene.elements.length === 0 ? (
                      <Button
                        onClick={() => {
                          if (addElement('shape')) setInspectorTab('motion');
                        }}
                      >
                        Add a shape layer
                      </Button>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="empty-inspector">
                  <MousePointer2 />
                  <strong>Select an element</strong>
                  <p>Click a layer or an item on the canvas to edit it.</p>
                </div>
              )
            ) : (
              <>
                {inspectorTab === 'design' && selectedElements.length > 1 ? (
                  <section
                    aria-labelledby="selection-layout-title"
                    className="selection-layout-panel"
                  >
                    <header>
                      <div>
                        <Layers3 aria-hidden="true" />
                        <strong id="selection-layout-title">
                          {selectedElements.length} layers
                        </strong>
                      </div>
                      <span>{unlockedSelectedElementIds.length} movable</span>
                    </header>
                    <fieldset className="selection-layout-actions">
                      <legend className="sr-only">
                        Align and distribute selected layers
                      </legend>
                      <button
                        aria-label="Align selected layers left"
                        disabled={unlockedSelectedElementIds.length < 2}
                        onClick={() => alignSelection('left')}
                        title="Align left"
                        type="button"
                      >
                        <AlignStartVertical aria-hidden="true" />
                        <span>Left</span>
                      </button>
                      <button
                        aria-label="Align selected layers to horizontal center"
                        disabled={unlockedSelectedElementIds.length < 2}
                        onClick={() => alignSelection('center')}
                        title="Center horizontally"
                        type="button"
                      >
                        <AlignCenterVertical aria-hidden="true" />
                        <span>Center</span>
                      </button>
                      <button
                        aria-label="Align selected layers right"
                        disabled={unlockedSelectedElementIds.length < 2}
                        onClick={() => alignSelection('right')}
                        title="Align right"
                        type="button"
                      >
                        <AlignEndVertical aria-hidden="true" />
                        <span>Right</span>
                      </button>
                      <button
                        aria-label="Distribute selected layers horizontally"
                        disabled={unlockedSelectedElementIds.length < 3}
                        onClick={() => distributeSelection('horizontal')}
                        title="Distribute horizontally"
                        type="button"
                      >
                        <AlignHorizontalSpaceBetween aria-hidden="true" />
                        <span>Space X</span>
                      </button>
                      <button
                        aria-label="Align selected layers to top"
                        disabled={unlockedSelectedElementIds.length < 2}
                        onClick={() => alignSelection('top')}
                        title="Align top"
                        type="button"
                      >
                        <AlignStartHorizontal aria-hidden="true" />
                        <span>Top</span>
                      </button>
                      <button
                        aria-label="Align selected layers to vertical middle"
                        disabled={unlockedSelectedElementIds.length < 2}
                        onClick={() => alignSelection('middle')}
                        title="Center vertically"
                        type="button"
                      >
                        <AlignCenterHorizontal aria-hidden="true" />
                        <span>Middle</span>
                      </button>
                      <button
                        aria-label="Align selected layers to bottom"
                        disabled={unlockedSelectedElementIds.length < 2}
                        onClick={() => alignSelection('bottom')}
                        title="Align bottom"
                        type="button"
                      >
                        <AlignEndHorizontal aria-hidden="true" />
                        <span>Bottom</span>
                      </button>
                      <button
                        aria-label="Distribute selected layers vertically"
                        disabled={unlockedSelectedElementIds.length < 3}
                        onClick={() => distributeSelection('vertical')}
                        title="Distribute vertically"
                        type="button"
                      >
                        <AlignVerticalSpaceBetween aria-hidden="true" />
                        <span>Space Y</span>
                      </button>
                    </fieldset>
                    <footer>
                      <span>Modifier-click or layer + to select</span>
                      <kbd>⌘/Ctrl+A</kbd>
                    </footer>
                  </section>
                ) : null}
                <div className="selected-element-card">
                  <span
                    className={`element-swatch swatch-${selectedElement.type}`}
                    style={{ background: selectedElement.fill }}
                  />
                  <div>
                    <small>
                      {selectedElements.length > 1
                        ? 'Primary layer'
                        : 'Selected'}
                    </small>
                    <strong>{selectedElement.name}</strong>
                  </div>
                  <Button
                    aria-label={
                      selectedElements.length > 1
                        ? `Duplicate ${selectedElements.length} selected layers`
                        : 'Duplicate selected element'
                    }
                    onClick={duplicateSelection}
                    size="icon-sm"
                    variant="outline"
                  >
                    <Copy />
                  </Button>
                  <Button
                    aria-label={
                      selectedElements.length > 1
                        ? `Delete ${selectedElements.length} selected layers`
                        : 'Delete selected element'
                    }
                    onClick={() => deleteSelection()}
                    size="icon-sm"
                    variant="destructive"
                  >
                    <Trash2 />
                  </Button>
                </div>

                {inspectorTab === 'design' ? (
                  <div className="property-stack">
                    <label htmlFor="selected-layer-name">
                      <span>Layer name</span>
                      <Input
                        {...textHistoryProps}
                        id="selected-layer-name"
                        maxLength={MAX_ELEMENT_NAME_LENGTH}
                        onChange={(event) =>
                          updateElement(
                            selectedElement.id,
                            (item) => {
                              item.name = event.target.value;
                            },
                            `element:${selectedElement.id}:name`,
                          )
                        }
                        value={selectedElement.name}
                      />
                    </label>
                    {selectedElement.type === 'text' ||
                    selectedElement.type === 'speech' ? (
                      <label htmlFor="selected-layer-text">
                        <span>Text</span>
                        <Textarea
                          {...textHistoryProps}
                          id="selected-layer-text"
                          maxLength={MAX_ELEMENT_TEXT_LENGTH}
                          onChange={(event) =>
                            updateElement(
                              selectedElement.id,
                              (item) => {
                                item.text = event.target.value;
                              },
                              `element:${selectedElement.id}:text`,
                            )
                          }
                          value={selectedElement.text ?? ''}
                        />
                      </label>
                    ) : null}
                    {selectedTypography ? (
                      <section
                        aria-labelledby="typography-panel-title"
                        className="typography-panel"
                      >
                        <div className="typography-panel-head">
                          <div>
                            <Type aria-hidden="true" />
                            <strong id="typography-panel-title">
                              Typography
                            </strong>
                          </div>
                          <span
                            aria-hidden="true"
                            className="typography-sample"
                            style={{
                              fontFamily:
                                ELEMENT_FONT_STACKS[
                                  selectedTypography.fontPreset
                                ],
                              fontWeight: selectedTypography.fontWeight,
                            }}
                          >
                            Aa
                          </span>
                        </div>
                        <div className="typography-grid">
                          <label
                            className="typography-font-field"
                            htmlFor="selected-layer-font"
                          >
                            <span>Font</span>
                            <NativeSelect
                              id="selected-layer-font"
                              onChange={(event) =>
                                updateElement(selectedElement.id, (item) => {
                                  applyTypographyPatch(item, {
                                    fontPreset: event.target
                                      .value as ElementFontPreset,
                                  });
                                })
                              }
                              size="sm"
                              value={selectedTypography.fontPreset}
                            >
                              {ELEMENT_FONT_PRESETS.map((fontPreset) => (
                                <NativeSelectOption
                                  key={fontPreset}
                                  value={fontPreset}
                                >
                                  {ELEMENT_FONT_LABELS[fontPreset]}
                                </NativeSelectOption>
                              ))}
                            </NativeSelect>
                          </label>
                          <label htmlFor="selected-layer-font-size">
                            <span>Size</span>
                            <Input
                              {...typographyFontSizeDraftProps}
                              id="selected-layer-font-size"
                              max={MAX_ELEMENT_FONT_SIZE}
                              min={MIN_ELEMENT_FONT_SIZE}
                              step="1"
                              type="number"
                            />
                          </label>
                          <label htmlFor="selected-layer-font-weight">
                            <span>Weight</span>
                            <NativeSelect
                              id="selected-layer-font-weight"
                              onChange={(event) =>
                                updateElement(selectedElement.id, (item) => {
                                  applyTypographyPatch(item, {
                                    fontWeight: Number(
                                      event.target.value,
                                    ) as ElementFontWeight,
                                  });
                                })
                              }
                              size="sm"
                              value={String(selectedTypography.fontWeight)}
                            >
                              {ELEMENT_FONT_WEIGHTS.map((fontWeight) => (
                                <NativeSelectOption
                                  key={fontWeight}
                                  value={String(fontWeight)}
                                >
                                  {ELEMENT_WEIGHT_LABELS[fontWeight]}
                                </NativeSelectOption>
                              ))}
                            </NativeSelect>
                          </label>
                          <fieldset className="typography-alignment-field">
                            <legend>Alignment</legend>
                            <div className="typography-alignment-buttons">
                              {ELEMENT_TEXT_ALIGNMENTS.map((textAlign) => {
                                const AlignmentIcon =
                                  ELEMENT_ALIGNMENT_ICONS[textAlign];
                                return (
                                  <Button
                                    aria-label={`Align text ${textAlign}`}
                                    aria-pressed={
                                      selectedTypography.textAlign === textAlign
                                    }
                                    key={textAlign}
                                    onClick={() =>
                                      updateElement(
                                        selectedElement.id,
                                        (item) => {
                                          applyTypographyPatch(item, {
                                            textAlign,
                                          });
                                        },
                                      )
                                    }
                                    size="icon-sm"
                                    title={`Align ${textAlign}`}
                                    type="button"
                                    variant="outline"
                                  >
                                    <AlignmentIcon />
                                  </Button>
                                );
                              })}
                            </div>
                          </fieldset>
                          <label htmlFor="selected-layer-line-height">
                            <span>Line height</span>
                            <Input
                              {...typographyLineHeightDraftProps}
                              id="selected-layer-line-height"
                              max={MAX_ELEMENT_LINE_HEIGHT}
                              min={MIN_ELEMENT_LINE_HEIGHT}
                              step="0.05"
                              type="number"
                            />
                          </label>
                          <label htmlFor="selected-layer-letter-spacing">
                            <span>Letter spacing (em)</span>
                            <Input
                              {...typographyLetterSpacingDraftProps}
                              id="selected-layer-letter-spacing"
                              max={MAX_ELEMENT_LETTER_SPACING}
                              min={MIN_ELEMENT_LETTER_SPACING}
                              step="0.01"
                              type="number"
                            />
                          </label>
                        </div>
                      </section>
                    ) : null}
                    {selectedElement.type !== 'image' ? (
                      <label className="color-control">
                        <span>Color</span>
                        <input
                          {...continuousHistoryProps}
                          aria-label="Element color"
                          onChange={(event) =>
                            updateElement(
                              selectedElement.id,
                              (item) => {
                                item.fill = event.target.value;
                              },
                              `element:${selectedElement.id}:fill`,
                            )
                          }
                          type="color"
                          value={selectedElement.fill}
                        />
                        <output>{selectedElement.fill}</output>
                      </label>
                    ) : null}
                    <div className="property-grid">
                      {(['x', 'y', 'width', 'height'] as const).map(
                        // oxlint-disable-next-line react/react-compiler -- input callbacks access editor history refs only after user interaction.
                        (property) => (
                          <label key={property}>
                            <span>{property.toUpperCase()}</span>
                            <Input
                              {...numericDraftProps(
                                `element:${selectedElement.id}:${property}`,
                                Number(selectedElement[property].toFixed(2)),
                                (candidate) => {
                                  if (!Number.isFinite(candidate)) {
                                    return Number(
                                      selectedElement[property].toFixed(2),
                                    );
                                  }
                                  return Number(candidate.toFixed(2));
                                },
                                (candidate) =>
                                  updateElement(
                                    selectedElement.id,
                                    (item) => {
                                      item[property] = candidate;
                                    },
                                    `element:${selectedElement.id}:${property}`,
                                  ),
                              )}
                              max={
                                property === 'x'
                                  ? CANVAS_WIDTH - selectedElement.width
                                  : property === 'y'
                                    ? CANVAS_HEIGHT - selectedElement.height
                                    : property === 'width'
                                      ? CANVAS_WIDTH
                                      : CANVAS_HEIGHT
                              }
                              min={
                                property === 'width'
                                  ? MIN_ELEMENT_WIDTH
                                  : property === 'height'
                                    ? MIN_ELEMENT_HEIGHT
                                    : 0
                              }
                              step="0.1"
                              type="number"
                            />
                          </label>
                        ),
                      )}
                    </div>
                    <label className="range-control">
                      <span>Rotation</span>
                      <output>{selectedElement.rotation}°</output>
                      <input
                        {...continuousHistoryProps}
                        max="180"
                        min="-180"
                        onChange={(event) =>
                          updateElement(
                            selectedElement.id,
                            (item) => {
                              item.rotation = Number(event.target.value);
                            },
                            `element:${selectedElement.id}:rotation`,
                          )
                        }
                        type="range"
                        value={selectedElement.rotation}
                      />
                    </label>
                    <label className="range-control">
                      <span>Opacity</span>
                      <output>
                        {Math.round(selectedElement.opacity * 100)}%
                      </output>
                      <input
                        {...continuousHistoryProps}
                        max="100"
                        min="0"
                        onChange={(event) =>
                          updateElement(
                            selectedElement.id,
                            (item) => {
                              item.opacity = Number(event.target.value) / 100;
                            },
                            `element:${selectedElement.id}:opacity`,
                          )
                        }
                        type="range"
                        value={Math.round(selectedElement.opacity * 100)}
                      />
                    </label>
                    <div className="visibility-row">
                      <Button
                        onClick={() =>
                          updateElement(selectedElement.id, (item) => {
                            item.visible = !item.visible;
                          })
                        }
                        variant="outline"
                      >
                        {selectedElement.visible ? <Eye /> : <EyeOff />}
                        {selectedElement.visible ? 'Visible' : 'Hidden'}
                      </Button>
                      <Button
                        onClick={() =>
                          updateElement(selectedElement.id, (item) => {
                            item.locked = !item.locked;
                          })
                        }
                        variant="outline"
                      >
                        {selectedElement.locked ? <Lock /> : <Unlock />}
                        {selectedElement.locked ? 'Locked' : 'Unlocked'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <DndContext
                    accessibility={{
                      screenReaderInstructions: {
                        draggable:
                          'Press space to pick up a block. Use the arrow keys to choose its position, then press space to drop or Escape to cancel.',
                      },
                    }}
                    collisionDetection={closestCenter}
                    id={`motion-program-${selectedElement.id}`}
                    onDragCancel={cancelMotionDrag}
                    onDragEnd={finishMotionDrag}
                    onDragStart={startMotionDrag}
                    sensors={motionSensors}
                  >
                    <div
                      className="property-stack motion-properties"
                      ref={motionProperties}
                      style={blockWorkspaceStyle}
                    >
                      <section className="block-workspace-intro">
                        <div>
                          <span>BLOCKS</span>
                          <strong>{selectedElement.name}</strong>
                        </div>
                        <small>
                          {selectedMotionBlockCount} blocks ·{' '}
                          {
                            compileElementMotion(selectedElement)
                              .sequenceDurationMs
                          }{' '}
                          ms
                        </small>
                        <div className="block-workspace-actions">
                          <Button
                            onClick={() => {
                              setInspectorTab('design');
                              setMobileStudioPane('blocks');
                            }}
                            size="sm"
                            variant="outline"
                          >
                            <Pencil />
                            Edit layer
                          </Button>
                          <Button
                            onClick={() => startCanvasPreview('selected')}
                            size="sm"
                          >
                            <Flag fill="currentColor" />
                            Run
                          </Button>
                        </div>
                      </section>

                      <section
                        className="block-palette"
                        aria-labelledby="block-palette-title"
                      >
                        <header className="block-palette-header">
                          <div>
                            <span>LIBRARY</span>
                            <h2 id="block-palette-title">
                              {normalizedBlockPaletteSearch
                                ? 'Search results'
                                : blockPaletteCategory === 'all'
                                  ? 'All blocks'
                                  : (ADDABLE_MOTION_BLOCK_CATEGORIES.find(
                                      (category) =>
                                        category.id === blockPaletteCategory,
                                    )?.label ?? 'Blocks')}
                            </h2>
                          </div>
                          <small>
                            {MAX_MOTION_BLOCKS - selectedMotionBlockCount} left
                          </small>
                        </header>

                        {motionInsertionParent ? (
                          <output
                            aria-live="polite"
                            className="block-insertion-target"
                          >
                            <div>
                              <ArrowRight aria-hidden="true" />
                              <span>
                                Adding inside{' '}
                                <strong>{motionInsertionParent.label}</strong>
                                {motionInsertionParent.kind === 'parallel'
                                  ? ' · compatible channels only'
                                  : ''}
                              </span>
                            </div>
                            <button
                              onClick={() => {
                                setMotionInsertionParentId(null);
                                setNotice('Nested block insertion cancelled');
                              }}
                              type="button"
                            >
                              Cancel
                            </button>
                          </output>
                        ) : null}

                        <div className="block-palette-search">
                          <Search aria-hidden="true" />
                          <Input
                            aria-controls="block-palette-results"
                            aria-describedby="block-palette-status"
                            aria-label={`Search ${ADDABLE_MOTION_BLOCK_CATALOG.length} editable blocks`}
                            onChange={(event) =>
                              setBlockPaletteSearch(event.target.value)
                            }
                            onKeyDown={(event) => {
                              if (
                                event.key === 'Escape' &&
                                blockPaletteSearch
                              ) {
                                event.preventDefault();
                                setBlockPaletteSearch('');
                              }
                            }}
                            placeholder="Search blocks"
                            ref={blockPaletteSearchInput}
                            type="search"
                            value={blockPaletteSearch}
                          />
                          {blockPaletteSearch ? (
                            <button
                              aria-label="Clear block search"
                              className="block-palette-search-clear"
                              onClick={() => setBlockPaletteSearch('')}
                              type="button"
                            >
                              ×
                            </button>
                          ) : null}
                        </div>

                        <div className="block-palette-meta">
                          <output
                            aria-atomic="true"
                            aria-live="polite"
                            id="block-palette-status"
                          >
                            {visibleBlockPaletteEntries.length} of{' '}
                            {ADDABLE_MOTION_BLOCK_CATALOG.length} blocks
                            {normalizedBlockPaletteSearch
                              ? ' match your search'
                              : ''}
                          </output>
                          <span>
                            {ADDABLE_MOTION_BLOCK_CATEGORIES.length} categories
                          </span>
                        </div>

                        <div className="block-palette-layout">
                          <nav
                            aria-label="Block categories"
                            className="block-category-rail"
                          >
                            <ul className="block-category-list">
                              <li>
                                <button
                                  aria-pressed={
                                    Boolean(normalizedBlockPaletteSearch) ||
                                    blockPaletteCategory === 'all'
                                  }
                                  className="block-category-chip"
                                  data-active={
                                    Boolean(normalizedBlockPaletteSearch) ||
                                    blockPaletteCategory === 'all' ||
                                    undefined
                                  }
                                  data-category="all"
                                  onClick={() => {
                                    setBlockPaletteCategory('all');
                                    setBlockPaletteSearch('');
                                  }}
                                  type="button"
                                >
                                  <BlockCategoryIcon category="all" />
                                  <span>All</span>
                                  <small>
                                    {ADDABLE_MOTION_BLOCK_CATALOG.length}
                                  </small>
                                </button>
                              </li>
                              {ADDABLE_MOTION_BLOCK_CATEGORIES.map(
                                (category) => {
                                  const categoryId =
                                    category.id as AddableMotionBlockCategory;
                                  const active =
                                    !normalizedBlockPaletteSearch &&
                                    blockPaletteCategory === categoryId;
                                  return (
                                    <li key={category.id}>
                                      <button
                                        aria-label={`${category.label}, ${blockPaletteCategoryCounts.get(category.id) ?? 0} blocks`}
                                        aria-pressed={active}
                                        className="block-category-chip"
                                        data-active={active || undefined}
                                        data-category={category.id}
                                        onClick={() => {
                                          setBlockPaletteCategory(categoryId);
                                          setBlockPaletteSearch('');
                                        }}
                                        type="button"
                                      >
                                        <BlockCategoryIcon
                                          category={categoryId}
                                        />
                                        <span>{category.label}</span>
                                        <small>
                                          {blockPaletteCategoryCounts.get(
                                            category.id,
                                          ) ?? 0}
                                        </small>
                                      </button>
                                    </li>
                                  );
                                },
                              )}
                            </ul>
                          </nav>

                          <div
                            className="block-palette-results"
                            id="block-palette-results"
                          >
                            {visibleBlockPaletteGroups.length ? (
                              visibleBlockPaletteGroups.map((group) => (
                                <section
                                  aria-labelledby={`block-group-${group.id}`}
                                  className="block-palette-group"
                                  data-category={group.id}
                                  key={group.id}
                                >
                                  <header className="block-palette-group-heading">
                                    <span aria-hidden="true" />
                                    <div>
                                      <h3 id={`block-group-${group.id}`}>
                                        {group.label}
                                      </h3>
                                      <p>{group.description}</p>
                                    </div>
                                    <small>{group.entries.length}</small>
                                  </header>
                                  <ul className="block-palette-list">
                                    {group.entries.map((entry) => (
                                      <li key={entry.kind}>
                                        <DraggableBlockPaletteCard
                                          disabled={
                                            !canAddPaletteBlock(entry.kind)
                                          }
                                          dragDisabled={false}
                                          elementId={selectedElement.id}
                                          entry={entry}
                                          onAdd={() =>
                                            addMotionBlock(entry.kind)
                                          }
                                        />
                                      </li>
                                    ))}
                                  </ul>
                                </section>
                              ))
                            ) : (
                              <output className="block-palette-empty">
                                <Search aria-hidden="true" />
                                <strong>No matching blocks</strong>
                                <span>
                                  Try a motion, effect, field, or unit.
                                </span>
                                <button
                                  onClick={() => setBlockPaletteSearch('')}
                                  type="button"
                                >
                                  Clear search
                                </button>
                              </output>
                            )}
                          </div>
                        </div>

                        <footer className="block-palette-footer">
                          <Button
                            onClick={() => {
                              setCatalogTab('motion');
                              setCatalogOpen(true);
                            }}
                            variant="outline"
                          >
                            <LibraryBig />
                            Presets
                          </Button>
                        </footer>
                      </section>

                      <div className="block-program-heading">
                        <div>
                          <span>SCRIPT</span>
                          <strong>
                            {selectedMotionBlockCount} blocks ·{' '}
                            {
                              compileElementMotion(selectedElement)
                                .sequenceDurationMs
                            }{' '}
                            ms
                          </strong>
                        </div>
                        <small>{selectedElement.name}</small>
                      </div>

                      <MotionProgramDropzone
                        active={Boolean(activeMotionDrag)}
                        itemIds={selectedElement.motion.blocks
                          .filter(
                            (block) => !isMotionEventBlockKind(block.kind),
                          )
                          .map((block) => programDragId(block.id))}
                        label={`${selectedElement.name} animation blocks`}
                      >
                        {selectedElement.motion.blocks.map(
                          // oxlint-disable-next-line react/react-compiler -- callbacks only access editor refs after input events.
                          (block, blockIndex) => {
                            const isEvent = isMotionEventBlockKind(block.kind);
                            const isAction =
                              !isMotionEventBlockKind(block.kind) &&
                              block.kind !== 'wait';
                            const isBounce = block.kind === 'bounce';
                            const catalogEntry = MOTION_BLOCK_CATALOG.find(
                              (entry) => entry.kind === block.kind,
                            );
                            const animationSourceCandidates =
                              block.kind === 'animation-finish'
                                ? activeScene.elements.filter(
                                    (candidate) =>
                                      candidate.visible &&
                                      candidate.id !== selectedElement.id &&
                                      hasExecutableMotionActions(
                                        candidate.motion.blocks,
                                      ),
                                  )
                                : [];
                            const storedAnimationSourceUnavailable = Boolean(
                              block.kind === 'animation-finish' &&
                              block.sourceElementId &&
                              !animationSourceCandidates.some(
                                (candidate) =>
                                  candidate.id === block.sourceElementId,
                              ),
                            );
                            if (isMotionContainerBlockKind(block.kind)) {
                              return (
                                <SortableMotionBlock
                                  block={block}
                                  elementId={selectedElement.id}
                                  key={block.id}
                                >
                                  {(dragHandle) => (
                                    <MotionTreeBlockContent
                                      actions={motionTreeEditorActions}
                                      block={block}
                                      depth={0}
                                      dragHandle={dragHandle}
                                      indexLabel={String(
                                        blockIndex + 1,
                                      ).padStart(2, '0')}
                                      parentKind={null}
                                      siblingCount={
                                        selectedElement.motion.blocks.length - 1
                                      }
                                      siblingIndex={blockIndex - 1}
                                    />
                                  )}
                                </SortableMotionBlock>
                              );
                            }
                            const renderBlock = (
                              dragHandle: MotionBlockDragHandle | null,
                            ) => {
                              const bounceExpanded =
                                isBounce && expandedMotionBlockId === block.id;
                              const bounceDuration = block.jumps.reduce(
                                (total, jump) => total + jump.durationMs,
                                0,
                              );

                              return (
                                <>
                                  <div className="motion-block-head">
                                    {dragHandle ? (
                                      <button
                                        {...dragHandle.attributes}
                                        {...(dragHandle.listeners ?? {})}
                                        aria-label={`Drag ${block.label}, step ${blockIndex}. Use arrow keys after picking it up, or use the move menu.`}
                                        className="motion-block-grip motion-block-drag-handle"
                                        data-dragging={
                                          dragHandle.isDragging || undefined
                                        }
                                        ref={dragHandle.setActivatorNodeRef}
                                        title="Drag to reorder"
                                        type="button"
                                      >
                                        {String(blockIndex + 1).padStart(
                                          2,
                                          '0',
                                        )}
                                      </button>
                                    ) : (
                                      <span className="motion-block-grip">
                                        {String(blockIndex + 1).padStart(
                                          2,
                                          '0',
                                        )}
                                      </span>
                                    )}

                                    <div className="motion-block-title">
                                      <small>
                                        {block.category.toUpperCase()}
                                      </small>
                                      <strong>{block.label}</strong>
                                    </div>

                                    <div className="motion-block-inline-fields">
                                      {isEvent ? (
                                        <>
                                          <label className="motion-inline-field motion-inline-trigger">
                                            <span>Trigger</span>
                                            <NativeSelect
                                              aria-label={`${selectedElement.name} animation trigger`}
                                              onChange={(event) =>
                                                changeMotionEvent(
                                                  event.target
                                                    .value as MotionEventBlockKind,
                                                )
                                              }
                                              size="sm"
                                              value={block.kind}
                                            >
                                              {MOTION_EVENT_BLOCK_KINDS.map(
                                                (eventKind) => (
                                                  <NativeSelectOption
                                                    key={eventKind}
                                                    value={eventKind}
                                                  >
                                                    {
                                                      MOTION_BLOCK_CATALOG.find(
                                                        (entry) =>
                                                          entry.kind ===
                                                          eventKind,
                                                      )?.label
                                                    }
                                                  </NativeSelectOption>
                                                ),
                                              )}
                                            </NativeSelect>
                                          </label>
                                          {block.kind === 'animation-finish' ? (
                                            <label className="motion-inline-field motion-inline-source">
                                              <span>Source layer</span>
                                              <NativeSelect
                                                aria-label={`${selectedElement.name} source animation`}
                                                onChange={(event) =>
                                                  changeMotionEventSource(
                                                    event.target.value,
                                                  )
                                                }
                                                size="sm"
                                                value={
                                                  block.sourceElementId ?? ''
                                                }
                                              >
                                                <NativeSelectOption value="">
                                                  No source selected
                                                </NativeSelectOption>
                                                {storedAnimationSourceUnavailable ? (
                                                  <NativeSelectOption
                                                    disabled
                                                    value={
                                                      block.sourceElementId ??
                                                      ''
                                                    }
                                                  >
                                                    Source unavailable — choose
                                                    again
                                                  </NativeSelectOption>
                                                ) : null}
                                                {animationSourceCandidates.map(
                                                  (candidate) => {
                                                    const createsCycle =
                                                      wouldCreateAnimationFinishCycle(
                                                        activeScene.elements,
                                                        selectedElement.id,
                                                        candidate.id,
                                                      );
                                                    return (
                                                      <NativeSelectOption
                                                        disabled={createsCycle}
                                                        key={candidate.id}
                                                        value={candidate.id}
                                                      >
                                                        {candidate.name}
                                                        {createsCycle
                                                          ? ' — creates a cycle'
                                                          : ''}
                                                      </NativeSelectOption>
                                                    );
                                                  },
                                                )}
                                              </NativeSelect>
                                            </label>
                                          ) : null}
                                        </>
                                      ) : isBounce ? (
                                        <>
                                          <span className="motion-inline-token">
                                            {block.jumps.length}{' '}
                                            {block.jumps.length === 1
                                              ? 'jump'
                                              : 'jumps'}
                                          </span>
                                          <span className="motion-inline-token">
                                            {bounceDuration} ms
                                          </span>
                                          <button
                                            aria-controls={`bounce-editor-${block.id}`}
                                            aria-expanded={bounceExpanded}
                                            className="motion-inline-edit"
                                            onClick={() =>
                                              setExpandedMotionBlockId(
                                                bounceExpanded
                                                  ? null
                                                  : block.id,
                                              )
                                            }
                                            type="button"
                                          >
                                            <Pencil aria-hidden="true" />
                                            Path
                                          </button>
                                        </>
                                      ) : (
                                        <>
                                          {catalogEntry?.usesDirection ? (
                                            <div className="motion-inline-field motion-inline-direction">
                                              <span>Direction</span>
                                              <NativeSelect
                                                aria-label={`${block.label} direction`}
                                                onChange={(event) =>
                                                  updateMotionBlock(
                                                    block.id,
                                                    (item) => {
                                                      item.direction = event
                                                        .target
                                                        .value as MotionBlock['direction'];
                                                    },
                                                  )
                                                }
                                                size="sm"
                                                value={block.direction}
                                              >
                                                <NativeSelectOption value="left">
                                                  Left
                                                </NativeSelectOption>
                                                <NativeSelectOption value="right">
                                                  Right
                                                </NativeSelectOption>
                                                <NativeSelectOption value="up">
                                                  Up
                                                </NativeSelectOption>
                                                <NativeSelectOption value="down">
                                                  Down
                                                </NativeSelectOption>
                                              </NativeSelect>
                                            </div>
                                          ) : null}
                                          {catalogEntry?.parameters.map(
                                            (parameter) => (
                                              <label
                                                className="motion-inline-field"
                                                key={parameter.field}
                                              >
                                                <span>{parameter.label}</span>
                                                <span className="motion-inline-number">
                                                  <Input
                                                    {...numericDraftProps(
                                                      `block:${block.id}:${parameter.field}`,
                                                      block[parameter.field],
                                                      (candidate) =>
                                                        normalizeMotionBlockNumericField(
                                                          block,
                                                          parameter.field,
                                                          candidate,
                                                        ),
                                                      (candidate) =>
                                                        updateMotionBlock(
                                                          block.id,
                                                          (item) => {
                                                            item[
                                                              parameter.field
                                                            ] =
                                                              normalizeMotionBlockNumericField(
                                                                item,
                                                                parameter.field,
                                                                candidate,
                                                              );
                                                          },
                                                          `block:${block.id}:${parameter.field}`,
                                                        ),
                                                    )}
                                                    aria-label={`${block.label} ${parameter.label}`}
                                                    max={parameter.max}
                                                    min={parameter.min}
                                                    step={parameter.step}
                                                    type="number"
                                                  />
                                                  {parameter.unit ? (
                                                    <small aria-hidden="true">
                                                      {parameter.unit}
                                                    </small>
                                                  ) : null}
                                                </span>
                                              </label>
                                            ),
                                          )}
                                          <label className="motion-inline-field">
                                            <span>
                                              {block.kind === 'wait'
                                                ? 'Wait'
                                                : 'Duration'}
                                            </span>
                                            <span className="motion-inline-number motion-inline-duration">
                                              <Input
                                                {...numericDraftProps(
                                                  `block:${block.id}:duration`,
                                                  block.durationMs,
                                                  (candidate) =>
                                                    normalizeMotionBlockNumericField(
                                                      block,
                                                      'durationMs',
                                                      candidate,
                                                    ),
                                                  (candidate) =>
                                                    updateMotionBlock(
                                                      block.id,
                                                      (item) => {
                                                        item.durationMs =
                                                          normalizeMotionBlockNumericField(
                                                            item,
                                                            'durationMs',
                                                            candidate,
                                                          );
                                                      },
                                                      `block:${block.id}:duration`,
                                                    ),
                                                )}
                                                aria-label={`${block.label} ${block.kind === 'wait' ? 'wait' : 'duration'}`}
                                                max="10000"
                                                min={
                                                  block.kind === 'wait'
                                                    ? 0
                                                    : 100
                                                }
                                                step="50"
                                                type="number"
                                              />
                                              <small aria-hidden="true">
                                                ms
                                              </small>
                                            </span>
                                          </label>
                                          {isAction ? (
                                            <div className="motion-inline-field motion-inline-easing">
                                              <span>Easing</span>
                                              <NativeSelect
                                                aria-label={`${block.label} easing`}
                                                onChange={(event) =>
                                                  updateMotionBlock(
                                                    block.id,
                                                    (item) => {
                                                      item.easing = event.target
                                                        .value as Easing;
                                                    },
                                                  )
                                                }
                                                size="sm"
                                                value={block.easing}
                                              >
                                                <NativeSelectOption value="linear">
                                                  Linear
                                                </NativeSelectOption>
                                                <NativeSelectOption value="ease-out">
                                                  Ease out
                                                </NativeSelectOption>
                                                <NativeSelectOption value="ease-in-out">
                                                  Ease in/out
                                                </NativeSelectOption>
                                              </NativeSelect>
                                            </div>
                                          ) : null}
                                        </>
                                      )}
                                    </div>

                                    {!isEvent ? (
                                      <div className="motion-block-actions">
                                        <button
                                          aria-label={`${block.enabled ? 'Disable' : 'Enable'} ${block.label}`}
                                          aria-pressed={block.enabled}
                                          className="motion-block-toggle"
                                          onClick={() =>
                                            updateMotionBlock(
                                              block.id,
                                              (item) => {
                                                item.enabled = !item.enabled;
                                              },
                                            )
                                          }
                                          title={
                                            block.enabled
                                              ? 'Disable block'
                                              : 'Enable block'
                                          }
                                          type="button"
                                        >
                                          {block.enabled ? <Eye /> : <EyeOff />}
                                        </button>
                                        <DropdownMenu>
                                          <DropdownMenuTrigger
                                            render={
                                              <button
                                                aria-label={`More actions for ${block.label}`}
                                                type="button"
                                              />
                                            }
                                          >
                                            <Ellipsis />
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent
                                            align="end"
                                            className="min-w-44"
                                            sideOffset={6}
                                          >
                                            <DropdownMenuItem
                                              className="min-h-9 px-2.5"
                                              disabled={blockIndex <= 1}
                                              onClick={() =>
                                                moveMotionBlock(block.id, -1)
                                              }
                                            >
                                              <ArrowUp />
                                              Move earlier
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                              className="min-h-9 px-2.5"
                                              disabled={
                                                blockIndex ===
                                                selectedElement.motion.blocks
                                                  .length -
                                                  1
                                              }
                                              onClick={() =>
                                                moveMotionBlock(block.id, 1)
                                              }
                                            >
                                              <ArrowDown />
                                              Move later
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                              className="min-h-9 px-2.5"
                                              onClick={() =>
                                                duplicateMotionBlock(block.id)
                                              }
                                            >
                                              <Copy />
                                              Duplicate
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                              className="min-h-9 px-2.5"
                                              onClick={() => {
                                                if (bounceExpanded)
                                                  setExpandedMotionBlockId(
                                                    null,
                                                  );
                                                removeMotionBlock(block.id);
                                              }}
                                              variant="destructive"
                                            >
                                              <Trash2 />
                                              Delete
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      </div>
                                    ) : null}
                                  </div>

                                  {isBounce && bounceExpanded ? (
                                    <section
                                      className="bounce-editor-panel"
                                      id={`bounce-editor-${block.id}`}
                                    >
                                      <div className="bounce-editor-preview">
                                        <BouncePathPreview
                                          jumps={block.jumps}
                                        />
                                        <div className="bounce-jumps-heading">
                                          <div>
                                            <strong>Jump path</strong>
                                            <small>
                                              {block.jumps.length} jumps ·{' '}
                                              {bounceDuration} ms
                                            </small>
                                          </div>
                                          <Button
                                            disabled={
                                              block.jumps.length >=
                                              MAX_BOUNCE_JUMPS
                                            }
                                            onClick={() =>
                                              addBounceJump(block.id)
                                            }
                                            size="sm"
                                            variant="secondary"
                                          >
                                            <Plus />
                                            Add jump
                                          </Button>
                                        </div>
                                      </div>
                                      <div className="bounce-jumps">
                                        {block.jumps.map((jump, jumpIndex) => (
                                          <section
                                            className="bounce-jump"
                                            key={jump.id}
                                          >
                                            <div className="bounce-jump-head">
                                              <strong>
                                                {String(jumpIndex + 1).padStart(
                                                  2,
                                                  '0',
                                                )}
                                              </strong>
                                              <div>
                                                <button
                                                  aria-label={`Move jump ${jumpIndex + 1} earlier`}
                                                  disabled={jumpIndex === 0}
                                                  onClick={() =>
                                                    moveBounceJump(
                                                      block.id,
                                                      jump.id,
                                                      -1,
                                                    )
                                                  }
                                                  type="button"
                                                >
                                                  <ArrowUp />
                                                </button>
                                                <button
                                                  aria-label={`Move jump ${jumpIndex + 1} later`}
                                                  disabled={
                                                    jumpIndex ===
                                                    block.jumps.length - 1
                                                  }
                                                  onClick={() =>
                                                    moveBounceJump(
                                                      block.id,
                                                      jump.id,
                                                      1,
                                                    )
                                                  }
                                                  type="button"
                                                >
                                                  <ArrowDown />
                                                </button>
                                                <button
                                                  aria-label={`Duplicate jump ${jumpIndex + 1}`}
                                                  disabled={
                                                    block.jumps.length >=
                                                    MAX_BOUNCE_JUMPS
                                                  }
                                                  onClick={() =>
                                                    duplicateBounceJump(
                                                      block.id,
                                                      jump.id,
                                                    )
                                                  }
                                                  type="button"
                                                >
                                                  <Copy />
                                                </button>
                                                <button
                                                  aria-label={`Remove jump ${jumpIndex + 1}`}
                                                  disabled={
                                                    block.jumps.length <= 1
                                                  }
                                                  onClick={() =>
                                                    removeBounceJump(
                                                      block.id,
                                                      jump.id,
                                                    )
                                                  }
                                                  type="button"
                                                >
                                                  <Trash2 />
                                                </button>
                                              </div>
                                            </div>
                                            <div className="bounce-jump-controls">
                                              <div>
                                                <span>Direction</span>
                                                <NativeSelect
                                                  aria-label={`Jump ${jumpIndex + 1} direction`}
                                                  onChange={(event) =>
                                                    updateBounceJump(
                                                      block.id,
                                                      jump.id,
                                                      (item) => {
                                                        item.direction = event
                                                          .target
                                                          .value as BounceJump['direction'];
                                                      },
                                                    )
                                                  }
                                                  size="sm"
                                                  value={jump.direction}
                                                >
                                                  <NativeSelectOption value="left">
                                                    ← Left
                                                  </NativeSelectOption>
                                                  <NativeSelectOption value="right">
                                                    Right →
                                                  </NativeSelectOption>
                                                </NativeSelect>
                                              </div>
                                              <div>
                                                <span>Height</span>
                                                <Input
                                                  {...numericDraftProps(
                                                    `jump:${jump.id}:height`,
                                                    jump.height,
                                                    (candidate) =>
                                                      normalizeBounceJumpNumericField(
                                                        jump,
                                                        'height',
                                                        candidate,
                                                      ),
                                                    (candidate) =>
                                                      updateBounceJump(
                                                        block.id,
                                                        jump.id,
                                                        (item) => {
                                                          item.height =
                                                            normalizeBounceJumpNumericField(
                                                              item,
                                                              'height',
                                                              candidate,
                                                            );
                                                        },
                                                        `jump:${jump.id}:height`,
                                                      ),
                                                  )}
                                                  aria-label={`Jump ${jumpIndex + 1} height`}
                                                  max="2000"
                                                  min="0"
                                                  step="5"
                                                  type="number"
                                                />
                                              </div>
                                              <div>
                                                <span>Spread</span>
                                                <Input
                                                  {...numericDraftProps(
                                                    `jump:${jump.id}:spread`,
                                                    jump.spread,
                                                    (candidate) =>
                                                      normalizeBounceJumpNumericField(
                                                        jump,
                                                        'spread',
                                                        candidate,
                                                      ),
                                                    (candidate) =>
                                                      updateBounceJump(
                                                        block.id,
                                                        jump.id,
                                                        (item) => {
                                                          item.spread =
                                                            normalizeBounceJumpNumericField(
                                                              item,
                                                              'spread',
                                                              candidate,
                                                            );
                                                        },
                                                        `jump:${jump.id}:spread`,
                                                      ),
                                                  )}
                                                  aria-label={`Jump ${jumpIndex + 1} spread`}
                                                  max="2000"
                                                  min="0"
                                                  step="5"
                                                  type="number"
                                                />
                                              </div>
                                              <div>
                                                <span>Time</span>
                                                <Input
                                                  {...numericDraftProps(
                                                    `jump:${jump.id}:duration`,
                                                    jump.durationMs,
                                                    (candidate) =>
                                                      normalizeBounceJumpNumericField(
                                                        jump,
                                                        'durationMs',
                                                        candidate,
                                                      ),
                                                    (candidate) =>
                                                      updateBounceJump(
                                                        block.id,
                                                        jump.id,
                                                        (item) => {
                                                          item.durationMs =
                                                            normalizeBounceJumpNumericField(
                                                              item,
                                                              'durationMs',
                                                              candidate,
                                                            );
                                                        },
                                                        `jump:${jump.id}:duration`,
                                                      ),
                                                  )}
                                                  aria-label={`Jump ${jumpIndex + 1} duration`}
                                                  max="10000"
                                                  min="80"
                                                  step="20"
                                                  type="number"
                                                />
                                              </div>
                                              <div className="bounce-easing">
                                                <span>Easing</span>
                                                <NativeSelect
                                                  aria-label={`Jump ${jumpIndex + 1} easing`}
                                                  onChange={(event) =>
                                                    updateBounceJump(
                                                      block.id,
                                                      jump.id,
                                                      (item) => {
                                                        item.easing = event
                                                          .target
                                                          .value as Easing;
                                                      },
                                                    )
                                                  }
                                                  size="sm"
                                                  value={jump.easing}
                                                >
                                                  <NativeSelectOption value="linear">
                                                    Linear
                                                  </NativeSelectOption>
                                                  <NativeSelectOption value="ease-out">
                                                    Ease out
                                                  </NativeSelectOption>
                                                  <NativeSelectOption value="ease-in-out">
                                                    Ease in/out
                                                  </NativeSelectOption>
                                                </NativeSelect>
                                              </div>
                                            </div>
                                          </section>
                                        ))}
                                      </div>
                                    </section>
                                  ) : null}
                                </>
                              );
                            };
                            return isEvent ? (
                              <StaticMotionBlock block={block} key={block.id}>
                                {renderBlock(null)}
                              </StaticMotionBlock>
                            ) : (
                              <SortableMotionBlock
                                block={block}
                                elementId={selectedElement.id}
                                key={block.id}
                              >
                                {renderBlock}
                              </SortableMotionBlock>
                            );
                          },
                        )}
                      </MotionProgramDropzone>
                      {desktopPanelsEnabled ? (
                        <div className="block-workspace-resize-layer">
                          <ResizablePanelGroup
                            defaultLayout={blockWorkspaceLayout}
                            id="block-workspace-panels"
                            key={blockWorkspaceLayoutRevision}
                            onLayoutChange={applyBlockWorkspaceLayout}
                            onLayoutChanged={rememberBlockWorkspaceLayout}
                            orientation="horizontal"
                          >
                            <ResizablePanel id="library" minSize="220px" />
                            <ResizableHandle
                              aria-label="Resize block library and script"
                              className="block-workspace-resize-handle"
                              title="Drag to resize the block library and script"
                              withHandle
                            />
                            <ResizablePanel id="script" minSize="240px" />
                          </ResizablePanelGroup>
                        </div>
                      ) : null}
                    </div>
                    <DragOverlay>
                      {activeMotionDrag ? (
                        <MotionDragPreview drag={activeMotionDrag} />
                      ) : null}
                    </DragOverlay>
                  </DndContext>
                )}
              </>
            )}
          </div>
        </aside>

        {desktopPanelsEnabled ? (
          <div className="studio-resize-layer">
            <ResizablePanelGroup
              defaultLayout={activePanelLayout}
              id={`studio-panels-${inspectorTab}`}
              key={`${inspectorTab}-${panelLayoutRevision}`}
              onLayoutChange={applyStudioPanelLayout}
              onLayoutChanged={rememberStudioPanelLayout}
              orientation="horizontal"
            >
              <ResizablePanel id="left" minSize="112px" />
              <ResizableHandle
                aria-label={
                  inspectorTab === 'motion'
                    ? 'Resize Layers and Blocks'
                    : 'Resize Layers and Stage'
                }
                className="studio-resize-handle"
                title={
                  inspectorTab === 'motion'
                    ? 'Drag to resize Layers and Blocks'
                    : 'Drag to resize Layers and Stage'
                }
                withHandle
              />
              <ResizablePanel
                id="center"
                minSize={inspectorTab === 'motion' ? '460px' : '340px'}
              />
              <ResizableHandle
                aria-label={
                  inspectorTab === 'motion'
                    ? 'Resize Blocks and Stage'
                    : 'Resize Stage and Properties'
                }
                className="studio-resize-handle"
                title={
                  inspectorTab === 'motion'
                    ? 'Drag to resize Blocks and Stage'
                    : 'Drag to resize Stage and Properties'
                }
                withHandle
              />
              <ResizablePanel id="right" minSize="260px" />
            </ResizablePanelGroup>
          </div>
        ) : null}
      </div>

      <Dialog onOpenChange={setCatalogOpen} open={catalogOpen}>
        <DialogContent className="catalog-dialog">
          <DialogHeader>
            <DialogTitle>Motus catalogs</DialogTitle>
            <DialogDescription>
              Read motion previews, reuse project images, start from a scene
              template, or apply an editable block preset.
            </DialogDescription>
          </DialogHeader>
          <div
            aria-label="Catalog sections"
            className="catalog-tabs"
            role="tablist"
          >
            <button
              aria-selected={catalogTab === 'works'}
              onClick={() => setCatalogTab('works')}
              role="tab"
              type="button"
            >
              <LibraryBig />
              Explore works
            </button>
            <button
              aria-selected={catalogTab === 'assets'}
              onClick={() => setCatalogTab('assets')}
              role="tab"
              type="button"
            >
              <ImagePlus />
              Project images
            </button>
            <button
              aria-selected={catalogTab === 'templates'}
              onClick={() => setCatalogTab('templates')}
              role="tab"
              type="button"
            >
              <Layers3 />
              Scene templates
            </button>
            <button
              aria-selected={catalogTab === 'motion'}
              onClick={() => setCatalogTab('motion')}
              role="tab"
              type="button"
            >
              <Code2 />
              Motion presets
            </button>
          </div>

          {catalogTab === 'works' ? (
            <section className="catalog-panel" aria-label="Works catalog">
              <div className="catalog-search">
                <Search aria-hidden="true" />
                <Input
                  aria-label="Search works, creators, genres, formats, or tags"
                  onChange={(event) => setCatalogSearch(event.target.value)}
                  placeholder="Search works, creators, genres, formats, tags…"
                  value={catalogSearch}
                />
              </div>
              <div className="catalog-section-heading">
                <div>
                  <span>YOUR LIBRARY</span>
                  <strong>Continue creating</strong>
                </div>
                <small>
                  {project.chapters.length} chapters · {allScenes.length} scenes
                  ·{' '}
                  {project.publishedRevision
                    ? `revision ${project.publishedRevision}`
                    : 'draft'}
                </small>
              </div>
              <article className="library-work-card">
                <div
                  className="library-work-cover"
                  style={{ background: projectCoverScene.background }}
                >
                  <span>M</span>
                </div>
                <div>
                  <small>
                    {project.format.replace('-', ' ').toUpperCase()} ·{' '}
                    {project.visibility.toUpperCase()}
                  </small>
                  <h3>{project.title}</h3>
                  <p>
                    by {project.creatorName} ·{' '}
                    {project.description ||
                      'Add a description before publishing.'}
                  </p>
                  <div>
                    {project.tags.map((tag) => (
                      <span key={tag}>#{tag}</span>
                    ))}
                  </div>
                </div>
                <Button
                  onClick={() => {
                    setCatalogOpen(false);
                    openReader();
                  }}
                  variant="secondary"
                >
                  <Play />
                  Read draft
                </Button>
              </article>

              <div className="catalog-section-heading">
                <div>
                  <span>DISCOVER</span>
                  <strong>Interactive motion previews</strong>
                </div>
                <small>{filteredWorkCatalog.length} playable results</small>
              </div>
              {filteredWorkCatalog.length ? (
                <div className="work-catalog-grid">
                  {filteredWorkCatalog.map((work, catalogIndex) => (
                    <article className="work-catalog-card" key={work.title}>
                      <div
                        className="work-catalog-cover"
                        style={{ background: work.palette }}
                      >
                        <span>{work.title.slice(0, 1)}</span>
                        <small>{work.format}</small>
                      </div>
                      <div className="work-catalog-copy">
                        <span>
                          {work.genre} · {work.status}
                        </span>
                        <h3>{work.title}</h3>
                        <p>by {work.creator}</p>
                        <div>
                          {work.tags.map((tag) => (
                            <small key={tag}>#{tag}</small>
                          ))}
                        </div>
                        <strong>{work.rating}</strong>
                        {!getCatalogPreviewLayout(work.format).native ? (
                          <small className="work-catalog-prototype">
                            Prototype preview ·{' '}
                            {getCatalogPreviewLayout(work.format).label} layout
                          </small>
                        ) : null}
                        <Button
                          onClick={() => openCatalogWork(work, catalogIndex)}
                          size="sm"
                          variant="secondary"
                        >
                          <Play />
                          Read preview
                        </Button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="catalog-empty">
                  <Search />
                  <strong>No matching works</strong>
                  <p>Try a title, creator, genre, format, or tag.</p>
                </div>
              )}
            </section>
          ) : null}

          {catalogTab === 'assets' ? (
            <section className="catalog-panel" aria-label="Project images">
              <div className="catalog-search">
                <Search aria-hidden="true" />
                <Input
                  aria-label="Search project images"
                  onChange={(event) => setCatalogSearch(event.target.value)}
                  placeholder="Search images used in this work…"
                  value={catalogSearch}
                />
              </div>
              <div className="catalog-section-heading">
                <div>
                  <span>PROJECT IMAGES</span>
                  <strong>Reuse uploaded layers</strong>
                </div>
                <small>
                  {projectImageAssets.length} image
                  {projectImageAssets.length === 1 ? '' : 's'} in this work
                </small>
              </div>
              {filteredProjectImageAssets.length ? (
                <div className="asset-catalog-grid">
                  {filteredProjectImageAssets.map((asset) => (
                    <article className="asset-catalog-card" key={asset.id}>
                      <div className="asset-catalog-preview">
                        <span
                          aria-hidden="true"
                          className="asset-catalog-image"
                          style={{ backgroundImage: `url("${asset.src}")` }}
                        />
                      </div>
                      <div className="asset-catalog-copy">
                        <small>
                          {Math.round(asset.width)}×{Math.round(asset.height)} ·{' '}
                          used {asset.uses}×
                        </small>
                        <h3>{asset.name}</h3>
                        <Button
                          onClick={() => addProjectImageAsset(asset)}
                          size="sm"
                          variant="secondary"
                        >
                          <Plus />
                          Add to scene
                        </Button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : projectImageAssets.length ? (
                <div className="catalog-empty">
                  <Search />
                  <strong>No matching project images</strong>
                  <p>Try a shorter file name.</p>
                  <Button
                    onClick={() => setCatalogSearch('')}
                    size="sm"
                    variant="outline"
                  >
                    Clear search
                  </Button>
                </div>
              ) : (
                <div className="catalog-empty asset-catalog-empty">
                  <ImagePlus />
                  <strong>No uploaded images yet</strong>
                  <p>
                    Upload a PNG or WebP once, then reuse it from this catalog.
                  </p>
                  <Button
                    onClick={() => {
                      setCatalogOpen(false);
                      window.requestAnimationFrame(() =>
                        imageInput.current?.click(),
                      );
                    }}
                  >
                    <Upload />
                    Upload image
                  </Button>
                </div>
              )}
            </section>
          ) : null}

          {catalogTab === 'templates' ? (
            <section
              className="catalog-panel"
              aria-label="Scene template catalog"
            >
              <div className="catalog-intro">
                <span>SCENE CATALOG</span>
                <h2>Start with structure, then make it yours.</h2>
                <p>
                  Each template adds a fully editable scene with separate title,
                  focal, and speech layers.
                </p>
              </div>
              <div className="template-catalog-grid">
                {sceneTemplates.map((template) => (
                  <article className="template-card" key={template.id}>
                    <div
                      className="template-preview"
                      style={{ background: template.background }}
                    >
                      <span style={{ color: template.accent }}>
                        {template.title}
                      </span>
                      <i style={{ background: template.accent }} />
                      <small>{template.speech}</small>
                    </div>
                    <div>
                      <h3>{template.name}</h3>
                      <p>{template.description}</p>
                      <Button
                        onClick={() => addSceneFromTemplate(template.id)}
                        size="sm"
                      >
                        <Plus />
                        Add scene
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {catalogTab === 'motion' ? (
            <section
              className="catalog-panel"
              aria-label="Motion preset catalog"
            >
              <div className="catalog-intro">
                <span>MOTION CATALOG</span>
                <h2>Presets remain editable block programs.</h2>
                <p>
                  Append a preset or deliberately replace the selected layer’s
                  program, then reorder and tune every generated block.
                </p>
              </div>
              <div className="motion-preset-grid">
                {motionPresets.map((preset) => (
                  <article className="motion-preset-card" key={preset.id}>
                    <div className="preset-block-stack">
                      {preset.blocks.map((block, index) => (
                        <span
                          className={`block-${createMotionBlock(block.kind, `${preset.id}-${index}`).category}`}
                          key={`${preset.id}-${block.kind}-${index}`}
                        >
                          {index + 1}.{' '}
                          {
                            createMotionBlock(
                              block.kind,
                              `${preset.id}-${index}`,
                            ).label
                          }
                        </span>
                      ))}
                    </div>
                    <div>
                      <h3>{preset.name}</h3>
                      <p>{preset.description}</p>
                      <small>
                        {preset.blocks.length - 1} editable action blocks +
                        event
                      </small>
                      <div className="preset-actions">
                        <Button
                          disabled={
                            !selectedElement ||
                            countMotionBlocks(selectedElement.motion.blocks) +
                              (preset.blocks.length - 1) >
                              MAX_MOTION_BLOCKS
                          }
                          onClick={() => applyMotionPreset(preset.id, 'append')}
                          size="sm"
                          variant="secondary"
                        >
                          <Plus />
                          Append
                        </Button>
                        <Button
                          disabled={!selectedElement}
                          onClick={() =>
                            applyMotionPreset(preset.id, 'replace')
                          }
                          size="sm"
                        >
                          <Sparkles />
                          Replace program
                        </Button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}
        </DialogContent>
      </Dialog>

      {deletionUndo ? (
        <div aria-atomic="true" aria-live="polite" className="deletion-undo">
          <span>{deletionUndo.message}</span>
          <Button onClick={undoDeletion} size="sm" variant="secondary">
            <Undo2 />
            Undo
          </Button>
        </div>
      ) : null}

      {saveFailed ? (
        <div aria-atomic="true" aria-live="assertive" className="save-recovery">
          <CloudOff aria-hidden="true" />
          <div>
            <strong>Draft is not safely saved</strong>
            <p>
              Browser storage may be full or unavailable. Download a portable
              backup before closing this tab.
            </p>
          </div>
          <Button
            onClick={
              externalDraftChange
                ? () => setConflictOpen(true)
                : saveCurrentProject
            }
            size="sm"
            variant="outline"
          >
            {externalDraftChange ? 'Resolve conflict' : 'Retry save'}
          </Button>
          <Button onClick={exportProject} size="sm">
            <Download />
            Download backup
          </Button>
        </div>
      ) : null}

      <Dialog onOpenChange={setConflictOpen} open={conflictOpen}>
        <DialogContent className="conflict-dialog">
          <DialogHeader>
            <DialogTitle>Draft changed in another tab</DialogTitle>
            <DialogDescription>
              Autosave is paused so neither tab silently overwrites the other.
            </DialogDescription>
          </DialogHeader>
          <div className="conflict-warning">
            <CloudOff />
            <div>
              <strong>Choose which draft should continue</strong>
              <p>
                Loading the saved draft downloads this tab’s version first.
                Keeping this draft makes it the newest recoverable copy.
              </p>
            </div>
          </div>
          <div className="conflict-actions">
            <Button onClick={() => setConflictOpen(false)} variant="ghost">
              Review later
            </Button>
            <Button onClick={keepCurrentDraft} variant="outline">
              Keep this draft
            </Button>
            <Button onClick={loadOtherTabDraft}>
              <Download />
              Back up &amp; load saved
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        onOpenChange={(open) => {
          if (!open) setPendingProjectImport(null);
        }}
        open={Boolean(pendingProjectImport)}
      >
        <DialogContent className="new-work-dialog">
          <DialogHeader>
            <DialogTitle>
              Import {pendingProjectImport?.project.title}?
            </DialogTitle>
            <DialogDescription>
              {pendingProjectImport?.fileName} contains{' '}
              {pendingProjectImport?.project.chapters.length} chapter
              {pendingProjectImport?.project.chapters.length === 1
                ? ''
                : 's'}{' '}
              and {pendingImportSceneCount} scene
              {pendingImportSceneCount === 1 ? '' : 's'} and will replace the
              draft currently open in the editor.
            </DialogDescription>
          </DialogHeader>
          <div className="new-work-backup">
            <Download />
            <div>
              <strong>Your current work downloads first</strong>
              <p>
                Motus also verifies that the imported draft fits in both
                recovery slots before switching projects.
              </p>
            </div>
          </div>
          <div className="new-work-actions">
            <Button
              onClick={() => setPendingProjectImport(null)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button onClick={confirmProjectImport}>
              <Upload />
              Back up &amp; import
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        onOpenChange={(open) => {
          if (!open) setPendingRevisionRemoval(null);
        }}
        open={Boolean(pendingRevisionRemoval)}
      >
        <DialogContent className="new-work-dialog">
          <DialogHeader>
            <DialogTitle>
              Remove revision {pendingRevisionRemoval?.revision}?
            </DialogTitle>
            <DialogDescription>
              This removes an older immutable snapshot from this browser. The
              current published revision stays untouched.
            </DialogDescription>
          </DialogHeader>
          <div className="new-work-backup">
            <Download />
            <div>
              <strong>A complete project backup downloads first</strong>
              <p>
                You can import that file later if you need this revision again.
              </p>
            </div>
          </div>
          <div className="new-work-actions">
            <Button
              onClick={() => {
                setPendingRevisionRemoval(null);
                setPublishOpen(true);
              }}
              variant="outline"
            >
              Cancel
            </Button>
            <Button onClick={confirmRevisionRemoval} variant="destructive">
              <Trash2 />
              Back up &amp; remove
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog onOpenChange={setNewWorkOpen} open={newWorkOpen}>
        <DialogContent className="new-work-dialog">
          <DialogHeader>
            <DialogTitle>Start a new work?</DialogTitle>
            <DialogDescription>
              Motus will download a complete backup of “{project.title}” before
              opening a blank scene.
            </DialogDescription>
          </DialogHeader>
          <div className="new-work-backup">
            <Download />
            <div>
              <strong>Your current work stays recoverable</strong>
              <p>
                Import the downloaded .motus.json file at any time to continue
                exactly where you left off.
              </p>
            </div>
          </div>
          <div className="new-work-actions">
            <Button onClick={() => setNewWorkOpen(false)} variant="outline">
              Keep editing
            </Button>
            <Button onClick={startNewWork}>
              <FilePlus2 />
              Back up &amp; start
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <MotusWorkDetailsDialog
        activeChapterId={activeChapter.id}
        endHistoryTransaction={endHistoryTransaction}
        onCommit={commitProject}
        onOpenChange={setProjectDetailsOpen}
        open={projectDetailsOpen}
        project={project}
      />

      <Dialog
        onOpenChange={(open) => {
          setReaderOpen(open);
          if (!open) setReaderMatureConfirmed(false);
        }}
        open={readerOpen}
      >
        <DialogContent className="reader-dialog">
          <DialogHeader>
            <DialogTitle>{readerSource.title}</DialogTitle>
            <DialogDescription>{readerDescription}</DialogDescription>
          </DialogHeader>
          <div className="reader-work-summary">
            <MotusWorkMetadataSummary
              contentRating={readerSource.contentRating}
              description={readerSource.description}
              format={readerSource.format}
              metadata={readerSource.metadata}
              mode="compact"
              tone="dark"
            />
            {readerSource.mode === 'revision' &&
            readerSource.revision === project.publishedRevision &&
            !readerCatalogProject ? (
              <div className="reader-published-route">
                <span>
                  Revision {readerSource.revision} is stored in this browser.
                </span>
                <a href={`/read/${getDevicePublicationSlug(project.id)}`}>
                  Open browser reader
                  <ArrowRight aria-hidden="true" />
                </a>
              </div>
            ) : null}
          </div>
          {(readerSource.contentRating === 'mature' ||
            readerSource.contentRating === 'adults-only') &&
          !readerMatureConfirmed ? (
            <section
              aria-describedby="reader-mature-description"
              aria-labelledby="reader-mature-title"
              className="reader-maturity"
            >
              <EyeOff aria-hidden="true" />
              <span>
                {readerSource.contentRating === 'adults-only'
                  ? 'ADULTS ONLY · 18+'
                  : 'MATURE CONTENT'}
              </span>
              <h3 id="reader-mature-title">Continue to this reader?</h3>
              <p id="reader-mature-description">
                {readerSource.contentRating === 'adults-only'
                  ? 'The creator restricted this work to adults. Continue only if you are 18 or older.'
                  : 'The creator marked this work as Mature. Continue only if this content is appropriate for you.'}
              </p>
              <div>
                <Button onClick={() => setReaderOpen(false)} variant="ghost">
                  Go back
                </Button>
                <Button onClick={() => setReaderMatureConfirmed(true)}>
                  {readerSource.contentRating === 'adults-only'
                    ? 'I am 18 or older — continue'
                    : 'Continue to reader'}
                </Button>
              </div>
            </section>
          ) : (
            <div className="reader-content">
              <div className="reader-toolbar">
                <span>
                  {readerMode === 'scroll'
                    ? `${readerChapter.title} · motion plays as each scene enters view.`
                    : `${readerChapter.title} · scene ${resolvedReaderPageIndex + 1} of ${readerScenes.length}.`}
                </span>
                <div className="reader-toolbar-actions">
                  <label className="reader-chapter-picker">
                    <span className="sr-only">Reader chapter</span>
                    <NativeSelect
                      aria-label="Reader chapter"
                      onChange={(event) => {
                        const chapter = readerSource.chapters.find(
                          (item) => item.id === event.target.value,
                        );
                        if (chapter) selectReaderChapter(chapter);
                      }}
                      value={readerChapter.id}
                    >
                      {readerSource.chapters.map((chapter, index) => (
                        <NativeSelectOption key={chapter.id} value={chapter.id}>
                          {index + 1}. {chapter.title}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                  </label>
                  <fieldset className="reader-mode-toggle">
                    <legend className="sr-only">Reader layout</legend>
                    <button
                      aria-pressed={readerMode === 'scroll'}
                      onClick={() => {
                        setReaderMode('scroll');
                        readerScroll.current?.scrollTo({
                          top: 0,
                          behavior: 'auto',
                        });
                      }}
                      type="button"
                    >
                      <ArrowDown aria-hidden="true" />
                      Vertical
                    </button>
                    <button
                      aria-pressed={readerMode === 'page'}
                      onClick={() => setReaderMode('page')}
                      type="button"
                    >
                      <FileImage aria-hidden="true" />
                      Page
                    </button>
                  </fieldset>
                  <Button onClick={replayReader} size="sm" variant="secondary">
                    <Play fill="currentColor" />
                    Replay
                  </Button>
                </div>
              </div>
              <div
                className="reader-scroll"
                data-mode={readerMode}
                ref={readerScroll}
              >
                {readerMode === 'scroll' ? (
                  readerScenes.map((scene, index) => (
                    <ReaderScene
                      index={index}
                      key={`${scene.id}-${readerPreviewKey}`}
                      scene={scene}
                      sessionKey={readerPreviewKey || 1}
                    />
                  ))
                ) : (
                  <div className="reader-page-mode">
                    <ReaderScene
                      index={resolvedReaderPageIndex}
                      key={`${readerScenes[resolvedReaderPageIndex].id}-${readerPreviewKey}-${resolvedReaderPageIndex}`}
                      scene={readerScenes[resolvedReaderPageIndex]}
                      sessionKey={
                        readerPreviewKey + resolvedReaderPageIndex + 1
                      }
                    />
                    <nav
                      aria-label="Scene navigation"
                      className="reader-page-navigation"
                    >
                      <Button
                        disabled={
                          readerChapterIndex === 0 &&
                          resolvedReaderPageIndex === 0
                        }
                        onClick={() => moveReaderPage(-1)}
                        variant="secondary"
                      >
                        <ArrowLeft />
                        Previous
                      </Button>
                      <span>
                        Chapter {readerChapterIndex + 1} ·{' '}
                        {resolvedReaderPageIndex + 1} / {readerScenes.length}
                      </span>
                      <Button
                        disabled={
                          readerChapterIndex ===
                            readerSource.chapters.length - 1 &&
                          resolvedReaderPageIndex === readerScenes.length - 1
                        }
                        onClick={() => moveReaderPage(1)}
                        variant="secondary"
                      >
                        Next
                        <ArrowRight />
                      </Button>
                    </nav>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog onOpenChange={setPublishOpen} open={publishOpen}>
        <DialogContent className="publish-dialog">
          <DialogHeader>
            <DialogTitle>Publish {project.title}</DialogTitle>
            <DialogDescription>
              Create an immutable reader snapshot. Later edits stay in your
              draft until you publish again.
            </DialogDescription>
          </DialogHeader>

          <div className="publish-grid">
            <section className="publish-work-review">
              <div className="publish-work-review-heading">
                <div>
                  <span>WORK DETAILS</span>
                  <strong>{project.title || 'Untitled work'}</strong>
                </div>
                <Button
                  onClick={() => {
                    setPublishOpen(false);
                    queueMicrotask(() => setProjectDetailsOpen(true));
                  }}
                  size="sm"
                  variant="outline"
                >
                  <Pencil />
                  Edit details
                </Button>
              </div>
              <MotusWorkMetadataSummary
                contentRating={project.contentRating}
                description={project.description}
                format={project.format}
                metadata={project.metadata}
              />
            </section>

            <div className="publish-field-row publish-final-controls">
              <label className="publish-field" htmlFor="publish-cover-scene">
                <span>Cover scene</span>
                <NativeSelect
                  id="publish-cover-scene"
                  onChange={(event) =>
                    commitProject((draft) => {
                      draft.coverSceneId = event.target.value;
                    })
                  }
                  value={project.coverSceneId}
                >
                  {project.chapters.flatMap((chapter, chapterNumber) =>
                    chapter.scenes.map((scene, sceneNumber) => (
                      <NativeSelectOption key={scene.id} value={scene.id}>
                        C{chapterNumber + 1} ·{' '}
                        {String(sceneNumber + 1).padStart(2, '0')} ·{' '}
                        {scene.name}
                      </NativeSelectOption>
                    )),
                  )}
                </NativeSelect>
                <small className="publish-field-hint">
                  Used for the work cover and next revision
                </small>
              </label>
              <label className="publish-field" htmlFor="publish-visibility">
                <span>Visibility</span>
                <NativeSelect
                  id="publish-visibility"
                  onChange={(event) =>
                    commitProject((draft) => {
                      draft.visibility = event.target
                        .value as PublicationVisibility;
                    })
                  }
                  value={project.visibility}
                >
                  <NativeSelectOption value="private">
                    Private
                  </NativeSelectOption>
                  <NativeSelectOption value="public">
                    Public metadata
                  </NativeSelectOption>
                </NativeSelect>
              </label>
            </div>

            <p className="publish-note">
              Nothing is uploaded. This reader edition is stored only in this
              browser; visibility is recorded as intent.
            </p>

            <section
              className="publish-readiness"
              data-ready={publicationReadiness.ready || undefined}
              aria-labelledby="publish-readiness-title"
            >
              <span className="publish-readiness-mark" aria-hidden="true">
                {publicationReadiness.ready ? '✓' : '!'}
              </span>
              <div>
                <strong id="publish-readiness-title">
                  {publicationReadiness.ready
                    ? 'Ready to publish'
                    : 'Finish before publishing'}
                </strong>
                <small>
                  {publicationReadiness.chapterCount} chapters ·{' '}
                  {publicationReadiness.sceneCount} scenes ·{' '}
                  {publicationReadiness.visibleLayerCount} visible layers
                </small>
                {publicationReadiness.issues.length > 0 ? (
                  <ul>
                    {publicationReadiness.issues.map((issue) => (
                      <li key={issue}>{issue}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </section>

            {project.publications.length > 0 ? (
              <section
                className="revision-history"
                aria-labelledby="revision-history-title"
              >
                <div className="revision-history-heading">
                  <strong id="revision-history-title">Revision history</strong>
                  <span>{project.publications.length} saved</span>
                </div>
                <div className="revision-list">
                  {[...project.publications].reverse().map((revision) => (
                    <div className="revision-row" key={revision.id}>
                      <div>
                        <strong>Revision {revision.revision}</strong>
                        <small>
                          {revision.createdAt.slice(0, 16).replace('T', ' ')} ·{' '}
                          {revision.chapters.length} chapters ·{' '}
                          {getProjectScenes(revision).length} scenes
                          {revision.revision === project.publishedRevision
                            ? ' · Current'
                            : ''}
                        </small>
                      </div>
                      <div className="revision-actions">
                        <Button
                          onClick={() => {
                            setPublishOpen(false);
                            openReader(revision);
                          }}
                          size="sm"
                          variant="outline"
                        >
                          View
                        </Button>
                        <Button
                          aria-label={`Restore revision ${revision.revision} as the editable draft`}
                          onClick={() => restoreRevision(revision)}
                          size="sm"
                          variant="outline"
                        >
                          <RotateCcw />
                          Restore
                        </Button>
                        {revision.revision !== project.publishedRevision ? (
                          <Button
                            aria-label={`Remove revision ${revision.revision}`}
                            onClick={() => {
                              setPublishOpen(false);
                              setPendingRevisionRemoval(revision);
                            }}
                            size="icon-sm"
                            variant="destructive"
                          >
                            <Trash2 />
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </div>

          <div className="publish-actions">
            <span>
              {!publicationReadiness.ready
                ? `${publicationReadiness.issues.length} item${publicationReadiness.issues.length === 1 ? '' : 's'} to finish`
                : publicationHasChanges
                  ? `Next: revision ${project.publishedRevision + 1}`
                  : `Revision ${project.publishedRevision} is current`}
            </span>
            <Button
              disabled={
                !publicationReadiness.ready ||
                !publicationHasChanges ||
                externalDraftChange
              }
              onClick={publishRevision}
            >
              <Send />
              Publish revision
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
