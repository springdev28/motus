/* oxlint-disable next/no-html-link-for-pages -- Reader navigation uses stable public paths. */
'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from 'react';
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
import { MotusWorkMetadataSummary } from '@/components/motus-work-metadata-summary';
import { Button } from '@/components/ui/button';
import {
  DEVICE_FOLLOWED_WORKS_STORAGE_KEY,
  DEVICE_READING_PROGRESS_STORAGE_KEY,
  getDevicePublicationCover,
  isDevicePublicationSlug,
  parseDeviceFollowedSlugs,
  parseDeviceReadingProgress,
  resolveDevicePublication,
  type DevicePublication,
} from '@/lib/motus-device-publication';
import {
  MOTUS_LIBRARY_WORKS,
  createCatalogPreviewProject,
  getCatalogPreviewLayout,
  getLibraryCreatorById,
  getLibraryWork,
  parseStoredReadingProgress,
  parseStoredSlugSet,
} from '@/lib/motus-library';
import {
  getAdjacentReaderPosition,
  getReaderControlIntent,
  getReaderTransitionPresentation,
  getReaderVisibleSceneIndexes,
  type ReaderNavigationIntent,
} from '@/lib/motus-reader-navigation';
import type {
  ContentRating,
  MotusProject,
  WorkOrigin,
  WorkStatus,
} from '@/lib/motus-model';

const FOLLOWED_WORKS_STORAGE_KEY = 'motus:followed-works:v1';
const READING_PROGRESS_STORAGE_KEY = 'motus:reading-progress:v1';

type ReaderMode = 'scroll' | 'page' | 'spread';

const readerModeForFormat = (
  format: MotusProject['format'] | undefined,
): ReaderMode =>
  format === 'spread' ? 'spread' : format === 'page' ? 'page' : 'scroll';

type ReaderWorkView = {
  slug: string;
  title: string;
  creator: string;
  creatorHandle: string | null;
  creatorHref: string | null;
  description: string;
  tags: readonly string[];
  genre: string;
  formatLabel: string;
  statusLabel: string;
  ratingLabel: string;
  languageLabel: string;
  originLabel: string;
  palette: string;
  accent: string;
  contentRating: ContentRating;
  project: MotusProject;
  previewLayout: ReturnType<typeof getCatalogPreviewLayout> | null;
  devicePublication: DevicePublication | null;
};

const RATING_LABELS: Record<ContentRating, string> = {
  'all-ages': 'General',
  teen: 'Teen',
  mature: 'Mature',
  'adults-only': 'Adults only',
};

const STATUS_LABELS: Record<WorkStatus, string> = {
  ongoing: 'Ongoing',
  completed: 'Completed',
  hiatus: 'Hiatus',
};

function getDeviceOriginLabel(
  origin: WorkOrigin | null,
  publication: DevicePublication,
) {
  const metadata = publication.source.metadata;
  if (origin === 'original') return 'Original';
  if (origin === 'motus-fanwork') {
    return `Motus fanwork${metadata.sourceTitle ? ` · ${metadata.sourceTitle}` : ''}`;
  }
  if (origin === 'external-fanwork') {
    return `External fanwork${metadata.fandom ? ` · ${metadata.fandom}` : ''}`;
  }
  return 'Not specified';
}

function createDeviceReaderWork(
  publication: DevicePublication,
): ReaderWorkView {
  const cover = getDevicePublicationCover(publication);
  const metadata = publication.source.metadata;
  return {
    slug: publication.slug,
    title: publication.source.title,
    creator:
      metadata.contributorNames.join(' · ') || publication.source.creatorName,
    creatorHandle: null,
    creatorHref: null,
    description: publication.source.description,
    tags: publication.source.tags,
    genre: metadata.genres[0] ?? 'Motion work',
    formatLabel:
      publication.source.format === 'spread'
        ? 'Two-page spread'
        : publication.source.format === 'page'
          ? 'Page'
          : 'Vertical',
    statusLabel: metadata.workStatus
      ? STATUS_LABELS[metadata.workStatus]
      : `Revision ${publication.revision.revision}`,
    ratingLabel: RATING_LABELS[publication.source.contentRating],
    languageLabel: publication.source.language.toLocaleUpperCase(),
    originLabel: getDeviceOriginLabel(metadata.origin, publication),
    palette: cover.background,
    accent: cover.accent,
    contentRating: publication.source.contentRating,
    project: publication.project,
    previewLayout: null,
    devicePublication: publication,
  };
}

