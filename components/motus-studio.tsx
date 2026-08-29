'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
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
import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  MAX_PROJECT_FILE_BYTES,
  MIN_ELEMENT_HEIGHT,
  MIN_ELEMENT_WIDTH,
  cloneProject,
  compileElementMotion,
  constrainElementToCanvas,
  createBlankProject,
  createDefaultProject,
  createElement,
  createProjectBackupFileName,
  createPublicationRevision,
  detectImageFormat,
  hasUnpublishedChanges,
  parseProjectTags,
  recordProjectHistory,
  reorderScenes,
  resolveDraftConflict,
  resolveEditorSelection,
  restoreNewestProject,
  restorePublicationToDraft,
  restoreProject,
  restoreProjectWithError,
  shouldAutosaveDraft,
  validateImageAsset,
  type ContentRating,
  type Easing,
  type ElementType,
  type MotusElement,
  type MotusProject,
  type MotusPublicationRevision,
  type MotusScene,
  type PublicationVisibility,
} from '@/lib/motus-model';

const LEGACY_STORAGE_KEY = 'motus.project.v2';
const DRAFT_SLOT_A_KEY = 'motus.project.slot.a.v4';
const DRAFT_SLOT_B_KEY = 'motus.project.slot.b.v4';
const DRAFT_POINTER_KEY = 'motus.project.active-slot.v4';

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
  selectedId?: string;
  playingKey?: number;
  interactive?: boolean;
  onSelect?: (id: string) => void;
  onPointerAction?: (
    event: ReactPointerEvent<HTMLElement>,
    elementId: string,
    mode: 'move' | 'resize',
  ) => void;
};

