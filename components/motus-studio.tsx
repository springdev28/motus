'use client';

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import {
  Box,
  ChevronDown,
  CirclePlay,
  Cloud,
  Eye,
  Image as ImageIcon,
  Layers3,
  Lock,
  MessageSquareText,
  MousePointer2,
  Play,
  Plus,
  Redo2,
  RotateCw,
  Save,
  Shapes,
  Sparkles,
  Type,
  Undo2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  cloneProject,
  compileMotion,
  createDefaultProject,
  restoreProject,
  type FadeBlock,
  type MotusProject,
  type MoveBlock,
} from '@/lib/motus-model';

const STORAGE_KEY = 'motus.project.v1';

const layers = [
  { id: 'speech', label: 'Speech bubble', icon: MessageSquareText },
  { id: 'orb', label: 'Signal orb', icon: Box },
  { id: 'title', label: 'Chapter title', icon: Type },
  { id: 'backdrop', label: 'Night backdrop', icon: ImageIcon },
];

const tools = [
  { label: 'Select', icon: MousePointer2 },
  { label: 'Assets', icon: ImageIcon },
  { label: 'Text', icon: Type },
  { label: 'Shapes', icon: Shapes },
  { label: 'Layers', icon: Layers3 },
  { label: 'Motion', icon: Sparkles },
];

