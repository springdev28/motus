/* oxlint-disable next/no-html-link-for-pages -- Library cards use stable reader routes. */
'use client';

import { MotusSiteHeader } from '@/components/motus-site-header';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  Clock3,
  Compass,
  Heart,
  LibraryBig,
  Search,
  Sparkles,
  Tag,
  Users,
  X,
} from 'lucide-react';

import {
  DISCOVERY_LANGUAGES,
  readDiscoveryFilters,
  discoverySearch,
  type DiscoveryFilters,
} from '@/lib/motus-discovery';
import { MotusShare } from '@/components/motus-share';
import { Button } from '@/components/ui/button';
import {
  LIBRARY_ENTITY_TYPES,
  LIBRARY_WORK_FORMATS,
  LIBRARY_WORK_GENRES,
  LIBRARY_WORK_RATINGS,
  LIBRARY_WORK_STATUSES,
  MOTUS_LIBRARY_COMMUNITIES,
  MOTUS_LIBRARY_CREATORS,
  MOTUS_LIBRARY_WORKS,
  filterLibraryWorks,
  getLibraryCommunityBySlug,
  getLibraryWorksForCommunity,
  getLibraryWorksForCreator,
  migrateStoredCreatorHandles,
  parseStoredCreatorIdSet,
  parseStoredSlugSet,
  type LibraryCreatorId,
  type LibraryCommunitySlug,
  type LibraryEntityType,
  type LibraryWorkFormat,
  type LibraryWorkGenre,
  type LibraryWorkOrigin,
  type LibraryWorkRating,
  type LibraryWorkStatus,
} from '@/lib/motus-library';

const FOLLOWED_WORKS_STORAGE_KEY = 'motus:followed-works:v1';
const FOLLOWED_CREATORS_STORAGE_KEY_V1 = 'motus:followed-creators:v1';
const FOLLOWED_CREATORS_STORAGE_KEY_V2 = 'motus:followed-creators:v2';

type FilterValue<T extends string> = T | 'All';

function readStoredValue(key: string) {
  try {
    return { available: true, value: window.localStorage.getItem(key) };
  } catch {
    return { available: false, value: null };
  }
}

function writeStoredStrings<T extends string>(
  key: string,
  values: ReadonlySet<T>,
) {
  try {
    window.localStorage.setItem(key, JSON.stringify([...values]));
    return true;
  } catch {
    return false;
  }
}

const ENTITY_LABELS: Record<LibraryEntityType, string> = {
  works: 'Works',
  creators: 'Creators',
  communities: 'Communities',
  tags: 'Tags',
  fandoms: 'Fandoms',
  characters: 'Characters',
};