function SceneView({
  scene,
  selectedId,
  playingKey = 0,
  interactive = false,
  onSelect,
  onPointerAction,
}: SceneViewProps) {
  return (
    <div className="artboard" style={{ background: scene.background }}>
      <div className="artboard-grid" />
      <div className="artboard-horizon" />
      {scene.elements.map((element) => {
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
            aria-label={element.name}
            className={`canvas-element element-${element.type} ${
              playingKey ? 'is-playing' : ''
            }`}
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
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      onSelect?.(element.id);
                    }
                  }
                : undefined
            }
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
            style={elementStyle}
            tabIndex={interactive ? 0 : undefined}
          >
            {renderElementContent(element)}
            {selected && interactive && !element.locked ? (
              <button
                aria-label={`Resize ${element.name}`}
                className="resize-handle"
                onClick={(event) => event.stopPropagation()}
                onPointerDown={(event) => {
                  event.stopPropagation();
                  onPointerAction?.(event, element.id, 'resize');
                }}
                type="button"
              >
                <Maximize2 />
              </button>
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
  const [activeTool, setActiveTool] = useState('select');
  const [inspectorTab, setInspectorTab] = useState<'design' | 'motion'>('design');
  const [zoom, setZoom] = useState(64);
  const [previewKey, setPreviewKey] = useState(0);
  const [readerOpen, setReaderOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishTagsInput, setPublishTagsInput] = useState(
    'science fiction, mystery',
  );
  const [newWorkOpen, setNewWorkOpen] = useState(false);
  const [conflictOpen, setConflictOpen] = useState(false);
  const [externalDraftChange, setExternalDraftChange] = useState(false);
  const [readerRevision, setReaderRevision] =
    useState<MotusPublicationRevision | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [notice, setNotice] = useState('Ready');
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const undoStack = useRef<MotusProject[]>([]);
  const redoStack = useRef<MotusProject[]>([]);
  const historyTransaction = useRef<string | null>(null);
  const imageInput = useRef<HTMLInputElement>(null);
  const projectInput = useRef<HTMLInputElement>(null);

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

  function persistProject(candidate: MotusProject, announce = true) {
    try {
      const activeSlot = window.localStorage.getItem(DRAFT_POINTER_KEY) === 'b' ? 'b' : 'a';
      const nextSlot = activeSlot === 'a' ? 'b' : 'a';
      const nextKey = nextSlot === 'a' ? DRAFT_SLOT_A_KEY : DRAFT_SLOT_B_KEY;
      const encoded = JSON.stringify(candidate);

      window.localStorage.setItem(nextKey, encoded);
      if (!restoreProject(window.localStorage.getItem(nextKey))) {
        throw new Error('Draft verification failed');
      }
      window.localStorage.setItem(DRAFT_POINTER_KEY, nextSlot);
      if (announce) setNotice('Saved with recovery');
      return true;
    } catch {
      if (announce) setNotice('Save failed — export a backup');
      return false;
    }
  }

  function readSavedDraft() {
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
  }

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      const restored = readSavedDraft();
      if (restored) {
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
  }, []);

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
      persistProject(project, false);
    };
    window.addEventListener('pagehide', flush);
    return () => window.removeEventListener('pagehide', flush);
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
          setProject(saved.project);
          setIsDirty(false);
          setExternalDraftChange(false);
          setConflictOpen(false);
          setNotice('Draft updated from another tab');
        }
        return;
      }
      setExternalDraftChange(true);
      setConflictOpen(true);
      setNotice('Autosave paused · draft changed in another tab');
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [activeSceneId, hydrated, isDirty, selectedElementId]);

  const commitProject = (
    mutate: (draft: MotusProject) => void,
    transactionKey: string | null = null,
  ) => {
    setIsDirty(true);
    setCanUndo(true);
    setCanRedo(false);
    setProject((current) => {
      const history = recordProjectHistory(
        {
          undoStack: undoStack.current,
          transactionKey: historyTransaction.current,
        },
        current,
        transactionKey,
      );
      undoStack.current = history.undoStack;
      historyTransaction.current = history.transactionKey;
      redoStack.current = [];
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
    endHistoryTransaction();
    const previous = undoStack.current.pop();
    if (!previous) return;
    setCanUndo(undoStack.current.length > 0);
    setCanRedo(true);
    setIsDirty(true);
    reconcileSelection(previous);
    setProject((current) => {
      redoStack.current.push(cloneProject(current));
      return previous;
    });
    setNotice('Undid change');
  };

  const redo = () => {
    endHistoryTransaction();
    const next = redoStack.current.pop();
    if (!next) return;
    setCanUndo(true);
    setCanRedo(redoStack.current.length > 0);
    setIsDirty(true);
    reconcileSelection(next);
    setProject((current) => {
      undoStack.current.push(cloneProject(current));
      return next;
    });
    setNotice('Redid change');
  };

  const addElement = (type: ElementType, overrides: Partial<MotusElement> = {}) => {
    const index = activeScene.elements.length + 1;
    const element = createElement(type, index, overrides);
    commitProject((draft) => {
      draft.scenes
        .find((scene) => scene.id === activeScene.id)
        ?.elements.push(element);
    });
    setSelectedElementId(element.id);
    setInspectorTab('design');
    setNotice(`${element.name} added`);
  };

  const deleteElement = (elementId: string) => {
    commitProject((draft) => {
      const scene = draft.scenes.find((item) => item.id === activeScene.id);
      if (!scene) return;
      scene.elements = scene.elements.filter((element) => element.id !== elementId);
    });
    const remaining = activeScene.elements.filter((element) => element.id !== elementId);
    setSelectedElementId(remaining.at(-1)?.id ?? '');
    setNotice('Layer deleted');
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
    setActiveTool(toolId);
    if (toolId === 'select') return;
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
      addElement('image', {
        name: file.name,
        src,
        width: Math.max(8, Math.round(dimensions.width * scale)),
        height: Math.max(8, Math.round(dimensions.height * scale)),
        fill: '#ffffff',
      });
      setNotice(`${file.name} added · ${dimensions.width}×${dimensions.height}`);
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
      const restored = result.project;
      restored.updatedAt = nowIso();
      if (!persistProject(restored, false)) {
        setNotice('Imported project could not be saved — current draft kept');
        return;
      }
      undoStack.current = [cloneProject(project)];
      redoStack.current = [];
      endHistoryTransaction();
      setCanUndo(true);
      setCanRedo(false);
      setProject(restored);
      setIsDirty(false);
      setActiveSceneId(restored.scenes[0].id);
      setSelectedElementId(restored.scenes[0].elements.at(-1)?.id ?? '');
      setNotice('Project imported');
    };
    reader.onerror = () => setNotice('Project file could not be read');
    reader.readAsText(file);
  };

  const duplicateElement = (elementId: string) => {
    const source = findElement(project, activeScene.id, elementId);
    if (!source) return;
    const copy = structuredClone(source);
    copy.id = uniqueId(source.type);
    copy.name = `${source.name} copy`;
    copy.x = Math.min(CANVAS_WIDTH - copy.width, copy.x + 28);
    copy.y = Math.min(CANVAS_HEIGHT - copy.height, copy.y + 28);
    commitProject((draft) => {
      draft.scenes
        .find((scene) => scene.id === activeScene.id)
        ?.elements.push(copy);
    });
    setSelectedElementId(copy.id);
    setNotice('Layer duplicated');
  };

  const addScene = () => {
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
  };

  const duplicateScene = () => {
    const copy = structuredClone(activeScene);
    copy.id = uniqueId('scene');
    copy.name = `${activeScene.name} copy`;
    copy.elements = copy.elements.map((element, index) => ({
      ...element,
      id: `${copy.id}-${element.type}-${index}`,
    }));
    commitProject((draft) => draft.scenes.splice(sceneIndex + 1, 0, copy));
    setActiveSceneId(copy.id);
    setSelectedElementId(copy.elements.at(-1)?.id ?? '');
    setNotice('Scene duplicated');
  };

  const deleteScene = () => {
    if (project.scenes.length === 1) {
      setNotice('A project needs at least one scene');
      return;
    }
    const nextScene = project.scenes[sceneIndex === 0 ? 1 : sceneIndex - 1];
    commitProject((draft) => {
      draft.scenes = draft.scenes.filter((scene) => scene.id !== activeScene.id);
    });
    setActiveSceneId(nextScene.id);
    setSelectedElementId(nextScene.elements.at(-1)?.id ?? '');
    setNotice('Scene deleted');
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

  const exportProject = () => {
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
    undoStack.current = [...undoStack.current, cloneProject(project)].slice(-50);
    redoStack.current = [];
    endHistoryTransaction();
    setCanUndo(true);
    setCanRedo(false);
    reconcileSelection(resolved);
    setProject(resolved);
    setIsDirty(false);
    setExternalDraftChange(false);
    setConflictOpen(false);
    setNotice('Other tab’s draft loaded · this draft downloaded');
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
    if (!persistProject(blank, false)) {
      setNotice('New work could not be saved — backup downloaded');
      return;
    }

    undoStack.current = [cloneProject(project)];
    redoStack.current = [];
    endHistoryTransaction();
    setCanUndo(true);
    setCanRedo(false);
    setProject(blank);
    setIsDirty(false);
    setActiveSceneId(blank.scenes[0].id);
    setSelectedElementId('');
    setActiveTool('select');
    setInspectorTab('design');
    setNewWorkOpen(false);
    setNotice('New work started · previous draft downloaded');
  };

  const openReader = (revision?: MotusPublicationRevision) => {
    const selectedRevision = revision ?? project.publications.at(-1) ?? null;
    setReaderRevision(selectedRevision ? structuredClone(selectedRevision) : null);
    setPreviewKey((key) => key + 1);
    setReaderOpen(true);
    setNotice(selectedRevision ? `Viewing revision ${selectedRevision.revision}` : 'Previewing draft');
  };

  const publishRevision = () => {
    if (externalDraftChange) {
      setConflictOpen(true);
      return;
    }
    if (!hasUnpublishedChanges(project)) {
      setNotice('Published revision is already current');
      return;
    }
    const createdAt = nowIso();
    const revision = createPublicationRevision(project, createdAt);
    commitProject((draft) => {
      const snapshot = createPublicationRevision(draft, createdAt);
      draft.publications.push(snapshot);
      draft.publishedRevision = snapshot.revision;
    });
    setPublishOpen(false);
    setReaderRevision(revision);
    setPreviewKey((key) => key + 1);
    setReaderOpen(true);
    setNotice(`Revision ${revision.revision} published`);
  };

  const restoreRevision = (revision: MotusPublicationRevision) => {
    const restored = restorePublicationToDraft(project, revision.id, nowIso());
    if (!restored) {
      setNotice('Revision could not be restored');
      return;
    }
    undoStack.current = [...undoStack.current, cloneProject(project)].slice(-50);
    redoStack.current = [];
    endHistoryTransaction();
    setCanUndo(true);
    setCanRedo(false);
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
    if (!element || element.locked || !artboard) return;
    event.preventDefault();
    event.stopPropagation();
    setSelectedElementId(elementId);

    const bounds = artboard.getBoundingClientRect();
    const startX = event.clientX;
    const startY = event.clientY;
    const origin = { x: element.x, y: element.y, width: element.width, height: element.height };
    let moved = false;

    const onMove = (pointer: PointerEvent) => {
      if (!moved) {
        undoStack.current = [...undoStack.current, cloneProject(project)].slice(-50);
        redoStack.current = [];
        endHistoryTransaction();
        setCanUndo(true);
        setCanRedo(false);
        setIsDirty(true);
        moved = true;
      }
      const deltaX = ((pointer.clientX - startX) / bounds.width) * CANVAS_WIDTH;
      const deltaY = ((pointer.clientY - startY) / bounds.height) * CANVAS_HEIGHT;
      setProject((current) => {
        const next = cloneProject(current);
        const target = findElement(next, activeScene.id, elementId);
        if (!target) return current;
        if (mode === 'move') {
          target.x = Math.round(origin.x + deltaX);
          target.y = Math.round(origin.y + deltaY);
        } else {
          target.width = Math.round(origin.width + deltaX);
          target.height = Math.round(origin.height + deltaY);
        }
        Object.assign(target, constrainElementToCanvas(target));
        next.updatedAt = new Date().toISOString();
        return next;
      });
    };

    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      if (moved) setNotice(mode === 'move' ? 'Element moved' : 'Element resized');
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp, { once: true });
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isEditing =
        target?.matches('input, textarea, select') || target?.isContentEditable;
      if (isEditing) return;

      const command = event.metaKey || event.ctrlKey;
      if (command && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
        return;
      }
      if (command && event.key.toLowerCase() === 'y') {
        event.preventDefault();
        redo();
        return;
      }
      if (command && event.key.toLowerCase() === 'd' && selectedElementId) {
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
        !selectedElement.locked &&
        ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)
      ) {
        event.preventDefault();
        const distance = event.shiftKey ? 10 : 1;
        updateElement(selectedElement.id, (element) => {
          if (event.key === 'ArrowLeft') element.x = Math.max(0, element.x - distance);
          if (event.key === 'ArrowRight') {
            element.x = Math.min(CANVAS_WIDTH - element.width, element.x + distance);
          }
          if (event.key === 'ArrowUp') element.y = Math.max(0, element.y - distance);
          if (event.key === 'ArrowDown') {
            element.y = Math.min(CANVAS_HEIGHT - element.height, element.y + distance);
          }
        });
        setNotice(`Nudged ${selectedElement.name}`);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const artboardWidth = Math.round(430 * (zoom / 64));
  const readerScenes = readerRevision?.scenes ?? project.scenes;
  const readerTitle = readerRevision?.title ?? project.title;
  const saveCurrentProject = () => {
    if (externalDraftChange) {
      setConflictOpen(true);
      return;
    }
    if (persistProject(project)) setIsDirty(false);
  };
  const openPublish = () => {
    if (externalDraftChange) {
      setConflictOpen(true);
      return;
    }
    setPublishTagsInput(project.tags.join(', '));
    setPublishOpen(true);
  };
  const publicationHasChanges = hasUnpublishedChanges(project);
  const displayedNotice = externalDraftChange
    ? 'Autosave paused · draft changed in another tab'
    : isDirty
      ? 'Saving changes…'
      : notice;
  const textHistoryProps = { onBlur: endHistoryTransaction };
  const continuousHistoryProps = {
    onBlur: endHistoryTransaction,
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
          onChange={(event) =>
            commitProject((draft) => {
              draft.title = event.target.value;
            }, 'project:title')
          }
          value={project.title}
        />

        <div className="topbar-actions">
          <button className="save-state" onClick={saveCurrentProject} title="Save draft now" type="button"><Cloud />{displayedNotice}</button>
          <Button aria-label="Start a new work" onClick={() => externalDraftChange ? setConflictOpen(true) : setNewWorkOpen(true)} size="icon" variant="outline"><FilePlus2 /></Button>
          <Button aria-label="Undo" disabled={!canUndo} onClick={undo} size="icon" variant="ghost"><Undo2 /></Button>
          <Button aria-label="Redo" disabled={!canRedo} onClick={redo} size="icon" variant="ghost"><Redo2 /></Button>
          <Button onClick={() => setPreviewKey((key) => key + 1)} variant="secondary">
            <Play data-icon="inline-start" fill="currentColor" />Preview
          </Button>
          <Button onClick={() => openReader()} variant="secondary"><Layers3 data-icon="inline-start" />Reader</Button>
          <Button onClick={openPublish}><Send data-icon="inline-start" />Publish</Button>
          <Button aria-label="Import Motus project" onClick={() => externalDraftChange ? setConflictOpen(true) : projectInput.current?.click()} size="icon" variant="outline"><Upload /></Button>
          <Button aria-label="Export Motus project" onClick={exportProject} size="icon" variant="outline"><Download /></Button>
        </div>
      </header>

      <div className="studio-grid">
        <aside className="tool-rail" aria-label="Add and edit elements">
          {toolItems.map(({ id, label, icon: Icon }) => (
            <button
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
                  <button className="layer-select" onClick={() => setSelectedElementId(element.id)} type="button">
                    <span className="layer-icon"><Icon /></span>
                    <span className="layer-copy"><strong>{element.name}</strong><small>{element.type}</small></span>
                  </button>
                  <div className="layer-actions">
                    <button
                      aria-label={element.visible ? `Hide ${element.name}` : `Show ${element.name}`}
                      onClick={() => updateElement(element.id, (item) => { item.visible = !item.visible; })}
                      type="button"
                    >
                      {element.visible ? <Eye /> : <EyeOff />}
                    </button>
                    <button
                      aria-label={element.locked ? `Unlock ${element.name}` : `Lock ${element.name}`}
                      onClick={() => updateElement(element.id, (item) => { item.locked = !item.locked; })}
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
            <div className="empty-layers"><Square /><strong>Blank scene</strong><p>Add text, shapes, speech, or an image from the toolbar.</p></div>
          ) : null}
        </aside>

        <section className="workspace" aria-label="Comic scene editor">
          <div className="workspace-toolbar">
            <div className="canvas-status"><Move /><span>Drag elements · resize from the corner</span><kbd>⌘D duplicate</kbd><kbd>⌫ delete</kbd></div>
            <output aria-live="polite" className="workspace-notice">{displayedNotice}</output>
            <div className="zoom-control" aria-label="Canvas zoom">
              <button aria-label="Zoom out" onClick={() => setZoom((value) => Math.max(40, value - 8))} type="button">−</button>
              <span>{zoom}%</span>
              <button aria-label="Zoom in" onClick={() => setZoom((value) => Math.min(96, value + 8))} type="button">+</button>
            </div>
          </div>

          <div
            className="canvas-stage"
            onClick={() => setSelectedElementId('')}
            onKeyDown={(event) => {
              if (event.key === 'Escape') setSelectedElementId('');
            }}
            role="presentation"
          >
            <div className="artboard-frame" style={{ width: `${artboardWidth}px` }}>
              <SceneView
                interactive
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
            {project.scenes.map((scene, index) => (
              <button
                aria-label={`Open ${scene.name}`}
                className="scene-thumbnail"
                data-active={scene.id === activeScene.id || undefined}
                key={scene.id}
                onClick={() => {
                  setActiveSceneId(scene.id);
                  setSelectedElementId(scene.elements.at(-1)?.id ?? '');
                }}
                style={{ background: scene.background }}
                type="button"
              >
                <span>{String(index + 1).padStart(2, '0')}</span>
                <small>{scene.name}</small>
              </button>
            ))}
            <Button className="scene-action" onClick={addScene} variant="outline"><Plus />New</Button>
            <Button aria-label="Move scene earlier" className="scene-icon-action" disabled={sceneIndex === 0} onClick={() => moveScene(-1)} size="icon" variant="outline"><ArrowLeft /></Button>
            <Button aria-label="Move scene later" className="scene-icon-action" disabled={sceneIndex === project.scenes.length - 1} onClick={() => moveScene(1)} size="icon" variant="outline"><ArrowRight /></Button>
            <Button aria-label="Duplicate scene" className="scene-icon-action" onClick={duplicateScene} size="icon" variant="outline"><Copy /></Button>
            <Button aria-label="Delete scene" className="scene-icon-action" onClick={deleteScene} size="icon" variant="destructive"><Trash2 /></Button>
          </footer>
        </section>

        <aside className="inspector-panel" aria-label="Selected element settings">
          <div className="inspector-tabs" role="tablist">
            <button aria-selected={inspectorTab === 'design'} onClick={() => setInspectorTab('design')} role="tab" type="button">Design</button>
            <button aria-selected={inspectorTab === 'motion'} onClick={() => setInspectorTab('motion')} role="tab" type="button">Motion</button>
          </div>

          <div className="inspector-content">
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
                    <label htmlFor="selected-layer-name"><span>Layer name</span><Input {...textHistoryProps} id="selected-layer-name" onChange={(event) => updateElement(selectedElement.id, (item) => { item.name = event.target.value; }, `element:${selectedElement.id}:name`)} value={selectedElement.name} /></label>
                    {(selectedElement.type === 'text' || selectedElement.type === 'speech') ? (
                      <label htmlFor="selected-layer-text"><span>Text</span><Textarea {...textHistoryProps} id="selected-layer-text" onChange={(event) => updateElement(selectedElement.id, (item) => { item.text = event.target.value; }, `element:${selectedElement.id}:text`)} value={selectedElement.text ?? ''} /></label>
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

      <Dialog onOpenChange={setReaderOpen} open={readerOpen}>
        <DialogContent className="reader-dialog">
          <DialogHeader>
            <DialogTitle>{readerTitle}</DialogTitle>
            <DialogDescription>
              {readerRevision
                ? `Published revision ${readerRevision.revision} · ${readerRevision.visibility}`
                : 'Unpublished draft preview'}
            </DialogDescription>
          </DialogHeader>
          <div className="reader-scroll">
            {readerScenes.map((scene, index) => (
              <ReaderScene
                index={index}
                key={`${scene.id}-${previewKey}`}
                scene={scene}
                sessionKey={previewKey || 1}
              />
            ))}
          </div>
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
                        <small>{revision.createdAt.slice(0, 16).replace('T', ' ')} · {revision.scenes.length} scenes</small>
                      </div>
                      <div className="revision-actions">
                        <Button onClick={() => { setPublishOpen(false); openReader(revision); }} size="sm" variant="outline">View</Button>
                        <Button aria-label={`Restore revision ${revision.revision} as the editable draft`} onClick={() => restoreRevision(revision)} size="sm" variant="outline"><RotateCcw />Restore</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </div>

          <div className="publish-actions">
            <span>
              {publicationHasChanges
                ? `Next: revision ${project.publishedRevision + 1}`
                : `Revision ${project.publishedRevision} is current`}
            </span>
            <Button disabled={!publicationHasChanges || externalDraftChange} onClick={publishRevision}><Send />Publish revision</Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
