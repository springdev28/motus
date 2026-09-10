/* oxlint-disable next/no-html-link-for-pages -- Full-page transitions keep local draft recovery independent of router state. */
'use client';

import { MotusSiteHeader } from '@/components/motus-site-header';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Code2,
  Heart,
  Layers3,
  Play,
  Sparkles,
  Globe2,
} from 'lucide-react';

import { readNewestMotusDraft } from '@/lib/motus-draft-storage';
import { MotusShare } from '@/components/motus-share';
import { MotusWorkMetadataSummary } from '@/components/motus-work-metadata-summary';
import {
  DEVICE_FOLLOWED_WORKS_STORAGE_KEY,
  DEVICE_READING_PROGRESS_STORAGE_KEY,
  getDevicePublicationCover,
  getDevicePublicationFromProject,
  listDevicePublications,
  parseDeviceFollowedSlugs,
  parseDeviceReadingProgress,
  type DevicePublication,
  type DeviceReadingProgress,
} from '@/lib/motus-device-publication';
import {
  MOTUS_LIBRARY_WORKS,
  parseStoredCreatorIdSet,
  migrateStoredCreatorHandles,
  type LibraryCreatorId,
  createCatalogPreviewProject,
  parseStoredReadingProgress,
  parseStoredSlugSet,
  type LibraryReadingProgress,
} from '@/lib/motus-library';
import {
  countMotionBlocks,
  getProjectScenes,
  type MotusProject,
} from '@/lib/motus-model';

