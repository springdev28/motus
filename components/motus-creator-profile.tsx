/* oxlint-disable next/no-html-link-for-pages -- Creator profiles use stable first-party routes. */
'use client';

import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  Heart,
  LibraryBig,
  ShieldAlert,
  Sparkles,
  Users,
} from 'lucide-react';

import { MotusLogo } from '@/components/motus-logo';
import { Button } from '@/components/ui/button';
import {
  LIBRARY_CONTENT_WARNING_LABELS,
  getLibraryCreatorProfile,
  migrateStoredCreatorHandles,
  parseStoredCreatorIdSet,
  type LibraryCreatorId,
  type LibraryWork,
} from '@/lib/motus-library';

const FOLLOWED_CREATORS_STORAGE_KEY_V1 = 'motus:followed-creators:v1';
const FOLLOWED_CREATORS_STORAGE_KEY_V2 = 'motus:followed-creators:v2';

function writeCreatorFollows(values: ReadonlySet<LibraryCreatorId>) {
  try {
    window.localStorage.setItem(
      FOLLOWED_CREATORS_STORAGE_KEY_V2,
      JSON.stringify([...values]),
    );
    return true;
  } catch {
    return false;
  }
}

function CreatorWorkCard({ work }: { work: LibraryWork }) {
  return (
    <article className="creator-work-card">
      <a href={`/read/${work.slug}`}>
        <span
          aria-hidden="true"
          className="creator-work-art"
          style={{ background: work.palette }}
        >
          <span>{work.genre}</span>
          <strong>{work.title.slice(0, 1)}</strong>
          <i style={{ background: work.accent }} />
        </span>
        <span className="creator-work-copy">
          <small>
            {work.format} · {work.status}
          </small>
          <strong>{work.title}</strong>
          <p>{work.description}</p>
          <span className="creator-work-facts">
            <span>{work.rating}</span>
            <span>{work.chapterCount} chapters</span>
            <span>{work.language}</span>
          </span>
          {work.fandom ? (
            <span className="creator-work-provenance">
              <LibraryBig aria-hidden="true" /> Fanwork · {work.fandom}
            </span>
          ) : (
            <span className="creator-work-provenance">
              <Sparkles aria-hidden="true" /> Original work
            </span>
          )}
          {work.contentWarningIds.length ? (
            <span className="creator-work-warnings">
              <ShieldAlert aria-hidden="true" />
              {work.contentWarningIds
                .map((warning) => LIBRARY_CONTENT_WARNING_LABELS[warning])
                .join(' · ')}
            </span>
          ) : null}
        </span>
        <ArrowRight aria-hidden="true" className="creator-work-arrow" />
      </a>
    </article>
  );
}

