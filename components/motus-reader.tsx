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
  ShieldAlert,
} from 'lucide-react';

import { MotusLogo } from '@/components/motus-logo';
import { ReaderScene } from '@/components/motus-studio';
import { Button } from '@/components/ui/button';
import {
  LIBRARY_CONTENT_WARNING_LABELS,
  MOTUS_LIBRARY_WORKS,
  createCatalogPreviewProject,
  getCatalogPreviewLayout,
  getLibraryCreatorById,
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
  const creator = work ? getLibraryCreatorById(work.creatorId) : null;
  const previewLayout = work ? getCatalogPreviewLayout(work.format) : null;
  const requiresRatingGate =
    work?.rating === 'Mature' || work?.rating === 'Adults only';
  const [mode, setMode] = useState<ReaderMode>(() =>
    project?.format === 'page' ? 'page' : 'scroll',
  );
  const [activeChapterId, setActiveChapterId] = useState(
    () => project?.chapters[0]?.id ?? '',
  );
  const [pageIndex, setPageIndex] = useState(0);
  const [playSession, setPlaySession] = useState(1);
  const [followed, setFollowed] = useState(false);
  const [followStorageAvailable, setFollowStorageAvailable] = useState(true);
  const [matureConfirmed, setMatureConfirmed] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [resumeTarget, setResumeTarget] = useState<{
    chapterId: string;
    sceneIndex: number;
  } | null>(null);

  const activeChapter = useMemo(
    () =>
      project?.chapters.find((chapter) => chapter.id === activeChapterId) ??
      project?.chapters[0] ??
      null,
    [activeChapterId, project],
  );
  const chapterIndex =
    project && activeChapter
      ? Math.max(
          0,
          project.chapters.findIndex(
            (chapter) => chapter.id === activeChapter.id,
          ),
        )
      : 0;

  useEffect(() => {
    if (!project || !work) return;
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      let followedWorks = new Set<string>();
      let savedProgress:
        | ReturnType<typeof parseStoredReadingProgress>[string]
        | undefined;
      try {
        followedWorks = parseStoredSlugSet(
          window.localStorage.getItem(FOLLOWED_WORKS_STORAGE_KEY),
        );
        savedProgress = parseStoredReadingProgress(
          window.localStorage.getItem(READING_PROGRESS_STORAGE_KEY),
        )[work.slug];
      } catch {
        // Reading remains available when browser storage is unavailable.
        setFollowStorageAvailable(false);
      }
      const resumedChapter =
        project.chapters.find(
          (chapter) => chapter.id === savedProgress?.chapterId,
        ) ?? project.chapters[0];
      const resumedIndex = Math.max(
        0,
        resumedChapter.scenes.findIndex(
          (scene) => scene.id === savedProgress?.sceneId,
        ),
      );
      setFollowed(followedWorks.has(work.slug));
      setActiveChapterId(resumedChapter.id);
      setPageIndex(resumedIndex);
      setResumeTarget(
        resumedIndex > 0 || resumedChapter.id !== project.chapters[0].id
          ? { chapterId: resumedChapter.id, sceneIndex: resumedIndex }
          : null,
      );
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
        .getElementById(
          `published-reader-scene-${resumeTarget.chapterId}-${resumeTarget.sceneIndex + 1}`,
        )
        ?.scrollIntoView({ block: 'start' });
      setResumeTarget(null);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [matureConfirmed, mode, requiresRatingGate, resumeTarget]);

  const recordProgress = useCallback(
    (chapterId: string, nextSceneIndex: number) => {
      if (!work || !project || !hydrated) return;
      const chapter =
        project.chapters.find((item) => item.id === chapterId) ??
        project.chapters[0];
      const sceneIndex = Math.min(
        Math.max(Math.floor(nextSceneIndex), 0),
        chapter.scenes.length - 1,
      );
      let progress = {} as ReturnType<typeof parseStoredReadingProgress>;
      let storageReadable = true;
      try {
        progress = parseStoredReadingProgress(
          window.localStorage.getItem(READING_PROGRESS_STORAGE_KEY),
        );
      } catch {
        // A blocked read still allows the current reading session to continue.
        storageReadable = false;
      }
      progress[work.slug] = {
        chapterId: chapter.id,
        sceneId: chapter.scenes[sceneIndex].id,
        updatedAt: new Date().toISOString(),
      };
      if (!storageReadable) return;
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
    if (!project || !activeChapter) return;
    const resolved = Math.min(
      Math.max(nextPageIndex, 0),
      activeChapter.scenes.length - 1,
    );
    setPageIndex(resolved);
    setPlaySession((session) => session + 1);
    recordProgress(activeChapter.id, resolved);
  };

  const selectChapter = (nextChapterIndex: number, targetSceneIndex = 0) => {
    if (!project) return;
    const resolvedChapterIndex = Math.min(
      Math.max(nextChapterIndex, 0),
      project.chapters.length - 1,
    );
    const chapter = project.chapters[resolvedChapterIndex];
    const resolvedSceneIndex = Math.min(
      Math.max(targetSceneIndex, 0),
      chapter.scenes.length - 1,
    );
    setActiveChapterId(chapter.id);
    setPageIndex(resolvedSceneIndex);
    setResumeTarget({
      chapterId: chapter.id,
      sceneIndex: resolvedSceneIndex,
    });
    setPlaySession((session) => session + 1);
    recordProgress(chapter.id, resolvedSceneIndex);
  };

  const selectPreviousPage = () => {
    if (!activeChapter) return;
    if (pageIndex > 0) selectPage(pageIndex - 1);
    else if (chapterIndex > 0) {
      const previous = project!.chapters[chapterIndex - 1];
      selectChapter(chapterIndex - 1, previous.scenes.length - 1);
    }
  };

  const selectNextPage = () => {
    if (!activeChapter || !project) return;
    if (pageIndex < activeChapter.scenes.length - 1) {
      selectPage(pageIndex + 1);
    } else if (chapterIndex < project.chapters.length - 1) {
      selectChapter(chapterIndex + 1);
    }
  };

  const toggleFollow = () => {
    if (!work) return;
    let followedWorks = new Set(followed ? [work.slug] : []);
    let storageReadable = followStorageAvailable;
    if (storageReadable) {
      try {
        followedWorks = parseStoredSlugSet(
          window.localStorage.getItem(FOLLOWED_WORKS_STORAGE_KEY),
        );
      } catch {
        storageReadable = false;
        setFollowStorageAvailable(false);
      }
    }
    if (followedWorks.has(work.slug)) followedWorks.delete(work.slug);
    else followedWorks.add(work.slug);
    if (storageReadable) {
      try {
        window.localStorage.setItem(
          FOLLOWED_WORKS_STORAGE_KEY,
          JSON.stringify([...followedWorks]),
        );
      } catch {
        setFollowStorageAvailable(false);
      }
    }
    setFollowed(followedWorks.has(work.slug));
  };

  if (!work || !project || !activeChapter) {
    return (
      <main className="published-reader-missing">
        <MotusLogo />
        <span>WORK NOT FOUND</span>
        <h1>This story is not in the Motus library.</h1>
        <a href="/discover">Return to Explore</a>
      </main>
    );
  }

  const scenesBeforeChapter = project.chapters
    .slice(0, chapterIndex)
    .reduce((total, chapter) => total + chapter.scenes.length, 0);
  const totalScenes = project.chapters.reduce(
    (total, chapter) => total + chapter.scenes.length,
    0,
  );
  const progressPercent =
    ((scenesBeforeChapter + pageIndex + 1) / Math.max(totalScenes, 1)) * 100;

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
        <div className="published-reader-follow-wrap">
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
          {!followStorageAvailable ? <small>Session only</small> : null}
        </div>
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
            {previewLayout && !previewLayout.native ? (
              <span className="published-reader-prototype">
                Prototype preview · {previewLayout.label} layout
              </span>
            ) : null}
            <h1>{work.title}</h1>
            <a
              href={`/creator/${creator?.routeHandle ?? work.creatorHandle.replace(/^@/, '')}`}
            >
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
            {work.contentWarningIds.length ? (
              <div
                className="published-reader-warnings"
                aria-label="Content warnings"
              >
                <ShieldAlert aria-hidden="true" />
                <span>
                  Content warnings:{' '}
                  {work.contentWarningIds
                    .map((warning) => LIBRARY_CONTENT_WARNING_LABELS[warning])
                    .join(' · ')}
                </span>
              </div>
            ) : null}
          </div>
          <dl className="published-reader-facts">
            <div>
              <dt>Chapter</dt>
              <dd>
                {chapterIndex + 1} / {project.chapters.length}
              </dd>
            </div>
            <div>
              <dt>Language</dt>
              <dd>{work.language}</dd>
            </div>
            <div>
              <dt>Rating</dt>
              <dd>{work.rating}</dd>
            </div>
            <div>
              <dt>Origin</dt>
              <dd>
                {work.origin === 'fanwork'
                  ? `Fanwork · ${work.fandom}`
                  : 'Original'}
              </dd>
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
                <span>
                  CHAPTER {String(chapterIndex + 1).padStart(2, '0')} OF{' '}
                  {String(project.chapters.length).padStart(2, '0')}
                </span>
                <h2 id="chapter-title">{activeChapter.title}</h2>
              </div>
              <div className="published-reader-controls">
                <nav
                  aria-label="Chapter navigation"
                  className="published-reader-chapter-nav"
                >
                  <Button
                    aria-label="Previous chapter"
                    disabled={chapterIndex === 0}
                    onClick={() => selectChapter(chapterIndex - 1)}
                    size="sm"
                    variant="secondary"
                  >
                    <ChevronLeft />
                  </Button>
                  <span>
                    {chapterIndex + 1} / {project.chapters.length}
                  </span>
                  <Button
                    aria-label="Next chapter"
                    disabled={chapterIndex === project.chapters.length - 1}
                    onClick={() => selectChapter(chapterIndex + 1)}
                    size="sm"
                    variant="secondary"
                  >
                    <ChevronRight />
                  </Button>
                </nav>
                <fieldset>
                  <legend className="sr-only">Preview layout</legend>
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
                {activeChapter.scenes.map((scene, index) => (
                  <ReaderScene
                    anchorId={`published-reader-scene-${activeChapter.id}-${index + 1}`}
                    index={index}
                    key={`${scene.id}-${playSession}`}
                    onEnter={(enteredIndex) => {
                      setPageIndex(enteredIndex);
                      recordProgress(activeChapter.id, enteredIndex);
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
                  key={`${activeChapter.scenes[pageIndex].id}-${playSession}`}
                  onEnter={(enteredIndex) =>
                    recordProgress(activeChapter.id, enteredIndex)
                  }
                  scene={activeChapter.scenes[pageIndex]}
                  sessionKey={playSession}
                />
                <div className="published-reader-page-controls">
                  <Button
                    disabled={pageIndex === 0 && chapterIndex === 0}
                    onClick={selectPreviousPage}
                    variant="secondary"
                  >
                    <ChevronLeft />
                    Previous
                  </Button>
                  <span>
                    {project.format === 'page' ? 'Page' : 'Scene'}{' '}
                    {pageIndex + 1} of {activeChapter.scenes.length}
                  </span>
                  <Button
                    disabled={
                      pageIndex === activeChapter.scenes.length - 1 &&
                      chapterIndex === project.chapters.length - 1
                    }
                    onClick={selectNextPage}
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