export function MotusDiscover() {
  const [layout, setLayout] = useState<'gallery' | 'archive'>('gallery');
  const [expandedFilters, setExpandedFilters] = useState(false);
  const [entity, setEntity] = useState<LibraryEntityType>('works');
  const [query, setQuery] = useState('');
  const [format, setFormat] = useState<FilterValue<LibraryWorkFormat>>('All');
  const [status, setStatus] = useState<FilterValue<LibraryWorkStatus>>('All');
  const [rating, setRating] = useState<FilterValue<LibraryWorkRating>>('All');
  const [genre, setGenre] = useState<FilterValue<LibraryWorkGenre>>('All');
  const [origin, setOrigin] = useState<FilterValue<LibraryWorkOrigin>>('All');
  const [communitySlug, setCommunitySlug] =
    useState<FilterValue<LibraryCommunitySlug>>('All');
  const [followedOnly, setFollowedOnly] = useState(false);
  const [followedWorks, setFollowedWorks] = useState<Set<string>>(new Set());
  const [followedCreators, setFollowedCreators] = useState<
    Set<LibraryCreatorId>
  >(new Set());
  const [language, setLanguage] = useState('All');
  const [sort, setSort] = useState<DiscoveryFilters['sort']>('featured');
  const [hydrated, setHydrated] = useState(false);
  const [storageAvailable, setStorageAvailable] = useState(true);

  useEffect(() => {
    let active = true;
    function restoreFilters() {
      const filters = readDiscoveryFilters(
        new URLSearchParams(window.location.search),
      );
      setEntity(filters.entity);
      setQuery(filters.query);
      setFormat(filters.format);
      setStatus(filters.status);
      setRating(filters.rating);
      setGenre(filters.genre);
      setOrigin(filters.origin);
      setCommunitySlug(filters.communitySlug);
      setLanguage(filters.language);
      setSort(filters.sort);
      setFollowedOnly(filters.followedOnly);
    }
    window.addEventListener('popstate', restoreFilters);
    queueMicrotask(() => {
      if (!active) return;
      restoreFilters();
      const storedWorksResult = readStoredValue(FOLLOWED_WORKS_STORAGE_KEY);
      setFollowedWorks(parseStoredSlugSet(storedWorksResult.value));
      const storedCreatorResult = readStoredValue(
        FOLLOWED_CREATORS_STORAGE_KEY_V2,
      );
      const legacyCreatorResult =
        storedCreatorResult.available && storedCreatorResult.value === null
          ? readStoredValue(FOLLOWED_CREATORS_STORAGE_KEY_V1)
          : { available: storedCreatorResult.available, value: null };
      const storedCreatorIds = parseStoredCreatorIdSet(
        storedCreatorResult.value,
      );
      const migratedCreatorIds =
        storedCreatorResult.available && storedCreatorResult.value === null
          ? migrateStoredCreatorHandles(legacyCreatorResult.value)
          : new Set<LibraryCreatorId>();
      const creatorIds = new Set<LibraryCreatorId>([
        ...storedCreatorIds,
        ...migratedCreatorIds,
      ]);
      const migrationSaved =
        storedCreatorResult.value !== null ||
        !storedCreatorResult.available ||
        writeStoredStrings(FOLLOWED_CREATORS_STORAGE_KEY_V2, creatorIds);
      setFollowedCreators(creatorIds);
      setStorageAvailable(
        storedWorksResult.available &&
          storedCreatorResult.available &&
          legacyCreatorResult.available &&
          migrationSaved,
      );
      setHydrated(true);
    });
    return () => {
      active = false;
      window.removeEventListener('popstate', restoreFilters);
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const search = discoverySearch({
      entity,
      query,
      format,
      status,
      rating,
      genre,
      origin,
      communitySlug,
      language,
      sort,
      followedOnly,
    });
    if (window.location.search !== search)
      window.history.replaceState(
        window.history.state,
        '',
        `/discover${search}`,
      );
  }, [
    hydrated,
    entity,
    query,
    format,
    status,
    rating,
    genre,
    origin,
    communitySlug,
    language,
    sort,
    followedOnly,
  ]);

  const followedSlugs = useMemo(
    () =>
      new Set([
        ...followedWorks,
        ...MOTUS_LIBRARY_WORKS.filter((work) =>
          followedCreators.has(work.creatorId),
        ).map((work) => work.slug),
      ]),
    [followedWorks, followedCreators],
  );

  const works = useMemo(
    () =>
      filterLibraryWorks(MOTUS_LIBRARY_WORKS, {
        query,
        format,
        status,
        rating,
        genre,
        origin,
        communitySlug,
        followedOnly,
        followedSlugs,
        language,
      }).sort((left, right) =>
        sort === 'title'
          ? left.title.localeCompare(right.title)
          : sort === 'chapters'
            ? right.chapterCount - left.chapterCount
            : right.popularity - left.popularity,
      ),
    [
      communitySlug,
      followedOnly,
      followedSlugs,
      language,
      sort,
      format,
      genre,
      origin,
      query,
      rating,
      status,
    ],
  );

  const creators = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return MOTUS_LIBRARY_CREATORS.map((creator) => {
      const creatorWorks = getLibraryWorksForCreator(creator.id);
      return {
        ...creator,
        genres: [...new Set(creatorWorks.map((work) => work.genre))],
        workCount: creatorWorks.length,
      };
    }).filter((creator) => {
      if (followedOnly && !followedCreators.has(creator.id)) return false;
      if (!normalizedQuery) return true;
      return `${creator.name} ${creator.displayHandle} ${creator.genres.join(' ')} ${creator.bio}`
        .toLocaleLowerCase()
        .includes(normalizedQuery);
    });
  }, [followedCreators, followedOnly, query]);

  const communities = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return MOTUS_LIBRARY_COMMUNITIES.filter((community) =>
      `${community.name} ${community.description} ${community.tags.join(' ')}`
        .toLocaleLowerCase()
        .includes(normalizedQuery),
    );
  }, [query]);

  const tokenResults = useMemo(() => {
    const values = new Map<string, number>();
    for (const work of MOTUS_LIBRARY_WORKS) {
      const candidates =
        entity === 'tags'
          ? work.tags
          : entity === 'characters'
            ? work.characters
            : work.fandom
              ? [work.fandom]
              : [];
      for (const candidate of candidates) {
        values.set(candidate, (values.get(candidate) ?? 0) + 1);
      }
    }
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return [...values.entries()]
      .filter(([value]) => value.toLocaleLowerCase().includes(normalizedQuery))
      .sort(
        (left, right) => right[1] - left[1] || left[0].localeCompare(right[0]),
      );
  }, [entity, query]);

  const hasFilters =
    sort !== 'featured' ||
    language !== 'All' ||
    query.trim() ||
    format !== 'All' ||
    status !== 'All' ||
    rating !== 'All' ||
    genre !== 'All' ||
    origin !== 'All' ||
    communitySlug !== 'All' ||
    followedOnly;

  const clearFilters = () => {
    setQuery('');
    setLanguage('All');
    setSort('featured');
    setFormat('All');
    setStatus('All');
    setRating('All');
    setGenre('All');
    setOrigin('All');
    setCommunitySlug('All');
    setFollowedOnly(false);
  };

  const toggleWorkFollow = (slug: string) => {
    const next = new Set(followedWorks);
    if (next.has(slug)) next.delete(slug);
    else next.add(slug);
    if (
      storageAvailable &&
      !writeStoredStrings(FOLLOWED_WORKS_STORAGE_KEY, next)
    ) {
      setStorageAvailable(false);
    }
    setFollowedWorks(next);
  };

  const toggleCreatorFollow = (creatorId: LibraryCreatorId) => {
    const next = new Set(followedCreators);
    if (next.has(creatorId)) next.delete(creatorId);
    else next.add(creatorId);
    if (
      storageAvailable &&
      !writeStoredStrings(FOLLOWED_CREATORS_STORAGE_KEY_V2, next)
    ) {
      setStorageAvailable(false);
    }
    setFollowedCreators(next);
  };

  const searchFor = (value: string) => {
    clearFilters();
    setEntity('works');
    setQuery(value);
    setFollowedOnly(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="discover-shell">
      <MotusSiteHeader
        active={
          followedOnly
            ? 'following'
            : entity === 'creators'
              ? 'creators'
              : 'discover'
        }
      />

      <main className="discover-main">
        <section className="discover-hero" aria-labelledby="discover-title">
          <div>
            <span>THE MOTUS ARCHIVE</span>
            <h1 id="discover-title">Find a story. Follow a world.</h1>
          </div>
          <label className="discover-search">
            <Search aria-hidden="true" />
            <span className="sr-only">Search the Motus library</span>
            <input
              onChange={(event) => setQuery(event.target.value)}
              placeholder={`Search ${ENTITY_LABELS[entity].toLocaleLowerCase()}…`}
              type="search"
              maxLength={300}
              value={query}
            />
            {query ? (
              <button
                aria-label="Clear search"
                onClick={() => setQuery('')}
                type="button"
              >
                <X />
              </button>
            ) : null}
          </label>
        </section>

        <section
          className="discover-entity-bar"
          aria-label="Search result type"
        >
          {LIBRARY_ENTITY_TYPES.map((item) => (
            <button
              aria-pressed={entity === item}
              key={item}
              onClick={() => {
                clearFilters();
                setEntity(item);
                setFollowedOnly(
                  (item === 'works' || item === 'creators') && followedOnly,
                );
              }}
              type="button"
            >
              {item === 'works' ? <BookOpen /> : null}
              {item === 'creators' ? <Sparkles /> : null}
              {item === 'communities' ? <Users /> : null}
              {item === 'tags' ? <Tag /> : null}
              {item === 'fandoms' ? <LibraryBig /> : null}
              {item === 'characters' ? <Compass /> : null}
              {ENTITY_LABELS[item]}
            </button>
          ))}
        </section>

        <p className="platform-context">
          A fresh archive for real creators. Public profiles and works will
          appear here when account-based publishing is available. You can
          already create in Studio and read editions shared by their creators.{' '}
          <a href="/read/import">
            Open a shared edition <ArrowRight aria-hidden="true" />
          </a>
        </p>

        {hydrated && !storageAvailable ? (
          <output className="discover-storage-notice">
            <Heart aria-hidden="true" /> Following changes are temporary because
            device storage is unavailable.
          </output>
        ) : null}

        {entity === 'works' ? (
          <>
            <div className="discover-browser">
              <button
                className="discover-filter-toggle"
                type="button"
                aria-expanded={expandedFilters}
                aria-controls="work-filters"
                onClick={() => setExpandedFilters((current) => !current)}
              >
                {expandedFilters ? 'Fewer filters' : 'More filters'}
                {[format, status, rating, genre, origin, communitySlug].filter(
                  (value) => value !== 'All',
                ).length
                  ? ` · ${[format, status, rating, genre, origin, communitySlug].filter((value) => value !== 'All').length} active`
                  : ''}
                <ChevronDown aria-hidden="true" />
              </button>
              <section
                id="work-filters"
                data-expanded={expandedFilters}
                className="discover-filterbar"
                aria-label="Work filters"
              >
                <label>
                  <span>Language</span>
                  <select
                    value={language}
                    onChange={(event) => setLanguage(event.target.value)}
                  >
                    <option value="All">All languages</option>
                    {DISCOVERY_LANGUAGES.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                  <ChevronDown aria-hidden="true" />
                </label>
                <label>
                  <span>Sort by</span>
                  <select
                    value={sort}
                    onChange={(event) =>
                      setSort(event.target.value as DiscoveryFilters['sort'])
                    }
                  >
                    <option value="featured">Featured</option>
                    <option value="title">Title A–Z</option>
                    <option value="chapters">Most chapters</option>
                  </select>
                  <ChevronDown aria-hidden="true" />
                </label>
                <label>
                  <span>Format</span>
                  <select
                    onChange={(event) =>
                      setFormat(
                        event.target.value as FilterValue<LibraryWorkFormat>,
                      )
                    }
                    value={format}
                  >
                    <option value="All">All formats</option>
                    {LIBRARY_WORK_FORMATS.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                  <ChevronDown aria-hidden="true" />
                </label>
                <label>
                  <span>Status</span>
                  <select
                    onChange={(event) =>
                      setStatus(
                        event.target.value as FilterValue<LibraryWorkStatus>,
                      )
                    }
                    value={status}
                  >
                    <option value="All">All statuses</option>
                    {LIBRARY_WORK_STATUSES.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                  <ChevronDown aria-hidden="true" />
                </label>
                <label>
                  <span>Rating</span>
                  <select
                    onChange={(event) =>
                      setRating(
                        event.target.value as FilterValue<LibraryWorkRating>,
                      )
                    }
                    value={rating}
                  >
                    <option value="All">All ratings</option>
                    {LIBRARY_WORK_RATINGS.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                  <ChevronDown aria-hidden="true" />
                </label>
                <label>
                  <span>Genre</span>
                  <select
                    onChange={(event) =>
                      setGenre(
                        event.target.value as FilterValue<LibraryWorkGenre>,
                      )
                    }
                    value={genre}
                  >
                    <option value="All">All genres</option>
                    {LIBRARY_WORK_GENRES.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                  <ChevronDown aria-hidden="true" />
                </label>
                <label>
                  <span>Origin</span>
                  <select
                    onChange={(event) =>
                      setOrigin(
                        event.target.value as FilterValue<LibraryWorkOrigin>,
                      )
                    }
                    value={origin}
                  >
                    <option value="All">All origins</option>
                    <option value="original">Original</option>
                    <option value="fanwork">Fanwork</option>
                  </select>
                  <ChevronDown aria-hidden="true" />
                </label>
                <label>
                  <span>Community</span>
                  <select
                    onChange={(event) =>
                      setCommunitySlug(
                        event.target.value as FilterValue<LibraryCommunitySlug>,
                      )
                    }
                    value={communitySlug}
                  >
                    <option value="All">All communities</option>
                    {MOTUS_LIBRARY_COMMUNITIES.map((community) => (
                      <option key={community.slug} value={community.slug}>
                        {community.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown aria-hidden="true" />
                </label>
                <button
                  aria-pressed={followedOnly}
                  className="discover-follow-filter"
                  onClick={() => setFollowedOnly((current) => !current)}
                  type="button"
                >
                  <Heart aria-hidden="true" />
                  Following
                </button>
                {hasFilters ? (
                  <button
                    className="discover-clear"
                    onClick={clearFilters}
                    type="button"
                  >
                    <X /> Clear
                  </button>
                ) : null}
              </section>

              <section
                className="discover-results"
                aria-labelledby="work-results-title"
              >
                <header>
                  <div>
                    <span>{followedOnly ? 'FOLLOWING' : 'DISCOVER'}</span>
                    <h2 id="work-results-title">
                      {query ? `Results for “${query}”` : 'Works in motion'}
                    </h2>
                  </div>
                  <div className="discover-result-options">
                    <output aria-live="polite">
                      {hydrated ? works.length : '—'} works
                    </output>
                    {works.length > 0 ? (
                      <fieldset aria-label="Result layout">
                        <button
                          type="button"
                          disabled={!hydrated}
                          aria-pressed={layout === 'gallery'}
                          onClick={() => setLayout('gallery')}
                        >
                          Gallery
                        </button>
                        <button
                          type="button"
                          disabled={!hydrated}
                          aria-pressed={layout === 'archive'}
                          onClick={() => setLayout('archive')}
                        >
                          Archive
                        </button>
                      </fieldset>
                    ) : null}
                  </div>
                </header>

                {works.length ? (
                  <div className="discover-work-grid" data-layout={layout}>
                    {works.map((work, index) => (
                      <article className="discover-work-card" key={work.slug}>
                        <a
                          className="discover-work-link"
                          href={`/read/${work.slug}`}
                        >
                          <span
                            aria-hidden="true"
                            className="discover-work-art"
                            style={{ background: work.palette }}
                          >
                            <BookOpen aria-hidden="true" />
                            <span>{String(index + 1).padStart(2, '0')}</span>
                            <em>{work.language}</em>
                          </span>
                          <span className="discover-work-details">
                            <small>
                              {work.format} · {work.status}
                            </small>
                            <strong>{work.title}</strong>
                            <span>
                              {work.creator} · {work.rating}
                            </span>
                            <span
                              className="discover-work-taxonomy"
                              aria-label="Work classification"
                            >
                              <i>{work.genre}</i>
                              <i>
                                {work.origin === 'original'
                                  ? 'Original'
                                  : `Fanwork · ${work.fandom}`}
                              </i>
                              {work.communitySlugs[0] ? (
                                <i>
                                  {getLibraryCommunityBySlug(
                                    work.communitySlugs[0],
                                  )?.name ?? work.communitySlugs[0]}
                                </i>
                              ) : null}
                            </span>
                            <p>{work.description}</p>
                            <span className="discover-work-meta">
                              <Clock3 /> {work.chapterCount} chapters ·{' '}
                              {work.status} · {work.language}
                            </span>
                          </span>
                        </a>
                        <div className="discover-work-actions">
                          <div>
                            {work.tags.map((tag) => (
                              <button
                                key={tag}
                                onClick={() => searchFor(tag)}
                                type="button"
                              >
                                #{tag}
                              </button>
                            ))}
                          </div>
                          <MotusShare
                            title={work.title}
                            creator={work.creator}
                            description={work.description}
                            path={`/read/${work.slug}`}
                            tags={work.tags}
                            compact
                          />
                          <button
                            aria-label={`${followedWorks.has(work.slug) ? 'Unfollow' : 'Follow'} ${work.title}`}
                            aria-pressed={followedWorks.has(work.slug)}
                            disabled={!hydrated}
                            onClick={() => toggleWorkFollow(work.slug)}
                            type="button"
                          >
                            {followedWorks.has(work.slug) ? (
                              <Check />
                            ) : (
                              <Heart />
                            )}
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="discover-empty">
                    <Search aria-hidden="true" />
                    <h3>
                      {MOTUS_LIBRARY_WORKS.length
                        ? 'No works match these filters.'
                        : 'The public archive is empty.'}
                    </h3>
                    <p>
                      {MOTUS_LIBRARY_WORKS.length
                        ? 'Clear the filters or search another title, creator, or tag.'
                        : 'Start with your own work, or open a reader edition shared by its creator.'}
                    </p>
                    {hasFilters ? (
                      <Button onClick={clearFilters}>Clear filters</Button>
                    ) : null}
                    <a className="motus-create-link" href="/studio?new=1">
                      Create a work <ArrowRight aria-hidden="true" />
                    </a>
                  </div>
                )}
              </section>
            </div>
          </>
        ) : null}

        {entity === 'creators' ? (
          <section
            className="discover-results"
            aria-labelledby="creator-results-title"
          >
            <header>
              <div>
                <span>CREATORS</span>
                <h2 id="creator-results-title">
                  Meet the people behind the work
                </h2>
              </div>
              <output>{creators.length} creators</output>
            </header>
            {!creators.length ? (
              <div className="discover-empty">
                <Users aria-hidden="true" />
                <h3>
                  {MOTUS_LIBRARY_CREATORS.length
                    ? 'No creators found.'
                    : 'No public creator profiles yet.'}
                </h3>
                <p>
                  {MOTUS_LIBRARY_CREATORS.length
                    ? 'Try a different name.'
                    : 'This directory will contain real people. Public registration is not available yet.'}
                </p>
                {hasFilters ? (
                  <Button onClick={clearFilters}>Clear filters</Button>
                ) : null}
                <a className="motus-create-link" href="/studio">
                  Open Studio <ArrowRight aria-hidden="true" />
                </a>
              </div>
            ) : null}
            <div className="discover-creator-grid">
              {creators.map((creator) => (
                <article key={creator.id}>
                  <a
                    aria-label={`Open ${creator.name}'s profile`}
                    className="discover-creator-avatar"
                    href={`/creator/${creator.routeHandle}`}
                    style={{ background: creator.banner }}
                  >
                    {creator.name
                      .split(' ')
                      .map((part) => part[0])
                      .join('')}
                  </a>
                  <div>
                    <strong>
                      <a href={`/creator/${creator.routeHandle}`}>
                        {creator.name}
                      </a>
                    </strong>
                    <span>{creator.displayHandle}</span>
                    <p>{creator.genres.join(' · ')}</p>
                    <small>
                      {creator.workCount} published work
                      {creator.workCount === 1 ? '' : 's'}
                    </small>
                  </div>
                  <Button
                    aria-label={`${followedCreators.has(creator.id) ? 'Unfollow' : 'Follow'} ${creator.name}`}
                    aria-pressed={followedCreators.has(creator.id)}
                    disabled={!hydrated}
                    onClick={() => toggleCreatorFollow(creator.id)}
                    size="sm"
                    variant={
                      followedCreators.has(creator.id) ? 'secondary' : 'outline'
                    }
                  >
                    {followedCreators.has(creator.id) ? <Check /> : <Heart />}
                    {followedCreators.has(creator.id) ? 'Following' : 'Follow'}
                  </Button>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {entity === 'communities' ? (
          <section
            className="discover-results"
            aria-labelledby="community-results-title"
          >
            <header>
              <div>
                <span>COMMUNITIES</span>
                <h2 id="community-results-title">
                  Archives built around shared work
                </h2>
              </div>
              <output>{communities.length} communities</output>
            </header>
            {!communities.length ? (
              <div className="discover-empty">
                <Users aria-hidden="true" />
                <h3>No communities yet.</h3>
                <p>
                  Communities will be created by real members when registration
                  is available.
                </p>
                {hasFilters ? (
                  <Button onClick={clearFilters}>Clear filters</Button>
                ) : (
                  <a href="/studio">
                    Open Studio <ArrowRight aria-hidden="true" />
                  </a>
                )}
              </div>
            ) : null}
            <div className="discover-community-grid">
              {communities.map((community) => {
                const featuredWorks = getLibraryWorksForCommunity(
                  community.slug,
                );
                return (
                  <article key={community.slug}>
                    <span
                      aria-hidden="true"
                      className="discover-community-mark"
                      style={{ background: community.palette }}
                    >
                      <Users />
                    </span>
                    <div>
                      <span>{community.privacy}</span>
                      <h3>{community.name}</h3>
                      <p>{community.description}</p>
                      <small>{featuredWorks.length} featured works</small>
                    </div>
                    <a
                      href={`/discover?entity=works&community=${community.slug}`}
                    >
                      See featured works <ArrowRight />
                    </a>
                  </article>
                );
              })}
            </div>
          </section>
        ) : null}

        {entity === 'tags' ||
        entity === 'fandoms' ||
        entity === 'characters' ? (
          <section
            className="discover-results"
            aria-labelledby="token-results-title"
          >
            <header>
              <div>
                <span>{ENTITY_LABELS[entity].toLocaleUpperCase()}</span>
                <h2 id="token-results-title">Browse the catalog by meaning</h2>
              </div>
              <output>{tokenResults.length} results</output>
            </header>
            {tokenResults.length ? (
              <div className="discover-token-grid">
                {tokenResults.map(([value, count]) => (
                  <button
                    key={value}
                    onClick={() => searchFor(value)}
                    type="button"
                  >
                    <span>{entity === 'tags' ? `#${value}` : value}</span>
                    <small>
                      {count} work{count === 1 ? '' : 's'}
                    </small>
                    <ArrowRight />
                  </button>
                ))}
              </div>
            ) : (
              <div className="discover-empty">
                <Search />
                <h3>No {ENTITY_LABELS[entity].toLocaleLowerCase()} found.</h3>
                {query ? (
                  <Button onClick={() => setQuery('')}>Clear search</Button>
                ) : (
                  <a href="/read/import">
                    Open a shared edition <ArrowRight aria-hidden="true" />
                  </a>
                )}
              </div>
            )}
          </section>
        ) : null}
      </main>
    </div>
  );
}