export function MotusStudio() {
  const [project, setProject] = useState<MotusProject>(createDefaultProject);
  const [selectedSceneId, setSelectedSceneId] = useState('scene-1');
  const [selectedLayer, setSelectedLayer] = useState('orb');
  const [playing, setPlaying] = useState(false);
  const [activeTool, setActiveTool] = useState('Select');
  const [inspectorTab, setInspectorTab] = useState<'design' | 'motion'>('motion');
  const [zoom, setZoom] = useState(68);
  const [hydrated, setHydrated] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const undoStack = useRef<MotusProject[]>([]);
  const redoStack = useRef<MotusProject[]>([]);

  const activeScene =
    project.scenes.find((scene) => scene.id === selectedSceneId) ?? project.scenes[0];
  const sceneIndex = Math.max(
    project.scenes.findIndex((scene) => scene.id === activeScene.id),
    0,
  );
  const compiledMotion = useMemo(
    () => compileMotion(activeScene.blocks),
    [activeScene.blocks],
  );
  const moveBlock = activeScene.blocks.find(
    (block): block is MoveBlock => block.kind === 'move',
  );
  const fadeBlock = activeScene.blocks.find(
    (block): block is FadeBlock => block.kind === 'fade',
  );
  const selectedLayerName =
    layers.find((layer) => layer.id === selectedLayer)?.label ?? 'Accent shape';

  useEffect(() => {
    const saved = restoreProject(window.localStorage.getItem(STORAGE_KEY));
    if (saved) {
      setProject(saved);
      setSelectedSceneId(saved.scenes[0].id);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const timer = window.setTimeout(() => {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
    }, 180);
    return () => window.clearTimeout(timer);
  }, [hydrated, project]);

  const commitProject = (mutate: (draft: MotusProject) => void) => {
    setProject((current) => {
      undoStack.current = [...undoStack.current, cloneProject(current)].slice(-30);
      redoStack.current = [];
      const next = cloneProject(current);
      mutate(next);
      next.updatedAt = new Date().toISOString();
      return next;
    });
  };

  const updateActiveScene = (mutate: (scene: typeof activeScene) => void) => {
    commitProject((draft) => {
      const scene = draft.scenes.find((item) => item.id === activeScene.id);
      if (scene) mutate(scene);
    });
  };

  const undo = () => {
    const previous = undoStack.current.pop();
    if (!previous) return;
    setProject((current) => {
      redoStack.current.push(cloneProject(current));
      return previous;
    });
  };

  const redo = () => {
    const next = redoStack.current.pop();
    if (!next) return;
    setProject((current) => {
      undoStack.current.push(cloneProject(current));
      return next;
    });
  };

  const togglePreview = () => {
    setPlaying(false);
    window.requestAnimationFrame(() => setPlaying(true));
  };

  const addScene = () => {
    const id = `scene-${Date.now()}`;
    commitProject((draft) => {
      const copy = cloneProject({ ...draft, scenes: [activeScene] }).scenes[0];
      copy.id = id;
      copy.kicker = `SCENE ${String(draft.scenes.length + 1).padStart(2, '0')} — UNTITLED`;
      copy.title = 'A new moment begins here.';
      copy.speech = 'Add your dialogue…';
      copy.accentCount = 0;
      copy.blocks = copy.blocks.map((block) => ({ ...block, id: `${id}-${block.kind}` }));
      draft.scenes.push(copy);
    });
    setSelectedSceneId(id);
    setSelectedLayer('orb');
    setNotice('New scene added');
  };

  const addAccent = () => {
    updateActiveScene((scene) => {
      scene.accentCount += 1;
    });
    setSelectedLayer(`accent-${activeScene.accentCount + 1}`);
    setNotice('Accent layer added');
  };

  const publish = () => {
    commitProject((draft) => {
      draft.publishedRevision += 1;
    });
    setNotice(`Published revision ${project.publishedRevision + 1}`);
  };

  const selectTool = (label: string) => {
    setActiveTool(label);
    if (label === 'Motion') setInspectorTab('motion');
    if (label === 'Text') {
      setSelectedLayer('speech');
      setInspectorTab('design');
    }
    if (label === 'Assets') setSelectedLayer('backdrop');
    if (label === 'Layers') setSelectedLayer('orb');
    if (label === 'Shapes') addAccent();
  };

  const sceneStyle = {
    '--scene-from': activeScene.palette.from,
    '--scene-to': activeScene.palette.to,
    '--scene-glow': activeScene.palette.glow,
    '--motion-distance': `${compiledMotion.distancePx}px`,
    '--motion-duration': `${compiledMotion.durationMs}ms`,
    '--motion-from-opacity': compiledMotion.fromOpacity,
    '--motion-to-opacity': compiledMotion.toOpacity,
    width: `${Math.round(390 * (zoom / 68))}px`,
  } as CSSProperties;

  return (
    <main className="studio-shell">
      <header className="studio-topbar">
        <div className="brand-lockup" aria-label="Motus Studio">
          <span className="brand-mark" aria-hidden="true">
            <span />
            <span />
          </span>
          <span className="brand-name">MOTUS</span>
          <span className="brand-product">STUDIO</span>
        </div>

        <button className="project-title" type="button">
          <span>{project.title}</span>
          <ChevronDown aria-hidden="true" />
        </button>

        <div className="topbar-actions">
          <span className="save-state">
            <Cloud aria-hidden="true" />
            {hydrated ? 'Saved locally' : 'Opening draft…'}
          </span>
          <Button aria-label="Undo" disabled={undoStack.current.length === 0} onClick={undo} size="icon" variant="ghost">
            <Undo2 />
          </Button>
          <Button aria-label="Redo" disabled={redoStack.current.length === 0} onClick={redo} size="icon" variant="ghost">
            <Redo2 />
          </Button>
          <Button className="preview-button" onClick={togglePreview}>
            <Play data-icon="inline-start" fill="currentColor" />
            Preview
          </Button>
          <Button className="publish-button" onClick={publish} variant="outline">
            {project.publishedRevision > 0
              ? `Published r${project.publishedRevision}`
              : 'Publish'}
          </Button>
          <span className="avatar" aria-label="Creator profile">
            BY
          </span>
        </div>
      </header>

      <div className="studio-grid">
        <aside className="tool-rail" aria-label="Studio tools">
          {tools.map(({ label, icon: Icon }) => (
            <button
              className="tool-button"
              data-active={activeTool === label || undefined}
              key={label}
              onClick={() => selectTool(label)}
              type="button"
            >
              <Icon aria-hidden="true" />
              <span>{label}</span>
            </button>
          ))}
          <button className="tool-button add-tool" onClick={addAccent} type="button">
            <Plus aria-hidden="true" />
            <span>Add</span>
          </button>
        </aside>

        <aside className="layers-panel" aria-label="Layers">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Chapter 01</span>
              <h1>Scene layers</h1>
            </div>
            <Button aria-label="Add layer" onClick={addAccent} size="icon-sm" variant="outline">
              <Plus />
            </Button>
          </div>

          <div className="layer-list">
            {layers.map(({ id, label, icon: Icon }, index) => (
              <button
                className="layer-row"
                data-selected={selectedLayer === id || undefined}
                key={id}
                onClick={() => setSelectedLayer(id)}
                type="button"
              >
                <span className="drag-handle" aria-hidden="true">
                  ⋮⋮
                </span>
                <span className="layer-icon">
                  <Icon aria-hidden="true" />
                </span>
                <span className="layer-copy">
                  <strong>{label}</strong>
                  <small>{index === 1 ? 'Animated · 2 blocks' : 'Static'}</small>
                </span>
                {index === 1 ? <Eye aria-label="Visible" /> : <Lock aria-label="Locked" />}
              </button>
            ))}
            {Array.from({ length: activeScene.accentCount }, (_, index) => (
              <button
                className="layer-row"
                data-selected={selectedLayer === `accent-${index + 1}` || undefined}
                key={`accent-${index + 1}`}
                onClick={() => setSelectedLayer(`accent-${index + 1}`)}
                type="button"
              >
                <span className="drag-handle" aria-hidden="true">⋮⋮</span>
                <span className="layer-icon"><Shapes aria-hidden="true" /></span>
                <span className="layer-copy">
                  <strong>Accent shape {index + 1}</strong>
                  <small>Static</small>
                </span>
                <Eye aria-label="Visible" />
              </button>
            ))}
          </div>

          <div className="panel-note">
            <Sparkles aria-hidden="true" />
            <p>
              <strong>Motion stays editable.</strong>
              Every effect is stored as a block, never flattened into video.
            </p>
          </div>
        </aside>

        <section className="workspace" aria-label="Scene canvas">
          <div className="workspace-toolbar">
            <div className="canvas-status">
              <span>SCENE {String(sceneIndex + 1).padStart(2, '0')}</span>
              <i />
              <span>1080 × 1440</span>
            </div>
            <div className="zoom-control" aria-label="Canvas zoom">
              <button aria-label="Zoom out" onClick={() => setZoom((value) => Math.max(44, value - 8))} type="button">−</button>
              <span>{zoom}%</span>
              <button aria-label="Zoom in" onClick={() => setZoom((value) => Math.min(100, value + 8))} type="button">+</button>
            </div>
          </div>

          <div className="canvas-stage">
            <div className="comic-canvas" style={sceneStyle}>
              <div className="canvas-grain" />
              <div className="scene-kicker">{activeScene.kicker}</div>
              <div className="scene-title">{activeScene.title}</div>

              <div className="horizon-line" />
              <div className="signal-trail" />
              {Array.from({ length: activeScene.accentCount }, (_, index) => (
                <button
                  aria-label={`Accent shape ${index + 1}`}
                  className="accent-shape"
                  data-selected={selectedLayer === `accent-${index + 1}` || undefined}
                  key={`accent-canvas-${index + 1}`}
                  onClick={() => setSelectedLayer(`accent-${index + 1}`)}
                  style={{
                    left: `${18 + index * 10}%`,
                    top: `${55 + (index % 2) * 8}%`,
                    transform: `rotate(${index * 17 - 12}deg)`,
                  }}
                  type="button"
                />
              ))}
              <button
                aria-label="Signal orb element"
                className={`signal-orb ${playing ? 'is-playing' : ''}`}
                data-selected={selectedLayer === 'orb' || undefined}
                onClick={() => setSelectedLayer('orb')}
                onAnimationEnd={() => setPlaying(false)}
                type="button"
              >
                <span className="selection-handle handle-nw" />
                <span className="selection-handle handle-ne" />
                <span className="selection-handle handle-sw" />
                <span className="selection-handle handle-se" />
              </button>

              <button
                className="speech-bubble"
                data-selected={selectedLayer === 'speech' || undefined}
                onClick={() => setSelectedLayer('speech')}
                type="button"
              >
                <span>{activeScene.speech}</span>
              </button>

              <span className="page-number">
                {String(sceneIndex + 1).padStart(2, '0')} / {String(project.scenes.length).padStart(2, '0')}
              </span>
            </div>
          </div>

          <footer className="scene-strip">
            <div className="scene-strip-title">
              <span>Scenes</span>
              <strong>{sceneIndex + 1} of {project.scenes.length}</strong>
            </div>
            {project.scenes.map((scene, index) => (
              <button
                aria-label={`Open scene ${index + 1}`}
                className="scene-thumbnail"
                data-active={scene.id === activeScene.id || undefined}
                key={scene.id}
                onClick={() => {
                  setSelectedSceneId(scene.id);
                  setSelectedLayer('orb');
                }}
                style={{ background: `linear-gradient(145deg, ${scene.palette.from}, ${scene.palette.to})` }}
                type="button"
              >
                <span>{String(index + 1).padStart(2, '0')}</span>
              </button>
            ))}
            <Button className="add-scene" onClick={addScene} variant="outline">
              <Plus data-icon="inline-start" />
              Scene
            </Button>
          </footer>
        </section>

        <aside className="inspector-panel" aria-label="Element inspector">
          <div className="inspector-tabs" role="tablist" aria-label="Inspector sections">
            <button
              aria-selected={inspectorTab === 'design'}
              onClick={() => setInspectorTab('design')}
              role="tab"
              type="button"
            >
              Design
            </button>
            <button
              aria-selected={inspectorTab === 'motion'}
              onClick={() => setInspectorTab('motion')}
              role="tab"
              type="button"
            >
              Motion <span>2</span>
            </button>
          </div>

          <div className="inspector-content">
            <div className="selected-element-card">
              <span className="selected-swatch" />
              <div>
                <small>Selected element</small>
                <strong>{selectedLayerName}</strong>
              </div>
              <Button aria-label="Preview selected animation" onClick={togglePreview} size="icon-sm" variant="outline">
                <CirclePlay />
              </Button>
            </div>

            {inspectorTab === 'motion' ? (
              <>
                <div className="motion-stack">
                  <div className="motion-connector" />
                  <article className="motion-block event-block">
                    <span className="block-index">01</span>
                    <div>
                      <small>WHEN</small>
                      <strong>Scene enters view</strong>
                    </div>
                    <ChevronDown aria-hidden="true" />
                  </article>
                  <article className="motion-block move-block">
                    <span className="block-index">02</span>
                    <div>
                      <small>MOTION</small>
                      <strong>Move right by {moveBlock?.deltaX ?? 0} px</strong>
                      <p>{((moveBlock?.durationMs ?? 0) / 1000).toFixed(1)} sec · Ease out</p>
                    </div>
                    <ChevronDown aria-hidden="true" />
                  </article>
                  <article className="motion-block looks-block">
                    <span className="block-index">03</span>
                    <div>
                      <small>LOOKS</small>
                      <strong>
                        Fade from {Math.round((fadeBlock?.from ?? 1) * 100)}% to {Math.round((fadeBlock?.to ?? 1) * 100)}%
                      </strong>
                      <p>{((fadeBlock?.durationMs ?? 0) / 1000).toFixed(1)} sec · With previous</p>
                    </div>
                    <ChevronDown aria-hidden="true" />
                  </article>
                  <button className="add-motion" onClick={togglePreview} type="button">
                    <CirclePlay aria-hidden="true" />
                    Run block stack
                  </button>
                </div>

                <div className="quick-properties">
                  <div className="section-label">
                    <span>Quick properties</span>
                    <RotateCw aria-hidden="true" />
                  </div>
                  <label>
                    <span>Distance</span>
                    <output>{moveBlock?.deltaX ?? 0} px</output>
                    <input
                      aria-label="Move distance"
                      max="180"
                      min="0"
                      onChange={(event) =>
                        updateActiveScene((scene) => {
                          const block = scene.blocks.find(
                            (item): item is MoveBlock => item.kind === 'move',
                          );
                          if (block) block.deltaX = Number(event.target.value);
                        })
                      }
                      type="range"
                      value={moveBlock?.deltaX ?? 0}
                    />
                  </label>
                  <label>
                    <span>Duration</span>
                    <output>{((moveBlock?.durationMs ?? 0) / 1000).toFixed(1)} s</output>
                    <input
                      aria-label="Animation duration"
                      max="3000"
                      min="200"
                      onChange={(event) =>
                        updateActiveScene((scene) => {
                          const block = scene.blocks.find(
                            (item): item is MoveBlock => item.kind === 'move',
                          );
                          if (block) block.durationMs = Number(event.target.value);
                        })
                      }
                      step="100"
                      type="range"
                      value={moveBlock?.durationMs ?? 1200}
                    />
                  </label>
                  <label>
                    <span>Start opacity</span>
                    <output>{Math.round((fadeBlock?.from ?? 1) * 100)}%</output>
                    <input
                      aria-label="Starting opacity"
                      max="100"
                      min="0"
                      onChange={(event) =>
                        updateActiveScene((scene) => {
                          const block = scene.blocks.find(
                            (item): item is FadeBlock => item.kind === 'fade',
                          );
                          if (block) block.from = Number(event.target.value) / 100;
                        })
                      }
                      type="range"
                      value={Math.round((fadeBlock?.from ?? 1) * 100)}
                    />
                  </label>
                </div>
              </>
            ) : (
              <div className="design-properties">
                <label>
                  <span>Scene label</span>
                  <Input
                    onChange={(event) =>
                      updateActiveScene((scene) => {
                        scene.kicker = event.target.value;
                      })
                    }
                    value={activeScene.kicker}
                  />
                </label>
                <label>
                  <span>Scene title</span>
                  <Textarea
                    onChange={(event) =>
                      updateActiveScene((scene) => {
                        scene.title = event.target.value;
                      })
                    }
                    value={activeScene.title}
                  />
                </label>
                <label>
                  <span>Speech bubble</span>
                  <Textarea
                    onChange={(event) =>
                      updateActiveScene((scene) => {
                        scene.speech = event.target.value;
                      })
                    }
                    value={activeScene.speech}
                  />
                </label>
                <p className="design-hint">Text updates on the canvas and is stored in the local draft.</p>
              </div>
            )}
          </div>

          <footer className="inspector-footer">
            <Save aria-hidden="true" />
            Changes save automatically
          </footer>
        </aside>
      </div>
      {notice ? (
        <button className="status-toast" onClick={() => setNotice(null)} type="button">
          {notice}
        </button>
      ) : null}
    </main>
  );
}
