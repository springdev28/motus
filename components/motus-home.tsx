/* oxlint-disable next/no-html-link-for-pages -- Full-page transitions keep local draft recovery independent of router state. */
'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Clock3,
  Code2,
  Layers3,
  Play,
  Plus,
  Sparkles,
} from 'lucide-react';

import { readNewestMotusDraft } from '@/lib/motus-draft-storage';
import { MotusLogo } from '@/components/motus-logo';
import {
  MOTUS_LIBRARY_WORKS,
  parseStoredReadingProgress,
  type LibraryReadingProgress,
} from '@/lib/motus-library';
import type { MotusProject } from '@/lib/motus-model';

const discoverWorks = MOTUS_LIBRARY_WORKS.slice(0, 4);
const READING_PROGRESS_STORAGE_KEY = 'motus:reading-progress:v1';

type DraftState =
  | { status: 'loading'; project: null }
  | { status: 'empty'; project: null }
  | { status: 'ready'; project: MotusProject };

function formatSavedAt(value: string) {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return 'Saved draft';
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(timestamp);
}

export function MotusHome() {
  const [draft, setDraft] = useState<DraftState>({
    status: 'loading',
    project: null,
  });
  const [readingProgress, setReadingProgress] =
    useState<LibraryReadingProgress>({});

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      try {
        const restored = readNewestMotusDraft(window.localStorage);
        setDraft(
          restored
            ? { status: 'ready', project: restored.project }
            : { status: 'empty', project: null },
        );
      } catch {
        setDraft({ status: 'empty', project: null });
      }
      setReadingProgress(
        parseStoredReadingProgress(
          window.localStorage.getItem(READING_PROGRESS_STORAGE_KEY),
        ),
      );
    });
    return () => {
      active = false;
    };
  }, []);

  const projectSummary = useMemo(() => {
    if (draft.status !== 'ready') return null;
    const elements = draft.project.scenes.flatMap((scene) => scene.elements);
    return {
      blocks: elements.reduce(
        (total, element) => total + element.motion.blocks.length,
        0,
      ),
      cover:
        draft.project.scenes.find(
          (scene) => scene.id === draft.project.coverSceneId,
        )?.background ??
        draft.project.scenes[0]?.background ??
        '#28223c',
      layers: elements.length,
    };
  }, [draft]);

  const continueReading = useMemo(
    () =>
      MOTUS_LIBRARY_WORKS.flatMap((work) => {
        const progress = readingProgress[work.slug];
        return progress ? [{ work, progress }] : [];
      })
        .sort(
          (left, right) =>
            Date.parse(right.progress.updatedAt) -
            Date.parse(left.progress.updatedAt),
        )
        .slice(0, 3),
    [readingProgress],
  );

  return (
    <div className="home-shell">
      <header className="home-header">
        <a aria-label="Motus home" className="home-brand" href="/">
          <MotusLogo className="home-brand-mark" />
          <span>MOTUS</span>
        </a>
        <nav aria-label="Primary navigation" className="home-nav">
          <a aria-current="page" href="/">
            Home
          </a>
          <a href="/discover">Explore</a>
          <a href="/discover?view=following">Following</a>
        </nav>
        <a className="home-studio-link" href="/studio">
          <Plus aria-hidden="true" />
          Open Studio
        </a>
      </header>

      <main className="home-main">
        <section className="home-creator-heading" aria-labelledby="home-title">
          <div>
            <span className="home-kicker">CREATOR HOME</span>
            <h1 id="home-title">Your stories, in motion.</h1>
          </div>
          <p>
            Build the page, shape the movement, and keep the work in one visual
            space.
          </p>
        </section>

        <section className="home-workspace" aria-labelledby="continue-title">
          <header className="home-section-heading">
            <div>
              <span>YOUR WORK</span>
              <h2 id="continue-title">
                {draft.status === 'ready'
                  ? 'Continue creating'
                  : draft.status === 'empty'
                    ? 'Start creating'
                    : 'Your work'}
              </h2>
            </div>
            <a href="/studio">
              View in Studio <ArrowRight aria-hidden="true" />
            </a>
          </header>

          {draft.status === 'loading' ? (
            <output
              aria-label="Loading saved work"
              aria-busy="true"
              aria-live="polite"
              className="home-draft-card home-draft-loading"
            >
              <span aria-hidden="true" />
              <div aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
            </output>
          ) : draft.status === 'ready' && projectSummary ? (
            <article className="home-draft-card">
              <div
                aria-hidden="true"
                className="home-draft-cover"
                style={{ background: projectSummary.cover }}
              >
                <span>WORK IN PROGRESS</span>
                <Play fill="currentColor" />
              </div>
              <div className="home-draft-copy">
                <div className="home-draft-title-row">
                  <div>
                    <span>{draft.project.visibility.toUpperCase()} DRAFT</span>
                    <h3>{draft.project.title}</h3>
                    <p>{draft.project.chapterTitle}</p>
                  </div>
                  <a className="home-continue-button" href="/studio">
                    Continue editing <ArrowRight aria-hidden="true" />
                  </a>
                </div>
                <dl className="home-project-stats">
                  <div>
                    <dt>Scenes</dt>
                    <dd>{draft.project.scenes.length}</dd>
                  </div>
                  <div>
                    <dt>Layers</dt>
                    <dd>{projectSummary.layers}</dd>
                  </div>
                  <div>
                    <dt>Blocks</dt>
                    <dd>{projectSummary.blocks}</dd>
                  </div>
                  <div>
                    <dt>Last saved</dt>
                    <dd>{formatSavedAt(draft.project.updatedAt)}</dd>
                  </div>
                </dl>
              </div>
            </article>
          ) : (
            <article className="home-empty-card">
              <div aria-hidden="true" className="home-empty-icon">
                <Sparkles />
              </div>
              <div>
                <h3>Make your first motion comic</h3>
                <p>A blank canvas and the full block catalog are ready.</p>
              </div>
              <a className="home-continue-button" href="/studio?new=1">
                Start a work <ArrowRight aria-hidden="true" />
              </a>
            </article>
          )}
        </section>

        <section className="home-tools" aria-labelledby="tools-title">
          <header className="home-section-heading">
            <div>
              <span>CREATE</span>
              <h2 id="tools-title">Jump back in</h2>
            </div>
          </header>
          <div className="home-tool-grid">
            <a href="/studio">
              <Layers3 aria-hidden="true" />
              <span>
                <strong>Visual canvas</strong>
                <small>Compose scenes and layers</small>
              </span>
              <ArrowRight aria-hidden="true" />
            </a>
            <a href="/studio?catalog=motion">
              <Code2 aria-hidden="true" />
              <span>
                <strong>Block catalog</strong>
                <small>Browse editable motion presets</small>
              </span>
              <ArrowRight aria-hidden="true" />
            </a>
            <a
              href={
                draft.status === 'ready' ? '/studio?reader=draft' : '/studio'
              }
            >
              <BookOpen aria-hidden="true" />
              <span>
                <strong>
                  {draft.status === 'ready' ? 'Draft reader' : 'Sample project'}
                </strong>
                <small>
                  {draft.status === 'ready'
                    ? 'Read the current sequence'
                    : 'Explore a complete scene set'}
                </small>
              </span>
              <ArrowRight aria-hidden="true" />
            </a>
          </div>
        </section>

        {continueReading.length > 0 ? (
          <section className="home-discover" aria-labelledby="reading-title">
            <header className="home-section-heading">
              <div>
                <span>LIBRARY</span>
                <h2 id="reading-title">Continue reading</h2>
              </div>
              <a href="/discover?view=following">
                Open Library <ArrowRight aria-hidden="true" />
              </a>
            </header>
            <div className="home-discover-grid home-reading-grid">
              {continueReading.map(({ work, progress }) => {
                const completedScenes = Math.min(progress.sceneIndex + 1, 3);
                return (
                  <a href={`/read/${work.slug}`} key={work.slug}>
                    <span
                      aria-hidden="true"
                      className="home-work-cover"
                      style={{ background: work.palette }}
                    >
                      <span>{completedScenes} / 3</span>
                      <BookOpen />
                    </span>
                    <span className="home-work-copy">
                      <strong>{work.title}</strong>
                      <small>{work.creator}</small>
                      <em>Resume at scene {completedScenes}</em>
                    </span>
                    <progress
                      aria-label={`${Math.round((completedScenes / 3) * 100)} percent read`}
                      className="home-reading-progress"
                      max={100}
                      value={Math.round((completedScenes / 3) * 100)}
                    >
                      {Math.round((completedScenes / 3) * 100)}%
                    </progress>
                  </a>
                );
              })}
            </div>
          </section>
        ) : null}

        <section
          className="home-discover"
          id="discover"
          aria-labelledby="discover-title"
        >
          <header className="home-section-heading">
            <div>
              <span>DISCOVER</span>
              <h2 id="discover-title">Motion stories</h2>
            </div>
            <a href="/discover">
              Open catalog <ArrowRight aria-hidden="true" />
            </a>
          </header>
          <div className="home-discover-grid">
            {discoverWorks.map((work, index) => (
              <a href={`/read/${work.slug}`} key={work.title}>
                <span
                  aria-hidden="true"
                  className="home-work-cover"
                  style={{ background: work.palette }}
                >
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <Clock3 />
                </span>
                <span className="home-work-copy">
                  <strong>{work.title}</strong>
                  <small>{work.creator}</small>
                  <em>
                    {work.genre} · {work.status}
                  </em>
                </span>
              </a>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
