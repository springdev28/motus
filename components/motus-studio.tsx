'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Circle,
  Cloud,
  CloudOff,
  Copy,
  Download,
  Ellipsis,
  Eye,
  EyeOff,
  FileImage,
  FilePlus2,
  ImagePlus,
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
  Send,
  Sparkles,
  Square,
  Trash2,
  Type,
  Undo2,
  Unlock,
  Upload,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
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
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  MAX_ELEMENT_NAME_LENGTH,
  MAX_ELEMENT_TEXT_LENGTH,
  MAX_PROJECT_FILE_BYTES,
  MAX_PROJECT_SCENES,
  MAX_PROJECT_TITLE_LENGTH,
  MAX_SCENE_ELEMENTS,
  MAX_SCENE_NAME_LENGTH,
  MAX_SCENE_THUMBNAIL_ELEMENTS,
  MIN_ELEMENT_HEIGHT,
  MIN_ELEMENT_WIDTH,
  canAddElementToScene,
  canAddSceneToProject,
  cloneProject,
  compileElementMotion,
  constrainElementToCanvas,
  createBlankProject,
  createCopyName,
  createDefaultProject,
  createElement,
  createElementCopy,
  createProjectHistoryEntry,
  createProjectBackupFileName,
  createPublicationRevision,
  describeElementForAccessibility,
  detectImageFormat,
  findSupportedImageFile,
  getPublicationReadiness,
  getDraftSaveStatus,
  getDraftExitAction,
  getEditorShortcut,
  getFitCanvasWidth,
  getKeyboardNudgeDelta,
  getProjectStorageBytes,
  getSceneThumbnailElements,
  getTabIndexForKey,
  hasFileDrag,
  hasPointerDragStarted,
  hasUnpublishedChanges,
  parseProjectTags,
  recordProjectHistory,
  removePublicationRevision,
  reorderScenes,
  resetProjectTimeline,
  resolveDraftConflict,
  resolveCoverSceneId,
  resolveEditorSelection,
  resolveReaderSource,
  resolveSelectionAfterElementDeletion,
  restoreNewestProject,
  restorePublicationToDraft,
  restoreProject,
  restoreProjectWithError,
  shouldAutosaveDraft,
  shouldEndContinuousHistoryOnKey,
  trimProjectHistory,
  transformElementByPointer,
  validateImageAsset,
  writeDraftJournal,
  type ContentRating,
  type Easing,
  type ElementType,
  type MotusElement,
  type MotusProject,
  type MotusPublicationRevision,
  type MotusScene,
  type ProjectHistoryEntry,
  type PublicationVisibility,
} from '@/lib/motus-model';

const LEGACY_STORAGE_KEY = 'motus.project.v2';
const DRAFT_SLOT_A_KEY = 'motus.project.slot.a.v4';
const DRAFT_SLOT_B_KEY = 'motus.project.slot.b.v4';
const DRAFT_POINTER_KEY = 'motus.project.active-slot.v4';
const MOTUS_LAYER_CLIPBOARD_TYPE = 'application/x-motus-layer';

type DeletionUndo = {
  message: string;
  sceneId: string;
  elementId: string;
};

type PendingProjectImport = {
  fileName: string;
  project: MotusProject;
};

const sceneBackgrounds = [
  { name: 'Amethyst fog', value: 'linear-gradient(155deg, #24203b 0%, #151626 54%, #332b46 100%)' },
  { name: 'Rose crossing', value: 'linear-gradient(155deg, #38284c 0%, #1c1729 54%, #7d4e61 100%)' },
  { name: 'Tidal signal', value: 'linear-gradient(155deg, #22293b 0%, #101d28 54%, #315a63 100%)' },
  { name: 'Ember night', value: 'linear-gradient(155deg, #3d231e 0%, #1d1518 54%, #6b3d2d 100%)' },
  { name: 'Electric dusk', value: 'linear-gradient(155deg, #1f2850 0%, #121526 54%, #55438b 100%)' },
] as const;

function uniqueId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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
    return await new Promise<{ width: number; height: number }>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
      image.onerror = () => reject(new Error('Image decoding failed'));
      image.src = url;
    });
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
    reader.onerror = () => reject(reader.error ?? new Error('Image reading failed'));
    reader.readAsDataURL(file);
  });
}

const toolItems = [
  { id: 'select', label: 'Select', icon: MousePointer2 },
  { id: 'image', label: 'Image', icon: ImagePlus },
  { id: 'text', label: 'Text', icon: Type },
  { id: 'shape', label: 'Shape', icon: Square },
  { id: 'speech', label: 'Speech', icon: MessageSquareText },
  { id: 'motion', label: 'Motion', icon: Sparkles },
] as const;

function findElement(project: MotusProject, sceneId: string, elementId: string) {
  return project.scenes
    .find((scene) => scene.id === sceneId)
    ?.elements.find((element) => element.id === elementId);
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
    return <span>{element.text}</span>;
  }
  return <span className="orb-highlight" />;
}

type SceneViewProps = {
  scene: MotusScene;
  elementLimit?: number;
  selectedId?: string;
  playingKey?: number;
  interactive?: boolean;
  onSelect?: (id: string) => void;
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
    mode: 'move' | 'resize',
  ) => void;
};

