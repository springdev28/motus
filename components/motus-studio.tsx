/* oxlint-disable next/no-html-link-for-pages -- Home navigation performs a full transition after synchronously flushing the draft. */
'use client';

import {
  useCallback,
  useEffect,
  useId,
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
  pointerWithin,
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
  BookOpen,
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
import { MotusMeshImage } from '@/components/motus-mesh-image';
import { MotusMeshWarpEditor } from '@/components/motus-mesh-warp-editor';
import { MotusMotionTimeline } from '@/components/motus-motion-timeline';
import { MotusRigJointFinder } from '@/components/motus-rig-joint-finder';
import {
  MotusSmartCut,
  type SmartCutResult,
} from '@/components/motus-smart-cut';
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
  ELEMENT_CATALOG_CATEGORIES,
  MOTUS_ELEMENT_CATALOG,
  MOTUS_SHAPE_PRESET_DEFINITIONS,
  createElementCatalogItem,
  getShapePresetDefinition,
  type ElementCatalogCategory,
} from '@/lib/motus-element-catalog';
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  ELEMENT_FONT_PRESETS,
  ELEMENT_FONT_WEIGHTS,
  ELEMENT_IMAGE_FITS,
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
  MAX_ELEMENT_RIG_DEPTH,
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
  getElementImageFraming,
  getElementShapePreset,
  getElementRigCascadeDeleteIds,
  getElementRigDepth,
  getElementRigDescendantIds,
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
  isElementEffectivelyVisible,
  isMotionContainerBlockKind,
  isMotionEventBlockKind,
  isParallelMotionBlockKind,
  normalizeBounceJumpNumericField,
  normalizeElementImageRigPart,
  normalizeElementTypography,
  normalizeMotionBlockNumericField,
  recordProjectHistory,
  removePublicationRevision,
  reorderElementRigSibling,
  replaceMotionEvent,
  reparentElementRigBranchPreservingPose,
  setElementRigPivotPreservingPose,
  validateElementRigPartName,
  reorderChapters,
  reorderMotionActionBefore,
  reorderScenes,
  resetProjectTimeline,
  resolveDraftConflict,
  resolveEditorSelection,
  resolveProjectCoverSceneId,
  resolveReaderSource,
  restorePublicationToDraft,
  restoreProject,
  restoreProjectWithError,
  shouldAutosaveDraft,
  shouldEndContinuousHistoryOnKey,
  snapSelectedElementMovement,
  trimProjectHistory,
  transformElementByPointer,
  translateElementRigBranch,
  translateElementRigSelectionByCanvasDelta,
  translateSelectedElements,
  validateImageAsset,
  wouldCreateAnimationFinishCycle,
  wouldCreateElementRigCycle,
  writeDraftJournal,
  type BounceJump,
  type Easing,
  type ElementAlignmentGuide,
  type ElementPointerTransformMode,
  type ElementFontPreset,
  type ElementFontWeight,
  type ElementImageFit,
  type ElementAlignment,
  type ElementDistributionAxis,
  type ElementTextAlignment,
  type ElementShapePreset,
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
import type { MotionTimelineSpan } from '@/lib/motus-motion-timeline';
import {
  getAdjacentReaderPosition,
  getReaderControlIntent,
  getReaderTransitionPresentation,
  getReaderVisibleSceneIndexes,
  type ReaderNavigationIntent,
} from '@/lib/motus-reader-navigation';
import {
  DRAFT_POINTER_KEY,
  DRAFT_SLOT_A_KEY,
  DRAFT_SLOT_B_KEY,
  readNewestMotusDraft,
} from '@/lib/motus-draft-storage';
import { createImageRigMesh } from '@/lib/motus-mesh-warp';
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

type RigRegionDraft = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const DEFAULT_RIG_REGION_DRAFT: RigRegionDraft = {
  x: 35,
  y: 24,
  width: 30,
  height: 36,
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

const ELEMENT_IMAGE_FIT_LABELS: Record<ElementImageFit, string> = {
  cover: 'Fill frame',
  contain: 'Fit image',
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

type CopiedElementSnapshot = {
  sceneId: string;
  contentElementIds: string[];
  elements: MotusElement[];
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

type CatalogTab = 'works' | 'elements' | 'assets' | 'templates' | 'motion';
type ElementCatalogCategoryFilter = 'all' | ElementCatalogCategory;

const CATALOG_TABS: readonly CatalogTab[] = [
  'works',
  'elements',
  'assets',
  'templates',
  'motion',
];
type ReaderMode = 'scroll' | 'page' | 'spread';

const readerModeForFormat = (format: MotusProject['format']): ReaderMode =>
  format === 'spread' ? 'spread' : format === 'page' ? 'page' : 'scroll';
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

const LAYER_ROOT_DROP_ID = 'layer-root-dropzone';

type ActiveLayerDrag = {
  source: 'layer';
  elementId: string;
  parentId: string | null;
  label: string;
};

type LayerDragHandle = {
  attributes: DraggableAttributes;
  listeners: DraggableSyntheticListeners;
  setActivatorNodeRef: (element: HTMLElement | null) => void;
  isDragging: boolean;
};

type LayerDropIntent = 'before' | 'parent' | 'after';

type LayerDropData = {
  source: 'layer-drop';
  intent: LayerDropIntent;
  targetElementId: string;
  targetParentId: string | null;
};

function layerDragId(elementId: string) {
  return `layer:${elementId}`;
}

function readLayerDragData(value: unknown): ActiveLayerDrag | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Partial<ActiveLayerDrag>;
  if (
    candidate.source !== 'layer' ||
    typeof candidate.elementId !== 'string' ||
    typeof candidate.label !== 'string' ||
    (candidate.parentId !== null && typeof candidate.parentId !== 'string')
  ) {
    return null;
  }
  return candidate as ActiveLayerDrag;
}

function layerDropId(intent: LayerDropIntent, elementId: string) {
  return `layer-drop:${intent}:${elementId}`;
}

function readLayerDropData(value: unknown): LayerDropData | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Partial<LayerDropData>;
  if (
    candidate.source !== 'layer-drop' ||
    (candidate.intent !== 'before' &&
      candidate.intent !== 'parent' &&
      candidate.intent !== 'after') ||
    typeof candidate.targetElementId !== 'string' ||
    (candidate.targetParentId !== null &&
      typeof candidate.targetParentId !== 'string')
  ) {
    return null;
  }
  return candidate as LayerDropData;
}

function LayerDropZone({
  active,
  element,
  intent,
  valid,
}: {
  active: boolean;
  element: MotusElement;
  intent: LayerDropIntent;
  valid: boolean;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: layerDropId(intent, element.id),
    data: {
      source: 'layer-drop',
      intent,
      targetElementId: element.id,
      targetParentId: element.parentId,
    } satisfies LayerDropData,
    disabled: !active,
  });
  return (
    <span
      aria-hidden="true"
      className="layer-drop-zone"
      data-drag-over={isOver || undefined}
      data-intent={intent}
      data-valid={valid || undefined}
      ref={setNodeRef}
    />
  );
}

function DraggableLayerRow({
  activeDrag,
  children,
  depth,
  disabled,
  element,
  nestAllowed,
  primarySelected,
  selected,
}: {
  activeDrag: ActiveLayerDrag | null;
  children: (handle: LayerDragHandle) => ReactNode;
  depth: number;
  disabled: boolean;
  element: MotusElement;
  nestAllowed: boolean;
  primarySelected: boolean;
  selected: boolean;
}) {
  const { attributes, isDragging, listeners, setActivatorNodeRef, setNodeRef } =
    useDraggable({
      id: layerDragId(element.id),
      data: {
        source: 'layer',
        elementId: element.id,
        parentId: element.parentId,
        label: element.name,
      } satisfies ActiveLayerDrag,
      disabled,
    });
  const style = {
    '--rig-depth': depth,
    zIndex: isDragging ? 12 : undefined,
  } as CSSProperties;
  const reorderAllowed = Boolean(
    activeDrag &&
    activeDrag.elementId !== element.id &&
    activeDrag.parentId === element.parentId,
  );

  return (
    <div
      aria-level={depth + 1}
      className="layer-row"
      data-dragging={isDragging || undefined}
      data-primary-selected={primarySelected || undefined}
      data-rig-depth={depth}
      data-selected={selected || undefined}
      ref={setNodeRef}
      role="treeitem"
      style={style}
    >
      {children({
        attributes,
        isDragging,
        listeners,
        setActivatorNodeRef,
      })}
      <LayerDropZone
        active={Boolean(activeDrag)}
        element={element}
        intent="before"
        valid={reorderAllowed}
      />
      <LayerDropZone
        active={Boolean(activeDrag)}
        element={element}
        intent="parent"
        valid={nestAllowed}
      />
      <LayerDropZone
        active={Boolean(activeDrag)}
        element={element}
        intent="after"
        valid={reorderAllowed}
      />
    </div>
  );
}

function LayerRootDropTarget({ active }: { active: boolean }) {
  const { isOver, setNodeRef } = useDroppable({
    id: LAYER_ROOT_DROP_ID,
    data: { source: 'layer-root' },
  });
  return (
    <div
      className="layer-root-drop"
      data-active={active || undefined}
      data-drag-over={isOver || undefined}
      ref={setNodeRef}
    >
      <Layers3 aria-hidden="true" />
      <span>
        <strong>Scene root</strong>
        <small>
          {active
            ? 'Drop here to detach the branch'
            : 'Independent top-level layers'}
        </small>
      </span>
    </div>
  );
}

