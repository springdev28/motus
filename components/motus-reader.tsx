/* oxlint-disable next/no-html-link-for-pages -- Reader navigation uses stable public paths. */
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  FileImage,
  Heart,
  Play,
  RotateCcw,
} from 'lucide-react';

import { MotusLogo } from '@/components/motus-logo';
import { ReaderScene } from '@/components/motus-studio';
import { Button } from '@/components/ui/button';
import {
  MOTUS_LIBRARY_WORKS,
  createCatalogPreviewProject,
  getLibraryWork,
  parseStoredReadingProgress,
  parseStoredSlugSet,
} from '@/lib/motus-library';

const FOLLOWED_WORKS_STORAGE_KEY = 'motus:followed-works:v1';
const READING_PROGRESS_STORAGE_KEY = 'motus:reading-progress:v1';

type ReaderMode = 'scroll' | 'page';

export function MotusReader({ slug }: { slug: string }) {
  const work = getLibraryWork(slug);
  const workIndex = MOTUS_LIBRARY_WORKS.findIndex(
    (candidate) => candidate.slug === slug,
  );
  const project = useMemo(
    () =>
      work ? createCatalogPreviewProject(work, Math.max(workIndex, 0)) : null,
    [work, workIndex],
  );
  const requiresRatingGate =
    work?.rating === 'Mature' || work?.rating === 'Adults only';
  const [mode, setMode] = useState<ReaderMode>(() =>
    work?.format === 'Page' || work?.format === 'Spread' ? 'page' : 'scroll',
  );
  const [pageIndex, setPageIndex] = useState(0);
  const [playSession, setPlaySession] = useState(1);
  const [followed, setFollowed] = useState(false);
  const [matureConfirmed, setMatureConfirmed] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [resumeTarget, setResumeTarget] = useState<number | null>(null);

  useEffect(() => {
    if (!project || !work) return;
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      const followedWorks = parseStoredSlugSet(
        window.localStorage.getItem(FOLLOWED_WORKS_STORAGE_KEY),
      );
      const savedProgress = parseStoredReadingProgress(
        window.localStorage.getItem(READING_PROGRESS_STORAGE_KEY),
      )[work.slug];
      const resumedIndex = Math.min(
        Math.max(Math.floor(savedProgress?.sceneIndex ?? 0), 0),
        project.scenes.length - 1,
      );
      setFollowed(followedWorks.has(work.slug));
      setPageIndex(resumedIndex);
      setResumeTarget(resumedIndex > 0 ? resumedIndex : null);
      setHydrated(true);
    });
    return () => {
      active = false;
    };
  }, [project, work]);

  useEffect(() => {
    if (
      resumeTarget === null ||
      mode !== 'scroll' ||
      (requiresRatingGate && !matureConfirmed)
    )
      return;
    const frame = window.requestAnimationFrame(() => {
      document
        .getElementById(`published-reader-scene-${resumeTarget + 1}`)
        ?.scrollIntoView({ block: 'start' });
      setResumeTarget(null);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [matureConfirmed, mode, requiresRatingGate, resumeTarget]);

  const recordProgress = useCallback(
    (nextSceneIndex: number) => {
      if (!work || !project || !hydrated) return;
      const sceneIndex = Math.min(
        Math.max(Math.floor(nextSceneIndex), 0),
        project.scenes.length - 1,
      );
      const progress = parseStoredReadingProgress(
        window.localStorage.getItem(READING_PROGRESS_STORAGE_KEY),
      );
      progress[work.slug] = {
        sceneIndex,
        updatedAt: new Date().toISOString(),
      };
      try {
        window.localStorage.setItem(
          READING_PROGRESS_STORAGE_KEY,
          JSON.stringify(progress),
        );
      } catch {
        // Reading remains available when browser storage is unavailable.
      }
    },
    [hydrated, project, work],
  );

  const selectPage = (nextPageIndex: number) => {
    if (!project) return;
    const resolved = Math.min(
      Math.max(nextPageIndex, 0),
      project.scenes.length - 1,
    );
    setPageIndex(resolved);
    setPlaySession((session) => session + 1);
    recordProgress(resolved);
  };

  const toggleFollow = () => {
    if (!work) return;
    const followedWorks = parseStoredSlugSet(
      window.localStorage.getItem(FOLLOWED_WORKS_STORAGE_KEY),
    );
    if (followedWorks.has(work.slug)) followedWorks.delete(work.slug);
    else followedWorks.add(work.slug);
    try {
      window.localStorage.setItem(
        FOLLOWED_WORKS_STORAGE_KEY,
        JSON.stringify([...followedWorks]),
      );
    } catch {
      return;
    }
    setFollowed(followedWorks.has(work.slug));
  };

  if (!work || !project) {
    return (
      <main className="published-reader-missing">
        <MotusLogo />
        <span>WORK NOT FOUND</span>
        <h1>This story is not in the Motus library.</h1>
        <a href="/discover">Return to Explore</a>
      </main>
    );
  }

  const progressPercent =
    ((pageIndex + 1) / Math.max(project.scenes.length, 1)) * 100;

  return (
    <div className="published-reader-shell">
      <header className="published-reader-header">
        <a className="published-reader-back" href="/discover">
          <ArrowLeft aria-hidden="true" />
          Explore
        </a>
        <a aria-label="Motus home" className="published-reader-brand" href="/">
          <MotusLogo />
          <span>MOTUS</span>
        </a>
        <Button
          aria-pressed={followed}
          className="published-reader-follow"
          onClick={toggleFollow}
          size="sm"
          variant={followed ? 'secondary' : 'default'}
        >
          {followed ? <Check /> : <Heart />}
          {followed ? 'Following' : 'Follow work'}
        </Button>
      </header>

      <main className="published-reader-main">
        <section className="published-reader-workhead">
          <div
            aria-hidden="true"
            className="published-reader-cover"
            style={{ background: work.palette }}
          >
            <span>{work.genre}</span>
            <strong>{work.title.slice(0, 1)}</strong>
            <i style={{ background: work.accent }} />
          </div>
          <div className="published-reader-copy">
            <span className="published-reader-eyebrow">
              {work.format} · {work.status}
            </span>
            <h1>{work.title}</h1>
            <a href={`/discover?creator=${encodeURIComponent(work.creator)}`}>
              {work.creator} <small>{work.creatorHandle}</small>
            </a>
            <p>{work.description}</p>
            <div className="published-reader-tags" aria-label="Work tags">
              {work.tags.map((tag) => (
                <a href={`/discover?q=${encodeURIComponent(tag)}`} key={tag}>
                  #{tag}
                </a>
              ))}
            </div>
          </div>
          <dl className="published-reader-facts">
            <div>
              <dt>Chapter</dt>
              <dd>1 / {work.chapterCount}</dd>
            </div>
            <div>
              <dt>Language</dt>
              <dd>{work.language}</dd>
            </div>
            <div>
              <dt>Rating</dt>
              <dd>{work.rating}</dd>
            </div>
          </dl>
        </section>

        {requiresRatingGate && !matureConfirmed ? (
          <section
            className="published-reader-gate"
            aria-labelledby="rating-title"
          >
            <BookOpen aria-hidden="true" />
            <span>
              {work.rating === 'Adults only'
                ? 'ADULTS ONLY · 18+'
                : 'MATURE CONTENT'}
            </span>
            <h2 id="rating-title">Continue to this work?</h2>
            <p>
              {work.rating === 'Adults only'
                ? 'The creator restricted this work to adults. Continue only if you are 18 or older.'
                : 'The creator marked this work as Mature. Continue only when this rating is appropriate for you.'}
            </p>
            <div>
              <a href="/discover">Go back</a>
              <Button onClick={() => setMatureConfirmed(true)}>
                {work.rating === 'Adults only'
                  ? 'I am 18 or older — continue'
                  : 'Continue to reader'}
              </Button>
            </div>
          </section>
        ) : (
          <section
            className="published-reader-stage"
            aria-labelledby="chapter-title"
          >
            <header className="published-reader-toolbar">
              <div>
                <span>CHAPTER 01</span>
                <h2 id="chapter-title">{project.chapterTitle}</h2>
              </div>
              <div className="published-reader-controls">
                <fieldset>
                  <legend className="sr-only">Reader layout</legend>
                  <button
                    aria-pressed={mode === 'scroll'}
                    onClick={() => setMode('scroll')}
                    type="button"
                  >
                    <ArrowDown aria-hidden="true" />
                    Vertical
                  </button>
                  <button
                    aria-pressed={mode === 'page'}
                    onClick={() => setMode('page')}
                    type="button"
                  >
                    <FileImage aria-hidden="true" />
                    Page
                  </button>
                </fieldset>
                <Button
                  aria-label="Replay chapter motion"
                  onClick={() => setPlaySession((session) => session + 1)}
                  size="sm"
                  variant="secondary"
                >
                  <RotateCcw />
                  Replay
                </Button>
              </div>
            </header>

            <div className="published-reader-progress" aria-hidden="true">
              <span style={{ width: `${progressPercent}%` }} />
            </div>

            {mode === 'scroll' ? (
              <div className="published-reader-scroll">
                {project.scenes.map((scene, index) => (
                  <ReaderScene
                    anchorId={`published-reader-scene-${index + 1}`}
                    index={index}
                    key={`${scene.id}-${playSession}`}
                    onEnter={(enteredIndex) => {
                      setPageIndex(enteredIndex);
                      recordProgress(enteredIndex);
                    }}
                    scene={scene}
                    sessionKey={playSession}
                  />
                ))}
              </div>
            ) : (
              <div className="published-reader-paged">
                <ReaderScene
                  index={pageIndex}
                  key={`${project.scenes[pageIndex].id}-${playSession}`}
                  onEnter={recordProgress}
                  scene={project.scenes[pageIndex]}
                  sessionKey={playSession}
                />
                <div className="published-reader-page-controls">
                  <Button
                    disabled={pageIndex === 0}
                    onClick={() => selectPage(pageIndex - 1)}
                    variant="secondary"
                  >
                    <ChevronLeft />
                    Previous
                  </Button>
                  <span>
                    Page {pageIndex + 1} of {project.scenes.length}
                  </span>
                  <Button
                    disabled={pageIndex === project.scenes.length - 1}
                    onClick={() => selectPage(pageIndex + 1)}
                  >
                    Next
                    <ChevronRight />
                  </Button>
                </div>
              </div>
            )}

            <footer className="published-reader-footer">
              <div>
                <Play aria-hidden="true" />
                <span>
                  Motion remains structured and replays from the creator’s
                  editable blocks.
                </span>
              </div>
              <a href="/studio">Create with Motus</a>
            </footer>
          </section>
        )}
      </main>
    </div>
  );
}