const discoverWorks = MOTUS_LIBRARY_WORKS.slice(0, 4);
const READING_PROGRESS_STORAGE_KEY = 'motus:reading-progress:v1';
const FOLLOWED_WORKS_STORAGE_KEY = 'motus:followed-works:v1';

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
  const [followedCreators, setFollowedCreators] = useState<
    Set<LibraryCreatorId>
  >(new Set());
  const [readingProgress, setReadingProgress] =
    useState<LibraryReadingProgress>({});
  const [followedWorks, setFollowedWorks] = useState<Set<string>>(new Set());
  const [devicePublications, setDevicePublications] = useState<
    DevicePublication[]
  >([]);
  const [deviceReadingProgress, setDeviceReadingProgress] = useState<
    Record<string, DeviceReadingProgress>
  >({});
  const [deviceFollowedSlugs, setDeviceFollowedSlugs] = useState<Set<string>>(
    new Set(),
  );

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      let currentPublication: DevicePublication | null = null;
      try {
        const restored = readNewestMotusDraft(window.localStorage);
        setDraft(
          restored
            ? { status: 'ready', project: restored.project }
            : { status: 'empty', project: null },
        );
        currentPublication = restored
          ? getDevicePublicationFromProject(restored.project)
          : null;
      } catch {
        setDraft({ status: 'empty', project: null });
      }
      let registeredPublications: DevicePublication[] = [];
      try {
        registeredPublications = listDevicePublications(window.localStorage);
      } catch {
        // The current journal publication remains available when the registry is blocked.
      }
      const publications = [
        ...(currentPublication ? [currentPublication] : []),
        ...registeredPublications.filter(
          (candidate) => candidate.slug !== currentPublication?.slug,
        ),
      ].sort(
        (left, right) =>
          Date.parse(right.revision.createdAt) -
            Date.parse(left.revision.createdAt) ||
          right.revision.revision - left.revision.revision,
      );
      setDevicePublications(publications);
      try {
        const encodedProgress = window.localStorage.getItem(
          DEVICE_READING_PROGRESS_STORAGE_KEY,
        );
        setDeviceReadingProgress(
          Object.fromEntries(
            publications.flatMap((publication) => {
              const progress = parseDeviceReadingProgress(
                encodedProgress,
                publication,
              )[publication.slug];
              return progress ? [[publication.slug, progress]] : [];
            }),
          ),
        );
      } catch {
        setDeviceReadingProgress({});
      }
      try {
        setDeviceFollowedSlugs(
          publications[0]
            ? parseDeviceFollowedSlugs(
                window.localStorage.getItem(DEVICE_FOLLOWED_WORKS_STORAGE_KEY),
                publications[0],
              )
            : new Set(),
        );
      } catch {
        setDeviceFollowedSlugs(new Set());
      }
      try {
        const storedCreators = window.localStorage.getItem(
          'motus:followed-creators:v2',
        );
        setFollowedCreators(
          storedCreators === null
            ? migrateStoredCreatorHandles(
                window.localStorage.getItem('motus:followed-creators:v1'),
              )
            : parseStoredCreatorIdSet(storedCreators),
        );
        setReadingProgress(
          parseStoredReadingProgress(
            window.localStorage.getItem(READING_PROGRESS_STORAGE_KEY),
          ),
        );
        setFollowedWorks(
          parseStoredSlugSet(
            window.localStorage.getItem(FOLLOWED_WORKS_STORAGE_KEY),
          ),
        );
      } catch {
        setReadingProgress({});
        setFollowedWorks(new Set());
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const projectSummary = useMemo(() => {
    if (draft.status !== 'ready') return null;
    const scenes = getProjectScenes(draft.project);
    const elements = scenes.flatMap((scene) => scene.elements);
    return {
      blocks: elements.reduce(
        (total, element) => total + countMotionBlocks(element.motion.blocks),
        0,
      ),
      cover:
        scenes.find((scene) => scene.id === draft.project.coverSceneId)
          ?.background ??
        scenes[0]?.background ??
        '#28223c',
      scenes: scenes.length,
      layers: elements.length,
    };
  }, [draft]);

  const continueReading = useMemo(() => {
    const catalogProgress = MOTUS_LIBRARY_WORKS.flatMap((work) => {
      const progress = readingProgress[work.slug];
      if (!progress) return [];
      const preview = createCatalogPreviewProject(work);
      const chapterIndex = Math.max(
        0,
        preview.chapters.findIndex(
          (chapter) => chapter.id === progress.chapterId,
        ),
      );
      const chapter = preview.chapters[chapterIndex] ?? preview.chapters[0];
      const sceneIndex = Math.max(
        0,
        chapter.scenes.findIndex((scene) => scene.id === progress.sceneId),
      );
      const completedScenes =
        preview.chapters
          .slice(0, chapterIndex)
          .reduce((total, item) => total + item.scenes.length, 0) +
        sceneIndex +
        1;
      return [
        {
          slug: work.slug,
          title: work.title,
          creator: work.creator,
          palette: work.palette,
          progress,
          chapterIndex,
          sceneIndex,
          completedScenes,
          totalScenes: getProjectScenes(preview).length,
        },
      ];
    });
    const deviceItems = devicePublications.flatMap((publication) => {
      const deviceProgress = deviceReadingProgress[publication.slug];
      if (!deviceProgress) return [];
      return (() => {
        const chapterIndex = Math.max(
          0,
          publication.project.chapters.findIndex(
            (chapter) => chapter.id === deviceProgress.chapterId,
          ),
        );
        const chapter =
          publication.project.chapters[chapterIndex] ??
          publication.project.chapters[0];
        const sceneIndex = Math.max(
          0,
          chapter.scenes.findIndex(
            (scene) => scene.id === deviceProgress.sceneId,
          ),
        );
        const completedScenes =
          publication.project.chapters
            .slice(0, chapterIndex)
            .reduce((total, item) => total + item.scenes.length, 0) +
          sceneIndex +
          1;
        return [
          {
            slug: publication.slug,
            title: publication.source.title,
            creator: publication.source.creatorName,
            palette: getDevicePublicationCover(publication).background,
            progress: deviceProgress,
            chapterIndex,
            sceneIndex,
            completedScenes,
            totalScenes: getProjectScenes(publication.project).length,
          },
        ];
      })();
    });
    return [...catalogProgress, ...deviceItems]
      .sort(
        (left, right) =>
          Date.parse(right.progress.updatedAt) -
          Date.parse(left.progress.updatedAt),
      )
      .slice(0, 3);
  }, [devicePublications, deviceReadingProgress, readingProgress]);

  const followingWorks = useMemo(() => {
    const catalog = MOTUS_LIBRARY_WORKS.filter(
      (work) =>
        followedWorks.has(work.slug) || followedCreators.has(work.creatorId),
    ).map((work) => ({
      slug: work.slug,
      title: work.title,
      creator: work.creator,
      palette: work.palette,
      detail: `${work.genre} · ${work.status}`,
      local: false,
    }));
    const local = devicePublications
      .filter((publication) => deviceFollowedSlugs.has(publication.slug))
      .map((publication) => ({
        slug: publication.slug,
        title: publication.source.title,
        creator: publication.source.creatorName,
        palette: getDevicePublicationCover(publication).background,
        detail: `Revision ${publication.revision.revision} · in this browser`,
        local: true,
      }));
    return [...local, ...catalog];
  }, [
    deviceFollowedSlugs,
    devicePublications,
    followedWorks,
    followedCreators,
  ]);

  return (
    <div className="home-shell">
      <MotusSiteHeader active="home" />

      <main className="home-main">
        <section className="home-creator-heading" aria-labelledby="home-title">
          <div>
            <span className="home-kicker">
              <Globe2 aria-hidden="true" /> AN OPEN SHELF FOR IMAGINATION
            </span>
            <h1 id="home-title">
              Stories worth finding.
              <br />
              Creators worth following.
            </h1>
          </div>
          <div className="home-intro">
            <p>
              Original comics, transformative fanworks, and stories that move.
              Find your next favorite—or share something only you could make.
            </p>
            <div className="home-hero-actions">
              <a className="home-continue-button" href="/studio">
                Create your work <ArrowRight aria-hidden="true" />
              </a>
              <a href="/discover">
                Explore creators & work <ArrowRight aria-hidden="true" />
              </a>
            </div>
          </div>
        </section>

        <section
          className="home-featured-shelf"
          aria-labelledby="featured-shelf-title"
        >
          <header className="home-section-heading">
            <div>
              <span>THE READING ROOM</span>
              <h2 id="featured-shelf-title">Find your next favorite</h2>
            </div>
            <a href="/discover">
              Browse the archive <ArrowRight aria-hidden="true" />
            </a>
          </header>
          <div className="home-genre-links" aria-label="Browse by genre">
            {[
              'Fantasy',
              'Romance',
              'Science fiction',
              'Drama',
              'Mystery',
              'Action',
            ].map((genre) => (
              <a
                key={genre}
                href={`/discover?genre=${encodeURIComponent(genre)}`}
              >
                {genre}
              </a>
            ))}
            <a href="/discover?origin=fanwork">Fanworks</a>
          </div>
          <div className="home-featured-grid">
            {discoverWorks.map((work) => (
              <article key={work.slug}>
                <a
                  className="home-featured-cover"
                  href={`/read/${work.slug}`}
                  style={{ background: work.palette }}
                  aria-label={`Read ${work.title}`}
                >
                  <BookOpen aria-hidden="true" />
                  <span>{work.genre}</span>
                </a>
                <div className="home-featured-copy">
                  <h3>
                    <a href={`/read/${work.slug}`}>{work.title}</a>
                  </h3>
                  <a href={`/creator/${work.creatorHandle.slice(1)}`}>
                    {work.creator}
                  </a>
                  <p>{work.description}</p>
                  <small>
                    {work.rating} · {work.language} · {work.chapterCount}{' '}
                    chapters
                  </small>
                </div>
              </article>
            ))}
          </div>
          {!discoverWorks.length ? (
            <div className="home-empty-card">
              <BookOpen aria-hidden="true" />
              <div>
                <h3>A fresh start for real creators</h3>
                <p>
                  The public shelf is empty. Create your own work, or open a
                  reader edition shared by its creator.
                </p>
              </div>
              <a className="home-continue-button" href="/read/import">
                Open a shared edition <ArrowRight aria-hidden="true" />
              </a>
            </div>
          ) : null}
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
                    <span>
                      BROWSER DRAFT · {draft.project.visibility.toUpperCase()}{' '}
                      INTENT
                    </span>
                    <h3>{draft.project.title}</h3>
                    <p>
                      {draft.project.chapters.length}{' '}
                      {draft.project.chapters.length === 1
                        ? 'chapter'
                        : 'chapters'}{' '}
                      ·{' '}
                      {draft.project.format === 'spread'
                        ? 'Spread'
                        : draft.project.format === 'page'
                          ? 'Page'
                          : 'Vertical'}
                    </p>
                    <MotusWorkMetadataSummary
                      contentRating={draft.project.contentRating}
                      format={draft.project.format}
                      metadata={draft.project.metadata}
                      mode="compact"
                    />
                  </div>
                  <a className="home-continue-button" href="/studio">
                    Continue editing <ArrowRight aria-hidden="true" />
                  </a>
                </div>
                <dl className="home-project-stats">
                  <div>
                    <dt>Scenes</dt>
                    <dd>{projectSummary.scenes}</dd>
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

        {devicePublications.length ? (
          <section
            className="home-published-work"
            aria-labelledby="published-work-title"
          >
            <header className="home-section-heading">
              <div>
                <span>SHARE & PROMOTE</span>
                <h2 id="published-work-title">Your reader editions</h2>
              </div>
              <a href={`/read/${devicePublications[0].slug}`}>
                Open latest <ArrowRight aria-hidden="true" />
              </a>
            </header>
            <div className="home-published-list">
              {devicePublications.map((publication) => (
                <article className="home-published-card" key={publication.slug}>
                  <a
                    aria-label={`Read ${publication.source.title}`}
                    className="home-published-cover"
                    href={`/read/${publication.slug}`}
                    style={{
                      background:
                        getDevicePublicationCover(publication).background,
                    }}
                  >
                    <span>REV {publication.revision.revision}</span>
                    <BookOpen aria-hidden="true" />
                  </a>
                  <div className="home-published-copy">
                    <span>
                      {publication.source.visibility.toUpperCase()} INTENT ·{' '}
                      {publication.source.format === 'spread'
                        ? 'SPREAD'
                        : publication.source.format === 'page'
                          ? 'PAGE'
                          : 'VERTICAL'}
                    </span>
                    <h3>{publication.source.title}</h3>
                    <p>by {publication.source.creatorName}</p>
                    <MotusWorkMetadataSummary
                      contentRating={publication.source.contentRating}
                      format={publication.source.format}
                      metadata={publication.source.metadata}
                      mode="compact"
                      tone="dark"
                    />
                    <small>
                      Immutable revision {publication.revision.revision} ·
                      stored in this browser, not synced
                    </small>
                  </div>
                  <div className="home-published-actions">
                    <a href={`/read/${publication.slug}`}>
                      <Play fill="currentColor" /> Read revision
                    </a>
                    <MotusShare
                      title={publication.source.title}
                      creator={publication.source.creatorName}
                      description={publication.source.description}
                      path={`/read/${publication.slug}`}
                      tags={publication.source.tags}
                      publication={publication}
                    />
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : (
          <section
            className="home-published-work"
            aria-labelledby="published-work-title"
          >
            <header className="home-section-heading">
              <div>
                <span>SHARE & PROMOTE</span>
                <h2 id="published-work-title">
                  Your first audience starts here.
                </h2>
              </div>
            </header>
            <div className="home-empty-card">
              <Globe2 aria-hidden="true" />
              <div>
                <h3>Publish an interactive reader edition</h3>
                <p>
                  Create in Studio, publish a revision, then download the
                  edition and a caption to share with your audience.
                </p>
              </div>
              <a className="home-continue-button" href="/studio">
                Start in Studio <ArrowRight aria-hidden="true" />
              </a>
            </div>
            <p className="home-edition-note">
              Editions are currently saved on this device. Share the downloaded
              file so someone else can{' '}
              <a href="/read/import">open it in Motus</a>.
            </p>
          </section>
        )}

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
                draft.status === 'ready'
                  ? '/studio?reader=draft'
                  : '/read/import'
              }
            >
              <BookOpen aria-hidden="true" />
              <span>
                <strong>
                  {draft.status === 'ready'
                    ? 'Draft reader'
                    : 'Open a shared edition'}
                </strong>
                <small>
                  {draft.status === 'ready'
                    ? 'Read the current sequence'
                    : 'Read work shared by its creator'}
                </small>
              </span>
              <ArrowRight aria-hidden="true" />
            </a>
          </div>
        </section>

        <section
          className="home-discover"
          id="following"
          aria-labelledby="following-title"
        >
          <header className="home-section-heading">
            <div>
              <span>FOLLOWING</span>
              <h2 id="following-title">From your creative circle</h2>
            </div>
            <a href="/discover?view=following">
              Browse catalog follows <ArrowRight aria-hidden="true" />
            </a>
          </header>
          {followingWorks.length ? (
            <div className="home-discover-grid">
              {followingWorks.map((work) => (
                <a href={`/read/${work.slug}`} key={work.slug}>
                  <span
                    aria-hidden="true"
                    className="home-work-cover"
                    style={{ background: work.palette }}
                  >
                    <span>{work.local ? 'IN THIS BROWSER' : 'FOLLOWED'}</span>
                    <Heart fill="currentColor" />
                  </span>
                  <span className="home-work-copy">
                    <strong>{work.title}</strong>
                    <small>{work.creator}</small>
                    <em>{work.detail}</em>
                  </span>
                </a>
              ))}
            </div>
          ) : (
            <div className="home-following-empty">
              <Heart aria-hidden="true" />
              <span>
                <strong>No followed works yet</strong>
                <small>
                  Follow a work or a creator to build your own feed.
                </small>
              </span>
              <a href="/discover">Explore works</a>
            </div>
          )}
        </section>

        {continueReading.length > 0 ? (
          <section className="home-discover" aria-labelledby="reading-title">
            <header className="home-section-heading">
              <div>
                <span>LIBRARY</span>
                <h2 id="reading-title">Continue reading</h2>
              </div>
              <a href="/discover">
                Open Library <ArrowRight aria-hidden="true" />
              </a>
            </header>
            <div className="home-discover-grid home-reading-grid">
              {continueReading.map(
                ({
                  slug,
                  title,
                  creator,
                  palette,
                  chapterIndex,
                  sceneIndex,
                  completedScenes,
                  totalScenes,
                }) => {
                  const percent = Math.round(
                    (completedScenes / totalScenes) * 100,
                  );
                  return (
                    <a href={`/read/${slug}`} key={slug}>
                      <span
                        aria-hidden="true"
                        className="home-work-cover"
                        style={{ background: palette }}
                      >
                        <span>
                          {completedScenes} / {totalScenes}
                        </span>
                        <BookOpen />
                      </span>
                      <span className="home-work-copy">
                        <strong>{title}</strong>
                        <small>{creator}</small>
                        <em>
                          Chapter {chapterIndex + 1} · scene {sceneIndex + 1}
                        </em>
                      </span>
                      <progress
                        aria-label={`${percent} percent read`}
                        className="home-reading-progress"
                        max={100}
                        value={percent}
                      >
                        {percent}%
                      </progress>
                    </a>
                  );
                },
              )}
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
