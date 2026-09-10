/* oxlint-disable next/no-html-link-for-pages -- Public navigation uses stable shareable URLs. */
/* oxlint-disable next/no-img-element -- Comic covers are validated uploaded data URLs. */
'use client';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { usePlatform } from './motus-platform-provider';
import { BackendNotice, MotusPlatformShell } from './motus-platform-header';
import {
  filterPlatformWorks,
  normalizeHandle,
  validateHandle,
  type PlatformWork,
  type PlatformProfile,
  type PlatformCommunity,
} from '@/lib/motus-platform';
import { basicStore, type BasicComic } from '@/lib/motus-basic';
import { loadEdition } from '@/lib/motus-platform-client';
import { BasicReader } from './motus-basic';

function useRecords<T>(
  table: string,
  column?: string,
  value?: string,
  refresh = 0,
) {
  const { client, loading: connecting } = usePlatform();
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    // oxlint-disable-next-line react/react-compiler -- Reset cached remote records when the query identity changes.
    setRows([]);
    setError('');
    if (!client) {
      setLoading(connecting);
      return;
    }
    setLoading(true);
    async function fetchRows() {
      let query = client!.from(table).select('*');
      if (column && value) query = query.eq(column, value);
      const result = await query
        .order(table === 'works' ? 'updated_at' : 'created_at', {
          ascending: false,
        })
        .limit(500);
      if (!active) return;
      if (result.error) setError(result.error.message);
      else setRows(result.data as T[]);
      setLoading(false);
    }
    void fetchRows().catch((e) => {
      if (active) {
        setError((e as Error).message);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [client, connecting, table, column, value, refresh]);
  return { rows, loading, error };
}
function Page({
  active,
  eyebrow,
  title,
  description,
  children,
}: {
  active: string;
  eyebrow?: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <MotusPlatformShell active={active}>
      <main className="platform-main">
        <div className="platform-heading">
          <p className="basic-eyebrow">{eyebrow || 'THE MOTUS COMMUNITY'}</p>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <BackendNotice />
        {children}
      </main>
    </MotusPlatformShell>
  );
}
function State({
  loading,
  error,
  empty,
  children,
}: {
  loading: boolean;
  error: string;
  empty: boolean;
  children: ReactNode;
}) {
  return loading ? (
    <output className="platform-notice">Loading…</output>
  ) : error ? (
    <p className="platform-notice">{error}</p>
  ) : empty ? (
    <div className="platform-empty">
      <h2>A space for your next story</h2>
      <p>
        Nothing here yet. Published comics and community activity will appear
        here.
      </p>
    </div>
  ) : (
    children
  );
}
export function WorkList({
  works,
  controls,
}: {
  works: PlatformWork[];
  controls?: (work: PlatformWork) => ReactNode;
}) {
  return (
    <div className="platform-works">
      {works.map((work) => (
        <article className="platform-work" key={work.id}>
          <a
            href={`/comic/${work.id}`}
            className="platform-cover"
            aria-label={`Read ${work.title}`}
          >
            {work.cover ? (
              <img src={work.cover} alt="" loading="lazy" />
            ) : (
              <span>M</span>
            )}
          </a>
          <div>
            <div className="platform-work-meta">
              {work.rating} · {work.status} · {work.page_count}{' '}
              {work.page_count === 1 ? 'page' : 'pages'}
              {work.animated ? ' · Animated' : ''}
              {!work.published && ' · Unpublished'}
            </div>
            <h2>
              <a href={`/comic/${work.id}`}>{work.title}</a>
            </h2>
            <p className="platform-byline">by {work.author}</p>
            <p className="platform-summary">{work.summary}</p>
            <div className="platform-tags">
              {work.tags.map((tag) => (
                <a key={tag} href={`/browse?q=${encodeURIComponent(tag)}`}>
                  {tag}
                </a>
              ))}
            </div>
            <small>
              {work.language} · Updated{' '}
              {new Date(work.updated_at).toLocaleDateString('en-GB')}
            </small>
            {controls?.(work)}
          </div>
        </article>
      ))}
    </div>
  );
}
export function MotusBrowse() {
  const { rows, loading, error } = useRecords<PlatformWork>(
    'works',
    'published',
    'true',
  );
  const [search, setSearch] = useState('');
  const [rating, setRating] = useState('all');
  const [format, setFormat] = useState('all');
  const [language, setLanguage] = useState('all');
  useEffect(() => {
    // oxlint-disable-next-line react/react-compiler -- Read the browser URL after hydration.
    setSearch(new URLSearchParams(window.location.search).get('q') || '');
  }, []);
  const shown = filterPlatformWorks(rows, search, rating, format, language);
  return (
    <Page
      active="browse"
      eyebrow="COMICS, WITH A LITTLE MOTION"
      title="Find your next story."
      description="An open archive for comics and their creators. Read, share, and add a little movement."
    >
      <div className="platform-actions">
        <a className="basic-primary" href="/create">
          Upload & animate
        </a>
        <a href="/communities">Explore communities →</a>
      </div>
      <form className="platform-filters" onSubmit={(e) => e.preventDefault()}>
        <label>
          Search the archive
          <input
            type="search"
            placeholder="Title, creator, tag, or summary"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <label>
          Rating
          <select value={rating} onChange={(e) => setRating(e.target.value)}>
            {['all', 'General', 'Teen', 'Mature', 'Explicit'].map((v) => (
              <option key={v} value={v}>
                {v === 'all' ? 'All ratings' : v}
              </option>
            ))}
          </select>
        </label>
        <label>
          Display
          <select value={format} onChange={(e) => setFormat(e.target.value)}>
            {[
              ['all', 'All layouts'],
              ['scroll', 'Vertical scroll'],
              ['page', 'Single page'],
              ['spread', 'Two-page spread'],
            ].map(([v, label]) => (
              <option key={v} value={v}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Language
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="all">All languages</option>
            {[...new Set(rows.map((w) => w.language))].sort().map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
      </form>
      <p className="basic-muted">
        {shown.length} {shown.length === 1 ? 'work' : 'works'} · Most recently
        updated{rows.length === 500 ? ' · Showing the latest 500 works' : ''}
      </p>
      <State loading={loading} error={error} empty={!shown.length}>
        <WorkList works={shown} />
      </State>
    </Page>
  );
}
export function MotusCreators({ handle }: { handle?: string }) {
  const { client, user } = usePlatform();
  const creators = useRecords<PlatformProfile>(
    'profiles',
    handle ? 'handle' : undefined,
    handle,
  );
  const creator = handle ? creators.rows[0] : null;
  const works = useRecords<PlatformWork>(
    'works',
    creator ? 'owner_id' : 'published',
    creator?.id || 'true',
  );
  const [search, setSearch] = useState('');
  const [following, setFollowing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  useEffect(() => {
    let active = true;
    // oxlint-disable-next-line react/react-compiler -- Reset remote follow state when viewing a different creator.
    setFollowing(false);
    if (client && user && creator)
      void client
        .from('creator_follows')
        .select('creator_id')
        .eq('user_id', user.id)
        .eq('creator_id', creator.id)
        .maybeSingle()
        .then((r) => {
          if (active) {
            if (r.error) setNotice(r.error.message);
            else setFollowing(!!r.data);
          }
        });
    return () => {
      active = false;
    };
  }, [client, user, creator]);
  async function follow() {
    if (!client || !user || !creator) return;
    setBusy(true);
    try {
      const result = following
        ? await client
            .from('creator_follows')
            .delete()
            .eq('user_id', user.id)
            .eq('creator_id', creator.id)
        : await client
            .from('creator_follows')
            .insert({ user_id: user.id, creator_id: creator.id });
      if (result.error) throw result.error;
      setFollowing(!following);
    } catch (e) {
      setNotice((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const shown = creators.rows.filter((p) =>
    `${p.handle} ${p.display_name} ${p.bio}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  return (
    <Page
      active="creators"
      title={
        creator?.display_name ||
        (handle ? 'Creator profile' : 'Meet the creators')
      }
      description={
        creator
          ? `@${creator.handle}`
          : 'Find the people behind your favorite stories.'
      }
    >
      {notice && <output className="platform-notice">{notice}</output>}
      <State
        loading={creators.loading}
        error={creators.error}
        empty={!creators.rows.length}
      >
        {creator ? (
          <>
            <section className="platform-panel">
              <p className="platform-preserve">
                {creator.bio || 'This creator has not added a bio yet.'}
              </p>
              {user?.id === creator.id ? (
                <a href="/account">Edit profile</a>
              ) : user ? (
                <button disabled={busy} onClick={() => void follow()}>
                  {following ? 'Unfollow creator' : 'Follow creator'}
                </button>
              ) : (
                <a href="/account">Sign in to follow</a>
              )}
            </section>
            <h2>Published comics</h2>
            <State
              loading={works.loading}
              error={works.error}
              empty={!works.rows.filter((w) => w.published).length}
            >
              <WorkList works={works.rows.filter((w) => w.published)} />
            </State>
          </>
        ) : (
          <>
            <label className="platform-search">
              Find a creator
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name or handle"
              />
            </label>
            <div className="platform-grid">
              {shown.map((p) => (
                <a
                  className="platform-panel platform-directory-card"
                  key={p.id}
                  href={`/creators/${p.handle}`}
                >
                  <span className="platform-avatar">
                    {p.display_name.slice(0, 1).toUpperCase()}
                  </span>
                  <h2>{p.display_name}</h2>
                  <small>@{p.handle}</small>
                  <p>{p.bio.slice(0, 160)}</p>
                </a>
              ))}
            </div>
            {!shown.length && <p>No matching creators.</p>}
          </>
        )}
      </State>
    </Page>
  );
}
export function MotusCommunities({ slug }: { slug?: string }) {
  const { client, user, profile } = usePlatform();
  const [refresh, setRefresh] = useState(0);
  const data = useRecords<PlatformCommunity>(
    'communities',
    slug ? 'slug' : undefined,
    slug,
    refresh,
  );
  const community = slug ? data.rows[0] : null;
  const works = useRecords<PlatformWork>(
    'works',
    community ? 'community_id' : 'published',
    community?.id || 'true',
  );
  const [joined, setJoined] = useState(false);
  const [members, setMembers] = useState(0);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [editing, setEditing] = useState(false);
  const [search, setSearch] = useState('');
  const [name, setName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [description, setDescription] = useState('');
  const [rules, setRules] = useState('');
  useEffect(() => {
    let active = true;
    // oxlint-disable-next-line react/react-compiler -- Reset membership state when the remote community or session changes.
    setJoined(false);
    setMembers(0);
    if (client && community) {
      void client
        .from('community_members')
        .select('user_id', { count: 'exact' })
        .eq('community_id', community.id)
        .then((r) => {
          if (active) {
            if (r.error) setNotice(r.error.message);
            else {
              setMembers(r.count || 0);
              setJoined((r.data || []).some((m) => m.user_id === user?.id));
            }
          }
        });
    }
    return () => {
      active = false;
    };
  }, [client, community, user, refresh]);
  async function run(action: () => Promise<void>) {
    setBusy(true);
    setNotice('');
    try {
      await action();
      setRefresh((v) => v + 1);
    } catch (e) {
      setNotice((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const owner = !!community && user?.id === community.owner_id;
  return (
    <Page
      active="communities"
      title={community?.name || (slug ? 'Community' : 'Find your people.')}
      description={
        community?.description ||
        'Gather around a genre, a fandom, or a shared love of comics.'
      }
    >
      {notice && <output className="platform-notice">{notice}</output>}
      {!slug && (
        <div className="platform-actions">
          {profile ? (
            <button
              className="basic-primary"
              onClick={() => setEditing(!editing)}
            >
              Create a community
            </button>
          ) : (
            <a href="/account">
              Set up your account to create or join a community
            </a>
          )}
        </div>
      )}
      {editing && (
        <section className="platform-panel">
          <h2>{community ? 'Edit community' : 'A new community'}</h2>
          <form
            className="platform-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (!client || !user) return;
              void run(async () => {
                const invalid = validateHandle(newSlug);
                if (invalid) throw new Error(invalid);
                const values = {
                  name: name.trim(),
                  slug: newSlug,
                  description: description.trim(),
                  rules: rules.trim(),
                  owner_id: user.id,
                };
                const result = community
                  ? await client
                      .from('communities')
                      .update(values)
                      .eq('id', community.id)
                      .select()
                      .single()
                  : await client
                      .from('communities')
                      .insert(values)
                      .select()
                      .single();
                if (result.error)
                  throw new Error(
                    result.error.code === '23505'
                      ? 'That community address is already in use.'
                      : result.error.message,
                  );
                if (!community) {
                  const membership = await client
                    .from('community_members')
                    .insert({ community_id: result.data.id, user_id: user.id });
                  if (membership.error) {
                    window.location.assign(`/communities/${result.data.slug}`);
                    return;
                  }
                }
                window.location.assign(`/communities/${result.data.slug}`);
              });
            }}
          >
            <label>
              Name
              <input
                required
                maxLength={80}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label>
              Community address
              <input
                required
                minLength={3}
                maxLength={30}
                pattern="[a-z][a-z0-9_]{2,29}"
                value={newSlug}
                onChange={(e) => setNewSlug(normalizeHandle(e.target.value))}
              />
            </label>
            <label>
              Description
              <textarea
                maxLength={3000}
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>
            <label>
              Community rules
              <textarea
                maxLength={5000}
                rows={4}
                value={rules}
                onChange={(e) => setRules(e.target.value)}
              />
            </label>
            <div className="platform-actions">
              <button className="basic-primary" disabled={busy}>
                Save community
              </button>
              <button type="button" onClick={() => setEditing(false)}>
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}
      <State
        loading={data.loading}
        error={data.error}
        empty={!data.rows.length}
      >
        {community ? (
          <>
            <section className="platform-panel">
              <div className="platform-row">
                <p>
                  {members} {members === 1 ? 'member' : 'members'}
                </p>
                <div className="platform-actions">
                  {profile && !owner && (
                    <button
                      disabled={busy}
                      onClick={() =>
                        void run(async () => {
                          const result = joined
                            ? await client!
                                .from('community_members')
                                .delete()
                                .eq('community_id', community.id)
                                .eq('user_id', user!.id)
                            : await client!.from('community_members').insert({
                                community_id: community.id,
                                user_id: user!.id,
                              });
                          if (result.error) throw result.error;
                        })
                      }
                    >
                      {joined ? 'Leave community' : 'Join community'}
                    </button>
                  )}
                  {owner && (
                    <button
                      onClick={() => {
                        setName(community.name);
                        setNewSlug(community.slug);
                        setDescription(community.description);
                        setRules(community.rules);
                        setEditing(true);
                      }}
                    >
                      Edit community
                    </button>
                  )}
                  {!profile && <a href="/account">Sign in to join</a>}
                  {(owner || joined) && (
                    <a href="/create">Publish a comic here</a>
                  )}
                </div>
              </div>
              <h2>Community rules</h2>
              <p className="platform-preserve">
                {community.rules ||
                  'Be considerate. Share work you have permission to publish and choose an accurate content rating.'}
              </p>
            </section>
            <h2>Community comics</h2>
            <State
              loading={works.loading}
              error={works.error}
              empty={!works.rows.filter((w) => w.published).length}
            >
              <WorkList works={works.rows.filter((w) => w.published)} />
            </State>
          </>
        ) : (
          <>
            <label className="platform-search">
              Search communities
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name, genre, or fandom"
              />
            </label>
            <div className="platform-grid">
              {data.rows
                .filter((c) =>
                  `${c.name} ${c.description}`
                    .toLowerCase()
                    .includes(search.toLowerCase()),
                )
                .map((c) => (
                  <a
                    className="platform-panel platform-directory-card"
                    key={c.id}
                    href={`/communities/${c.slug}`}
                  >
                    <h2>{c.name}</h2>
                    <p>{c.description.slice(0, 220)}</p>
                    <span>Visit community →</span>
                  </a>
                ))}
            </div>
          </>
        )}
      </State>
    </Page>
  );
}

export function MotusLibrary() {
  const { client, user } = usePlatform();
  const [tab, setTab] = useState('publications');
  const [works, setWorks] = useState<PlatformWork[]>([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let active = true;
    // oxlint-disable-next-line react/react-compiler -- Clear private records when the external session or selected library changes.
    setWorks([]);
    if (!client || !user) return;
    setLoading(true);
    setNotice('');
    async function fetchLibrary() {
      let query = client!.from('works').select('*');
      if (tab === 'publications') query = query.eq('owner_id', user!.id);
      else {
        const relation = tab === 'bookmarks' ? 'bookmarks' : 'creator_follows';
        const ids = await client!
          .from(relation)
          .select('*')
          .eq('user_id', user!.id);
        if (ids.error) throw ids.error;
        const keys = (ids.data || []).map((row) =>
          String(row[tab === 'bookmarks' ? 'work_id' : 'creator_id']),
        );
        if (!keys.length) {
          if (active) setWorks([]);
          return;
        }
        query = query
          .in(tab === 'bookmarks' ? 'id' : 'owner_id', keys)
          .eq('published', true);
      }
      const result = await query
        .order('updated_at', { ascending: false })
        .limit(500);
      if (result.error) throw result.error;
      if (active) setWorks(result.data as PlatformWork[]);
    }
    void fetchLibrary()
      .catch((e) => {
        if (active) setNotice((e as Error).message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [client, user, tab, refresh]);
  async function unpublish(work: PlatformWork) {
    setBusy(true);
    try {
      const result = await client!
        .from('works')
        .update({ published: false, community_id: null })
        .eq('id', work.id)
        .eq('owner_id', user!.id);
      if (result.error) throw result.error;
      setNotice('Comic unpublished. It is now visible only to you.');
      setRefresh((v) => v + 1);
    } catch (e) {
      setNotice((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function edit(work: PlatformWork) {
    setBusy(true);
    try {
      const comic = await loadEdition(client!, work);
      const local = await basicStore('list');
      if (!local.some((c) => c.id === comic.id))
        await basicStore('save', { ...comic, archived: true });
      window.location.assign(`/create?edit=${work.id}`);
    } catch (e) {
      setNotice((e as Error).message);
      setBusy(false);
    }
  }
  return (
    <Page
      active="library"
      eyebrow="YOUR READING & CREATING SPACE"
      title="My library"
      description="Your published comics, bookmarks, and updates from creators you follow."
    >
      <section className="platform-panel platform-row">
        <div>
          <h2>Drafts on this device</h2>
          <p>
            Your existing comics are still here. Open a draft or start something
            new.
          </p>
        </div>
        <a className="basic-primary" href="/create">
          Open drafts & editor
        </a>
      </section>
      {!user ? (
        <p className="platform-notice">
          <a href="/account">Sign in</a> to see your online library.
        </p>
      ) : (
        <>
          <div className="platform-tabs">
            {[
              ['publications', 'My comics'],
              ['bookmarks', 'Bookmarks'],
              ['following', 'Following'],
            ].map(([value, label]) => (
              <button
                key={value}
                aria-pressed={tab === value}
                onClick={() => setTab(value)}
              >
                {label}
              </button>
            ))}
          </div>
          {notice && <output className="platform-notice">{notice}</output>}
          <State loading={loading} error="" empty={!works.length}>
            <WorkList
              works={works}
              controls={(work) =>
                tab === 'publications' ? (
                  <div className="platform-actions">
                    <button disabled={busy} onClick={() => void edit(work)}>
                      Edit comic
                    </button>
                    {work.published && (
                      <button
                        disabled={busy}
                        onClick={() => void unpublish(work)}
                      >
                        Unpublish
                      </button>
                    )}
                  </div>
                ) : null
              }
            />
          </State>
        </>
      )}
    </Page>
  );
}
export function MotusComic({ id }: { id: string }) {
  const { client, user } = usePlatform();
  const data = useRecords<PlatformWork>('works', 'id', id);
  const work = data.rows[0];
  const [comic, setComic] = useState<BasicComic | null>(null);
  const [notice, setNotice] = useState('');
  const [bookmarked, setBookmarked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reading, setReading] = useState(false);
  const [report, setReport] = useState(false);
  const [reason, setReason] = useState('');
  const [creator, setCreator] = useState<PlatformProfile | null>(null);
  useEffect(() => {
    let active = true;
    // oxlint-disable-next-line react/react-compiler -- Reset remote creator and bookmark state for the selected work.
    setCreator(null);
    setBookmarked(false);
    if (client && work) {
      void client
        .from('profiles')
        .select('*')
        .eq('id', work.owner_id)
        .single()
        .then((r) => {
          if (active && r.data) setCreator(r.data as PlatformProfile);
        });
      if (user)
        void client
          .from('bookmarks')
          .select('work_id')
          .eq('user_id', user.id)
          .eq('work_id', id)
          .maybeSingle()
          .then((r) => {
            if (active) {
              if (r.error) setNotice(r.error.message);
              else setBookmarked(!!r.data);
            }
          });
    }
    return () => {
      active = false;
    };
  }, [client, user, work, id]);
  const run = useCallback(async (action: () => Promise<void>) => {
    setBusy(true);
    setNotice('');
    try {
      await action();
    } catch (e) {
      setNotice((e as Error).message);
    } finally {
      setBusy(false);
    }
  }, []);
  if (reading && comic)
    return (
      <MotusPlatformShell active="browse">
        <BasicReader comic={comic} close={() => setReading(false)} />
      </MotusPlatformShell>
    );
  return (
    <Page
      active="browse"
      title={work?.title || 'Comic'}
      description={
        work ? `by ${work.author}` : 'A story from the Motus archive.'
      }
    >
      <State loading={data.loading} error={data.error} empty={!work}>
        {work && (
          <>
            <WorkList works={[work]} />
            {creator && (
              <a href={`/creators/${creator.handle}`}>
                More by {creator.display_name} →
              </a>
            )}
            <div className="platform-actions">
              <button
                className="basic-primary"
                disabled={busy}
                onClick={() =>
                  void run(async () => {
                    if (!comic) setComic(await loadEdition(client!, work));
                    setReading(true);
                  })
                }
              >
                {busy ? 'Please wait…' : 'Read comic'}
              </button>
              {user ? (
                <>
                  <button
                    disabled={busy}
                    onClick={() =>
                      void run(async () => {
                        const result = bookmarked
                          ? await client!
                              .from('bookmarks')
                              .delete()
                              .eq('user_id', user.id)
                              .eq('work_id', id)
                          : await client!
                              .from('bookmarks')
                              .insert({ user_id: user.id, work_id: id });
                        if (result.error) throw result.error;
                        setBookmarked(!bookmarked);
                      })
                    }
                  >
                    {bookmarked ? 'Remove bookmark' : 'Bookmark'}
                  </button>
                  <button onClick={() => setReport(!report)}>
                    Report a concern
                  </button>
                </>
              ) : (
                <a href="/account">Sign in to bookmark</a>
              )}
              <button
                onClick={() =>
                  void run(async () => {
                    await navigator.clipboard.writeText(window.location.href);
                    setNotice('Link copied.');
                  })
                }
              >
                Copy link
              </button>
            </div>
            {report && user && (
              <form
                className="platform-panel platform-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  void run(async () => {
                    const result = await client!
                      .from('content_reports')
                      .insert({
                        reporter_id: user.id,
                        work_id: id,
                        reason: reason.trim(),
                      });
                    if (result.error)
                      throw new Error(
                        result.error.code === '23505'
                          ? 'You have already reported this comic.'
                          : result.error.message,
                      );
                    setReport(false);
                    setReason('');
                    setNotice('Report submitted for review.');
                  });
                }}
              >
                <label>
                  What should we review?
                  <textarea
                    minLength={10}
                    maxLength={2000}
                    required
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </label>
                <button disabled={busy}>Submit report</button>
              </form>
            )}
            {notice && <output className="platform-notice">{notice}</output>}
          </>
        )}
      </State>
    </Page>
  );
}
