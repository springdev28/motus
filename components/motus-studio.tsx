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
  ArrowUp,
  Circle,
  Cloud,
  Copy,
  Download,
  Eye,
  EyeOff,
  FileImage,
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
  RotateCw,
  Sparkles,
  Square,
  Trash2,
  Type,
  Undo2,
  Unlock,
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
  cloneProject,
  createDefaultProject,
  createElement,
  restoreProject,
  type Easing,
  type ElementType,
  type MotusElement,
  type MotusProject,
  type MotusScene,
} from '@/lib/motus-model';

const STORAGE_KEY = 'motus.project.v2';
const CANVAS_WIDTH = 1080;
const CANVAS_HEIGHT = 1440;

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
        const elementStyle = {
          left: `${(element.x / CANVAS_WIDTH) * 100}%`,
          top: `${(element.y / CANVAS_HEIGHT) * 100}%`,
          width: `${(element.width / CANVAS_WIDTH) * 100}%`,
          height: `${(element.height / CANVAS_HEIGHT) * 100}%`,
          transform: `rotate(${element.rotation}deg)`,
          opacity: element.opacity,
          '--element-fill': element.fill,
          '--motion-x': `${element.motion.moveX}px`,
          '--motion-y': `${element.motion.moveY}px`,
          '--motion-duration': `${element.motion.durationMs}ms`,
          '--motion-opacity': element.motion.fromOpacity,
          '--motion-easing': element.motion.easing,
        } as CSSProperties;

        return (
          <div
            aria-label={element.name}
            className={`canvas-element element-${element.type} ${
              playingKey ? 'is-playing' : ''
            }`}
            data-locked={element.locked || undefined}
            data-selected={selected || undefined}
            key={`${element.id}-${playingKey}`}
            onClick={(event) => {
              event.stopPropagation();
              onSelect?.(element.id);
            }}
            onPointerDown={(event) => {
              if (interactive && !element.locked) {
                onPointerAction?.(event, element.id, 'move');
              }
            }}
            role={interactive ? 'button' : undefined}
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

export function MotusStudio() {
  const [project, setProject] = useState<MotusProject>(createDefaultProject);
  const [activeSceneId, setActiveSceneId] = useState('scene-1');
  const [selectedElementId, setSelectedElementId] = useState('scene-1-orb');
  const [activeTool, setActiveTool] = useState('select');
  const [inspectorTab, setInspectorTab] = useState<'design' | 'motion'>('design');
  const [zoom, setZoom] = useState(64);
  const [previewKey, setPreviewKey] = useState(0);
  const [readerOpen, setReaderOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [notice, setNotice] = useState('Ready');
  const undoStack = useRef<MotusProject[]>([]);
  const redoStack = useRef<MotusProject[]>([]);
  const imageInput = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    const saved = restoreProject(window.localStorage.getItem(STORAGE_KEY));
    if (saved) {
      setProject(saved);
      setActiveSceneId(saved.scenes[0].id);
      setSelectedElementId(saved.scenes[0].elements.at(-1)?.id ?? '');
      setNotice('Draft restored');
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const timer = window.setTimeout(() => {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
      setNotice('Saved locally');
    }, 180);
    return () => window.clearTimeout(timer);
  }, [hydrated, project]);

  const commitProject = (mutate: (draft: MotusProject) => void) => {
    setProject((current) => {
      undoStack.current = [...undoStack.current, cloneProject(current)].slice(-50);
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
  ) => {
    commitProject((draft) => {
      const element = findElement(draft, activeScene.id, elementId);
      if (element) mutate(element);
    });
  };

  const undo = () => {
    const previous = undoStack.current.pop();
    if (!previous) return;
    setProject((current) => {
      redoStack.current.push(cloneProject(current));
      return previous;
    });
    setNotice('Undid change');
  };

  const redo = () => {
    const next = redoStack.current.pop();
    if (!next) return;
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

  const uploadImage = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setNotice('Choose an image file');
      return;
    }
    if (file.size > 750_000) {
      setNotice('Images must be under 750 KB for this local prototype');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      addElement('image', {
        name: file.name,
        src: String(reader.result),
        width: 360,
        height: 300,
        fill: '#ffffff',
      });
    };
    reader.readAsDataURL(file);
  };

  const addScene = () => {
    const id = `scene-${Date.now()}`;
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
    copy.id = `scene-${Date.now()}`;
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

  const exportProject = () => {
    const blob = new Blob([JSON.stringify(project, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${project.id}.motus.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setNotice('Project exported');
  };

  const openReader = () => {
    commitProject((draft) => {
      draft.publishedRevision += 1;
    });
    setPreviewKey((key) => key + 1);
    setReaderOpen(true);
    setNotice('Reader revision created');
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

    undoStack.current = [...undoStack.current, cloneProject(project)].slice(-50);
    redoStack.current = [];
    const bounds = artboard.getBoundingClientRect();
    const startX = event.clientX;
    const startY = event.clientY;
    const origin = { x: element.x, y: element.y, width: element.width, height: element.height };

    const onMove = (pointer: PointerEvent) => {
      const deltaX = ((pointer.clientX - startX) / bounds.width) * CANVAS_WIDTH;
      const deltaY = ((pointer.clientY - startY) / bounds.height) * CANVAS_HEIGHT;
      setProject((current) => {
        const next = cloneProject(current);
        const target = findElement(next, activeScene.id, elementId);
        if (!target) return current;
        if (mode === 'move') {
          target.x = Math.round(Math.max(0, Math.min(CANVAS_WIDTH - target.width, origin.x + deltaX)));
          target.y = Math.round(Math.max(0, Math.min(CANVAS_HEIGHT - target.height, origin.y + deltaY)));
        } else {
          target.width = Math.round(Math.max(60, Math.min(CANVAS_WIDTH - target.x, origin.width + deltaX)));
          target.height = Math.round(Math.max(50, Math.min(CANVAS_HEIGHT - target.y, origin.height + deltaY)));
        }
        next.updatedAt = new Date().toISOString();
        return next;
      });
    };

    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      setNotice(mode === 'move' ? 'Element moved' : 'Element resized');
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp, { once: true });
  };

  const artboardWidth = Math.round(430 * (zoom / 64));

  return (
    <main className="studio-shell">
      <input
        accept="image/*"
        className="sr-only"
        onChange={(event) => uploadImage(event.target.files?.[0])}
        ref={imageInput}
        type="file"
      />

      <header className="studio-topbar">
        <div className="brand-lockup" aria-label="Motus Studio">
          <span className="brand-mark" aria-hidden="true"><span /><span /></span>
          <span className="brand-name">MOTUS</span>
          <span className="brand-product">STUDIO</span>
        </div>

        <Input
          aria-label="Project title"
          className="project-title-input"
          onChange={(event) =>
            commitProject((draft) => {
              draft.title = event.target.value;
            })
          }
          value={project.title}
        />

        <div className="topbar-actions">
          <span className="save-state"><Cloud />{notice}</span>
          <Button aria-label="Undo" onClick={undo} size="icon" variant="ghost"><Undo2 /></Button>
          <Button aria-label="Redo" onClick={redo} size="icon" variant="ghost"><Redo2 /></Button>
          <Button onClick={() => setPreviewKey((key) => key + 1)} variant="secondary">
            <Play data-icon="inline-start" fill="currentColor" />Preview
          </Button>
          <Button onClick={openReader}><Layers3 data-icon="inline-start" />Reader</Button>
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
            <div className="canvas-status"><Move /><span>Drag elements · resize from the corner</span></div>
            <div className="zoom-control" aria-label="Canvas zoom">
              <button aria-label="Zoom out" onClick={() => setZoom((value) => Math.max(40, value - 8))} type="button">−</button>
              <span>{zoom}%</span>
              <button aria-label="Zoom in" onClick={() => setZoom((value) => Math.min(96, value + 8))} type="button">+</button>
            </div>
          </div>

          <div className="canvas-stage" onClick={() => setSelectedElementId('')}>
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
                  <Button aria-label="Delete selected element" onClick={() => deleteElement(selectedElement.id)} size="icon-sm" variant="destructive"><Trash2 /></Button>
                </div>

                {inspectorTab === 'design' ? (
                  <div className="property-stack">
                    <label><span>Layer name</span><Input onChange={(event) => updateElement(selectedElement.id, (item) => { item.name = event.target.value; })} value={selectedElement.name} /></label>
                    {(selectedElement.type === 'text' || selectedElement.type === 'speech') ? (
                      <label><span>Text</span><Textarea onChange={(event) => updateElement(selectedElement.id, (item) => { item.text = event.target.value; })} value={selectedElement.text ?? ''} /></label>
                    ) : null}
                    {selectedElement.type !== 'image' ? (
                      <label className="color-control"><span>Color</span><input aria-label="Element color" onChange={(event) => updateElement(selectedElement.id, (item) => { item.fill = event.target.value; })} type="color" value={selectedElement.fill} /><output>{selectedElement.fill}</output></label>
                    ) : null}
                    <div className="property-grid">
                      {(['x', 'y', 'width', 'height'] as const).map((property) => (
                        <label key={property}><span>{property.toUpperCase()}</span><Input min="0" onChange={(event) => updateElement(selectedElement.id, (item) => { item[property] = Math.max(0, Number(event.target.value)); })} type="number" value={Math.round(selectedElement[property])} /></label>
                      ))}
                    </div>
                    <label className="range-control"><span>Rotation</span><output>{selectedElement.rotation}°</output><input max="180" min="-180" onChange={(event) => updateElement(selectedElement.id, (item) => { item.rotation = Number(event.target.value); })} type="range" value={selectedElement.rotation} /></label>
                    <label className="range-control"><span>Opacity</span><output>{Math.round(selectedElement.opacity * 100)}%</output><input max="100" min="0" onChange={(event) => updateElement(selectedElement.id, (item) => { item.opacity = Number(event.target.value) / 100; })} type="range" value={Math.round(selectedElement.opacity * 100)} /></label>
                    <div className="visibility-row">
                      <Button onClick={() => updateElement(selectedElement.id, (item) => { item.visible = !item.visible; })} variant="outline">{selectedElement.visible ? <Eye /> : <EyeOff />}{selectedElement.visible ? 'Visible' : 'Hidden'}</Button>
                      <Button onClick={() => updateElement(selectedElement.id, (item) => { item.locked = !item.locked; })} variant="outline">{selectedElement.locked ? <Lock /> : <Unlock />}{selectedElement.locked ? 'Locked' : 'Unlocked'}</Button>
                    </div>
                  </div>
                ) : (
                  <div className="property-stack motion-properties">
                    <div className="motion-summary"><span className="motion-number">01</span><div><small>WHEN</small><strong>Scene enters view</strong></div></div>
                    <div className="motion-summary motion-action"><span className="motion-number">02</span><div><small>MOTION + LOOKS</small><strong>Move and fade</strong></div></div>
                    <label className="range-control"><span>Move X</span><output>{selectedElement.motion.moveX}px</output><input max="400" min="-400" onChange={(event) => updateElement(selectedElement.id, (item) => { item.motion.moveX = Number(event.target.value); })} type="range" value={selectedElement.motion.moveX} /></label>
                    <label className="range-control"><span>Move Y</span><output>{selectedElement.motion.moveY}px</output><input max="400" min="-400" onChange={(event) => updateElement(selectedElement.id, (item) => { item.motion.moveY = Number(event.target.value); })} type="range" value={selectedElement.motion.moveY} /></label>
                    <label className="range-control"><span>Duration</span><output>{(selectedElement.motion.durationMs / 1000).toFixed(1)}s</output><input max="4000" min="200" onChange={(event) => updateElement(selectedElement.id, (item) => { item.motion.durationMs = Number(event.target.value); })} step="100" type="range" value={selectedElement.motion.durationMs} /></label>
                    <label className="range-control"><span>Start opacity</span><output>{Math.round(selectedElement.motion.fromOpacity * 100)}%</output><input max="100" min="0" onChange={(event) => updateElement(selectedElement.id, (item) => { item.motion.fromOpacity = Number(event.target.value) / 100; })} type="range" value={Math.round(selectedElement.motion.fromOpacity * 100)} /></label>
                    <label><span>Easing</span><NativeSelect className="w-full" onChange={(event) => updateElement(selectedElement.id, (item) => { item.motion.easing = event.target.value as Easing; })} value={selectedElement.motion.easing}><NativeSelectOption value="linear">Linear</NativeSelectOption><NativeSelectOption value="ease-out">Ease out</NativeSelectOption><NativeSelectOption value="ease-in-out">Ease in/out</NativeSelectOption></NativeSelect></label>
                    <Button className="run-motion-button" onClick={() => setPreviewKey((key) => key + 1)}><Play fill="currentColor" />Run animation</Button>
                  </div>
                )}
              </>
            )}
          </div>
        </aside>
      </div>

      <Dialog onOpenChange={setReaderOpen} open={readerOpen}>
        <DialogContent className="reader-dialog">
          <DialogHeader>
            <DialogTitle>{project.title}</DialogTitle>
            <DialogDescription>Reader preview · revision {project.publishedRevision}</DialogDescription>
          </DialogHeader>
          <div className="reader-scroll">
            {project.scenes.map((scene, index) => (
              <article className="reader-scene" key={`${scene.id}-${previewKey}`}>
                <span className="reader-scene-number">SCENE {String(index + 1).padStart(2, '0')}</span>
                <SceneView playingKey={previewKey || 1} scene={scene} />
              </article>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