function SceneView({
  scene,
  elementLimit,
  selectedId,
  playingKey = 0,
  interactive = false,
  onSelect,
  onKeyboardNudge,
  onKeyboardNudgeEnd,
  onElementRef,
  onPointerAction,
}: SceneViewProps) {
  const renderedElements = elementLimit === undefined
    ? scene.elements
    : getSceneThumbnailElements(scene, elementLimit);

  return (
    <div className="artboard" style={{ background: scene.background }}>
      <div className="artboard-grid" />
      <div className="artboard-horizon" />
      {renderedElements.map((element) => {
        if (!element.visible) return null;
        const selected = selectedId === element.id;
        const compiledMotion = compileElementMotion(element);
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
        } as CSSProperties;

        return (
          // The role and handlers are conditional because reader scenes are display-only.
          // oxlint-disable-next-line jsx-a11y/no-static-element-interactions
          <div
            aria-describedby={interactive ? 'canvas-instructions' : undefined}
            aria-keyshortcuts={
              interactive
                ? 'ArrowLeft ArrowRight ArrowUp ArrowDown Meta+C Control+C Meta+X Control+X Meta+V Control+V'
                : undefined
            }
            aria-label={describeElementForAccessibility(element)}
            aria-pressed={interactive ? selected : undefined}
            className={`canvas-element element-${element.type} ${
              playingKey ? 'is-playing' : ''
            }`}
            data-interactive={interactive || undefined}
            data-locked={element.locked || undefined}
            data-selected={selected || undefined}
            key={`${element.id}-${playingKey}`}
            onClick={
              interactive
                ? (event) => {
                    event.stopPropagation();
                    onSelect?.(element.id);
                  }
                : undefined
            }
            onKeyDown={
              interactive
                ? (event) => {
                    const nudge = getKeyboardNudgeDelta(event.key, event.shiftKey);
                    if (nudge) {
                      event.preventDefault();
                      event.stopPropagation();
                      onSelect?.(element.id);
                      onKeyboardNudge?.(element.id, event.key, event.shiftKey);
                      return;
                    }
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      onSelect?.(element.id);
                    }
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
            onPointerDown={
              interactive
                ? (event) => {
                    if (!element.locked) {
                      onPointerAction?.(event, element.id, 'move');
                    }
                  }
                : undefined
            }
            role={interactive ? 'button' : 'img'}
            ref={
              interactive
                ? (node) => onElementRef?.(element.id, node)
                : undefined
            }
            style={elementStyle}
            tabIndex={interactive ? 0 : undefined}
          >
            {renderElementContent(element)}
            {selected && interactive && !element.locked ? (
              // Pointer resize stays visual-only; keyboard users resize through the inspector fields.
              // oxlint-disable-next-line jsx-a11y/no-static-element-interactions
              <span
                aria-hidden="true"
                className="resize-handle"
                onPointerDown={(event) => {
                  event.stopPropagation();
                  onPointerAction?.(event, element.id, 'resize');
                }}
                title={`Drag to resize ${element.name}`}
              >
                <Maximize2 />
              </span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

type ReaderSceneProps = {
  scene: MotusScene;
  index: number;
  sessionKey: number;
};

function ReaderScene({ scene, index, sessionKey }: ReaderSceneProps) {
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
      queueMicrotask(() => setReducedMotion(true));
      return;
    }

    if (!('IntersectionObserver' in window)) {
      queueMicrotask(() => setPlayingKey(sessionKey || 1));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        setPlayingKey(sessionKey || 1);
        observer.disconnect();
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.35 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [sessionKey]);

  return (
    <article
      aria-label={`Scene ${index + 1}: ${scene.name}`}
      className="reader-scene"
      data-played={playingKey > 0 || undefined}
      ref={sceneRef}
    >
      <div className="reader-scene-meta">
        <span className="reader-scene-number">
          SCENE {String(index + 1).padStart(2, '0')}
        </span>
        <span className="reader-trigger-state">
          {reducedMotion ? 'Motion reduced' : playingKey ? 'Played' : 'Plays on view'}
        </span>
      </div>
      <SceneView playingKey={playingKey} scene={scene} />
    </article>
  );
}

export function MotusStudio() {
  const [project, setProject] = useState<MotusProject>(createDefaultProject);
  const [activeSceneId, setActiveSceneId] = useState('scene-1');
  const [selectedElementId, setSelectedElementId] = useState('scene-1-orb');
  const [inspectorTab, setInspectorTab] = useState<'design' | 'motion'>('design');
  const [zoom, setZoom] = useState(100);
  const [fitCanvasWidth, setFitCanvasWidth] = useState(430);
  const [imageDropActive, setImageDropActive] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [readerOpen, setReaderOpen] = useState(false);
  const [readerMatureConfirmed, setReaderMatureConfirmed] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [projectDetailsOpen, setProjectDetailsOpen] = useState(false);
  const [publishTagsInput, setPublishTagsInput] = useState(
    'science fiction, mystery',
  );
  const [pendingProjectImport, setPendingProjectImport] =
    useState<PendingProjectImport | null>(null);
  const [pendingRevisionRemoval, setPendingRevisionRemoval] =
    useState<MotusPublicationRevision | null>(null);
  const [newWorkOpen, setNewWorkOpen] = useState(false);
  const [conflictOpen, setConflictOpen] = useState(false);
  const [externalDraftChange, setExternalDraftChange] = useState(false);
  const [readerRevision, setReaderRevision] =
    useState<MotusPublicationRevision | null>(null);
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
  const canvasStage = useRef<HTMLDivElement>(null);
  const readerScroll = useRef<HTMLDivElement>(null);
  const canvasElementRefs = useRef(new Map<string, HTMLDivElement>());
  const sceneButtonRefs = useRef(new Map<string, HTMLButtonElement>());
  const deletionUndoTimer = useRef<number | null>(null);
  const activePointerCleanup = useRef<(() => void) | null>(null);
  const copiedElement = useRef<MotusElement | null>(null);

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

  const activeScene =
    project.scenes.find((scene) => scene.id === activeSceneId) ?? project.scenes[0];
  const sceneIndex = Math.max(
    project.scenes.findIndex((scene) => scene.id === activeScene.id),
    0,
  );
  const selectedElement = useMemo(
    () => activeScene.elements.find((element) => element.id === selectedElementId),
    [activeScene.elements, selectedElementId],
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
      const activeSlot =
        window.localStorage.getItem(DRAFT_POINTER_KEY) === 'b' ? 'b' : 'a';
      return restoreNewestProject([
        {
          source: 'legacy',
          value: window.localStorage.getItem(LEGACY_STORAGE_KEY),
          priority: -1,
        },
        {
          source: 'slot-a',
          value: window.localStorage.getItem(DRAFT_SLOT_A_KEY),
          priority: activeSlot === 'a' ? 1 : 0,
        },
        {
          source: 'slot-b',
          value: window.localStorage.getItem(DRAFT_SLOT_B_KEY),
          priority: activeSlot === 'b' ? 1 : 0,
        },
      ]);
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
    queueMicrotask(() => {
      if (!active) return;
      const restored = readSavedDraft();
      if (restored) {
        resetEditorHistory();
        setProject(restored.project);
        setIsDirty(false);
        setActiveSceneId(restored.project.scenes[0].id);
        setSelectedElementId(restored.project.scenes[0].elements.at(-1)?.id ?? '');
        setNotice(restored.source === 'legacy' ? 'Legacy draft recovered' : 'Saved draft recovered');
      }
      setHydrated(true);
    });
    return () => {
      active = false;
    };
  }, [resetEditorHistory]);

  useEffect(() => {
    if (!shouldAutosaveDraft({ hydrated, dirty: isDirty, externalChange: externalDraftChange })) return;
    const timer = window.setTimeout(() => {
      if (persistProject(project)) setIsDirty(false);
    }, 180);
    return () => window.clearTimeout(timer);
  }, [externalDraftChange, hydrated, isDirty, project]);

  useEffect(() => {
    if (!shouldAutosaveDraft({ hydrated, dirty: isDirty, externalChange: externalDraftChange })) return;
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
    return () => window.removeEventListener('beforeunload', protectDraftBeforeExit);
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
          const selection = resolveEditorSelection(
            saved.project,
            activeSceneId,
            selectedElementId,
          );
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
    activeSceneId,
    clearDeletionUndo,
    hydrated,
    isDirty,
    resetEditorHistory,
    selectedElementId,
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
      { sceneId: activeScene.id, elementId: selectedElementId },
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
      const megabytes = (getProjectStorageBytes(candidate) / 1_000_000).toFixed(1);
      setNotice(`${failureMessage} · ${megabytes} MB draft · download a backup`);
      return false;
    }
    clearDeletionUndo();
    const history = recordProjectHistory(
      {
        undoStack: undoStack.current,
        transactionKey: historyTransaction.current,
      },
      project,
      { sceneId: activeScene.id, elementId: selectedElementId },
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

  const reconcileSelection = (candidate: MotusProject) => {
    const selection = resolveEditorSelection(
      candidate,
      activeSceneId,
      selectedElementId,
    );
    setActiveSceneId(selection.sceneId);
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
        sceneId: activeScene.id,
        elementId: selectedElementId,
      }),
    ]);
    setCanUndo(undoStack.current.length > 0);
    setCanRedo(true);
    setIsDirty(true);
    setActiveSceneId(previous.selection.sceneId);
    setSelectedElementId(previous.selection.elementId);
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
        sceneId: activeScene.id,
        elementId: selectedElementId,
      }),
    ]);
    setCanUndo(true);
    setCanRedo(redoStack.current.length > 0);
    setIsDirty(true);
    setActiveSceneId(next.selection.sceneId);
    setSelectedElementId(next.selection.elementId);
    setProject(next.project);
    setNotice('Redid change');
  };

  const undoDeletion = () => {
    if (!deletionUndo) return;
    const recovery = deletionUndo;
    undo();
    setActiveSceneId(recovery.sceneId);
    setSelectedElementId(recovery.elementId);
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
      draft.scenes
        .find((scene) => scene.id === activeScene.id)
        ?.elements.push(element);
    };
    if (requireStoragePreflight) {
      if (!commitProjectWithStoragePreflight(
        addToDraft,
        'Image cannot fit in device storage',
      )) {
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
      const scene = draft.scenes.find((item) => item.id === activeScene.id);
      if (!scene) return;
      scene.elements = scene.elements.filter((element) => element.id !== elementId);
    });
    setSelectedElementId(nextSelectedElementId);
    setNotice(
      action === 'cut'
        ? `${deletedElement.name} cut · paste to move it`
        : 'Layer deleted',
    );
    showDeletionUndo({
      message: `${deletedElement.name} ${action === 'cut' ? 'cut' : 'deleted'}`,
      sceneId: activeScene.id,
      elementId,
    });
    focusEditorTarget(activeScene.id, nextSelectedElementId);
  };

  const moveLayer = (elementId: string, direction: -1 | 1) => {
    commitProject((draft) => {
      const elements = draft.scenes.find((scene) => scene.id === activeScene.id)?.elements;
      if (!elements) return;
      const index = elements.findIndex((element) => element.id === elementId);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= elements.length) return;
      [elements[index], elements[target]] = [elements[target], elements[index]];
    });
  };

  const nudgeElement = (elementId: string, key: string, accelerated: boolean) => {
    const delta = getKeyboardNudgeDelta(key, accelerated);
    const element = findElement(project, activeScene.id, elementId);
    if (!delta || !element) return;
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

  const moveScene = (direction: -1 | 1) => {
    const targetIndex = sceneIndex + direction;
    if (targetIndex < 0 || targetIndex >= project.scenes.length) {
      setNotice('Scene is already at the edge');
      return;
    }
    commitProject((draft) => {
      draft.scenes = reorderScenes(draft.scenes, activeScene.id, direction);
    });
    setNotice(direction < 0 ? 'Scene moved earlier' : 'Scene moved later');
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
  };

  const uploadImage = async (file?: File) => {
    if (!file) return;
    if (!canAddElementToScene(activeScene)) {
      setNotice(`This scene has reached the ${MAX_SCENE_ELEMENTS}-layer limit`);
      return;
    }
    const envelopeError = validateImageAsset({ mime: file.type, size: file.size });
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
      const added = addElement('image', {
        name: file.name,
        src,
        width: Math.max(8, Math.round(dimensions.width * scale)),
        height: Math.max(8, Math.round(dimensions.height * scale)),
        fill: '#ffffff',
      }, true);
      if (added) {
        setNotice(`${file.name} added · ${dimensions.width}×${dimensions.height}`);
      }
    } catch {
      setNotice('Image could not be decoded');
    }
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
      draft.scenes
        .find((scene) => scene.id === activeScene.id)
        ?.elements.push(copy);
    };
    if (!commitProjectWithStoragePreflight(
      addCopyToDraft,
      'Layer copy cannot fit in device storage',
    )) {
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

  const addScene = () => {
    if (!canAddSceneToProject(project)) {
      setNotice(`This work has reached the ${MAX_PROJECT_SCENES}-scene limit`);
      return;
    }
    const id = uniqueId('scene');
    const nextScene: MotusScene = {
      id,
      name: `Scene ${project.scenes.length + 1}`,
      background: 'linear-gradient(155deg, #28213d 0%, #12131e 54%, #3c3350 100%)',
      elements: [],
    };
    commitProject((draft) => draft.scenes.push(nextScene));
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
    const copy = structuredClone(activeScene);
    copy.id = uniqueId('scene');
    copy.name = createCopyName(activeScene.name, MAX_SCENE_NAME_LENGTH);
    copy.elements = copy.elements.map((element, index) => ({
      ...element,
      id: `${copy.id}-${element.type}-${index}`,
    }));
    if (!commitProjectWithStoragePreflight(
      (draft) => draft.scenes.splice(sceneIndex + 1, 0, copy),
      'Scene copy cannot fit in device storage',
    )) {
      return;
    }
    setActiveSceneId(copy.id);
    const selectedCopyId = copy.elements.at(-1)?.id ?? '';
    setSelectedElementId(selectedCopyId);
    setNotice('Scene duplicated');
    focusEditorTarget(copy.id, selectedCopyId);
  };

  const deleteScene = () => {
    if (project.scenes.length === 1) {
      setNotice('A project needs at least one scene');
      return;
    }
    const nextScene = project.scenes[sceneIndex === 0 ? 1 : sceneIndex - 1];
    commitProject((draft) => {
      draft.scenes = draft.scenes.filter((scene) => scene.id !== activeScene.id);
      draft.coverSceneId = resolveCoverSceneId(
        draft.scenes,
        draft.coverSceneId,
      );
    });
    setActiveSceneId(nextScene.id);
    const nextSelectedElementId = nextScene.elements.at(-1)?.id ?? '';
    setSelectedElementId(nextSelectedElementId);
    setNotice('Scene deleted');
    showDeletionUndo({
      message: `${activeScene.name} deleted`,
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

    downloadProject(project);
    const restored = cloneProject(pendingProjectImport.project);
    restored.updatedAt = nowIso();
    if (!persistProject(restored, false, false, true)) {
      setPendingProjectImport(null);
      setNotice('Imported project could not be saved — current draft kept and backed up');
      return;
    }

    undoStack.current = [
      createProjectHistoryEntry(project, {
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
    setActiveSceneId(restored.scenes[0].id);
    setSelectedElementId(restored.scenes[0].elements.at(-1)?.id ?? '');
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

    const candidate = removePublicationRevision(project, pendingRevisionRemoval.id);
    if (!candidate) {
      setPendingRevisionRemoval(null);
      setNotice('The current published revision cannot be removed');
      return;
    }

    downloadProject(project);
    const removedRevision = pendingRevisionRemoval.revision;
    if (!commitProjectWithStoragePreflight(
      (draft) => {
        draft.publications = candidate.publications;
      },
      'Revision removal could not be saved',
    )) {
      setPendingRevisionRemoval(null);
      setNotice('Revision was not removed · project backup downloaded');
      return;
    }

    setPendingRevisionRemoval(null);
    setPublishOpen(true);
    setNotice(`Revision ${removedRevision} removed · project backup downloaded`);
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
    const resolved = resolveDraftConflict(
      project,
      saved.project,
      'load-saved',
    );
    resetEditorHistory();
    clearDeletionUndo();
    reconcileSelection(resolved);
    setProject(resolved);
    setIsDirty(false);
    setSaveFailed(false);
    setExternalDraftChange(false);
    setConflictOpen(false);
    setNotice('Other tab’s draft loaded · backup downloaded · undo history reset');
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
    downloadProject(project);
    const blank = createBlankProject(uniqueId('work'), nowIso());
    if (!persistProject(blank, false, false)) {
      setNotice('New work could not be saved — backup downloaded');
      return;
    }

    undoStack.current = [
      createProjectHistoryEntry(project, {
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
    setActiveSceneId(blank.scenes[0].id);
    setSelectedElementId('');
    setInspectorTab('design');
    setNewWorkOpen(false);
    setNotice('New work started · previous draft downloaded');
  };

  const openReader = (revision: MotusPublicationRevision | null = null) => {
    activePointerCleanup.current?.();
    endHistoryTransaction();
    setReaderRevision(revision ? structuredClone(revision) : null);
    setReaderMatureConfirmed(false);
    setPreviewKey((key) => key + 1);
    setReaderOpen(true);
    setNotice(revision ? `Viewing revision ${revision.revision}` : 'Previewing draft');
  };

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
    if (!commitProjectWithStoragePreflight(
      addRevisionToDraft,
      'Revision cannot fit in device storage',
    )) {
      return;
    }
    setPublishOpen(false);
    setReaderRevision(revision);
    setReaderMatureConfirmed(false);
    setPreviewKey((key) => key + 1);
    setReaderOpen(true);
    setNotice(`Revision ${revision.revision} published`);
  };

  const restoreRevision = (revision: MotusPublicationRevision) => {
    activePointerCleanup.current?.();
    const restored = restorePublicationToDraft(project, revision.id, nowIso());
    if (!restored) {
      setNotice('Revision could not be restored');
      return;
    }
    undoStack.current = trimProjectHistory([
      ...undoStack.current,
      createProjectHistoryEntry(project, {
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
    setActiveSceneId(restored.scenes[0].id);
    setSelectedElementId(restored.scenes[0].elements.at(-1)?.id ?? '');
    setPublishOpen(false);
    setNotice(`Revision ${revision.revision} restored to draft`);
  };

  const beginPointerAction = (
    event: ReactPointerEvent<HTMLElement>,
    elementId: string,
    mode: 'move' | 'resize',
  ) => {
    const element = findElement(project, activeScene.id, elementId);
    const artboard = event.currentTarget.closest('.artboard') as HTMLElement | null;
    if (!event.isPrimary || event.button !== 0 || !element || element.locked || !artboard) return;
    event.preventDefault();
    event.stopPropagation();
    activePointerCleanup.current?.();
    setSelectedElementId(elementId);

    const bounds = artboard.getBoundingClientRect();
    if (bounds.width <= 0 || bounds.height <= 0) return;
    const pointerId = event.pointerId;
    const pointerType = event.pointerType;
    const startX = event.clientX;
    const startY = event.clientY;
    const origin = { x: element.x, y: element.y, width: element.width, height: element.height };
    let moved = false;

    function onMove(pointer: PointerEvent) {
      if (pointer.pointerId !== pointerId) return;
      const clientDeltaX = pointer.clientX - startX;
      const clientDeltaY = pointer.clientY - startY;
      if (!moved && !hasPointerDragStarted(clientDeltaX, clientDeltaY, pointerType)) {
        return;
      }
      if (!moved) {
        undoStack.current = trimProjectHistory([
          ...undoStack.current,
          createProjectHistoryEntry(project, {
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
      setProject((current) => {
        const next = cloneProject(current);
        const target = findElement(next, activeScene.id, elementId);
        if (!target) return current;
        Object.assign(
          target,
          transformElementByPointer(
            { ...target, ...origin },
            mode,
            deltaX,
            deltaY,
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
    }

    function finish(pointer?: PointerEvent | Event) {
      if (pointer instanceof PointerEvent && pointer.pointerId !== pointerId) return;
      cleanup();
      if (moved) setNotice(mode === 'move' ? 'Element moved' : 'Element resized');
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
        'input, textarea, select, button, a, [contenteditable="true"], [contenteditable="plaintext-only"]',
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
      if (modalOpen || insideNativeControl) return;

      if (shortcut === 'undo' || shortcut === 'redo') {
        event.preventDefault();
        if (shortcut === 'redo') redo();
        else undo();
        return;
      }
      if (shortcut === 'duplicate' && selectedElementId) {
        event.preventDefault();
        duplicateElement(selectedElementId);
        return;
      }
      if ((event.key === 'Backspace' || event.key === 'Delete') && selectedElementId) {
        event.preventDefault();
        deleteElement(selectedElementId);
        return;
      }
      if (
        selectedElement &&
        getKeyboardNudgeDelta(event.key, event.shiftKey)
      ) {
        event.preventDefault();
        nudgeElement(selectedElement.id, event.key, event.shiftKey);
        return;
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      const insideNativeControl = target?.closest(
        'input, textarea, select, button, a, [contenteditable="true"], [contenteditable="plaintext-only"]',
      );
      if (!insideNativeControl && getKeyboardNudgeDelta(event.key, event.shiftKey)) {
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

      copiedElement.current = structuredClone(selectedElement);
      event.clipboardData.setData(MOTUS_LAYER_CLIPBOARD_TYPE, selectedElement.id);
      event.preventDefault();
      return selectedElement;
    };

    const onCopy = (event: ClipboardEvent) => {
      const source = writeSelectedLayerToClipboard(event);
      if (source) setNotice(`${source.name} copied`);
    };

    const onCut = (event: ClipboardEvent) => {
      const source = writeSelectedLayerToClipboard(event);
      if (source) deleteElement(source.id, 'cut');
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

      const source = copiedElement.current;
      const marker = clipboard.getData(MOTUS_LAYER_CLIPBOARD_TYPE);
      if (!source || marker !== source.id) return;
      event.preventDefault();
      addElementCopy(source, 'Layer pasted');
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
        Number.parseFloat(style.paddingLeft) + Number.parseFloat(style.paddingRight);
      const verticalPadding =
        Number.parseFloat(style.paddingTop) + Number.parseFloat(style.paddingBottom);
      const nextWidth = getFitCanvasWidth(
        stage.clientWidth,
        stage.clientHeight,
        horizontalPadding,
        verticalPadding,
      );
      setFitCanvasWidth((current) => current === nextWidth ? current : nextWidth);
    };

    updateFitWidth();
    if (!('ResizeObserver' in window)) return;
    const observer = new ResizeObserver(updateFitWidth);
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  const artboardWidth = Math.round(fitCanvasWidth * (zoom / 100));
  const publicationHasChanges = hasUnpublishedChanges(project);
  const publicationReadiness = getPublicationReadiness(project);
  const draftSaveStatus = getDraftSaveStatus({
    dirty: isDirty,
    externalChange: externalDraftChange,
    saveFailed,
  });
  const readerSource = resolveReaderSource(project, readerRevision);
  const readerDescription =
    readerSource.mode === 'revision'
      ? `Published revision ${readerSource.revision} · ${readerSource.visibility}`
      : project.publishedRevision === 0
        ? 'Unpublished draft preview'
        : publicationHasChanges
          ? `Draft preview · changes since published revision ${project.publishedRevision}`
          : `Draft preview · matches published revision ${project.publishedRevision}`;
  const replayPreview = () => {
    activePointerCleanup.current?.();
    endHistoryTransaction();
    setPreviewKey((key) => key + 1);
    setNotice('Preview replayed');
  };
  const replayReader = () => {
    readerScroll.current?.scrollTo({ top: 0, behavior: 'auto' });
    setPreviewKey((key) => key + 1);
    setNotice('Reader replayed from the first scene');
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
    setPublishTagsInput(project.tags.join(', '));
    setPublishOpen(true);
  };
  const openProjectDetails = () => {
    activePointerCleanup.current?.();
    endHistoryTransaction();
    if (externalDraftChange) {
      setConflictOpen(true);
      return;
    }
    setPublishTagsInput(project.tags.join(', '));
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
        <div className="brand-lockup" aria-label="Motus Studio">
          <span className="brand-mark" aria-hidden="true"><span /><span /></span>
          <span className="brand-name">MOTUS</span>
          <span className="brand-product">STUDIO</span>
        </div>

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
          <button aria-keyshortcuts="Meta+S Control+S" className="save-state" onClick={saveCurrentProject} title="Save draft now (⌘/Ctrl+S)" type="button"><Cloud />{displayedNotice}</button>
          <Button aria-label="Start a new work" className="topbar-mobile-hide" onClick={requestNewWork} size="icon" variant="outline"><FilePlus2 /></Button>
          <Button aria-label="Undo" disabled={!canUndo} onClick={undo} size="icon" variant="ghost"><Undo2 /></Button>
          <Button aria-label="Redo" disabled={!canRedo} onClick={redo} size="icon" variant="ghost"><Redo2 /></Button>
          <Button className="topbar-mobile-hide" onClick={replayPreview} variant="secondary">
            <Play data-icon="inline-start" fill="currentColor" />Preview
          </Button>
          <Button aria-label="Open draft reader" className="topbar-reader" onClick={() => openReader()} variant="secondary"><Layers3 data-icon="inline-start" /><span>Draft reader</span></Button>
          <Button aria-label="Publish work" className="topbar-publish" onClick={openPublish}><Send data-icon="inline-start" /><span>Publish</span></Button>
          <Button aria-label="Import Motus project" className="topbar-mobile-hide" onClick={requestProjectImport} size="icon" variant="outline"><Upload /></Button>
          <Button aria-label="Export Motus project" onClick={exportProject} size="icon" variant="outline"><Download /></Button>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button aria-label="More project actions" className="topbar-mobile-more" size="icon" variant="outline" />}
            >
              <Ellipsis />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-48" sideOffset={8}>
              <DropdownMenuItem className="min-h-10 px-2.5" onClick={openProjectDetails}>
                <Pencil />Project details
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="min-h-10 px-2.5" onClick={saveCurrentProject}>
                <Cloud />Save now
              </DropdownMenuItem>
              <DropdownMenuItem className="min-h-10 px-2.5" onClick={replayPreview}>
                <Play />Replay canvas preview
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="min-h-10 px-2.5" onClick={requestNewWork}>
                <FilePlus2 />New work
              </DropdownMenuItem>
              <DropdownMenuItem className="min-h-10 px-2.5" onClick={requestProjectImport}>
                <Upload />Import project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="studio-grid">
        <aside className="tool-rail" aria-label="Add and edit elements">
          {toolItems.map(({ id, label, icon: Icon }) => (
            <button
              aria-pressed={id === 'select' || id === 'motion' ? activeTool === id : undefined}
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

        <aside className="layers-panel" aria-label="Scene layers">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">SCENE {String(sceneIndex + 1).padStart(2, '0')}</span>
              <h1>Layers</h1>
            </div>
            <Button aria-label="Add shape" onClick={() => addElement('shape')} size="icon-sm" variant="outline"><Plus /></Button>
          </div>

          <div className="scene-settings">
            <label htmlFor="active-scene-name">
              <span>Scene name</span>
              <Input
                {...textHistoryProps}
                id="active-scene-name"
                maxLength={MAX_SCENE_NAME_LENGTH}
                onChange={(event) => commitProject((draft) => {
                  const scene = draft.scenes.find((item) => item.id === activeScene.id);
                  if (scene) scene.name = event.target.value;
                }, `scene:${activeScene.id}:name`)}
                value={activeScene.name}
              />
            </label>
            <fieldset className="scene-palette">
              <legend className="sr-only">Scene background</legend>
              {sceneBackgrounds.map((background) => (
                <button
                  aria-label={`Use ${background.name} background`}
                  aria-pressed={activeScene.background === background.value}
                  data-active={activeScene.background === background.value || undefined}
                  key={background.name}
                  onClick={() => commitProject((draft) => {
                    const scene = draft.scenes.find((item) => item.id === activeScene.id);
                    if (scene) scene.background = background.value;
                  })}
                  style={{ background: background.value }}
                  type="button"
                />
              ))}
            </fieldset>
          </div>

          <div className="layer-list">
            {[...activeScene.elements].reverse().map((element) => {
              const Icon = elementIcon(element.type);
              const originalIndex = activeScene.elements.findIndex((item) => item.id === element.id);
              return (
                <div className="layer-row" data-selected={selectedElementId === element.id || undefined} key={element.id}>
                  <button aria-pressed={selectedElementId === element.id} className="layer-select" onClick={() => setSelectedElementId(element.id)} type="button">
                    <span className="layer-icon"><Icon /></span>
                    <span className="layer-copy"><strong>{element.name}</strong><small>{element.type}</small></span>
                  </button>
                  <div className="layer-actions">
                    <button
                      aria-label={`${element.name} visibility`}
                      aria-pressed={element.visible}
                      onClick={() => updateElement(element.id, (item) => { item.visible = !item.visible; })}
                      title={element.visible ? `Hide ${element.name}` : `Show ${element.name}`}
                      type="button"
                    >
                      {element.visible ? <Eye /> : <EyeOff />}
                    </button>
                    <button
                      aria-label={`${element.name} locked`}
                      aria-pressed={element.locked}
                      onClick={() => updateElement(element.id, (item) => { item.locked = !item.locked; })}
                      title={element.locked ? `Unlock ${element.name}` : `Lock ${element.name}`}
                      type="button"
                    >
                      {element.locked ? <Lock /> : <Unlock />}
                    </button>
                    <button aria-label={`Move ${element.name} up`} disabled={originalIndex === activeScene.elements.length - 1} onClick={() => moveLayer(element.id, 1)} type="button"><ArrowUp /></button>
                    <button aria-label={`Move ${element.name} down`} disabled={originalIndex === 0} onClick={() => moveLayer(element.id, -1)} type="button"><ArrowDown /></button>
                  </div>
                </div>
              );
            })}
          </div>

          {activeScene.elements.length === 0 ? (
            <div className="empty-layers"><Square /><strong>Blank scene</strong><p>Add from the toolbar, or drop or paste a PNG or WebP.</p></div>
          ) : null}
        </aside>

        <section className="workspace" aria-label="Comic scene editor">
          <div className="workspace-toolbar">
            <div className="canvas-status"><Move /><span id="canvas-instructions">Drag, paste, or use arrow keys · Shift moves 10 px</span><kbd>⌘/Ctrl+S save</kbd><kbd>⌘/Ctrl+C/X/V layer</kbd><kbd>⌫ delete</kbd></div>
            <output aria-live="polite" className="workspace-notice">{displayedNotice}</output>
            <fieldset className="zoom-control" aria-label="Canvas zoom">
              <button aria-label="Zoom out" disabled={zoom <= 50} onClick={() => setZoom((value) => Math.max(50, value - 10))} type="button">−</button>
              <span>{zoom}%</span>
              <button aria-label="Zoom in" disabled={zoom >= 160} onClick={() => setZoom((value) => Math.min(160, value + 10))} type="button">+</button>
              <button aria-label="Fit canvas" className="zoom-fit" disabled={zoom === 100} onClick={() => setZoom(100)} type="button">Fit</button>
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
              if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) return;
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
            <div className="artboard-frame" style={{ width: `${artboardWidth}px` }}>
              <SceneView
                interactive
                onElementRef={(elementId, node) => {
                  if (node) canvasElementRefs.current.set(elementId, node);
                  else canvasElementRefs.current.delete(elementId);
                }}
                onKeyboardNudge={nudgeElement}
                onKeyboardNudgeEnd={endHistoryTransaction}
                onPointerAction={beginPointerAction}
                onSelect={setSelectedElementId}
                playingKey={previewKey}
                scene={activeScene}
                selectedId={selectedElementId}
              />
            </div>
          </div>

          <footer className="scene-strip">
            <div className="scene-strip-copy"><span>Scenes</span><strong>{sceneIndex + 1} / {project.scenes.length}</strong></div>
            <div aria-label="Scenes" className="scene-tabs" role="tablist">
              {project.scenes.map((scene, index) => (
                <button
                  aria-controls="scene-canvas"
                  aria-label={`Scene ${index + 1}: ${scene.name}`}
                  aria-selected={scene.id === activeScene.id}
                  className="scene-thumbnail"
                  data-active={scene.id === activeScene.id || undefined}
                  key={scene.id}
                  onClick={() => {
                    setActiveSceneId(scene.id);
                    setSelectedElementId(scene.elements.at(-1)?.id ?? '');
                  }}
                  onKeyDown={(event) => {
                    const nextIndex = getTabIndexForKey(index, project.scenes.length, event.key);
                    if (nextIndex === null) return;
                    event.preventDefault();
                    const nextScene = project.scenes[nextIndex];
                    setActiveSceneId(nextScene.id);
                    setSelectedElementId(nextScene.elements.at(-1)?.id ?? '');
                    window.requestAnimationFrame(() => sceneButtonRefs.current.get(nextScene.id)?.focus());
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
            <Button className="scene-action" onClick={addScene} variant="outline"><Plus />New</Button>
            <Button aria-label="Move scene earlier" className="scene-icon-action" disabled={sceneIndex === 0} onClick={() => moveScene(-1)} size="icon" variant="outline"><ArrowLeft /></Button>
            <Button aria-label="Move scene later" className="scene-icon-action" disabled={sceneIndex === project.scenes.length - 1} onClick={() => moveScene(1)} size="icon" variant="outline"><ArrowRight /></Button>
            <Button aria-label="Duplicate scene" className="scene-icon-action" onClick={duplicateScene} size="icon" variant="outline"><Copy /></Button>
            <Button aria-label="Delete scene" className="scene-icon-action" onClick={deleteScene} size="icon" variant="destructive"><Trash2 /></Button>
          </footer>
        </section>

        <aside className="inspector-panel" aria-label="Selected element settings">
          <div aria-label="Element property sections" className="inspector-tabs" role="tablist">
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
              Motion
            </button>
          </div>

          <div
            aria-labelledby={`inspector-tab-${inspectorTab}`}
            className="inspector-content"
            id="inspector-panel"
            role="tabpanel"
          >
            {!selectedElement ? (
              <div className="empty-inspector"><MousePointer2 /><strong>Select an element</strong><p>Click a layer or an item on the canvas to edit it.</p></div>
            ) : (
              <>
                <div className="selected-element-card">
                  <span className={`element-swatch swatch-${selectedElement.type}`} style={{ background: selectedElement.fill }} />
                  <div><small>Selected</small><strong>{selectedElement.name}</strong></div>
                  <Button aria-label="Duplicate selected element" onClick={() => duplicateElement(selectedElement.id)} size="icon-sm" variant="outline"><Copy /></Button>
                  <Button aria-label="Delete selected element" onClick={() => deleteElement(selectedElement.id)} size="icon-sm" variant="destructive"><Trash2 /></Button>
                </div>

                {inspectorTab === 'design' ? (
                  <div className="property-stack">
                    <label htmlFor="selected-layer-name"><span>Layer name</span><Input {...textHistoryProps} id="selected-layer-name" maxLength={MAX_ELEMENT_NAME_LENGTH} onChange={(event) => updateElement(selectedElement.id, (item) => { item.name = event.target.value; }, `element:${selectedElement.id}:name`)} value={selectedElement.name} /></label>
                    {(selectedElement.type === 'text' || selectedElement.type === 'speech') ? (
                      <label htmlFor="selected-layer-text"><span>Text</span><Textarea {...textHistoryProps} id="selected-layer-text" maxLength={MAX_ELEMENT_TEXT_LENGTH} onChange={(event) => updateElement(selectedElement.id, (item) => { item.text = event.target.value; }, `element:${selectedElement.id}:text`)} value={selectedElement.text ?? ''} /></label>
                    ) : null}
                    {selectedElement.type !== 'image' ? (
                      <label className="color-control"><span>Color</span><input {...continuousHistoryProps} aria-label="Element color" onChange={(event) => updateElement(selectedElement.id, (item) => { item.fill = event.target.value; }, `element:${selectedElement.id}:fill`)} type="color" value={selectedElement.fill} /><output>{selectedElement.fill}</output></label>
                    ) : null}
                    <div className="property-grid">
                      {(['x', 'y', 'width', 'height'] as const).map((property) => (
                        <label key={property}><span>{property.toUpperCase()}</span><Input {...continuousHistoryProps} max={property === 'x' ? CANVAS_WIDTH - selectedElement.width : property === 'y' ? CANVAS_HEIGHT - selectedElement.height : property === 'width' ? CANVAS_WIDTH : CANVAS_HEIGHT} min={property === 'width' ? MIN_ELEMENT_WIDTH : property === 'height' ? MIN_ELEMENT_HEIGHT : 0} onChange={(event) => updateElement(selectedElement.id, (item) => { item[property] = Number(event.target.value); }, `element:${selectedElement.id}:${property}`)} type="number" value={Math.round(selectedElement[property])} /></label>
                      ))}
                    </div>
                    <label className="range-control"><span>Rotation</span><output>{selectedElement.rotation}°</output><input {...continuousHistoryProps} max="180" min="-180" onChange={(event) => updateElement(selectedElement.id, (item) => { item.rotation = Number(event.target.value); }, `element:${selectedElement.id}:rotation`)} type="range" value={selectedElement.rotation} /></label>
                    <label className="range-control"><span>Opacity</span><output>{Math.round(selectedElement.opacity * 100)}%</output><input {...continuousHistoryProps} max="100" min="0" onChange={(event) => updateElement(selectedElement.id, (item) => { item.opacity = Number(event.target.value) / 100; }, `element:${selectedElement.id}:opacity`)} type="range" value={Math.round(selectedElement.opacity * 100)} /></label>
                    <div className="visibility-row">
                      <Button onClick={() => updateElement(selectedElement.id, (item) => { item.visible = !item.visible; })} variant="outline">{selectedElement.visible ? <Eye /> : <EyeOff />}{selectedElement.visible ? 'Visible' : 'Hidden'}</Button>
                      <Button onClick={() => updateElement(selectedElement.id, (item) => { item.locked = !item.locked; })} variant="outline">{selectedElement.locked ? <Lock /> : <Unlock />}{selectedElement.locked ? 'Locked' : 'Unlocked'}</Button>
                    </div>
                  </div>
                ) : (
                  <div className="property-stack motion-properties">
                    <div className="motion-summary"><span className="motion-number">01</span><div><small>WHEN</small><strong>Scene enters view</strong></div></div>
                    <div className="motion-summary motion-action"><span className="motion-number">02</span><div><small>MOTION + LOOKS</small><strong>Move · rotate · scale · fade</strong></div></div>
                    <label className="range-control"><span>Move X</span><output>{selectedElement.motion.moveX}px</output><input {...continuousHistoryProps} max="400" min="-400" onChange={(event) => updateElement(selectedElement.id, (item) => { item.motion.moveX = Number(event.target.value); }, `element:${selectedElement.id}:motion:move-x`)} type="range" value={selectedElement.motion.moveX} /></label>
                    <label className="range-control"><span>Move Y</span><output>{selectedElement.motion.moveY}px</output><input {...continuousHistoryProps} max="400" min="-400" onChange={(event) => updateElement(selectedElement.id, (item) => { item.motion.moveY = Number(event.target.value); }, `element:${selectedElement.id}:motion:move-y`)} type="range" value={selectedElement.motion.moveY} /></label>
                    <label className="range-control"><span>Rotate from</span><output>{selectedElement.motion.fromRotation}°</output><input {...continuousHistoryProps} max="180" min="-180" onChange={(event) => updateElement(selectedElement.id, (item) => { item.motion.fromRotation = Number(event.target.value); }, `element:${selectedElement.id}:motion:rotation`)} type="range" value={selectedElement.motion.fromRotation} /></label>
                    <label className="range-control"><span>Scale from</span><output>{selectedElement.motion.fromScale.toFixed(2)}×</output><input {...continuousHistoryProps} max="200" min="20" onChange={(event) => updateElement(selectedElement.id, (item) => { item.motion.fromScale = Number(event.target.value) / 100; }, `element:${selectedElement.id}:motion:scale`)} type="range" value={Math.round(selectedElement.motion.fromScale * 100)} /></label>
                    <label className="range-control"><span>Duration</span><output>{(selectedElement.motion.durationMs / 1000).toFixed(1)}s</output><input {...continuousHistoryProps} max="4000" min="200" onChange={(event) => updateElement(selectedElement.id, (item) => { item.motion.durationMs = Number(event.target.value); }, `element:${selectedElement.id}:motion:duration`)} step="100" type="range" value={selectedElement.motion.durationMs} /></label>
                    <label className="range-control"><span>Delay</span><output>{(selectedElement.motion.delayMs / 1000).toFixed(1)}s</output><input {...continuousHistoryProps} max="3000" min="0" onChange={(event) => updateElement(selectedElement.id, (item) => { item.motion.delayMs = Number(event.target.value); }, `element:${selectedElement.id}:motion:delay`)} step="100" type="range" value={selectedElement.motion.delayMs} /></label>
                    <label className="range-control"><span>Start opacity</span><output>{Math.round(selectedElement.motion.fromOpacity * 100)}%</output><input {...continuousHistoryProps} max="100" min="0" onChange={(event) => updateElement(selectedElement.id, (item) => { item.motion.fromOpacity = Number(event.target.value) / 100; }, `element:${selectedElement.id}:motion:opacity`)} type="range" value={Math.round(selectedElement.motion.fromOpacity * 100)} /></label>
                    <label htmlFor="selected-layer-easing"><span>Easing</span><NativeSelect className="w-full" id="selected-layer-easing" onChange={(event) => updateElement(selectedElement.id, (item) => { item.motion.easing = event.target.value as Easing; })} value={selectedElement.motion.easing}><NativeSelectOption value="linear">Linear</NativeSelectOption><NativeSelectOption value="ease-out">Ease out</NativeSelectOption><NativeSelectOption value="ease-in-out">Ease in/out</NativeSelectOption></NativeSelect></label>
                    <Button className="run-motion-button" onClick={() => setPreviewKey((key) => key + 1)}><Play fill="currentColor" />Run animation</Button>
                  </div>
                )}
              </>
            )}
          </div>
        </aside>
      </div>

      {deletionUndo ? (
        <div aria-atomic="true" aria-live="polite" className="deletion-undo">
          <span>{deletionUndo.message}</span>
          <Button onClick={undoDeletion} size="sm" variant="secondary"><Undo2 />Undo</Button>
        </div>
      ) : null}

      {saveFailed ? (
        <div aria-atomic="true" aria-live="assertive" className="save-recovery">
          <CloudOff aria-hidden="true" />
          <div>
            <strong>Draft is not safely saved</strong>
            <p>Browser storage may be full or unavailable. Download a portable backup before closing this tab.</p>
          </div>
          <Button
            onClick={externalDraftChange ? () => setConflictOpen(true) : saveCurrentProject}
            size="sm"
            variant="outline"
          >
            {externalDraftChange ? 'Resolve conflict' : 'Retry save'}
          </Button>
          <Button onClick={exportProject} size="sm"><Download />Download backup</Button>
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
              <p>Loading the saved draft downloads this tab’s version first. Keeping this draft makes it the newest recoverable copy.</p>
            </div>
          </div>
          <div className="conflict-actions">
            <Button onClick={() => setConflictOpen(false)} variant="ghost">Review later</Button>
            <Button onClick={keepCurrentDraft} variant="outline">Keep this draft</Button>
            <Button onClick={loadOtherTabDraft}><Download />Back up &amp; load saved</Button>
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
            <DialogTitle>Import {pendingProjectImport?.project.title}?</DialogTitle>
            <DialogDescription>
              {pendingProjectImport?.fileName} contains {pendingProjectImport?.project.scenes.length}{' '}
              scene{pendingProjectImport?.project.scenes.length === 1 ? '' : 's'} and will replace the draft currently open in the editor.
            </DialogDescription>
          </DialogHeader>
          <div className="new-work-backup">
            <Download />
            <div>
              <strong>Your current work downloads first</strong>
              <p>Motus also verifies that the imported draft fits in both recovery slots before switching projects.</p>
            </div>
          </div>
          <div className="new-work-actions">
            <Button onClick={() => setPendingProjectImport(null)} variant="outline">Cancel</Button>
            <Button onClick={confirmProjectImport}><Upload />Back up &amp; import</Button>
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
            <DialogTitle>Remove revision {pendingRevisionRemoval?.revision}?</DialogTitle>
            <DialogDescription>
              This removes an older immutable snapshot from this device. The current published revision stays untouched.
            </DialogDescription>
          </DialogHeader>
          <div className="new-work-backup">
            <Download />
            <div>
              <strong>A complete project backup downloads first</strong>
              <p>You can import that file later if you need this revision again.</p>
            </div>
          </div>
          <div className="new-work-actions">
            <Button onClick={() => { setPendingRevisionRemoval(null); setPublishOpen(true); }} variant="outline">Cancel</Button>
            <Button onClick={confirmRevisionRemoval} variant="destructive"><Trash2 />Back up &amp; remove</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog onOpenChange={setNewWorkOpen} open={newWorkOpen}>
        <DialogContent className="new-work-dialog">
          <DialogHeader>
            <DialogTitle>Start a new work?</DialogTitle>
            <DialogDescription>
              Motus will download a complete backup of “{project.title}” before opening a blank scene.
            </DialogDescription>
          </DialogHeader>
          <div className="new-work-backup">
            <Download />
            <div>
              <strong>Your current work stays recoverable</strong>
              <p>Import the downloaded .motus.json file at any time to continue exactly where you left off.</p>
            </div>
          </div>
          <div className="new-work-actions">
            <Button onClick={() => setNewWorkOpen(false)} variant="outline">Keep editing</Button>
            <Button onClick={startNewWork}><FilePlus2 />Back up &amp; start</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog onOpenChange={setProjectDetailsOpen} open={projectDetailsOpen}>
        <DialogContent className="publish-dialog">
          <DialogHeader>
            <DialogTitle>Project details</DialogTitle>
            <DialogDescription>
              Update the title and reader-facing context without publishing a new revision.
            </DialogDescription>
          </DialogHeader>
          <div className="publish-grid">
            <label className="publish-field" htmlFor="project-details-title">
              <span>Title</span>
              <Input
                {...textHistoryProps}
                id="project-details-title"
                maxLength={MAX_PROJECT_TITLE_LENGTH}
                onChange={(event) =>
                  commitProject((draft) => {
                    draft.title = event.target.value;
                  }, 'project:title')
                }
                placeholder="Name this work"
                value={project.title}
              />
            </label>
            <label className="publish-field" htmlFor="project-details-description">
              <span>Description</span>
              <Textarea
                {...textHistoryProps}
                id="project-details-description"
                onChange={(event) => commitProject((draft) => { draft.description = event.target.value; }, 'project:description')}
                placeholder="What should readers know before they begin?"
                value={project.description}
              />
            </label>
            <label className="publish-field" htmlFor="project-details-tags">
              <span>Tags</span>
              <Input
                id="project-details-tags"
                maxLength={400}
                onBlur={(event) => {
                  endHistoryTransaction();
                  setPublishTagsInput(parseProjectTags(event.currentTarget.value).join(', '));
                }}
                onChange={(event) => {
                  const value = event.target.value;
                  setPublishTagsInput(value);
                  commitProject((draft) => {
                    draft.tags = parseProjectTags(value);
                  }, 'project:tags');
                }}
                placeholder="mystery, science fiction"
                value={publishTagsInput}
              />
              <span className="publish-field-hint">Separate tags with commas.</span>
            </label>
          </div>
          <div className="new-work-actions">
            <Button onClick={() => setProjectDetailsOpen(false)}>Done</Button>
          </div>
        </DialogContent>
      </Dialog>

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
          {readerSource.contentRating === 'mature' && !readerMatureConfirmed ? (
            <section
              aria-describedby="reader-mature-description"
              aria-labelledby="reader-mature-title"
              className="reader-maturity"
            >
              <EyeOff aria-hidden="true" />
              <span>MATURE CONTENT</span>
              <h3 id="reader-mature-title">Continue to this reader?</h3>
              <p id="reader-mature-description">
                The creator marked this work as Mature. Continue only if this content is appropriate for you.
              </p>
              <div>
                <Button onClick={() => setReaderOpen(false)} variant="ghost">Go back</Button>
                <Button onClick={() => setReaderMatureConfirmed(true)}>Continue to reader</Button>
              </div>
            </section>
          ) : (
            <div className="reader-content">
              <div className="reader-toolbar">
                <span>Motion plays as each scene enters view.</span>
                <Button onClick={replayReader} size="sm" variant="secondary">
                  <Play fill="currentColor" />Replay from start
                </Button>
              </div>
              <div className="reader-scroll" ref={readerScroll}>
                {readerSource.scenes.map((scene, index) => (
                  <ReaderScene
                    index={index}
                    key={`${scene.id}-${previewKey}`}
                    scene={scene}
                    sessionKey={previewKey || 1}
                  />
                ))}
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
              Create an immutable reader snapshot. Later edits stay in your draft until you publish again.
            </DialogDescription>
          </DialogHeader>

          <div className="publish-grid">
            <label className="publish-field" htmlFor="publish-title">
              <span>Title</span>
              <Input
                {...textHistoryProps}
                id="publish-title"
                maxLength={MAX_PROJECT_TITLE_LENGTH}
                onChange={(event) =>
                  commitProject((draft) => {
                    draft.title = event.target.value;
                  }, 'project:title')
                }
                placeholder="Name this work"
                value={project.title}
              />
            </label>
            <label className="publish-field" htmlFor="publish-description">
              <span>Description</span>
              <Textarea
                {...textHistoryProps}
                id="publish-description"
                onChange={(event) => commitProject((draft) => { draft.description = event.target.value; }, 'project:description')}
                placeholder="What should readers know before they begin?"
                value={project.description}
              />
            </label>
            <label className="publish-field" htmlFor="publish-tags">
              <span>Tags</span>
              <Input
                id="publish-tags"
                maxLength={400}
                onBlur={(event) => {
                  endHistoryTransaction();
                  setPublishTagsInput(parseProjectTags(event.currentTarget.value).join(', '));
                }}
                onChange={(event) => {
                  const value = event.target.value;
                  setPublishTagsInput(value);
                  commitProject((draft) => {
                    draft.tags = parseProjectTags(value);
                  }, 'project:tags');
                }}
                placeholder="mystery, science fiction"
                value={publishTagsInput}
              />
              <small className="publish-field-hint">Comma-separated · up to 8 tags</small>
            </label>

            <label className="publish-field" htmlFor="publish-cover-scene">
              <span>Cover scene</span>
              <NativeSelect
                id="publish-cover-scene"
                onChange={(event) => commitProject((draft) => {
                  draft.coverSceneId = event.target.value;
                })}
                value={project.coverSceneId}
              >
                {project.scenes.map((scene, index) => (
                  <NativeSelectOption key={scene.id} value={scene.id}>
                    {String(index + 1).padStart(2, '0')} · {scene.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              <small className="publish-field-hint">
                Used as this alpha revision’s cover metadata
              </small>
            </label>

            <div className="publish-field-row">
              <label className="publish-field" htmlFor="publish-language">
                <span>Language</span>
                <NativeSelect id="publish-language" onChange={(event) => commitProject((draft) => { draft.language = event.target.value; })} value={project.language}>
                  <NativeSelectOption value="en">English</NativeSelectOption>
                  <NativeSelectOption value="tr">Turkish</NativeSelectOption>
                  <NativeSelectOption value="es">Spanish</NativeSelectOption>
                  <NativeSelectOption value="fr">French</NativeSelectOption>
                  <NativeSelectOption value="ja">Japanese</NativeSelectOption>
                </NativeSelect>
              </label>
              <label className="publish-field" htmlFor="publish-rating">
                <span>Content rating</span>
                <NativeSelect id="publish-rating" onChange={(event) => commitProject((draft) => { draft.contentRating = event.target.value as ContentRating; })} value={project.contentRating}>
                  <NativeSelectOption value="all-ages">All ages</NativeSelectOption>
                  <NativeSelectOption value="teen">Teen</NativeSelectOption>
                  <NativeSelectOption value="mature">Mature</NativeSelectOption>
                </NativeSelect>
              </label>
              <label className="publish-field" htmlFor="publish-visibility">
                <span>Visibility</span>
                <NativeSelect id="publish-visibility" onChange={(event) => commitProject((draft) => { draft.visibility = event.target.value as PublicationVisibility; })} value={project.visibility}>
                  <NativeSelectOption value="private">Private</NativeSelectOption>
                  <NativeSelectOption value="public">Public metadata</NativeSelectOption>
                </NativeSelect>
              </label>
            </div>

            <p className="publish-note">
              This alpha site remains owner-only. Choosing public records your intended visibility in the revision but does not change site access.
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
                  {publicationReadiness.ready ? 'Ready to publish' : 'Finish before publishing'}
                </strong>
                <small>
                  {publicationReadiness.sceneCount} scenes · {publicationReadiness.visibleLayerCount} visible layers
                </small>
                {publicationReadiness.issues.length > 0 ? (
                  <ul>
                    {publicationReadiness.issues.map((issue) => <li key={issue}>{issue}</li>)}
                  </ul>
                ) : null}
              </div>
            </section>

            {project.publications.length > 0 ? (
              <section className="revision-history" aria-labelledby="revision-history-title">
                <div className="revision-history-heading">
                  <strong id="revision-history-title">Revision history</strong>
                  <span>{project.publications.length} saved</span>
                </div>
                <div className="revision-list">
                  {[...project.publications].reverse().map((revision) => (
                    <div className="revision-row" key={revision.id}>
                      <div>
                        <strong>Revision {revision.revision}</strong>
                        <small>{revision.createdAt.slice(0, 16).replace('T', ' ')} · {revision.scenes.length} scenes{revision.revision === project.publishedRevision ? ' · Current' : ''}</small>
                      </div>
                      <div className="revision-actions">
                        <Button onClick={() => { setPublishOpen(false); openReader(revision); }} size="sm" variant="outline">View</Button>
                        <Button aria-label={`Restore revision ${revision.revision} as the editable draft`} onClick={() => restoreRevision(revision)} size="sm" variant="outline"><RotateCcw />Restore</Button>
                        {revision.revision !== project.publishedRevision ? (
                          <Button aria-label={`Remove revision ${revision.revision}`} onClick={() => { setPublishOpen(false); setPendingRevisionRemoval(revision); }} size="icon-sm" variant="destructive"><Trash2 /></Button>
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
            <Button disabled={!publicationReadiness.ready || !publicationHasChanges || externalDraftChange} onClick={publishRevision}><Send />Publish revision</Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