export function MotusCreatorProfile({ handle }: { handle: string }) {
  const profile = getLibraryCreatorProfile(handle);
  const [followedCreators, setFollowedCreators] = useState<
    Set<LibraryCreatorId>
  >(new Set());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      const storedValue = window.localStorage.getItem(
        FOLLOWED_CREATORS_STORAGE_KEY_V2,
      );
      const stored = parseStoredCreatorIdSet(storedValue);
      const migrated =
        storedValue === null
          ? migrateStoredCreatorHandles(
              window.localStorage.getItem(FOLLOWED_CREATORS_STORAGE_KEY_V1),
            )
          : new Set<LibraryCreatorId>();
      const merged = new Set<LibraryCreatorId>([...stored, ...migrated]);
      if (storedValue === null) writeCreatorFollows(merged);
      setFollowedCreators(merged);
      setHydrated(true);
    });
    return () => {
      active = false;
    };
  }, []);

  if (!profile) {
    return (
      <main className="published-reader-missing">
        <MotusLogo />
        <span>CREATOR NOT FOUND</span>
        <h1>This creator is not in the Motus library.</h1>
        <a href="/discover?entity=creators">Browse creators</a>
      </main>
    );
  }

  const { creator, works, featuredWork, communities, genres } = profile;
  const originals = works.filter((work) => work.origin === 'original');
  const fanworks = works.filter((work) => work.origin === 'fanwork');
  const followed = followedCreators.has(creator.id);
  const initials = creator.name
    .split(' ')
    .map((part) => part[0])
    .join('');

  const toggleFollow = () => {
    const next = new Set(followedCreators);
    if (next.has(creator.id)) next.delete(creator.id);
    else next.add(creator.id);
    if (writeCreatorFollows(next)) setFollowedCreators(next);
  };

  return (
    <div className="creator-profile-shell">
      <header className="creator-profile-header">
        <a className="creator-profile-back" href="/discover?entity=creators">
          <ArrowLeft aria-hidden="true" />
          Creators
        </a>
        <a aria-label="Motus home" className="creator-profile-brand" href="/">
          <MotusLogo />
          <span>MOTUS</span>
        </a>
        <a className="creator-profile-create" href="/studio">
          <Sparkles aria-hidden="true" /> Create
        </a>
      </header>

      <main className="creator-profile-main">
        <section
          className="creator-profile-hero"
          style={{ background: creator.banner }}
        >
          <div aria-hidden="true" className="creator-profile-glow" />
          <div
            aria-hidden="true"
            className="creator-profile-avatar"
            style={{ borderColor: creator.accent }}
          >
            {initials}
          </div>
          <div className="creator-profile-identity">
            <span>CREATOR PROFILE</span>
            <h1>{creator.name}</h1>
            <p className="creator-profile-handle">{creator.displayHandle}</p>
            <p>{creator.bio}</p>
            <div className="creator-profile-genres" aria-label="Creator genres">
              {genres.map((genre) => (
                <a
                  href={`/discover?q=${encodeURIComponent(genre)}`}
                  key={genre}
                >
                  {genre}
                </a>
              ))}
            </div>
          </div>
          <div className="creator-profile-follow-wrap">
            <Button
              aria-pressed={followed}
              disabled={!hydrated}
              onClick={toggleFollow}
              size="lg"
              variant={followed ? 'secondary' : 'default'}
            >
              {followed ? <Check /> : <Heart />}
              {followed ? 'Following' : 'Follow creator'}
            </Button>
            <small>Saved on this device</small>
          </div>
        </section>

        <section className="creator-profile-stats" aria-label="Creator summary">
          <div>
            <strong>{works.length}</strong>
            <span>Published {works.length === 1 ? 'work' : 'works'}</span>
          </div>
          <div>
            <strong>{profile.totalChapters}</strong>
            <span>Total chapters</span>
          </div>
          <div>
            <strong>{new Set(works.map((work) => work.format)).size}</strong>
            <span>Reading formats</span>
          </div>
          <div>
            <strong>{communities.length}</strong>
            <span>Community affiliations</span>
          </div>
        </section>

        <section
          className="creator-featured"
          aria-labelledby="featured-work-title"
        >
          <header>
            <div>
              <span>FEATURED WORK</span>
              <h2 id="featured-work-title">Start here</h2>
            </div>
            <a href={`/read/${featuredWork.slug}`}>
              Open reader <ArrowRight aria-hidden="true" />
            </a>
          </header>
          <a
            aria-label={`Open ${featuredWork.title} in the reader`}
            className="creator-featured-card"
            href={`/read/${featuredWork.slug}`}
          >
            <span
              aria-hidden="true"
              className="creator-featured-art"
              style={{ background: featuredWork.palette }}
            >
              <span>{featuredWork.genre}</span>
              <strong>{featuredWork.title.slice(0, 1)}</strong>
              <i style={{ background: featuredWork.accent }} />
            </span>
            <span className="creator-featured-copy">
              <small>
                {featuredWork.origin === 'fanwork'
                  ? `FANWORK · ${featuredWork.fandom}`
                  : 'ORIGINAL WORK'}
              </small>
              <strong>{featuredWork.title}</strong>
              <p>{featuredWork.description}</p>
              <span>
                {featuredWork.format} · {featuredWork.status} ·{' '}
                {featuredWork.rating}
              </span>
            </span>
          </a>
        </section>

        {originals.length ? (
          <section
            className="creator-portfolio"
            aria-labelledby="originals-title"
          >
            <header>
              <div>
                <span>PORTFOLIO</span>
                <h2 id="originals-title">Originals</h2>
              </div>
              <output>{originals.length}</output>
            </header>
            <div className="creator-work-grid">
              {originals.map((work) => (
                <CreatorWorkCard key={work.slug} work={work} />
              ))}
            </div>
          </section>
        ) : null}

        {fanworks.length ? (
          <section
            className="creator-portfolio"
            aria-labelledby="fanworks-title"
          >
            <header>
              <div>
                <span>TRANSFORMATIVE WORK</span>
                <h2 id="fanworks-title">Fanworks</h2>
              </div>
              <output>{fanworks.length}</output>
            </header>
            <div className="creator-work-grid">
              {fanworks.map((work) => (
                <CreatorWorkCard key={work.slug} work={work} />
              ))}
            </div>
          </section>
        ) : null}

        <section
          className="creator-communities"
          aria-labelledby="creator-communities-title"
        >
          <header>
            <div>
              <span>COMMUNITIES</span>
              <h2 id="creator-communities-title">Affiliated archives</h2>
            </div>
          </header>
          <div>
            {communities.map((community) => (
              <article key={community.slug}>
                <span
                  aria-hidden="true"
                  style={{ background: community.palette }}
                >
                  <Users />
                </span>
                <div>
                  <small>{community.privacy} archive</small>
                  <strong>{community.name}</strong>
                  <p>{community.description}</p>
                  <a
                    href={`/discover?entity=communities&q=${encodeURIComponent(community.name)}`}
                  >
                    Browse community <ArrowRight aria-hidden="true" />
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="creator-profile-note">
          <BookOpen aria-hidden="true" />
          <div>
            <strong>
              Profile follows are device-local in this private alpha.
            </strong>
            <p>
              No follower counts, account claims, or public membership states
              are invented before Motus has authenticated profiles.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