function LayerDragPreview({ drag }: { drag: ActiveLayerDrag }) {
  return (
    <div className="layer-drag-preview">
      <GripVertical aria-hidden="true" />
      <span>
        <strong>{drag.label}</strong>
        <small>
          {drag.parentId ? 'Nested rig branch' : 'Scene root layer'}
        </small>
      </span>
    </div>
  );
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
      id={`motion-block-${block.id}`}
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
      id={`motion-block-${block.id}`}
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
  {
    id: 'character-body-sway',
    name: 'Character · body sway',
    description:
      'Loop a gentle root sway; every Head, Hair, Arm, and nested child inherits it.',
    blocks: [
      { kind: 'scene-enter' },
      { kind: 'sway', durationMs: 1800, x: 26, value: 4, repetitions: 4 },
    ],
  },
  {
    id: 'character-breathing',
    name: 'Character · breathing idle',
    description: 'Subtle editable scale pulses for a torso or whole rig.',
    blocks: [
      { kind: 'scene-enter' },
      { kind: 'breathe', durationMs: 2200, value: 1.045, repetitions: 4 },
    ],
  },
  {
    id: 'character-head-tilt',
    name: 'Character · head tilt',
    description:
      'Rock the selected Head around its pivot while its Hair and facial parts stay attached.',
    blocks: [
      { kind: 'scene-enter' },
      { kind: 'loop-rotate', durationMs: 1600, value: 12, repetitions: 4 },
    ],
  },
  {
    id: 'character-hair-wind',
    name: 'Character · hair in wind',
    description:
      'An editable wave for a Hair group or strand, composed under Head and Body motion.',
    blocks: [
      { kind: 'scene-enter' },
      {
        kind: 'wave',
        durationMs: 1800,
        x: 32,
        y: 16,
        repetitions: 4,
      },
    ],
  },
  {
    id: 'character-blink',
    name: 'Character · eyelid blink',
    description:
      'Blink a selected eyelid or eye layer; duration and repetitions stay fully editable.',
    blocks: [
      { kind: 'scene-enter' },
      { kind: 'blink', durationMs: 950, repetitions: 3 },
    ],
  },
  {
    id: 'character-talking',
    name: 'Character · talking bob',
    description:
      'A small local loop for a jaw, mouth, or speech pose beneath the head rig.',
    blocks: [
      { kind: 'scene-enter' },
      {
        kind: 'loop-move',
        durationMs: 1100,
        x: 0,
        y: 10,
        repetitions: 5,
      },
    ],
  },
  {
    id: 'character-arm-swing',
    name: 'Character · arm swing',
    description:
      'Swing an Arm around the shoulder pivot without disturbing the torso or other arm.',
    blocks: [
      { kind: 'scene-enter' },
      { kind: 'pendulum', durationMs: 1500, value: 22, repetitions: 4 },
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
  { id: 'catalog', label: 'Elements', icon: LibraryBig },
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

function flattenRigLayers(elements: readonly MotusElement[]) {
  const ids = new Set(elements.map((element) => element.id));
  const rows: Array<{ element: MotusElement; depth: number }> = [];
  const append = (element: MotusElement, depth: number) => {
    rows.push({ element, depth });
    [...elements]
      .reverse()
      .filter((candidate) => candidate.parentId === element.id)
      .forEach((child) => append(child, depth + 1));
  };
  [...elements]
    .reverse()
    .filter((element) => !element.parentId || !ids.has(element.parentId))
    .forEach((element) => append(element, 0));
  return rows;
}

function preserveRigBranchesAfterSelectionTransform(
  before: readonly MotusElement[],
  transformed: readonly MotusElement[],
  selectedIds: readonly string[],
): MotusElement[] {
  const selected = new Set(selectedIds);
  const beforeById = new Map(before.map((element) => [element.id, element]));
  const transformedById = new Map(
    transformed.map((element) => [element.id, element]),
  );
  const nearestSelectedAncestor = new Map<string, string>();
  for (const element of before) {
    if (selected.has(element.id)) continue;
    let parentId = element.parentId;
    const visited = new Set<string>();
    while (parentId && !visited.has(parentId)) {
      visited.add(parentId);
      if (selected.has(parentId)) {
        nearestSelectedAncestor.set(element.id, parentId);
        break;
      }
      parentId = beforeById.get(parentId)?.parentId ?? null;
    }
  }

  const nextById = new Map(
    transformed.map((element) => [element.id, { ...element }]),
  );
  for (const selectedId of selected) {
    const previousParent = beforeById.get(selectedId);
    const nextParent = transformedById.get(selectedId);
    if (!previousParent || !nextParent) continue;
    const followerIds = before
      .filter(
        (element) => nearestSelectedAncestor.get(element.id) === selectedId,
      )
      .map((element) => element.id);
    const cohort = [selectedId, ...followerIds]
      .map((id) => beforeById.get(id))
      .filter((element): element is MotusElement => Boolean(element));
    const minimumX = Math.min(...cohort.map((element) => element.x));
    const minimumY = Math.min(...cohort.map((element) => element.y));
    const maximumX = Math.max(
      ...cohort.map((element) => element.x + element.width),
    );
    const maximumY = Math.max(
      ...cohort.map((element) => element.y + element.height),
    );
    const requestedDeltaX = nextParent.x - previousParent.x;
    const requestedDeltaY = nextParent.y - previousParent.y;
    const boundedDeltaX = Math.min(
      CANVAS_WIDTH - maximumX,
      Math.max(-minimumX, requestedDeltaX),
    );
    const boundedDeltaY = Math.min(
      CANVAS_HEIGHT - maximumY,
      Math.max(-minimumY, requestedDeltaY),
    );
    for (const elementId of [selectedId, ...followerIds]) {
      const previous = beforeById.get(elementId);
      const next = nextById.get(elementId);
      if (!previous || !next) continue;
      next.x = previous.x + boundedDeltaX;
      next.y = previous.y + boundedDeltaY;
    }
  }
  return transformed.map((element) => nextById.get(element.id) ?? element);
}

function getElementRigAncestors(
  elements: readonly MotusElement[],
  elementId: string,
) {
  const byId = new Map(elements.map((element) => [element.id, element]));
  const ancestors: MotusElement[] = [];
  const visited = new Set<string>();
  let current = byId.get(elementId);
  while (current?.parentId && !visited.has(current.id)) {
    visited.add(current.id);
    const parent = byId.get(current.parentId);
    if (!parent) break;
    ancestors.push(parent);
    current = parent;
  }
  return ancestors;
}

function rotateCanvasVector(x: number, y: number, degrees: number) {
  const radians = (degrees * Math.PI) / 180;
  const cosine = Math.cos(radians);
  const sine = Math.sin(radians);
  return {
    x: x * cosine - y * sine,
    y: x * sine + y * cosine,
  };
}

function getRenderedRigPoint(
  elements: readonly MotusElement[],
  elementId: string,
  point: { x: number; y: number },
) {
  return getElementRigAncestors(elements, elementId).reduce(
    (renderedPoint, ancestor) => {
      const pivot = {
        x: ancestor.x + (ancestor.width * ancestor.pivotX) / 100,
        y: ancestor.y + (ancestor.height * ancestor.pivotY) / 100,
      };
      const rotated = rotateCanvasVector(
        renderedPoint.x - pivot.x,
        renderedPoint.y - pivot.y,
        ancestor.rotation,
      );
      return { x: pivot.x + rotated.x, y: pivot.y + rotated.y };
    },
    point,
  );
}

function getRigSelectionRootIds(
  elements: readonly MotusElement[],
  selectedIds: Iterable<string>,
) {
  const selected = new Set(selectedIds);
  const byId = new Map(elements.map((element) => [element.id, element]));
  return elements.flatMap((element) => {
    if (!selected.has(element.id)) return [];
    const visited = new Set<string>();
    let parentId = element.parentId;
    while (parentId && !visited.has(parentId)) {
      if (selected.has(parentId)) return [];
      visited.add(parentId);
      parentId = byId.get(parentId)?.parentId ?? null;
    }
    return [element.id];
  });
}

function getImageRigPartClipPath(
  crop: NonNullable<MotusElement['imageRigPart']>,
) {
  if (!crop.maskPoints?.length) return undefined;
  const points = crop.maskPoints.map((point) => {
    const x = ((point.x - crop.cropX) / crop.cropWidth) * 100;
    const y = ((point.y - crop.cropY) / crop.cropHeight) * 100;
    return `${x.toFixed(3)}% ${y.toFixed(3)}%`;
  });
  return `polygon(${points.join(', ')})`;
}

function resizeImageRigPartCrop(
  crop: NonNullable<MotusElement['imageRigPart']>,
  field: 'cropX' | 'cropY' | 'cropWidth' | 'cropHeight',
  value: number,
) {
  const requestedCrop = normalizeElementImageRigPart({
    ...crop,
    [field]: value,
    maskPoints: undefined,
  });
  if (!requestedCrop || !crop.maskPoints?.length) return requestedCrop;
  const maskPoints = crop.maskPoints.map((point) => ({
    x:
      requestedCrop.cropX +
      ((point.x - crop.cropX) / crop.cropWidth) * requestedCrop.cropWidth,
    y:
      requestedCrop.cropY +
      ((point.y - crop.cropY) / crop.cropHeight) * requestedCrop.cropHeight,
  }));
  return normalizeElementImageRigPart({ ...requestedCrop, maskPoints });
}

function elementIcon(type: ElementType) {
  if (type === 'group') return Layers3;
  if (type === 'text') return Type;
  if (type === 'speech') return MessageSquareText;
  if (type === 'image') return FileImage;
  return Circle;
}

function MotusShapeGlyph({
  preset,
  className = '',
}: {
  preset: ElementShapePreset;
  className?: string;
}) {
  if (preset === 'orb') {
    return <span aria-hidden="true" className="orb-highlight" />;
  }

  const definition = getShapePresetDefinition(preset);
  return (
    <svg
      aria-hidden="true"
      className={`shape-preset-glyph ${className}`.trim()}
      focusable="false"
      preserveAspectRatio="none"
      viewBox="0 0 100 100"
    >
      {definition.primitives.map((primitive, index) => {
        if (primitive.kind === 'path') {
          return (
            <path
              d={primitive.d}
              fill="currentColor"
              fillRule={primitive.fillRule}
              key={`${preset}-path-${index}`}
              opacity={primitive.opacity}
            />
          );
        }
        if (primitive.kind === 'circle') {
          return (
            <circle
              cx={primitive.cx}
              cy={primitive.cy}
              fill="currentColor"
              key={`${preset}-circle-${index}`}
              opacity={primitive.opacity}
              r={primitive.r}
            />
          );
        }
        return (
          <line
            key={`${preset}-line-${index}`}
            opacity={primitive.opacity}
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth={primitive.strokeWidth}
            x1={primitive.x1}
            x2={primitive.x2}
            y1={primitive.y1}
            y2={primitive.y2}
          />
        );
      })}
    </svg>
  );
}

function renderElementContent(
  element: MotusElement,
  sceneElements: readonly MotusElement[] = [],
  maskNamespace = 'scene',
  enableMesh = true,
) {
  const rigSourceElement = element.imageRigPart
    ? sceneElements.find(
        (candidate) => candidate.id === element.imageRigPart?.sourceElementId,
      )
    : undefined;
  const resolvedImageSource = element.src ?? rigSourceElement?.src;
  if (element.type === 'image' && resolvedImageSource) {
    if (element.imageRigPart) {
      const crop = element.imageRigPart;
      const framing = getElementImageFraming(rigSourceElement ?? element);
      const meshFraming = {
        aspectRatio:
          (rigSourceElement?.width ?? element.width) /
          (rigSourceElement?.height ?? element.height),
        fit: framing.fit,
        focalX: framing.focalX,
        focalY: framing.focalY,
      };
      const fallbackStyle = {
        height: `${10_000 / crop.cropHeight}%`,
        left: `${(-crop.cropX / crop.cropWidth) * 100}%`,
        maxWidth: 'none',
        objectFit: framing.fit,
        objectPosition: `${framing.focalX}% ${framing.focalY}%`,
        top: `${(-crop.cropY / crop.cropHeight) * 100}%`,
        width: `${10_000 / crop.cropWidth}%`,
      } as CSSProperties;
      return (
        <span
          className="image-rig-part-crop"
          style={
            crop.mesh && enableMesh
              ? undefined
              : { clipPath: getImageRigPartClipPath(crop) }
          }
        >
          {crop.mesh && enableMesh ? (
            <MotusMeshImage
              crop={crop}
              fallbackStyle={fallbackStyle}
              framing={meshFraming}
              mesh={crop.mesh}
              src={resolvedImageSource}
            />
          ) : (
            // oxlint-disable-next-line next/no-img-element
            <img
              alt=""
              draggable={false}
              src={resolvedImageSource}
              style={fallbackStyle}
            />
          )}
        </span>
      );
    }
    const cutouts = sceneElements
      .filter(
        (candidate) =>
          isElementEffectivelyVisible(sceneElements, candidate.id) &&
          candidate.imageRigPart?.sourceElementId === element.id,
      )
      .map((candidate) => candidate.imageRigPart!);
    if (cutouts.length) {
      const maskId = `rig-mask-${maskNamespace}-${element.id.replace(/[^a-z0-9_-]/gi, '-')}`;
      const framing = getElementImageFraming(element);
      return (
        <svg
          aria-hidden="true"
          className="image-rig-source"
          preserveAspectRatio="none"
          viewBox="0 0 100 100"
        >
          <defs>
            <mask id={maskId} maskUnits="userSpaceOnUse">
              <rect fill="white" height="100" width="100" />
              {cutouts.map((crop, index) =>
                crop.maskPoints?.length ? (
                  <polygon
                    fill="black"
                    key={`${crop.sourceElementId}-${index}`}
                    points={crop.maskPoints
                      .map((point) => `${point.x},${point.y}`)
                      .join(' ')}
                  />
                ) : (
                  <rect
                    fill="black"
                    height={crop.cropHeight}
                    key={`${crop.sourceElementId}-${index}`}
                    width={crop.cropWidth}
                    x={crop.cropX}
                    y={crop.cropY}
                  />
                ),
              )}
            </mask>
          </defs>
          <g mask={`url(#${maskId})`}>
            <rect fill="#fff" height="100" width="100" />
            <foreignObject height="100" width="100">
              {/* oxlint-disable-next-line next/no-img-element */}
              <img
                alt=""
                draggable={false}
                src={resolvedImageSource}
                style={{
                  height: '100%',
                  objectFit: framing.fit,
                  objectPosition: `${framing.focalX}% ${framing.focalY}%`,
                  width: '100%',
                }}
              />
            </foreignObject>
          </g>
        </svg>
      );
    }
    const framing = getElementImageFraming(element);
    // Data URLs from the local project file are not compatible with optimized image loaders.
    return (
      // oxlint-disable-next-line next/no-img-element
      <img
        alt=""
        draggable={false}
        src={resolvedImageSource}
        style={{
          objectFit: framing.fit,
          objectPosition: `${framing.focalX}% ${framing.focalY}%`,
        }}
      />
    );
  }
  if (element.type === 'text' || element.type === 'speech') {
    return <span className="element-text-content">{element.text}</span>;
  }
  if (element.type === 'group') return null;
  return <MotusShapeGlyph preset={getElementShapePreset(element)} />;
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

type ElementAnimationHandle = {
  cancel: () => void;
  currentTime: () => number;
  durationMs: number;
  finished: Promise<unknown>;
  pause: () => void;
  play: () => void;
  seek: (timeMs: number) => void;
};

type ScenePlaybackController = {
  cancel: () => void;
  currentTime: () => number;
  durationMs: number;
  pause: () => void;
  play: () => void;
  seek: (timeMs: number) => void;
};

function animateElementProgram(
  element: MotusElement,
  node: HTMLDivElement,
  effectNode: HTMLDivElement = node,
  sharedStartTime?: CSSNumberish | null,
  allowReducedMotion = false,
): ElementAnimationHandle | null {
  if (
    !node.animate ||
    !element.visible ||
    (!allowReducedMotion &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
  ) {
    return null;
  }
  const compiled = compileElementMotion(element);
  if (!compiled.steps.some((step) => step.kind !== 'wait')) return null;
  const artboardWidth = node
    .closest('.artboard')
    ?.getBoundingClientRect().width;
  const canvasScale = artboardWidth ? artboardWidth / CANVAS_WIDTH : 1;
  const timing = {
    duration: Math.max(compiled.sequenceDurationMs, 1),
    fill: 'both' as const,
  };
  const transformAnimation = node.animate(
    compiled.keyframes.map((frame) => ({
      offset: frame.offset,
      easing: frame.easing,
      transform: `translate(${frame.translateX * canvasScale}px, ${frame.translateY * canvasScale}px) rotate(${frame.rotation}deg) scale(${frame.scale * frame.scaleX}, ${frame.scale * frame.scaleY})`,
    })),
    timing,
  );
  const effectAnimation = effectNode.animate(
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
    })),
    timing,
  );
  if (sharedStartTime !== undefined && sharedStartTime !== null) {
    transformAnimation.startTime = sharedStartTime;
    effectAnimation.startTime = sharedStartTime;
  }
  const animations = [transformAnimation, effectAnimation];
  const readCurrentTime = () => {
    const time = transformAnimation.currentTime;
    return typeof time === 'number' && Number.isFinite(time) ? time : 0;
  };
  const seek = (timeMs: number) => {
    const nextTime = Math.min(
      Math.max(Number.isFinite(timeMs) ? timeMs : 0, 0),
      timing.duration,
    );
    animations.forEach((animation) => {
      animation.currentTime = nextTime;
    });
  };
  return {
    cancel: () => animations.forEach((animation) => animation.cancel()),
    currentTime: readCurrentTime,
    durationMs: timing.duration,
    finished: Promise.all([
      transformAnimation.finished,
      effectAnimation.finished,
    ]).then(() => undefined),
    pause: () => animations.forEach((animation) => animation.pause()),
    play: () => animations.forEach((animation) => animation.play()),
    seek,
  };
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
  onPlaybackController?: (controller: ScenePlaybackController | null) => void;
  playbackStartsPaused?: boolean;
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
  onPlaybackController,
  playbackStartsPaused = false,
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
  const maskNamespace = useId().replace(/[^a-z0-9_-]/gi, '-');
  const elementNodes = useRef(new Map<string, HTMLDivElement>());
  const effectNodes = useRef(new Map<string, HTMLDivElement>());
  const surfaceNodes = useRef(new Map<string, HTMLDivElement>());
  const runningAnimations = useRef<ElementAnimationHandle[]>([]);
  const readerAnimations = useRef(new Map<string, ElementAnimationHandle>());
  const triggerReaderElementRef = useRef<ReaderTriggerElement>(() => undefined);
  const onPlaybackCompleteRef = useRef(onPlaybackComplete);
  const onPlaybackControllerRef = useRef(onPlaybackController);
  const playbackStartsPausedRef = useRef(playbackStartsPaused);
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
    onPlaybackControllerRef.current = onPlaybackController;
  }, [onPlaybackController]);

  useEffect(() => {
    playbackStartsPausedRef.current = playbackStartsPaused;
  }, [playbackStartsPaused]);

  useEffect(() => {
    runningAnimations.current.forEach((animation) => animation.cancel());
    runningAnimations.current = [];
    onPlaybackControllerRef.current?.(null);

    if (!playingKey || readerTriggers) return;

    let disposed = false;
    let completed = false;
    const animations: ElementAnimationHandle[] = [];
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
        onPlaybackControllerRef.current?.(null);
      }
    };

    if (
      !playbackStartsPausedRef.current &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    ) {
      queueMicrotask(completePlayback);
      return cleanup;
    }

    const sharedStartTime = document.timeline.currentTime;
    for (const element of renderedElements) {
      if (playingElementId && element.id !== playingElementId) continue;
      const node = elementNodes.current.get(element.id);
      if (!node) continue;
      const animation = animateElementProgram(
        element,
        node,
        effectNodes.current.get(element.id),
        sharedStartTime,
        playbackStartsPausedRef.current,
      );
      if (!animation) continue;
      if (playbackStartsPausedRef.current) animation.pause();
      animations.push(animation);
    }

    runningAnimations.current = animations;
    if (animations.length === 0) {
      queueMicrotask(completePlayback);
    } else {
      const durationMs = animations.reduce(
        (longest, animation) => Math.max(longest, animation.durationMs),
        0,
      );
      const controller: ScenePlaybackController = {
        cancel: () => {
          disposed = true;
          animations.forEach((animation) => animation.cancel());
        },
        currentTime: () =>
          animations.reduce(
            (latest, animation) => Math.max(latest, animation.currentTime()),
            0,
          ),
        durationMs,
        pause: () => animations.forEach((animation) => animation.pause()),
        play: () =>
          animations.forEach((animation) => {
            if (animation.currentTime() >= animation.durationMs) {
              animation.seek(animation.durationMs);
              animation.pause();
            } else {
              animation.play();
            }
          }),
        seek: (timeMs) =>
          animations.forEach((animation) => animation.seek(timeMs)),
      };
      onPlaybackControllerRef.current?.(controller);
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
      const animation = animateElementProgram(
        element,
        node,
        effectNodes.current.get(element.id),
      );
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
      const node = surfaceNodes.current.get(element.id);
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
      {(() => {
        const renderedElementIds = new Set(
          renderedElements.map((element) => element.id),
        );
        const renderRigElement = (
          element: MotusElement,
          depth = 0,
        ): ReactNode => {
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
          const layerOrder = renderedElements.indexOf(element) + 1;
          const rigStyle = {
            opacity: element.type === 'group' ? element.opacity : undefined,
            transform: `rotate(${element.rotation}deg)`,
            transformOrigin: `${((element.x + (element.width * element.pivotX) / 100) / CANVAS_WIDTH) * 100}% ${((element.y + (element.height * element.pivotY) / 100) / CANVAS_HEIGHT) * 100}%`,
            zIndex: layerOrder,
          } as CSSProperties;
          const elementStyle = {
            left: `${(element.x / CANVAS_WIDTH) * 100}%`,
            top: `${(element.y / CANVAS_HEIGHT) * 100}%`,
            width: `${(element.width / CANVAS_WIDTH) * 100}%`,
            height: `${(element.height / CANVAS_HEIGHT) * 100}%`,
            opacity: element.type === 'group' ? 1 : element.opacity,
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
            '--layer-order': layerOrder,
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
            <div
              className="rig-node"
              data-rig-depth={depth}
              data-rig-parent={element.parentId ?? undefined}
              key={readerTriggers ? element.id : `${element.id}-${playingKey}`}
              ref={(node) => {
                if (node) {
                  elementNodes.current.set(element.id, node);
                  if (element.type === 'group') {
                    effectNodes.current.set(element.id, node);
                  }
                } else {
                  elementNodes.current.delete(element.id);
                  if (element.type === 'group') {
                    effectNodes.current.delete(element.id);
                  }
                }
              }}
              style={rigStyle}
            >
              {/* The role and handlers are conditional because reader scenes are display-only. */}
              {/* oxlint-disable-next-line jsx-a11y/no-static-element-interactions */}
              <div
                aria-describedby={
                  interactive ? 'canvas-instructions' : undefined
                }
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
                aria-current={
                  interactive && primarySelected ? 'true' : undefined
                }
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
                data-image-rig-source={
                  element.type === 'image' &&
                  !element.imageRigPart &&
                  renderedElements.some(
                    (candidate) =>
                      candidate.imageRigPart?.sourceElementId === element.id &&
                      isElementEffectivelyVisible(
                        renderedElements,
                        candidate.id,
                      ),
                  )
                    ? true
                    : undefined
                }
                data-image-rig-part={element.imageRigPart ? true : undefined}
                data-locked={element.locked || undefined}
                data-motion-trigger={
                  readerTriggers ? compiledMotion.event : undefined
                }
                data-primary-selected={primarySelected || undefined}
                data-selected={selected || undefined}
                data-shape-preset={
                  element.type === 'shape'
                    ? getElementShapePreset(element)
                    : undefined
                }
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
                          onKeyboardNudge?.(
                            element.id,
                            event.key,
                            event.shiftKey,
                          );
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
                          if (event.key !== 'Enter' && event.key !== ' ')
                            return;
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
                  readerHover
                    ? () => triggerReaderElement(element.id)
                    : undefined
                }
                onPointerEnter={
                  readerHover
                    ? () => triggerReaderElement(element.id)
                    : undefined
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
                  if (node) {
                    surfaceNodes.current.set(element.id, node);
                    if (element.type !== 'group') {
                      effectNodes.current.set(element.id, node);
                    }
                  } else {
                    surfaceNodes.current.delete(element.id);
                    if (element.type !== 'group') {
                      effectNodes.current.delete(element.id);
                    }
                  }
                  if (interactive) onElementRef?.(element.id, node);
                }}
                style={elementStyle}
                tabIndex={
                  (interactive && !editingText) || readerInteractive
                    ? 0
                    : undefined
                }
                title={
                  readerTap
                    ? 'Tap to play this layer animation'
                    : readerHover
                      ? 'Hover or focus to play this layer animation'
                      : undefined
                }
              >
                {primarySelected && interactive ? (
                  <span
                    aria-hidden="true"
                    className="rig-pivot-marker"
                    style={{
                      left: `${element.pivotX}%`,
                      top: `${element.pivotY}%`,
                    }}
                  />
                ) : null}
                {editingText ? (
                  <CanvasTextEditor
                    element={element}
                    onChange={onTextChange}
                    onFinish={onEndTextEdit}
                  />
                ) : (
                  renderElementContent(
                    element,
                    renderedElements,
                    maskNamespace,
                    elementLimit === undefined,
                  )
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
                          onPointerAction?.(
                            event,
                            element.id,
                            `resize-${handle}`,
                          );
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
              {renderedElements
                .filter((candidate) => candidate.parentId === element.id)
                .map((child) => renderRigElement(child, depth + 1))}
            </div>
          );
        };
        return renderedElements
          .filter(
            (element) =>
              !element.parentId || !renderedElementIds.has(element.parentId),
          )
          .map((element) => renderRigElement(element));
      })()}
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
  const [previewActive, setPreviewActive] = useState(false);
  const [previewStartsPaused, setPreviewStartsPaused] = useState(false);
  const [timelineCollapsed, setTimelineCollapsed] = useState(false);
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
  const [readerPageTurnIntent, setReaderPageTurnIntent] =
    useState<ReaderNavigationIntent | null>(null);
  const [readerPageTransitionSequence, setReaderPageTransitionSequence] =
    useState(0);
  const [publishOpen, setPublishOpen] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [catalogTab, setCatalogTab] = useState<CatalogTab>('works');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [elementCatalogSearch, setElementCatalogSearch] = useState('');
  const [elementCatalogCategory, setElementCatalogCategory] =
    useState<ElementCatalogCategoryFilter>('all');
  const [blockPaletteCategory, setBlockPaletteCategory] =
    useState<BlockPaletteCategory>('motion');
  const [blockPaletteSearch, setBlockPaletteSearch] = useState('');
  const [numericDrafts, setNumericDrafts] = useState<Record<string, string>>(
    {},
  );
  const [rigRegionDraft, setRigRegionDraft] = useState<RigRegionDraft>(
    DEFAULT_RIG_REGION_DRAFT,
  );
  const [rigPartNameDraftState, setRigPartNameDraftState] = useState({
    sourceElementId: '',
    value: '',
  });
  const [activeMotionDrag, setActiveMotionDrag] =
    useState<ActiveMotionDrag | null>(null);
  const [activeLayerDrag, setActiveLayerDrag] =
    useState<ActiveLayerDrag | null>(null);
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
  const rigPartNameInput = useRef<HTMLInputElement>(null);
  const rigCutPanel = useRef<HTMLElement>(null);
  const canvasStage = useRef<HTMLDivElement>(null);
  const studioGrid = useRef<HTMLDivElement>(null);
  const motionProperties = useRef<HTMLDivElement>(null);
  const readerScroll = useRef<HTMLDivElement>(null);
  const activePivotGesture = useRef<{
    elementId: string;
    elementName: string;
  } | null>(null);
  const canvasElementRefs = useRef(new Map<string, HTMLDivElement>());
  const chapterButtonRefs = useRef(new Map<string, HTMLButtonElement>());
  const sceneButtonRefs = useRef(new Map<string, HTMLButtonElement>());
  const deletionUndoTimer = useRef<number | null>(null);
  const activePointerCleanup = useRef<(() => void) | null>(null);
  const canvasPlaybackController = useRef<ScenePlaybackController | null>(null);
  const pendingPreviewSeek = useRef<number | null>(null);
  const previewRunningRef = useRef(false);
  const copiedElements = useRef<CopiedElementSnapshot | null>(null);
  const motionSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 7 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const layerSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 7 },
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
    canvasPlaybackController.current?.cancel();
    canvasPlaybackController.current = null;
    pendingPreviewSeek.current = null;
    previewRunningRef.current = false;
    setActiveAlignmentGuides([]);
    setPreviewRunning(false);
    setPreviewActive(false);
    setPreviewStartsPaused(false);
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

  const handleCatalogTabKeyDown = (
    event: ReactKeyboardEvent<HTMLButtonElement>,
  ) => {
    const currentIndex = CATALOG_TABS.indexOf(catalogTab);
    const nextIndex = getTabIndexForKey(
      currentIndex,
      CATALOG_TABS.length,
      event.key,
    );
    if (nextIndex === null) return;
    const nextTab = CATALOG_TABS[nextIndex];

    event.preventDefault();
    setCatalogTab(nextTab);
    requestAnimationFrame(() => {
      document.getElementById(`catalog-tab-${nextTab}`)?.focus();
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
  const flattenedLayerRows = useMemo(
    () => flattenRigLayers(activeScene.elements),
    [activeScene.elements],
  );
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
  const selectedRigCutterSourceId =
    selectedElement?.type === 'image' &&
    selectedElement.src &&
    !selectedElement.imageRigPart
      ? selectedElement.id
      : null;
  const rigPartNameDraft =
    rigPartNameDraftState.sourceElementId === selectedRigCutterSourceId
      ? rigPartNameDraftState.value
      : '';
  const selectedRigPath = useMemo(() => {
    if (!selectedElement) return [];
    const byId = new Map(
      activeScene.elements.map((element) => [element.id, element]),
    );
    const path: MotusElement[] = [];
    const visited = new Set<string>();
    let current: MotusElement | undefined = selectedElement;
    while (current && !visited.has(current.id)) {
      visited.add(current.id);
      path.unshift(current);
      current = current.parentId ? byId.get(current.parentId) : undefined;
    }
    return path;
  }, [activeScene.elements, selectedElement]);
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
  const selectedImageFraming =
    selectedElement?.type === 'image'
      ? getElementImageFraming(selectedElement)
      : undefined;
  const selectedRigSourceElement = selectedElement?.imageRigPart
    ? activeScene.elements.find(
        (element) =>
          element.id === selectedElement.imageRigPart?.sourceElementId,
      )
    : undefined;
  const selectedRigSourceFraming = selectedRigSourceElement
    ? getElementImageFraming(selectedRigSourceElement)
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
      const scene = findProjectScene(draft, activeScene.id)?.scene;
      const element = scene?.elements.find((item) => item.id === elementId);
      if (element) {
        const previousX = element.x;
        const previousY = element.y;
        mutate(element);
        const requestedX = Number.isFinite(element.x) ? element.x : previousX;
        const requestedY = Number.isFinite(element.y) ? element.y : previousY;
        const normalized = constrainElementToCanvas({
          ...element,
          x: previousX,
          y: previousY,
        });
        Object.assign(element, normalized, { x: previousX, y: previousY });
        scene!.elements = translateElementRigBranch(
          scene!.elements,
          elementId,
          requestedX - previousX,
          requestedY - previousY,
        );
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

  const setElementRigParent = (elementId: string, parentId: string | null) => {
    const element = activeScene.elements.find((item) => item.id === elementId);
    if (!element || element.parentId === parentId) return;
    const preview = reparentElementRigBranchPreservingPose(
      activeScene.elements,
      elementId,
      parentId,
    );
    if (preview.issue) {
      setNotice(
        preview.issue === 'depth-limit'
          ? `Rigs can be nested up to ${MAX_ELEMENT_RIG_DEPTH} levels`
          : preview.issue === 'cycle'
            ? 'A rig branch cannot follow itself or one of its children'
            : 'That rig destination is no longer available',
      );
      return;
    }
    if (!preview.changed) return;
    commitProject((draft) => {
      const scene = findProjectScene(draft, activeScene.id)?.scene;
      if (!scene) return;
      const result = reparentElementRigBranchPreservingPose(
        scene.elements,
        elementId,
        parentId,
      );
      if (!result.issue && result.changed) scene.elements = result.elements;
    });
    const parent = parentId
      ? activeScene.elements.find((item) => item.id === parentId)
      : null;
    setNotice(
      parent
        ? `${element.name} now follows ${parent.name} · pose preserved`
        : `${element.name} detached to scene root · pose preserved`,
    );
  };

  const updateElementRigPivot = (
    elementId: string,
    pivotX: number,
    pivotY: number,
    transactionKey: string | null = null,
  ) => {
    const preview = setElementRigPivotPreservingPose(
      activeScene.elements,
      elementId,
      pivotX,
      pivotY,
    );
    if (preview.issue) {
      activePivotGesture.current = null;
      setNotice(
        preview.issue === 'coordinate-limit'
          ? 'Move this rig away from the canvas edge before changing its pivot'
          : preview.issue === 'invalid-pivot'
            ? 'Pivot values must stay between 0 and 100%'
            : 'Layer is no longer available',
      );
      return false;
    }
    if (!preview.changed) return false;
    commitProject((draft) => {
      const scene = findProjectScene(draft, activeScene.id)?.scene;
      if (!scene) return;
      const result = setElementRigPivotPreservingPose(
        scene.elements,
        elementId,
        pivotX,
        pivotY,
      );
      if (result.changed) scene.elements = result.elements;
    }, transactionKey);
    return true;
  };

  const groupSelectionAsRig = () => {
    const candidates =
      selectedElements.length > 1
        ? selectedElements
        : selectedElement
          ? [selectedElement]
          : [];
    if (!candidates.length || !canAddElementToScene(activeScene)) return;
    const selectedIds = new Set(candidates.map((element) => element.id));
    const topLevel = candidates.filter((element) => {
      let parentId = element.parentId;
      while (parentId) {
        if (selectedIds.has(parentId)) return false;
        parentId =
          activeScene.elements.find((candidate) => candidate.id === parentId)
            ?.parentId ?? null;
      }
      return true;
    });
    const groupedIds = new Set(
      topLevel.flatMap((element) => [
        element.id,
        ...getElementRigDescendantIds(activeScene.elements, element.id),
      ]),
    );
    const groupedElements = activeScene.elements.filter((element) =>
      groupedIds.has(element.id),
    );
    const left = Math.min(...groupedElements.map((element) => element.x));
    const top = Math.min(...groupedElements.map((element) => element.y));
    const right = Math.max(
      ...groupedElements.map((element) => element.x + element.width),
    );
    const bottom = Math.max(
      ...groupedElements.map((element) => element.y + element.height),
    );
    const sharedParent = topLevel.every(
      (element) => element.parentId === topLevel[0].parentId,
    )
      ? topLevel[0].parentId
      : null;
    const groupDepth = sharedParent
      ? getElementRigDepth(activeScene.elements, sharedParent) + 1
      : 0;
    const deepestBranch = Math.max(
      ...topLevel.map((element) => {
        const elementDepth = getElementRigDepth(
          activeScene.elements,
          element.id,
        );
        return Math.max(
          0,
          ...getElementRigDescendantIds(activeScene.elements, element.id).map(
            (descendantId) =>
              getElementRigDepth(activeScene.elements, descendantId) -
              elementDepth,
          ),
        );
      }),
    );
    if (groupDepth + 1 + deepestBranch > MAX_ELEMENT_RIG_DEPTH) {
      setNotice(`Rigs can be nested up to ${MAX_ELEMENT_RIG_DEPTH} levels`);
      return;
    }
    const group = createElement('group', activeScene.elements.length + 1, {
      id: uniqueId('rig-group'),
      name: `Rig group ${activeScene.elements.filter((item) => item.type === 'group').length + 1}`,
      parentId: sharedParent,
      x: left,
      y: top,
      width: Math.max(MIN_ELEMENT_WIDTH, right - left),
      height: Math.max(MIN_ELEMENT_HEIGHT, bottom - top),
      fill: '#7d5cff',
    });
    commitProject((draft) => {
      const scene = findProjectScene(draft, activeScene.id)?.scene;
      if (!scene) return;
      scene.elements.push(group);
      scene.elements.forEach((element) => {
        if (
          selectedIds.has(element.id) &&
          topLevel.some((item) => item.id === element.id)
        ) {
          element.parentId = group.id;
        }
      });
    });
    setSelectedElementId(group.id);
    setNotice(
      `${topLevel.length} ${topLevel.length === 1 ? 'layer' : 'layers'} nested under ${group.name}`,
    );
    focusEditorTarget(activeScene.id, group.id);
  };

  const openRigPartCutter = (sourceElementId: string) => {
    const source = activeScene.elements.find(
      (element) =>
        element.id === sourceElementId &&
        element.type === 'image' &&
        element.src &&
        !element.imageRigPart,
    );
    if (!source) {
      setNotice('The original image layer is no longer available');
      return;
    }
    setRigPartNameDraftState({ sourceElementId: source.id, value: '' });
    setRigRegionDraft(DEFAULT_RIG_REGION_DRAFT);
    setSelectedElementId(source.id);
    setInspectorTab('design');
    setMobileStudioPane('blocks');
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        rigCutPanel.current?.scrollIntoView({
          behavior: 'auto',
          block: 'start',
        });
        rigPartNameInput.current?.focus({ preventScroll: true });
      });
    });
    setNotice(`Ready to cut another part from ${source.name}`);
  };

  const extractImageRigPart = (selection?: SmartCutResult) => {
    if (
      !selectedElement ||
      selectedElement.type !== 'image' ||
      !selectedElement.src ||
      selectedElement.imageRigPart ||
      !canAddElementToScene(activeScene)
    ) {
      return;
    }
    const partName = validateElementRigPartName(
      rigPartNameDraft,
      activeScene.elements
        .filter(
          (element) =>
            element.imageRigPart?.sourceElementId === selectedElement.id,
        )
        .map((element) => element.name),
    );
    if (partName.issue) {
      setNotice(
        partName.issue === 'required'
          ? 'Name the new rig part before cutting'
          : partName.issue === 'duplicate'
            ? `A part named ${partName.name} already exists under ${selectedElement.name}`
            : `Part names can use up to ${MAX_ELEMENT_NAME_LENGTH} characters`,
      );
      rigPartNameInput.current?.focus();
      rigPartNameInput.current?.select();
      return;
    }
    const region = selection
      ? {
          x: selection.cropX,
          y: selection.cropY,
          width: selection.cropWidth,
          height: selection.cropHeight,
        }
      : rigRegionDraft;
    const cropX = Math.min(Math.max(region.x, 0), 99);
    const cropY = Math.min(Math.max(region.y, 0), 99);
    const cropWidth = Math.min(Math.max(region.width, 0.1), 100 - cropX);
    const cropHeight = Math.min(Math.max(region.height, 0.1), 100 - cropY);
    const imageRigPart = normalizeElementImageRigPart({
      sourceElementId: selectedElement.id,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      ...(selection?.maskPoints ? { maskPoints: selection.maskPoints } : {}),
    });
    if (!imageRigPart || (selection && !imageRigPart.maskPoints)) {
      setNotice('Draw a larger closed selection');
      return;
    }
    const part = createElement('image', activeScene.elements.length + 1, {
      id: uniqueId('rig-part'),
      name: partName.name,
      parentId: selectedElement.id,
      pivotX: 50,
      pivotY: 50,
      x: selectedElement.x + (selectedElement.width * imageRigPart.cropX) / 100,
      y:
        selectedElement.y + (selectedElement.height * imageRigPart.cropY) / 100,
      width: Math.max(
        MIN_ELEMENT_WIDTH,
        (selectedElement.width * imageRigPart.cropWidth) / 100,
      ),
      height: Math.max(
        MIN_ELEMENT_HEIGHT,
        (selectedElement.height * imageRigPart.cropHeight) / 100,
      ),
      src: undefined,
      imageRigPart,
    });
    commitProject((draft) => {
      findProjectScene(draft, activeScene.id)?.scene.elements.push(part);
    });
    setRigPartNameDraftState({
      sourceElementId: selectedElement.id,
      value: '',
    });
    setSelectedElementId(part.id);
    setNotice(`${part.name} ${selection ? 'masked' : 'cropped'} and attached`);
    focusEditorTarget(activeScene.id, part.id);
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
    const branchIds = getElementRigCascadeDeleteIds(activeScene.elements, [
      elementId,
    ]);
    const branchIdSet = new Set(branchIds);
    const nextSelectedElementId =
      activeScene.elements
        .filter((element) => !branchIdSet.has(element.id))
        .at(-1)?.id ?? '';
    commitProject((draft) => {
      const scene = findProjectScene(draft, activeScene.id)?.scene;
      if (!scene) return;
      scene.elements = scene.elements.filter(
        (element) => !branchIdSet.has(element.id),
      );
    });
    setSelectedElementId(nextSelectedElementId);
    setNotice(
      action === 'cut'
        ? `${deletedElement.name}${branchIds.length > 1 ? ` and ${branchIds.length - 1} nested parts` : ''} cut · paste to move it`
        : `${deletedElement.name}${branchIds.length > 1 ? ` and ${branchIds.length - 1} nested parts` : ''} deleted`,
    );
    showDeletionUndo({
      message: `${deletedElement.name} ${action === 'cut' ? 'cut' : 'deleted'}`,
      chapterId: activeChapter.id,
      sceneId: activeScene.id,
      elementId,
      elementIds: branchIds,
    });
    focusEditorTarget(activeScene.id, nextSelectedElementId);
  };

  const deleteSelection = (action: 'delete' | 'cut' = 'delete') => {
    if (selectedElements.length < 2) {
      if (selectedElementId) deleteElement(selectedElementId, action);
      return;
    }
    const deletedIds = getElementRigCascadeDeleteIds(
      activeScene.elements,
      selectedElements.map((element) => element.id),
    );
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
    const element = activeScene.elements.find((item) => item.id === elementId);
    if (!element) return;
    const siblings = activeScene.elements.filter(
      (item) => item.parentId === element.parentId,
    );
    const siblingIndex = siblings.findIndex((item) => item.id === elementId);
    const target = siblings[siblingIndex + direction];
    if (!target) return;
    commitProject((draft) => {
      const scene = findProjectScene(draft, activeScene.id)?.scene;
      if (!scene) return;
      const result = reorderElementRigSibling(
        scene.elements,
        elementId,
        target.id,
      );
      if (result.outcome === 'moved') scene.elements = result.elements;
    });
    setNotice(
      `${element.name} moved ${direction > 0 ? 'forward' : 'back'} in its layer stack`,
    );
  };

  const focusLayerRow = (elementId: string) => {
    window.requestAnimationFrame(() => {
      document.getElementById(`layer-select-${elementId}`)?.focus();
    });
  };

  const startLayerDrag = (event: DragStartEvent) => {
    activePointerCleanup.current?.();
    endHistoryTransaction();
    const drag = readLayerDragData(event.active.data.current);
    setActiveLayerDrag(drag);
    if (!drag) return;
    setSelectedElementId(drag.elementId);
    setNotice(
      `${drag.label} picked up · use row edges to reorder, center to nest, or Scene root to detach`,
    );
  };

  const cancelLayerDrag = (_event?: DragCancelEvent) => {
    const label = activeLayerDrag?.label ?? 'Layer';
    setActiveLayerDrag(null);
    setNotice(`${label} move cancelled`);
  };

  const finishLayerDrag = (event: DragEndEvent) => {
    const drag = readLayerDragData(event.active.data.current);
    const drop = readLayerDropData(event.over?.data.current);
    const droppedAtRoot = event.over?.id === LAYER_ROOT_DROP_ID;
    setActiveLayerDrag(null);
    if (!drag) {
      setNotice('Ready');
      return;
    }
    if (droppedAtRoot) {
      if (!drag.parentId) {
        setNotice(`${drag.label} is already at the scene root`);
      } else {
        setElementRigParent(drag.elementId, null);
      }
      focusLayerRow(drag.elementId);
      return;
    }
    if (!drop) {
      setNotice(`${drag.label} returned to its previous position`);
      focusLayerRow(drag.elementId);
      return;
    }
    if (drop.intent === 'parent') {
      setElementRigParent(drag.elementId, drop.targetElementId);
      focusLayerRow(drag.elementId);
      return;
    }
    if (
      drag.elementId === drop.targetElementId ||
      drag.parentId !== drop.targetParentId
    ) {
      setNotice('Use the center of a layer row to nest this rig branch');
      focusLayerRow(drag.elementId);
      return;
    }

    const placement = drop.intent;
    let moved = false;
    commitProject((draft) => {
      const scene = findProjectScene(draft, activeScene.id)?.scene;
      if (!scene) return;
      const result = reorderElementRigSibling(
        scene.elements,
        drag.elementId,
        drop.targetElementId,
        placement,
      );
      if (result.outcome !== 'moved') return;
      scene.elements = result.elements;
      moved = true;
    });
    const target = activeScene.elements.find(
      (element) => element.id === drop.targetElementId,
    );
    setNotice(
      moved
        ? `${drag.label} moved ${placement} ${target?.name ?? 'the target layer'}`
        : `${drag.label} stayed in position`,
    );
    focusLayerRow(drag.elementId);
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
      const selectionIds = [
        ...new Set(
          unlockedSelectedElementIds.flatMap((id) => [
            id,
            ...getElementRigDescendantIds(activeScene.elements, id),
          ]),
        ),
      ];
      commitProject(
        (draft) => {
          const scene = findProjectScene(draft, activeScene.id)?.scene;
          if (!scene) return;
          scene.elements = translateElementRigSelectionByCanvasDelta(
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
    commitProject((draft) => {
      const scene = findProjectScene(draft, activeScene.id)?.scene;
      if (!scene) return;
      scene.elements = translateElementRigSelectionByCanvasDelta(
        scene.elements,
        [elementId],
        delta.x,
        delta.y,
      );
    }, `element:${elementId}:keyboard-position`);
    setNotice(`${element.name} moved${accelerated ? ' 10 px' : ' 1 px'}`);
  };

  const alignSelection = (alignment: ElementAlignment) => {
    if (unlockedSelectedElementIds.length < 2) {
      setNotice('Select at least two unlocked layers to align them');
      return;
    }
    const nextElements = preserveRigBranchesAfterSelectionTransform(
      activeScene.elements,
      alignSelectedElements(
        activeScene.elements,
        unlockedSelectedElementIds,
        alignment,
      ),
      unlockedSelectedElementIds,
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
      scene.elements = preserveRigBranchesAfterSelectionTransform(
        scene.elements,
        alignSelectedElements(
          scene.elements,
          unlockedSelectedElementIds,
          alignment,
        ),
        unlockedSelectedElementIds,
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
    const nextElements = preserveRigBranchesAfterSelectionTransform(
      activeScene.elements,
      distributeSelectedElements(
        activeScene.elements,
        unlockedSelectedElementIds,
        axis,
      ),
      unlockedSelectedElementIds,
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
      scene.elements = preserveRigBranchesAfterSelectionTransform(
        scene.elements,
        distributeSelectedElements(
          scene.elements,
          unlockedSelectedElementIds,
          axis,
        ),
        unlockedSelectedElementIds,
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
    canvasPlaybackController.current?.cancel();
    canvasPlaybackController.current = null;
    pendingPreviewSeek.current = null;
    previewRunningRef.current = true;
    setPreviewRunning(true);
    setPreviewActive(true);
    setPreviewStartsPaused(false);
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
      setCatalogTab('elements');
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

  const addCatalogElement = (entryId: string) => {
    const created = createElementCatalogItem(
      entryId,
      activeScene.elements.length + 1,
      uniqueId,
    );
    if (!created) return;
    if (
      activeScene.elements.length + created.elements.length >
      MAX_SCENE_ELEMENTS
    ) {
      setNotice(
        `${created.entry.name} needs ${created.elements.length} layers · this scene only has ${MAX_SCENE_ELEMENTS - activeScene.elements.length} free`,
      );
      return;
    }

    commitProject((draft) => {
      findProjectScene(draft, activeScene.id)?.scene.elements.push(
        ...created.elements,
      );
    });
    setSelectedElementId(created.rootElementId);
    setInspectorTab('design');
    setCatalogOpen(false);
    setNotice(
      `${created.entry.name} added · ${created.elements.length} editable layer${created.elements.length === 1 ? '' : 's'}`,
    );
    focusEditorTarget(activeScene.id, created.rootElementId);
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
    if (!source) return;
    const branchIds = new Set([
      elementId,
      ...getElementRigDescendantIds(activeScene.elements, elementId),
    ]);
    const branch = activeScene.elements.filter((element) =>
      branchIds.has(element.id),
    );
    if (branch.length > 1) {
      addElementCopies(branch, `${source.name} rig duplicated`);
    } else {
      addElementCopy(source, 'Layer duplicated');
    }
  };

  const addElementCopies = (
    sources: readonly MotusElement[],
    successMessage: string,
    selectedSourceIds: ReadonlySet<string> = new Set(
      sources.map((source) => source.id),
    ),
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
      copy.parentId = source.parentId
        ? (copiedElementIds.get(source.parentId) ?? source.parentId)
        : null;
      if (copy.imageRigPart) {
        copy.imageRigPart.sourceElementId =
          copiedElementIds.get(copy.imageRigPart.sourceElementId) ??
          copy.imageRigPart.sourceElementId;
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
    const selectedCopyIds = copyIds.filter((_, index) =>
      selectedSourceIds.has(sources[index].id),
    );
    setSelectedElementIds(selectedCopyIds);
    setPrimarySelectedElementId(selectedCopyIds.at(-1) ?? copyIds.at(-1)!);
    setEditingTextElementId(null);
    setNotice(successMessage);
    focusEditorTarget(
      activeScene.id,
      selectedCopyIds.at(-1) ?? copyIds.at(-1)!,
    );
    return true;
  };

  const duplicateSelection = () => {
    if (selectedElements.length > 1) {
      const copyIds = new Set(
        selectedElements.flatMap((element) => [
          element.id,
          ...getElementRigDescendantIds(activeScene.elements, element.id),
        ]),
      );
      addElementCopies(
        activeScene.elements.filter((element) => copyIds.has(element.id)),
        `${copyIds.size} layers duplicated`,
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
        parentId: element.parentId
          ? (duplicatedElementIds.get(element.parentId) ?? null)
          : null,
        imageRigPart: element.imageRigPart
          ? {
              ...element.imageRigPart,
              sourceElementId:
                duplicatedElementIds.get(
                  element.imageRigPart.sourceElementId,
                ) ?? element.imageRigPart.sourceElementId,
            }
          : undefined,
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
    setReaderMode(readerModeForFormat(source.format));
    setReaderChapterId(source.chapters[0].id);
    setReaderPageTurnIntent(null);
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
    setReaderMode(readerModeForFormat(catalogProject.format));
    setReaderChapterId(catalogProject.chapters[0].id);
    setReaderPageTurnIntent(null);
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
        setReaderMode(readerModeForFormat(project.format));
        setReaderChapterId(project.chapters[0].id);
        setReaderPageTurnIntent(null);
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
        setReaderMode(readerModeForFormat(catalogProject.format));
        setReaderChapterId(catalogProject.chapters[0].id);
        setReaderPageTurnIntent(null);
        setReaderPageIndex(0);
        setReaderPreviewKey((key) => key + 1);
        setReaderOpen(true);
        setNotice(`Previewing ${work.title}`);
      } else if (
        catalogTarget &&
        CATALOG_TABS.includes(catalogTarget as CatalogTab)
      ) {
        setCatalogTab(catalogTarget as CatalogTab);
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
    setReaderMode(readerModeForFormat(revision.format));
    setReaderChapterId(revision.chapters[0].id);
    setReaderPageTurnIntent(null);
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
      ? [
          ...new Set(
            unlockedSelectedElementIds.flatMap((id) => [
              id,
              ...getElementRigDescendantIds(activeScene.elements, id),
            ]),
          ),
        ]
      : [elementId];
    const selectionHasRotatedAncestor = getRigSelectionRootIds(
      activeScene.elements,
      moveSelectionIds,
    ).some(
      (rootId) =>
        Math.abs(
          getElementRigAncestors(activeScene.elements, rootId).reduce(
            (total, ancestor) => total + ancestor.rotation,
            0,
          ) % 360,
        ) > 0.01,
    );
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
    const renderedPivot = getRenderedRigPoint(
      activeScene.elements,
      element.id,
      {
        x: origin.x + (origin.width * element.pivotX) / 100,
        y: origin.y + (origin.height * element.pivotY) / 100,
      },
    );
    const ancestorRotation = getElementRigAncestors(
      activeScene.elements,
      element.id,
    ).reduce((total, ancestor) => total + ancestor.rotation, 0);
    const startCanvasX = ((startX - bounds.left) / bounds.width) * CANVAS_WIDTH;
    const startCanvasY =
      ((startY - bounds.top) / bounds.height) * CANVAS_HEIGHT;
    const startRotationAngle = Math.atan2(
      startCanvasY - renderedPivot.y,
      startCanvasX - renderedPivot.x,
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
      const rawDeltaX = (clientDeltaX / bounds.width) * CANVAS_WIDTH;
      const rawDeltaY = (clientDeltaY / bounds.height) * CANVAS_HEIGHT;
      const authoredDelta =
        mode === 'rotate' || mode === 'move'
          ? { x: rawDeltaX, y: rawDeltaY }
          : rotateCanvasVector(rawDeltaX, rawDeltaY, -ancestorRotation);
      const deltaX = authoredDelta.x;
      const deltaY = authoredDelta.y;
      let transformDeltaX = deltaX;
      let transformDeltaY = deltaY;
      if (mode === 'move') {
        if (
          pointer.altKey ||
          (groupMove
            ? selectionHasRotatedAncestor
            : Math.abs(ancestorRotation % 360) > 0.01)
        ) {
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
          pointerCanvasY - renderedPivot.y,
          pointerCanvasX - renderedPivot.x,
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
        const scene = findProjectScene(next, activeScene.id)?.scene;
        if (!scene) return current;
        if (mode === 'move') {
          scene.elements = translateElementRigSelectionByCanvasDelta(
            originSceneElements,
            groupMove ? moveSelectionIds : [elementId],
            transformDeltaX,
            transformDeltaY,
          );
          next.updatedAt = new Date().toISOString();
          return next;
        }
        const target = scene?.elements.find((item) => item.id === elementId);
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

      const selectedSources =
        selectedElements.length > 1 ? selectedElements : [selectedElement];
      const contentElementIds = getElementRigCascadeDeleteIds(
        activeScene.elements,
        selectedSources.map((source) => source.id),
      );
      const snapshotIds = new Set(contentElementIds);
      for (const element of activeScene.elements) {
        if (!snapshotIds.has(element.id) || !element.imageRigPart) continue;
        snapshotIds.add(element.imageRigPart.sourceElementId);
      }
      const snapshotElements = activeScene.elements.filter((source) =>
        snapshotIds.has(source.id),
      );
      const contentElements = activeScene.elements.filter((source) =>
        contentElementIds.includes(source.id),
      );
      copiedElements.current = {
        sceneId: activeScene.id,
        contentElementIds,
        elements: structuredClone(snapshotElements),
      };
      event.clipboardData.setData(
        MOTUS_LAYER_CLIPBOARD_TYPE,
        JSON.stringify(snapshotElements.map((source) => source.id)),
      );
      event.preventDefault();
      return contentElements;
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

      const snapshot = copiedElements.current;
      const marker = clipboard.getData(MOTUS_LAYER_CLIPBOARD_TYPE);
      if (
        !snapshot ||
        marker !== JSON.stringify(snapshot.elements.map((source) => source.id))
      )
        return;
      event.preventDefault();
      const contentIds = new Set(snapshot.contentElementIds);
      const sameScene = snapshot.sceneId === activeScene.id;
      const activeIds = new Set(
        activeScene.elements.map((element) => element.id),
      );
      const pasteIds = new Set(snapshot.contentElementIds);
      for (const element of snapshot.elements) {
        if (!contentIds.has(element.id) || !element.imageRigPart) continue;
        if (
          !sameScene ||
          !activeIds.has(element.imageRigPart.sourceElementId)
        ) {
          pasteIds.add(element.imageRigPart.sourceElementId);
        }
      }
      const sources = snapshot.elements
        .filter((source) => pasteIds.has(source.id))
        .map((source) => ({
          ...source,
          parentId:
            source.parentId &&
            (contentIds.has(source.parentId) ||
              (sameScene && activeIds.has(source.parentId)))
              ? source.parentId
              : null,
          visible: contentIds.has(source.id) ? source.visible : false,
        }));
      const selectedSourceIds = new Set(
        sources
          .filter((source) => contentIds.has(source.id))
          .map((source) => source.id),
      );
      const pastedLayerCount = selectedSourceIds.size;
      if (sources.length > 1) {
        addElementCopies(
          sources,
          `${pastedLayerCount} ${pastedLayerCount === 1 ? 'layer' : 'layers'} pasted`,
          selectedSourceIds,
        );
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
  const normalizedElementCatalogSearch = elementCatalogSearch
    .trim()
    .toLocaleLowerCase();
  const filteredElementCatalog = MOTUS_ELEMENT_CATALOG.filter((entry) => {
    if (
      elementCatalogCategory !== 'all' &&
      entry.category !== elementCatalogCategory
    ) {
      return false;
    }
    if (!normalizedElementCatalogSearch) return true;
    const preset =
      entry.kind === 'shape' ? entry.shapePreset : entry.previewPreset;
    return [
      entry.name,
      entry.description,
      entry.category,
      preset,
      ...entry.tags,
    ]
      .join(' ')
      .toLocaleLowerCase()
      .includes(normalizedElementCatalogSearch);
  });
  const elementCatalogCategoryCounts = new Map(
    ELEMENT_CATALOG_CATEGORIES.map((category) => [
      category.id,
      MOTUS_ELEMENT_CATALOG.filter((entry) => entry.category === category.id)
        .length,
    ]),
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
  const readerPagedLayout = readerMode === 'spread' ? 'spread' : 'page';
  const readerSceneCounts = readerSource.chapters.map(
    (chapter) => chapter.scenes.length,
  );
  const readerPageTargets = {
    previous: getAdjacentReaderPosition(
      readerSceneCounts,
      {
        chapterIndex: readerChapterIndex,
        pageIndex: resolvedReaderPageIndex,
      },
      readerPagedLayout,
      'previous',
    ),
    next: getAdjacentReaderPosition(
      readerSceneCounts,
      {
        chapterIndex: readerChapterIndex,
        pageIndex: resolvedReaderPageIndex,
      },
      readerPagedLayout,
      'next',
    ),
  };
  const readerLeftControlIntent = getReaderControlIntent(
    readerSource.readerPresentation.direction,
    'left',
  );
  const readerRightControlIntent = getReaderControlIntent(
    readerSource.readerPresentation.direction,
    'right',
  );
  const readerPageTransition = getReaderTransitionPresentation(
    readerSource.readerPresentation.transition,
    readerSource.readerPresentation.direction,
    readerPageTurnIntent,
    false,
  );
  const readerVisibleSceneIndexes = getReaderVisibleSceneIndexes(
    readerScenes.length,
    resolvedReaderPageIndex,
    readerPagedLayout,
  );
  const readerPageTransitionStyle = {
    '--reader-transition-duration': `${readerSource.readerPresentation.durationMs}ms`,
  } as CSSProperties;
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
  const finishCanvasPreview = useCallback(() => {
    if (!previewRunningRef.current) return;
    previewRunningRef.current = false;
    canvasPlaybackController.current = null;
    setPreviewRunning(false);
    setPreviewActive(false);
    setPreviewStartsPaused(false);
    setCanvasPreviewKey(0);
    setNotice('Preview finished');
  }, []);

  const stopCanvasPreview = useCallback(() => {
    previewRunningRef.current = false;
    canvasPlaybackController.current?.cancel();
    canvasPlaybackController.current = null;
    pendingPreviewSeek.current = null;
    setPreviewRunning(false);
    setPreviewActive(false);
    setPreviewStartsPaused(false);
    setCanvasPreviewKey(0);
    setNotice('Preview stopped');
  }, []);

  const handleCanvasPlaybackController = useCallback(
    (controller: ScenePlaybackController | null) => {
      canvasPlaybackController.current = controller;
      if (!controller || pendingPreviewSeek.current === null) return;
      const nextTime = pendingPreviewSeek.current;
      pendingPreviewSeek.current = null;
      controller.pause();
      controller.seek(nextTime);
    },
    [],
  );

  const getCanvasPreviewTime = useCallback(
    () => canvasPlaybackController.current?.currentTime() ?? 0,
    [],
  );

  const pauseCanvasPreview = useCallback(() => {
    if (!canvasPlaybackController.current) return;
    previewRunningRef.current = false;
    canvasPlaybackController.current.pause();
    setPreviewRunning(false);
    setPreviewActive(true);
    setPreviewStartsPaused(true);
    setNotice('Preview paused');
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
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setNotice(
        'Motion is reduced · drag the timeline playhead to inspect frames',
      );
      return;
    }
    canvasPlaybackController.current?.cancel();
    canvasPlaybackController.current = null;
    pendingPreviewSeek.current = null;
    previewRunningRef.current = true;
    setPreviewScope(scope);
    setPreviewRunning(true);
    setPreviewActive(true);
    setPreviewStartsPaused(false);
    setMobileStudioPane('stage');
    setCanvasPreviewKey((key) => key + 1);
    setNotice(
      `${scope === 'selected' ? selectedElement?.name : 'Scene'} preview · ${formatPreviewDuration(duration)}`,
    );
  };

  const resumeCanvasPreview = () => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setNotice(
        'Motion is reduced · drag the timeline playhead to inspect frames',
      );
      return;
    }
    const controller = canvasPlaybackController.current;
    if (!controller || controller.currentTime() >= controller.durationMs - 1) {
      startCanvasPreview();
      return;
    }
    previewRunningRef.current = true;
    controller.play();
    setPreviewRunning(true);
    setPreviewActive(true);
    setPreviewStartsPaused(false);
    setNotice('Preview resumed');
  };

  const seekCanvasPreview = (timeMs: number) => {
    const duration =
      previewScope === 'selected'
        ? selectedPreviewDurationMs
        : scenePreviewDurationMs;
    if (duration <= 0) return;
    const nextTime = Math.min(Math.max(timeMs, 0), duration);
    previewRunningRef.current = false;
    setPreviewRunning(false);
    setPreviewActive(true);
    setPreviewStartsPaused(true);
    const controller = canvasPlaybackController.current;
    if (controller) {
      controller.pause();
      controller.seek(nextTime);
    } else {
      pendingPreviewSeek.current = nextTime;
      setPreviewStartsPaused(true);
      setCanvasPreviewKey((key) => key + 1);
    }
    setNotice(`Playhead · ${formatPreviewDuration(nextTime)}`);
  };

  const changeTimelinePreviewScope = (scope: PreviewScope) => {
    if (scope === previewScope) return;
    previewRunningRef.current = false;
    canvasPlaybackController.current?.cancel();
    canvasPlaybackController.current = null;
    pendingPreviewSeek.current = null;
    setPreviewRunning(false);
    setPreviewActive(false);
    setPreviewStartsPaused(false);
    setCanvasPreviewKey(0);
    setPreviewScope(scope);
    setNotice(`${scope === 'selected' ? 'Selected layer' : 'Scene'} timeline`);
  };

  const selectMotionTimelineSpan = (
    elementId: string,
    span: MotionTimelineSpan,
  ) => {
    setSelectedElementId(elementId);
    setInspectorTab('motion');
    setExpandedMotionBlockId(span.blockId);
    setMobileStudioPane('blocks');
    window.requestAnimationFrame(() => {
      document
        .getElementById(`motion-block-${span.blockId}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    setNotice(
      `${span.label} selected at ${formatPreviewDuration(span.startsAtMs)}`,
    );
  };
  const replayReader = () => {
    setReaderChapterId(readerSource.chapters[0].id);
    setReaderPageTurnIntent(null);
    if (readerMode !== 'scroll') setReaderPageIndex(0);
    readerScroll.current?.scrollTo({ top: 0, behavior: 'auto' });
    setReaderPreviewKey((key) => key + 1);
    setNotice('Reader replayed from the first scene');
  };

  const selectReaderChapter = (chapter: MotusChapter) => {
    setReaderChapterId(chapter.id);
    setReaderPageTurnIntent(null);
    setReaderPageIndex(0);
    readerScroll.current?.scrollTo({ top: 0, behavior: 'auto' });
    setReaderPreviewKey((key) => key + 1);
  };

  const moveReaderPage = (intent: ReaderNavigationIntent) => {
    if (readerMode === 'scroll') return;
    const target = readerPageTargets[intent];
    if (!target) return;
    setReaderPageTurnIntent(intent);
    setReaderPageTransitionSequence((sequence) => sequence + 1);
    if (target.chapterIndex !== readerChapterIndex) {
      setReaderChapterId(readerSource.chapters[target.chapterIndex].id);
    }
    setReaderPageIndex(target.pageIndex);
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
  const finishPivotHistory = () => {
    endHistoryTransaction();
    const gesture = activePivotGesture.current;
    activePivotGesture.current = null;
    if (gesture) {
      setNotice(`${gesture.elementName} pivot updated · pose preserved`);
    }
  };
  const pivotHistoryProps = {
    onBlur: finishPivotHistory,
    onKeyUp: (event: ReactKeyboardEvent<HTMLInputElement>) => {
      if (shouldEndContinuousHistoryOnKey(event.key)) finishPivotHistory();
    },
    onPointerCancel: finishPivotHistory,
    onPointerUp: finishPivotHistory,
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
        aria-label="Upload a PNG or WebP image"
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
        aria-label="Import a Motus project"
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
          <MotusLogo className="brand-mark" variant="on-dark" />
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
              aria-label={label}
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

          <DndContext
            collisionDetection={pointerWithin}
            onDragCancel={cancelLayerDrag}
            onDragEnd={finishLayerDrag}
            onDragStart={startLayerDrag}
            sensors={layerSensors}
          >
            {desktopPanelsEnabled ? (
              <LayerRootDropTarget active={Boolean(activeLayerDrag)} />
            ) : null}
            <div
              aria-label="Rig layer hierarchy"
              className="layer-list"
              data-drag-active={Boolean(activeLayerDrag) || undefined}
              role="tree"
            >
              {flattenedLayerRows.map(({ element, depth }) => {
                const Icon = elementIcon(element.type);
                const siblingElements = activeScene.elements.filter(
                  (item) => item.parentId === element.parentId,
                );
                const siblingIndex = siblingElements.findIndex(
                  (item) => item.id === element.id,
                );
                const nestPreview = activeLayerDrag
                  ? reparentElementRigBranchPreservingPose(
                      activeScene.elements,
                      activeLayerDrag.elementId,
                      element.id,
                    )
                  : null;
                return (
                  <DraggableLayerRow
                    activeDrag={activeLayerDrag}
                    depth={depth}
                    disabled={!desktopPanelsEnabled || previewRunning}
                    element={element}
                    key={element.id}
                    nestAllowed={Boolean(
                      nestPreview?.changed && !nestPreview.issue,
                    )}
                    primarySelected={selectedElementId === element.id}
                    selected={selectedElementIdSet.has(element.id)}
                  >
                    {(dragHandle) => (
                      <>
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
                          {...(desktopPanelsEnabled
                            ? dragHandle.attributes
                            : {})}
                          {...(desktopPanelsEnabled
                            ? (dragHandle.listeners ?? {})
                            : {})}
                          aria-current={
                            selectedElementId === element.id
                              ? 'true'
                              : undefined
                          }
                          aria-label={
                            desktopPanelsEnabled
                              ? `${selectedElementId === element.id ? `Edit ${element.name}, primary layer` : `Edit ${element.name} and make it primary`}. Drag to reorder or nest this rig branch.`
                              : selectedElementId === element.id
                                ? `Edit ${element.name}, primary layer`
                                : `Edit ${element.name} and make it primary`
                          }
                          className="layer-select"
                          data-drag-enabled={
                            desktopPanelsEnabled && !previewRunning
                              ? true
                              : undefined
                          }
                          id={`layer-select-${element.id}`}
                          onClick={(event) =>
                            selectElement(
                              element.id,
                              event.shiftKey || event.metaKey || event.ctrlKey,
                            )
                          }
                          ref={dragHandle.setActivatorNodeRef}
                          title={
                            desktopPanelsEnabled
                              ? 'Drag: row edge reorders · center nests'
                              : undefined
                          }
                          type="button"
                        >
                          <span className="layer-icon">
                            <Icon className="layer-type-icon" />
                            {desktopPanelsEnabled ? (
                              <GripVertical
                                aria-hidden="true"
                                className="layer-drag-grip"
                              />
                            ) : null}
                          </span>
                          <span className="layer-copy">
                            <strong>{element.name}</strong>
                            <small>
                              {element.type}
                              {element.parentId
                                ? ` · follows ${activeScene.elements.find((candidate) => candidate.id === element.parentId)?.name ?? 'parent'}`
                                : ''}
                            </small>
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
                              siblingIndex === siblingElements.length - 1
                            }
                            onClick={() => moveLayer(element.id, 1)}
                            type="button"
                          >
                            <ArrowUp />
                          </button>
                          <button
                            aria-label={`Move ${element.name} down`}
                            disabled={siblingIndex === 0}
                            onClick={() => moveLayer(element.id, -1)}
                            type="button"
                          >
                            <ArrowDown />
                          </button>
                        </div>
                      </>
                    )}
                  </DraggableLayerRow>
                );
              })}
            </div>
            <DragOverlay>
              {activeLayerDrag ? (
                <LayerDragPreview drag={activeLayerDrag} />
              ) : null}
            </DragOverlay>
          </DndContext>

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
          data-motion-timeline={inspectorTab === 'motion' || undefined}
          data-timeline-collapsed={
            inspectorTab === 'motion' && timelineCollapsed ? true : undefined
          }
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
                onPlaybackController={handleCanvasPlaybackController}
                onPointerAction={beginPointerAction}
                onSelect={selectElement}
                onTextChange={changeTextOnCanvas}
                playingElementId={
                  previewScope === 'selected'
                    ? (selectedElement?.id ?? '__no-selection__')
                    : undefined
                }
                playingKey={canvasPreviewKey}
                playbackStartsPaused={previewStartsPaused}
                scene={activeScene}
                selectedId={selectedElementId}
                selectedIds={selectedElementIdSet}
              />
            </div>
          </div>

          {inspectorTab === 'motion' ? (
            <MotusMotionTimeline
              active={previewActive}
              collapsed={timelineCollapsed}
              getCurrentTime={getCanvasPreviewTime}
              onFinish={finishCanvasPreview}
              onPause={pauseCanvasPreview}
              onPlay={previewActive ? resumeCanvasPreview : startCanvasPreview}
              onScopeChange={changeTimelinePreviewScope}
              onSeek={seekCanvasPreview}
              onSelectSpan={selectMotionTimelineSpan}
              onStop={stopCanvasPreview}
              onToggleCollapsed={() =>
                setTimelineCollapsed((collapsed) => !collapsed)
              }
              playing={previewRunning}
              scene={activeScene}
              scope={previewScope}
              selectedElementId={selectedElement?.id}
              sessionKey={canvasPreviewKey}
            />
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
                    <label
                      className="selected-layer-name-field"
                      htmlFor="selected-layer-name"
                    >
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
                    <section
                      aria-labelledby="rig-panel-title"
                      className="rig-panel"
                    >
                      <div className="rig-panel-heading">
                        <div>
                          <Layers3 aria-hidden="true" />
                          <div>
                            <strong id="rig-panel-title">Character rig</strong>
                            <span>
                              Level{' '}
                              {getElementRigDepth(
                                activeScene.elements,
                                selectedElement.id,
                              ) + 1}{' '}
                              ·{' '}
                              {
                                activeScene.elements.filter(
                                  (candidate) =>
                                    candidate.parentId === selectedElement.id,
                                ).length
                              }{' '}
                              direct parts
                            </span>
                          </div>
                        </div>
                        <Button
                          onClick={groupSelectionAsRig}
                          size="sm"
                          type="button"
                          variant="outline"
                        >
                          <Plus aria-hidden="true" />
                          {selectedElements.length > 1
                            ? 'Nest selection'
                            : 'Wrap in group'}
                        </Button>
                      </div>
                      <label htmlFor="selected-layer-parent">
                        <span>Transform parent</span>
                        <NativeSelect
                          id="selected-layer-parent"
                          onChange={(event) =>
                            setElementRigParent(
                              selectedElement.id,
                              event.target.value || null,
                            )
                          }
                          value={selectedElement.parentId ?? ''}
                        >
                          <NativeSelectOption value="">
                            Scene root · independent
                          </NativeSelectOption>
                          {activeScene.elements
                            .filter(
                              (candidate) =>
                                candidate.id !== selectedElement.id &&
                                !wouldCreateElementRigCycle(
                                  activeScene.elements,
                                  selectedElement.id,
                                  candidate.id,
                                ),
                            )
                            .map((candidate) => (
                              <NativeSelectOption
                                key={candidate.id}
                                value={candidate.id}
                              >
                                {'—'.repeat(
                                  Math.min(
                                    getElementRigDepth(
                                      activeScene.elements,
                                      candidate.id,
                                    ),
                                    4,
                                  ),
                                )}{' '}
                                {candidate.name}
                              </NativeSelectOption>
                            ))}
                        </NativeSelect>
                      </label>
                      <div className="rig-pivot-controls">
                        {(['pivotX', 'pivotY'] as const).map((property) => (
                          <label key={property}>
                            <span>
                              Pivot {property === 'pivotX' ? 'X' : 'Y'}
                            </span>
                            <output>
                              {Math.round(selectedElement[property])}%
                            </output>
                            <input
                              {...pivotHistoryProps}
                              aria-label={
                                property === 'pivotX' ? 'Pivot X' : 'Pivot Y'
                              }
                              max="100"
                              min="0"
                              onChange={(event) => {
                                const value = Number(event.target.value);
                                if (
                                  updateElementRigPivot(
                                    selectedElement.id,
                                    property === 'pivotX'
                                      ? value
                                      : selectedElement.pivotX,
                                    property === 'pivotY'
                                      ? value
                                      : selectedElement.pivotY,
                                    `element:${selectedElement.id}:${property}`,
                                  )
                                ) {
                                  activePivotGesture.current = {
                                    elementId: selectedElement.id,
                                    elementName: selectedElement.name,
                                  };
                                }
                              }}
                              step="1"
                              type="range"
                              value={selectedElement[property]}
                            />
                          </label>
                        ))}
                      </div>
                      <small>
                        Parent transforms compose in order. A Body sway moves
                        Head and Hair; their own blocks keep playing in their
                        inherited coordinate space.
                      </small>
                    </section>
                    {selectedElement.type === 'image' &&
                    selectedElement.src &&
                    !selectedElement.imageRigPart ? (
                      <section
                        aria-labelledby="rig-cut-panel-title"
                        className="rig-cut-panel"
                        ref={rigCutPanel}
                      >
                        <div className="rig-cut-heading">
                          <div>
                            <FileImage aria-hidden="true" />
                            <strong id="rig-cut-panel-title">
                              Cut an articulated part
                            </strong>
                          </div>
                          <span>NON-DESTRUCTIVE MASK</span>
                        </div>
                        <div
                          aria-label="Name, paint, then cut"
                          className="rig-cut-sequence"
                        >
                          <span>Name</span>
                          <ArrowRight aria-hidden="true" />
                          <span>Paint</span>
                          <ArrowRight aria-hidden="true" />
                          <span>Cut</span>
                        </div>
                        <label
                          className="rig-part-name-field"
                          htmlFor="rig-part-name"
                        >
                          <span>New part name</span>
                          <Input
                            aria-describedby="rig-part-name-help"
                            autoComplete="off"
                            id="rig-part-name"
                            maxLength={MAX_ELEMENT_NAME_LENGTH}
                            onChange={(event) =>
                              setRigPartNameDraftState({
                                sourceElementId: selectedElement.id,
                                value: event.target.value,
                              })
                            }
                            placeholder="Head, left arm, front hair…"
                            ref={rigPartNameInput}
                            required
                            value={rigPartNameDraft}
                          />
                          <small id="rig-part-name-help">
                            Paint Include inside the part; mark overlapping
                            artwork with Exclude.
                          </small>
                        </label>
                        <MotusSmartCut
                          aspectRatio={
                            selectedElement.width / selectedElement.height
                          }
                          focalX={selectedImageFraming?.focalX ?? 50}
                          focalY={selectedImageFraming?.focalY ?? 50}
                          imageFit={selectedImageFraming?.fit ?? 'cover'}
                          imageName={selectedElement.name}
                          imageSrc={selectedElement.src}
                          key={[
                            selectedElement.id,
                            selectedElement.width,
                            selectedElement.height,
                            selectedImageFraming?.fit,
                            selectedImageFraming?.focalX,
                            selectedImageFraming?.focalY,
                          ].join(':')}
                          onApply={extractImageRigPart}
                        />
                        <div className="rig-cut-divider">
                          <span>Rectangle crop</span>
                        </div>
                        <div
                          aria-label="Image region preview"
                          className="rig-region-preview"
                          style={{
                            aspectRatio: `${selectedElement.width} / ${selectedElement.height}`,
                            backgroundImage: `url(${selectedElement.src})`,
                            backgroundPosition: `${selectedImageFraming?.focalX ?? 50}% ${selectedImageFraming?.focalY ?? 50}%`,
                            backgroundSize:
                              selectedImageFraming?.fit ?? 'cover',
                          }}
                        >
                          <span
                            style={{
                              height: `${rigRegionDraft.height}%`,
                              left: `${rigRegionDraft.x}%`,
                              top: `${rigRegionDraft.y}%`,
                              width: `${rigRegionDraft.width}%`,
                            }}
                          />
                        </div>
                        <div className="rig-region-fields">
                          {(
                            [
                              ['x', 'X'],
                              ['y', 'Y'],
                              ['width', 'Width'],
                              ['height', 'Height'],
                            ] as const
                          ).map(([field, label]) => (
                            <label key={field}>
                              <span>{label} %</span>
                              <Input
                                max={
                                  field === 'x'
                                    ? 100 - rigRegionDraft.width
                                    : field === 'y'
                                      ? 100 - rigRegionDraft.height
                                      : field === 'width'
                                        ? 100 - rigRegionDraft.x
                                        : 100 - rigRegionDraft.y
                                }
                                min={
                                  field === 'width' || field === 'height'
                                    ? 1
                                    : 0
                                }
                                onChange={(event) => {
                                  const value = Number(event.target.value);
                                  setRigRegionDraft((current) => ({
                                    ...current,
                                    [field]: Number.isFinite(value)
                                      ? value
                                      : current[field],
                                  }));
                                }}
                                step="1"
                                type="number"
                                value={rigRegionDraft[field]}
                              />
                            </label>
                          ))}
                        </div>
                        <Button
                          onClick={() => extractImageRigPart()}
                          type="button"
                        >
                          <Plus aria-hidden="true" />
                          Cut region into child part
                        </Button>
                        <small>
                          Motus removes this region from the base image and
                          creates a movable child without copying the asset.
                        </small>
                      </section>
                    ) : null}
                    {selectedElement.imageRigPart ? (
                      <section className="rig-part-source-card">
                        <span>EXTRACTED PART</span>
                        <strong>
                          Source ·{' '}
                          {selectedRigSourceElement?.name ?? 'Missing source'}
                        </strong>
                        <small>
                          Crop {Math.round(selectedElement.imageRigPart.cropX)},{' '}
                          {Math.round(selectedElement.imageRigPart.cropY)} ·{' '}
                          {Math.round(selectedElement.imageRigPart.cropWidth)}×
                          {Math.round(selectedElement.imageRigPart.cropHeight)}%
                          {selectedElement.imageRigPart.maskPoints?.length
                            ? ` · Freeform ${selectedElement.imageRigPart.maskPoints.length}-point mask`
                            : ' · Rectangle mask'}
                        </small>
                        {selectedRigSourceElement ? (
                          <Button
                            className="rig-cut-another"
                            onClick={() =>
                              openRigPartCutter(selectedRigSourceElement.id)
                            }
                            size="sm"
                            type="button"
                            variant="outline"
                          >
                            <Plus aria-hidden="true" />
                            <span>
                              Cut another part from{' '}
                              {selectedRigSourceElement.name}
                            </span>
                          </Button>
                        ) : null}
                        <div className="mesh-warp-heading">
                          <div>
                            <Sparkles aria-hidden="true" />
                            <div>
                              <strong>Warp mesh</strong>
                              <span>PIXEL-DEFORM · PIXIJS</span>
                            </div>
                          </div>
                          {selectedElement.imageRigPart.mesh ? (
                            <Button
                              onClick={() => {
                                updateElement(selectedElement.id, (item) => {
                                  if (item.imageRigPart) {
                                    delete item.imageRigPart.mesh;
                                  }
                                });
                                endHistoryTransaction();
                                setNotice(
                                  'Warp mesh removed · flat part restored',
                                );
                              }}
                              size="sm"
                              type="button"
                              variant="outline"
                            >
                              Remove
                            </Button>
                          ) : (
                            <Button
                              onClick={() => {
                                updateElement(selectedElement.id, (item) => {
                                  if (item.imageRigPart) {
                                    item.imageRigPart.mesh =
                                      createImageRigMesh();
                                  }
                                });
                                endHistoryTransaction();
                                setNotice(
                                  'Warp mesh enabled · drag any of the nine points',
                                );
                              }}
                              size="sm"
                              type="button"
                            >
                              Enable warp
                            </Button>
                          )}
                        </div>
                        {selectedElement.imageRigPart.mesh ? (
                          <MotusMeshWarpEditor
                            crop={selectedElement.imageRigPart}
                            imageName={selectedElement.name}
                            imageSrc={selectedRigSourceElement?.src ?? ''}
                            focalX={selectedRigSourceFraming?.focalX ?? 50}
                            focalY={selectedRigSourceFraming?.focalY ?? 50}
                            imageFit={selectedRigSourceFraming?.fit ?? 'cover'}
                            mesh={selectedElement.imageRigPart.mesh}
                            onChange={(mesh) =>
                              updateElement(
                                selectedElement.id,
                                (item) => {
                                  if (item.imageRigPart) {
                                    item.imageRigPart.mesh = mesh;
                                  }
                                },
                                `element:${selectedElement.id}:mesh`,
                              )
                            }
                            onInteractionEnd={endHistoryTransaction}
                          />
                        ) : (
                          <p className="mesh-warp-help">
                            Bend hair, cloth, limbs, and other cut parts without
                            redrawing them. The mesh stays inside this layer, so
                            every parent rig and motion block still composes.
                          </p>
                        )}
                        <MotusRigJointFinder
                          aspectRatio={
                            selectedRigSourceElement
                              ? selectedRigSourceElement.width /
                                selectedRigSourceElement.height
                              : 1
                          }
                          crop={selectedElement.imageRigPart}
                          focalX={selectedRigSourceFraming?.focalX ?? 50}
                          focalY={selectedRigSourceFraming?.focalY ?? 50}
                          imageFit={selectedRigSourceFraming?.fit ?? 'cover'}
                          imageName={selectedElement.name}
                          imageSrc={selectedRigSourceElement?.src ?? ''}
                          key={[
                            selectedElement.id,
                            selectedRigSourceElement?.id,
                            selectedRigSourceElement?.width,
                            selectedRigSourceElement?.height,
                            selectedRigSourceFraming?.fit,
                            selectedRigSourceFraming?.focalX,
                            selectedRigSourceFraming?.focalY,
                          ].join(':')}
                          onApplyPivot={(pivot, joint) => {
                            endHistoryTransaction();
                            activePivotGesture.current = null;
                            if (
                              updateElementRigPivot(
                                selectedElement.id,
                                pivot.x,
                                pivot.y,
                              )
                            ) {
                              setNotice(
                                `${joint.label} set as ${selectedElement.name} pivot · pose preserved`,
                              );
                            }
                          }}
                        />
                        <div className="rig-region-fields">
                          {(
                            [
                              ['cropX', 'Crop X'],
                              ['cropY', 'Crop Y'],
                              ['cropWidth', 'Crop width'],
                              ['cropHeight', 'Crop height'],
                            ] as const
                          ).map(([field, label]) => (
                            <label key={field}>
                              <span>{label} %</span>
                              <Input
                                max={
                                  field === 'cropX'
                                    ? 100 -
                                      selectedElement.imageRigPart!.cropWidth
                                    : field === 'cropY'
                                      ? 100 -
                                        selectedElement.imageRigPart!.cropHeight
                                      : field === 'cropWidth'
                                        ? 100 -
                                          selectedElement.imageRigPart!.cropX
                                        : 100 -
                                          selectedElement.imageRigPart!.cropY
                                }
                                min={
                                  field === 'cropWidth' ||
                                  field === 'cropHeight'
                                    ? '1'
                                    : '0'
                                }
                                onChange={(event) =>
                                  updateElement(
                                    selectedElement.id,
                                    (item) => {
                                      if (!item.imageRigPart) return;
                                      const normalized = resizeImageRigPartCrop(
                                        item.imageRigPart,
                                        field,
                                        Number(event.target.value),
                                      );
                                      if (normalized) {
                                        item.imageRigPart = normalized;
                                      }
                                    },
                                    `element:${selectedElement.id}:${field}`,
                                  )
                                }
                                step="1"
                                type="number"
                                value={selectedElement.imageRigPart![field]}
                              />
                            </label>
                          ))}
                        </div>
                      </section>
                    ) : null}
                    {selectedElement.type === 'shape' ? (
                      <label htmlFor="selected-layer-shape-preset">
                        <span>Shape style</span>
                        <NativeSelect
                          id="selected-layer-shape-preset"
                          onChange={(event) =>
                            updateElement(selectedElement.id, (item) => {
                              item.shapePreset = event.target
                                .value as ElementShapePreset;
                            })
                          }
                          size="sm"
                          value={getElementShapePreset(selectedElement)}
                        >
                          {MOTUS_SHAPE_PRESET_DEFINITIONS.map((definition) => (
                            <NativeSelectOption
                              key={definition.id}
                              value={definition.id}
                            >
                              {definition.label}
                            </NativeSelectOption>
                          ))}
                        </NativeSelect>
                      </label>
                    ) : null}
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
                    {selectedElement.type === 'image' &&
                    selectedImageFraming ? (
                      <section
                        aria-labelledby="image-framing-panel-title"
                        className="image-framing-panel"
                      >
                        <div className="image-framing-head">
                          <div>
                            <FileImage aria-hidden="true" />
                            <strong id="image-framing-panel-title">
                              Image framing
                            </strong>
                          </div>
                          <span>
                            {selectedImageFraming.fit === 'cover'
                              ? 'Cropped'
                              : 'Full image'}
                          </span>
                        </div>
                        <fieldset className="image-fit-toggle">
                          <legend>Fit</legend>
                          <div>
                            {ELEMENT_IMAGE_FITS.map((imageFit) => (
                              <button
                                aria-pressed={
                                  selectedImageFraming.fit === imageFit
                                }
                                key={imageFit}
                                onClick={() =>
                                  updateElement(selectedElement.id, (item) => {
                                    item.imageFit = imageFit;
                                  })
                                }
                                type="button"
                              >
                                {ELEMENT_IMAGE_FIT_LABELS[imageFit]}
                              </button>
                            ))}
                          </div>
                        </fieldset>
                        <div className="image-framing-controls">
                          <label className="image-framing-control">
                            <span>Horizontal focus</span>
                            <output htmlFor="selected-image-focal-x">
                              {Math.round(selectedImageFraming.focalX)}%
                            </output>
                            <input
                              {...continuousHistoryProps}
                              aria-describedby="image-framing-help"
                              disabled={selectedImageFraming.fit === 'contain'}
                              id="selected-image-focal-x"
                              max="100"
                              min="0"
                              onChange={(event) =>
                                updateElement(
                                  selectedElement.id,
                                  (item) => {
                                    item.imageFocalX = Number(
                                      event.target.value,
                                    );
                                  },
                                  `element:${selectedElement.id}:image-focal-x`,
                                )
                              }
                              step="1"
                              type="range"
                              value={selectedImageFraming.focalX}
                            />
                          </label>
                          <label className="image-framing-control">
                            <span>Vertical focus</span>
                            <output htmlFor="selected-image-focal-y">
                              {Math.round(selectedImageFraming.focalY)}%
                            </output>
                            <input
                              {...continuousHistoryProps}
                              aria-describedby="image-framing-help"
                              disabled={selectedImageFraming.fit === 'contain'}
                              id="selected-image-focal-y"
                              max="100"
                              min="0"
                              onChange={(event) =>
                                updateElement(
                                  selectedElement.id,
                                  (item) => {
                                    item.imageFocalY = Number(
                                      event.target.value,
                                    );
                                  },
                                  `element:${selectedElement.id}:image-focal-y`,
                                )
                              }
                              step="1"
                              type="range"
                              value={selectedImageFraming.focalY}
                            />
                          </label>
                        </div>
                        <small id="image-framing-help">
                          {selectedImageFraming.fit === 'cover'
                            ? 'Move the focus point to choose which part of the image stays in frame.'
                            : 'Fit image keeps the entire image visible, so focus controls are paused.'}
                        </small>
                        <Button
                          className="image-framing-reset"
                          disabled={
                            selectedImageFraming.focalX === 50 &&
                            selectedImageFraming.focalY === 50
                          }
                          onClick={() =>
                            updateElement(selectedElement.id, (item) => {
                              item.imageFocalX = 50;
                              item.imageFocalY = 50;
                            })
                          }
                          size="sm"
                          type="button"
                          variant="outline"
                        >
                          <RotateCcw aria-hidden="true" />
                          Center image
                        </Button>
                      </section>
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
                          <strong>
                            {selectedRigPath
                              .map((element) => element.name)
                              .join(' › ')}
                          </strong>
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
                        <small>
                          {selectedRigPath
                            .map((element) => element.name)
                            .join(' › ')}
                        </small>
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
              Add editable comic elements, read motion previews, reuse project
              images, start from a scene template, or apply a block preset.
            </DialogDescription>
          </DialogHeader>
          <div
            aria-label="Catalog sections"
            className="catalog-tabs"
            role="tablist"
          >
            <button
              aria-controls="catalog-panel-works"
              aria-selected={catalogTab === 'works'}
              id="catalog-tab-works"
              onClick={() => setCatalogTab('works')}
              onKeyDown={handleCatalogTabKeyDown}
              role="tab"
              tabIndex={catalogTab === 'works' ? 0 : -1}
              type="button"
            >
              <LibraryBig />
              Explore works
            </button>
            <button
              aria-controls="catalog-panel-elements"
              aria-selected={catalogTab === 'elements'}
              id="catalog-tab-elements"
              onClick={() => setCatalogTab('elements')}
              onKeyDown={handleCatalogTabKeyDown}
              role="tab"
              tabIndex={catalogTab === 'elements' ? 0 : -1}
              type="button"
            >
              <Sparkles />
              Elements
            </button>
            <button
              aria-controls="catalog-panel-assets"
              aria-selected={catalogTab === 'assets'}
              id="catalog-tab-assets"
              onClick={() => setCatalogTab('assets')}
              onKeyDown={handleCatalogTabKeyDown}
              role="tab"
              tabIndex={catalogTab === 'assets' ? 0 : -1}
              type="button"
            >
              <ImagePlus />
              Project images
            </button>
            <button
              aria-controls="catalog-panel-templates"
              aria-selected={catalogTab === 'templates'}
              id="catalog-tab-templates"
              onClick={() => setCatalogTab('templates')}
              onKeyDown={handleCatalogTabKeyDown}
              role="tab"
              tabIndex={catalogTab === 'templates' ? 0 : -1}
              type="button"
            >
              <Layers3 />
              Scene templates
            </button>
            <button
              aria-controls="catalog-panel-motion"
              aria-selected={catalogTab === 'motion'}
              id="catalog-tab-motion"
              onClick={() => setCatalogTab('motion')}
              onKeyDown={handleCatalogTabKeyDown}
              role="tab"
              tabIndex={catalogTab === 'motion' ? 0 : -1}
              type="button"
            >
              <Code2 />
              Motion presets
            </button>
          </div>

          {catalogTab === 'works' ? (
            <section
              aria-labelledby="catalog-tab-works"
              className="catalog-panel"
              id="catalog-panel-works"
              role="tabpanel"
            >
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

          {catalogTab === 'elements' ? (
            <section
              aria-labelledby="catalog-tab-elements"
              className="catalog-panel element-catalog-panel"
              id="catalog-panel-elements"
              role="tabpanel"
            >
              <div className="element-catalog-heading">
                <div>
                  <span>EDITABLE ELEMENTS</span>
                  <h2>Build the page from native layers.</h2>
                  <p>
                    Every shape can be recolored, resized, rigged, nested, and
                    animated. Kits arrive as grouped layers you can open and
                    edit separately.
                  </p>
                </div>
                <output aria-live="polite">
                  {filteredElementCatalog.length} of{' '}
                  {MOTUS_ELEMENT_CATALOG.length} elements
                </output>
              </div>
              <div className="catalog-search element-catalog-search">
                <Search aria-hidden="true" />
                <Input
                  aria-label="Search editable elements"
                  onChange={(event) =>
                    setElementCatalogSearch(event.target.value)
                  }
                  placeholder="Search panels, effects, symbols, and text kits…"
                  value={elementCatalogSearch}
                />
              </div>
              <fieldset className="element-category-list">
                <legend className="sr-only">
                  Filter editable elements by category
                </legend>
                <button
                  aria-pressed={elementCatalogCategory === 'all'}
                  onClick={() => setElementCatalogCategory('all')}
                  type="button"
                >
                  All <span>{MOTUS_ELEMENT_CATALOG.length}</span>
                </button>
                {ELEMENT_CATALOG_CATEGORIES.map((category) => (
                  <button
                    aria-pressed={elementCatalogCategory === category.id}
                    key={category.id}
                    onClick={() => setElementCatalogCategory(category.id)}
                    type="button"
                  >
                    {category.label}{' '}
                    <span>{elementCatalogCategoryCounts.get(category.id)}</span>
                  </button>
                ))}
              </fieldset>

              {filteredElementCatalog.length ? (
                <div className="element-catalog-grid">
                  {filteredElementCatalog.map((entry) => (
                    <article className="element-catalog-card" key={entry.id}>
                      <div
                        aria-hidden="true"
                        className="element-catalog-preview"
                      >
                        <span
                          className="element-catalog-shape element-shape"
                          data-shape-preset={entry.previewPreset}
                          style={
                            {
                              '--element-fill': entry.fill,
                            } as CSSProperties
                          }
                        >
                          <MotusShapeGlyph preset={entry.previewPreset} />
                        </span>
                        {entry.kind === 'kit' ? (
                          <strong style={{ color: entry.previewTextColor }}>
                            {entry.previewText}
                          </strong>
                        ) : null}
                      </div>
                      <div className="element-catalog-copy">
                        <small>
                          {ELEMENT_CATALOG_CATEGORIES.find(
                            (category) => category.id === entry.category,
                          )?.label ?? entry.category}{' '}
                          · {entry.layerCount} editable layer
                          {entry.layerCount === 1 ? '' : 's'}
                        </small>
                        <h3>{entry.name}</h3>
                        <p>{entry.description}</p>
                        <Button
                          aria-label={`Add ${entry.name} to scene`}
                          onClick={() => addCatalogElement(entry.id)}
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
              ) : (
                <div className="catalog-empty">
                  <Search />
                  <strong>No matching elements</strong>
                  <p>Clear the search or show every category.</p>
                  <Button
                    onClick={() => {
                      setElementCatalogSearch('');
                      setElementCatalogCategory('all');
                    }}
                    size="sm"
                    variant="outline"
                  >
                    Clear filters
                  </Button>
                </div>
              )}
            </section>
          ) : null}

          {catalogTab === 'assets' ? (
            <section
              aria-labelledby="catalog-tab-assets"
              className="catalog-panel"
              id="catalog-panel-assets"
              role="tabpanel"
            >
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
              aria-labelledby="catalog-tab-templates"
              className="catalog-panel"
              id="catalog-panel-templates"
              role="tabpanel"
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
              aria-labelledby="catalog-tab-motion"
              className="catalog-panel"
              id="catalog-panel-motion"
              role="tabpanel"
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
                    : readerMode === 'spread'
                      ? `${readerChapter.title} · spread ${Math.floor(resolvedReaderPageIndex / 2) + 1} of ${Math.ceil(readerScenes.length / 2)}.`
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
                        setReaderPageTurnIntent(null);
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
                      onClick={() => {
                        setReaderPageTurnIntent(null);
                        setReaderMode('page');
                      }}
                      type="button"
                    >
                      <FileImage aria-hidden="true" />
                      Page
                    </button>
                    <button
                      aria-pressed={readerMode === 'spread'}
                      onClick={() => {
                        setReaderPageTurnIntent(null);
                        setReaderMode('spread');
                        setReaderPageIndex((index) => index - (index % 2));
                      }}
                      type="button"
                    >
                      <BookOpen aria-hidden="true" />
                      Spread
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
                  <div
                    className="reader-page-mode"
                    data-layout={readerMode}
                    data-reading-direction={
                      readerSource.readerPresentation.direction
                    }
                    data-transition={readerPageTransition.effectiveStyle}
                    data-turn={readerPageTransition.entryEdge}
                    style={readerPageTransitionStyle}
                  >
                    <div
                      className="reader-page-leaf"
                      key={`${readerChapter.id}-${readerMode}-${resolvedReaderPageIndex}-${readerPageTransitionSequence}`}
                    >
                      {readerVisibleSceneIndexes.map(
                        (sceneIndex, spreadOffset) => (
                          <ReaderScene
                            index={sceneIndex}
                            key={`${readerScenes[sceneIndex].id}-${readerPreviewKey}-${resolvedReaderPageIndex}`}
                            scene={readerScenes[sceneIndex]}
                            sessionKey={
                              readerPreviewKey +
                              resolvedReaderPageIndex +
                              spreadOffset +
                              1
                            }
                          />
                        ),
                      )}
                    </div>
                    <nav
                      aria-label="Scene navigation"
                      className="reader-page-navigation"
                    >
                      <Button
                        aria-label={
                          readerLeftControlIntent === 'previous'
                            ? 'Previous page'
                            : 'Next page'
                        }
                        disabled={!readerPageTargets[readerLeftControlIntent]}
                        onClick={() => moveReaderPage(readerLeftControlIntent)}
                        variant="secondary"
                      >
                        <ArrowLeft />
                        {readerLeftControlIntent === 'previous'
                          ? 'Previous'
                          : 'Next'}
                      </Button>
                      <span aria-atomic="true" aria-live="polite">
                        Chapter {readerChapterIndex + 1} ·{' '}
                        {readerMode === 'spread'
                          ? `${resolvedReaderPageIndex + 1}–${Math.min(resolvedReaderPageIndex + 2, readerScenes.length)}`
                          : resolvedReaderPageIndex + 1}{' '}
                        / {readerScenes.length}
                      </span>
                      <Button
                        aria-label={
                          readerRightControlIntent === 'previous'
                            ? 'Previous page'
                            : 'Next page'
                        }
                        disabled={!readerPageTargets[readerRightControlIntent]}
                        onClick={() => moveReaderPage(readerRightControlIntent)}
                        variant="secondary"
                      >
                        {readerRightControlIntent === 'previous'
                          ? 'Previous'
                          : 'Next'}
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
