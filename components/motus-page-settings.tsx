'use client';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  findProjectScene,
  type MotusProject,
  type MotusProjectFormat,
  type ReaderDirection,
  type ReaderTransitionStyle,
} from '@/lib/motus-model';
export function MotusPageSettings({
  open,
  onOpenChange,
  project,
  sceneId,
  onCommit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: MotusProject;
  sceneId: string;
  onCommit: (mutate: (draft: MotusProject) => void) => void;
}) {
  const scene = findProjectScene(project, sceneId)?.scene;
  const [colorError, setColorError] = useState('');
  if (!scene) return null;
  const setBackground = (value: string) => {
    if (!/^#[\da-f]{6}$/i.test(value)) {
      setColorError('Enter a six-digit hex color, such as #000000.');
      return;
    }
    setColorError('');
    onCommit((draft) => {
      const target = findProjectScene(draft, sceneId)?.scene;
      if (target) target.background = value;
    });
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="page-settings-dialog">
        <DialogHeader>
          <DialogTitle>Page design & display</DialogTitle>
          <DialogDescription>
            Design your own pages and choose how readers move through them.
            Saved with your work and included in the next reader edition.
          </DialogDescription>
        </DialogHeader>
        <div className="page-settings-sections">
          <section>
            <h3>Page background</h3>
            <p>
              Applies to “{scene.name}”. Your layers stay in place. No textures
              or decorations are added.
            </p>
            <div className="page-color-controls">
              <label>
                Pick any color
                <input
                  aria-label="Page background color"
                  type="color"
                  value={
                    /^#[\da-f]{6}$/i.test(scene.background)
                      ? scene.background
                      : '#000000'
                  }
                  onChange={(e) => setBackground(e.target.value)}
                />
              </label>
              <label>
                Hex color
                <input
                  key={scene.background}
                  aria-label="Page background hex"
                  defaultValue={
                    /^#[\da-f]{6}$/i.test(scene.background)
                      ? scene.background
                      : ''
                  }
                  placeholder="#000000"
                  maxLength={7}
                  onBlur={(e) => setBackground(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') setBackground(e.currentTarget.value);
                  }}
                />
              </label>
              <Button
                variant="outline"
                onClick={() => setBackground('#000000')}
              >
                Black
              </Button>
              <Button
                variant="outline"
                onClick={() => setBackground('#ffffff')}
              >
                White
              </Button>
            </div>
            <output aria-live="polite">{colorError}</output>
          </section>
          <section>
            <h3>Default reading display</h3>
            <label>
              Page display
              <select
                aria-label="Page display"
                value={project.format}
                onChange={(e) =>
                  onCommit((draft) => {
                    draft.format = e.target.value as MotusProjectFormat;
                  })
                }
              >
                <option value="vertical-scroll">Vertical scrolling</option>
                <option value="page">Horizontal · one page at a time</option>
                <option value="spread">Two-page spread</option>
              </select>
            </label>
            <p>
              Readers can change the display. Each scene is one page; a spread
              pairs consecutive pages.
            </p>
          </section>
          <section>
            <h3>Page transitions</h3>
            <div className="page-settings-grid">
              <label>
                Animation
                <select
                  aria-label="Page transition animation"
                  value={project.readerPresentation.transition}
                  onChange={(e) =>
                    onCommit((draft) => {
                      draft.readerPresentation.transition = e.target
                        .value as ReaderTransitionStyle;
                    })
                  }
                >
                  <option value="cut">None · instant</option>
                  <option value="slide">Slide</option>
                  <option value="book">Page turn</option>
                </select>
              </label>
              <label>
                Reading direction
                <select
                  aria-label="Page reading direction"
                  value={project.readerPresentation.direction}
                  onChange={(e) =>
                    onCommit((draft) => {
                      draft.readerPresentation.direction = e.target
                        .value as ReaderDirection;
                    })
                  }
                >
                  <option value="ltr">Left to right</option>
                  <option value="rtl">Right to left</option>
                </select>
              </label>
              <label>
                Duration (milliseconds)
                <input
                  aria-label="Page transition duration"
                  type="number"
                  min={100}
                  max={2000}
                  step={50}
                  value={project.readerPresentation.durationMs}
                  onChange={(e) => {
                    const value = e.target.valueAsNumber;
                    if (Number.isFinite(value))
                      onCommit((draft) => {
                        draft.readerPresentation.durationMs = Math.min(
                          2000,
                          Math.max(100, value),
                        );
                      });
                  }}
                />
              </label>
            </div>
            <p>
              Slides follow the reading direction. Spreads turn a leaf around
              the center spine; vertical scrolling reveals each page from the
              top. Reduced-motion preferences are respected.
            </p>
          </section>
        </div>
        <Button onClick={() => onOpenChange(false)}>Done</Button>
      </DialogContent>
    </Dialog>
  );
}