export function MotusReader({ slug }: { slug: string }) {
  const catalogWork = getLibraryWork(slug);
  const workIndex = MOTUS_LIBRARY_WORKS.findIndex(
    (candidate) => candidate.slug === slug,
  );
  const expectsDevicePublication = isDevicePublicationSlug(slug);
  const [devicePublication, setDevicePublication] =
    useState<DevicePublication | null>(null);
  const [deviceResolutionComplete, setDeviceResolutionComplete] = useState(
    () => !expectsDevicePublication,
  );
  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      if (!expectsDevicePublication) {
        setDevicePublication(null);
      } else {
        try {
          setDevicePublication(
            resolveDevicePublication(window.localStorage, slug),
          );
        } catch {
          setDevicePublication(null);
        }
      }
      setDeviceResolutionComplete(true);
    });
    return () => {
      active = false;
    };
  }, [expectsDevicePublication, slug]);

  const work = useMemo<ReaderWorkView | null>(() => {
    if (catalogWork) {
      const project = createCatalogPreviewProject(
        catalogWork,
        Math.max(workIndex, 0),
      );
      const creator = getLibraryCreatorById(catalogWork.creatorId);
      return {
        slug: catalogWork.slug,
        title: catalogWork.title,
        creator: catalogWork.creator,
        creatorHandle: catalogWork.creatorHandle,
        creatorHref: `/creator/${creator?.routeHandle ?? catalogWork.creatorHandle.replace(/^@/, '')}`,
        description: catalogWork.description,
        tags: catalogWork.tags,
        genre: catalogWork.genre,
        formatLabel: catalogWork.format,
        statusLabel: catalogWork.status,
        ratingLabel: catalogWork.rating,
        languageLabel: catalogWork.language,
        originLabel:
          catalogWork.origin === 'fanwork'
            ? `Fanwork · ${catalogWork.fandom}`
            : 'Original',
        palette: catalogWork.palette,
        accent: catalogWork.accent,
        contentRating: project.contentRating,
        project,
        previewLayout: getCatalogPreviewLayout(catalogWork.format),
        devicePublication: null,
      };
    }
    return devicePublication ? createDeviceReaderWork(devicePublication) : null;
  }, [catalogWork, devicePublication, workIndex]);
  const project = work?.project ?? null;
  const requiresRatingGate =
    work?.contentRating === 'mature' || work?.contentRating === 'adults-only';
  const [mode, setMode] = useState<ReaderMode>(() =>
    readerModeForFormat(project?.format),
  );
  const [activeChapterId, setActiveChapterId] = useState(
    () => project?.chapters[0]?.id ?? '',
  );
  const [pageIndex, setPageIndex] = useState(0);
  const [pageTurnIntent, setPageTurnIntent] =
    useState<ReaderNavigationIntent | null>(null);
  const [pageTransitionSequence, setPageTransitionSequence] = useState(0);
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
        if (work.devicePublication) {
          followedWorks = parseDeviceFollowedSlugs(
            window.localStorage.getItem(DEVICE_FOLLOWED_WORKS_STORAGE_KEY),
            work.devicePublication,
          );
          savedProgress = parseDeviceReadingProgress(
            window.localStorage.getItem(DEVICE_READING_PROGRESS_STORAGE_KEY),
            work.devicePublication,
          )[work.slug];
        } else {
          followedWorks = parseStoredSlugSet(
            window.localStorage.getItem(FOLLOWED_WORKS_STORAGE_KEY),
          );
          savedProgress = parseStoredReadingProgress(
            window.localStorage.getItem(READING_PROGRESS_STORAGE_KEY),
          )[work.slug];
        }
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
      const projectReaderMode = readerModeForFormat(project.format);
      setMode(projectReaderMode);
      setActiveChapterId(resumedChapter.id);
      setPageTurnIntent(null);
      setPageIndex(
        projectReaderMode === 'spread'
          ? resumedIndex - (resumedIndex % 2)
          : resumedIndex,
      );
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
      let progress: Record<
        string,
        { chapterId: string; sceneId: string; updatedAt: string }
      > = {};
      let storageReadable = true;
      const storageKey = work.devicePublication
        ? DEVICE_READING_PROGRESS_STORAGE_KEY
        : READING_PROGRESS_STORAGE_KEY;
      try {
        progress = work.devicePublication
          ? parseDeviceReadingProgress(
              window.localStorage.getItem(storageKey),
              work.devicePublication,
            )
          : parseStoredReadingProgress(window.localStorage.getItem(storageKey));
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
        window.localStorage.setItem(storageKey, JSON.stringify(progress));
      } catch {
        // Reading remains available when browser storage is unavailable.
      }
    },
    [hydrated, project, work],
  );

  const selectPage = (
    nextPageIndex: number,
    intent: ReaderNavigationIntent | null = null,
  ) => {
    if (!project || !activeChapter) return;
    const resolved = Math.min(
      Math.max(nextPageIndex, 0),
      activeChapter.scenes.length - 1,
    );
    setPageTurnIntent(intent);
    if (intent) setPageTransitionSequence((sequence) => sequence + 1);
    setPageIndex(resolved);
    setPlaySession((session) => session + 1);
    recordProgress(activeChapter.id, resolved);
  };

  const selectChapter = (
    nextChapterIndex: number,
    targetSceneIndex = 0,
    intent: ReaderNavigationIntent | null = null,
  ) => {
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
    setPageTurnIntent(intent);
    if (intent) setPageTransitionSequence((sequence) => sequence + 1);
    setActiveChapterId(chapter.id);
    setPageIndex(resolvedSceneIndex);
    setResumeTarget({
      chapterId: chapter.id,
      sceneIndex: resolvedSceneIndex,
    });
    setPlaySession((session) => session + 1);
    recordProgress(chapter.id, resolvedSceneIndex);
  };

  const navigatePage = (intent: ReaderNavigationIntent) => {
    if (!activeChapter || !project || mode === 'scroll') return;
    const target = getAdjacentReaderPosition(
      project.chapters.map((chapter) => chapter.scenes.length),
      { chapterIndex, pageIndex },
      mode,
      intent,
    );
    if (!target) return;
    if (target.chapterIndex === chapterIndex) {
      selectPage(target.pageIndex, intent);
    } else {
      selectChapter(target.chapterIndex, target.pageIndex, intent);
    }
  };

  const toggleFollow = () => {
    if (!work || !hydrated || !followStorageAvailable) return;
    let followedWorks: Set<string>;
    const storageKey = work.devicePublication
      ? DEVICE_FOLLOWED_WORKS_STORAGE_KEY
      : FOLLOWED_WORKS_STORAGE_KEY;
    try {
      followedWorks = work.devicePublication
        ? parseDeviceFollowedSlugs(
            window.localStorage.getItem(storageKey),
            work.devicePublication,
          )
        : parseStoredSlugSet(window.localStorage.getItem(storageKey));
    } catch {
      setFollowStorageAvailable(false);
      return;
    }
    if (followedWorks.has(work.slug)) followedWorks.delete(work.slug);
    else followedWorks.add(work.slug);
    try {
      window.localStorage.setItem(
        storageKey,
        JSON.stringify([...followedWorks]),
      );
      setFollowed(followedWorks.has(work.slug));
    } catch {
      setFollowStorageAvailable(false);
    }
  };

  if (!deviceResolutionComplete) {
    return (
      <main
        aria-busy="true"
        aria-live="polite"
        className="published-reader-missing"
      >
        <MotusLogo variant="on-dark" />
        <span>OPENING PUBLISHED REVISION</span>
        <h1>Loading this browser’s saved work…</h1>
      </main>
    );
  }

  if (!work || !project || !activeChapter) {
    return (
      <main className="published-reader-missing">
        <MotusLogo variant="on-dark" />
        <span>WORK NOT FOUND</span>
        <h1>
          {expectsDevicePublication
            ? 'No matching published revision is saved in this browser.'
            : 'This story is not in the Motus library.'}
        </h1>
        <a href={expectsDevicePublication ? '/' : '/discover'}>
          {expectsDevicePublication ? 'Return home' : 'Return to Explore'}
        </a>
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
    ((scenesBeforeChapter +
      Math.min(
        pageIndex + (mode === 'spread' ? 2 : 1),
        activeChapter.scenes.length,
      )) /
      Math.max(totalScenes, 1)) *
    100;
  const pagedLayout = mode === 'spread' ? 'spread' : 'page';
  const sceneCounts = project.chapters.map((chapter) => chapter.scenes.length);
  const pageTargets = {
    previous: getAdjacentReaderPosition(
      sceneCounts,
      { chapterIndex, pageIndex },
      pagedLayout,
      'previous',
    ),
    next: getAdjacentReaderPosition(
      sceneCounts,
      { chapterIndex, pageIndex },
      pagedLayout,
      'next',
    ),
  };
  const leftControlIntent = getReaderControlIntent(
    project.readerPresentation.direction,
    'left',
  );
  const rightControlIntent = getReaderControlIntent(
    project.readerPresentation.direction,
    'right',
  );
  const pageTransition = getReaderTransitionPresentation(
    project.readerPresentation.transition,
    project.readerPresentation.direction,
    pageTurnIntent,
    false,
  );
  const visiblePageIndexes = getReaderVisibleSceneIndexes(
    activeChapter.scenes.length,
    pageIndex,
    pagedLayout,
  );
  const pageTransitionStyle = {
    '--reader-transition-duration': `${project.readerPresentation.durationMs}ms`,
  } as CSSProperties;

  return (
    <div className="published-reader-shell">
      <header className="published-reader-header">
        <a
          className="published-reader-back"
          href={work.devicePublication ? '/' : '/discover'}
        >
          <ArrowLeft aria-hidden="true" />
          {work.devicePublication ? 'Home' : 'Explore'}
        </a>
        <a aria-label="Motus home" className="published-reader-brand" href="/">
          <MotusLogo variant="on-dark" />
          <span>MOTUS</span>
        </a>
        <div className="published-reader-follow-wrap">
          <Button
            aria-pressed={followed}
            className="published-reader-follow"
            disabled={!hydrated || !followStorageAvailable}
            onClick={toggleFollow}
            size="sm"
            variant={followed ? 'secondary' : 'default'}
          >
            {followed ? <Check /> : <Heart />}
            {work.devicePublication
              ? followed
                ? 'Saved to Home'
                : 'Save to Home'
              : followed
                ? 'Following'
                : 'Follow work'}
          </Button>
          {!followStorageAvailable ? (
            <small>Not saved · browser storage unavailable</small>
          ) : null}
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
              {work.formatLabel} · {work.statusLabel}
            </span>
            {work.devicePublication ? (
              <span className="published-reader-device">
                Published in this browser · revision{' '}
                {work.devicePublication.revision.revision} ·{' '}
                {work.devicePublication.source.visibility} intent
              </span>
            ) : null}
            {work.previewLayout && !work.previewLayout.native ? (
              <span className="published-reader-prototype">
                Prototype preview · {work.previewLayout.label} layout
              </span>
            ) : null}
            <h1>{work.title}</h1>
            {work.creatorHref ? (
              <a href={work.creatorHref}>
                {work.creator} <small>{work.creatorHandle}</small>
              </a>
            ) : (
              <span className="published-reader-local-creator">
                by {work.creator}
              </span>
            )}
            <p>{work.description}</p>
            <div className="published-reader-tags" aria-label="Work tags">
              {work.tags.map((tag) =>
                work.devicePublication ? (
                  <span key={tag}>#{tag}</span>
                ) : (
                  <a href={`/discover?q=${encodeURIComponent(tag)}`} key={tag}>
                    #{tag}
                  </a>
                ),
              )}
            </div>
            <MotusWorkMetadataSummary
              contentRating={project.contentRating}
              format={project.format}
              metadata={project.metadata}
              tone="dark"
            />
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
              <dd>{work.languageLabel}</dd>
            </div>
            <div>
              <dt>Rating</dt>
              <dd>{work.ratingLabel}</dd>
            </div>
            <div>
              <dt>Origin</dt>
              <dd>{work.originLabel}</dd>
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
              {work.contentRating === 'adults-only'
                ? 'ADULTS ONLY · 18+'
                : 'MATURE CONTENT'}
            </span>
            <h2 id="rating-title">Continue to this work?</h2>
            <p>
              {work.contentRating === 'adults-only'
                ? 'The creator restricted this work to adults. Continue only if you are 18 or older.'
                : 'The creator marked this work as Mature. Continue only when this rating is appropriate for you.'}
            </p>
            <div>
              <a href={work.devicePublication ? '/' : '/discover'}>Go back</a>
              <Button onClick={() => setMatureConfirmed(true)}>
                {work.contentRating === 'adults-only'
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
                    aria-label={`${leftControlIntent === 'previous' ? 'Previous' : 'Next'} chapter`}
                    disabled={
                      leftControlIntent === 'previous'
                        ? chapterIndex === 0
                        : chapterIndex === project.chapters.length - 1
                    }
                    onClick={() =>
                      selectChapter(
                        chapterIndex +
                          (leftControlIntent === 'previous' ? -1 : 1),
                      )
                    }
                    size="sm"
                    variant="secondary"
                  >
                    <ChevronLeft />
                  </Button>
                  <span>
                    {chapterIndex + 1} / {project.chapters.length}
                  </span>
                  <Button
                    aria-label={`${rightControlIntent === 'previous' ? 'Previous' : 'Next'} chapter`}
                    disabled={
                      rightControlIntent === 'previous'
                        ? chapterIndex === 0
                        : chapterIndex === project.chapters.length - 1
                    }
                    onClick={() =>
                      selectChapter(
                        chapterIndex +
                          (rightControlIntent === 'previous' ? -1 : 1),
                      )
                    }
                    size="sm"
                    variant="secondary"
                  >
                    <ChevronRight />
                  </Button>
                </nav>
                <fieldset>
                  <legend className="sr-only">Reading layout</legend>
                  <button
                    aria-pressed={mode === 'scroll'}
                    onClick={() => {
                      setPageTurnIntent(null);
                      setMode('scroll');
                    }}
                    type="button"
                  >
                    <ArrowDown aria-hidden="true" />
                    Vertical
                  </button>
                  <button
                    aria-pressed={mode === 'page'}
                    onClick={() => {
                      setPageTurnIntent(null);
                      setMode('page');
                    }}
                    type="button"
                  >
                    <FileImage aria-hidden="true" />
                    Page
                  </button>
                  <button
                    aria-pressed={mode === 'spread'}
                    onClick={() => {
                      setPageTurnIntent(null);
                      setMode('spread');
                      setPageIndex((index) => index - (index % 2));
                    }}
                    type="button"
                  >
                    <BookOpen aria-hidden="true" />
                    Spread
                  </button>
                </fieldset>
                <Button
                  aria-label="Replay chapter motion"
                  onClick={() => {
                    setPageTurnIntent(null);
                    setPlaySession((session) => session + 1);
                  }}
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
              <div
                className="published-reader-paged"
                data-layout={mode}
                data-reading-direction={project.readerPresentation.direction}
                data-transition={pageTransition.effectiveStyle}
                data-turn={pageTransition.entryEdge}
                style={pageTransitionStyle}
              >
                <div
                  className="published-reader-page-leaf"
                  key={`${activeChapter.id}-${mode}-${pageIndex}-${pageTransitionSequence}`}
                >
                  {visiblePageIndexes.map((sceneIndex, spreadOffset) => (
                    <ReaderScene
                      index={sceneIndex}
                      key={`${activeChapter.scenes[sceneIndex].id}-${playSession}-${pageIndex}`}
                      onEnter={(enteredIndex) =>
                        recordProgress(activeChapter.id, enteredIndex)
                      }
                      scene={activeChapter.scenes[sceneIndex]}
                      sessionKey={playSession + spreadOffset}
                    />
                  ))}
                </div>
                <div className="published-reader-page-controls">
                  <Button
                    aria-label={
                      leftControlIntent === 'previous'
                        ? 'Previous page'
                        : 'Next page'
                    }
                    disabled={!pageTargets[leftControlIntent]}
                    onClick={() => navigatePage(leftControlIntent)}
                    variant="secondary"
                  >
                    <ChevronLeft />
                    {leftControlIntent === 'previous' ? 'Previous' : 'Next'}
                  </Button>
                  <span aria-atomic="true" aria-live="polite">
                    {mode === 'spread' ? 'Spread' : 'Page'}{' '}
                    {mode === 'spread'
                      ? `${Math.floor(pageIndex / 2) + 1} of ${Math.ceil(activeChapter.scenes.length / 2)}`
                      : `${pageIndex + 1} of ${activeChapter.scenes.length}`}
                  </span>
                  <Button
                    aria-label={
                      rightControlIntent === 'previous'
                        ? 'Previous page'
                        : 'Next page'
                    }
                    disabled={!pageTargets[rightControlIntent]}
                    onClick={() => navigatePage(rightControlIntent)}
                  >
                    {rightControlIntent === 'previous' ? 'Previous' : 'Next'}
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
              <a href="/studio">
                {work.devicePublication
                  ? 'Edit in Studio'
                  : 'Create with Motus'}
              </a>
            </footer>
          </section>
        )}
      </main>
    </div>
  );
}
