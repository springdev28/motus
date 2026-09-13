/* oxlint-disable next/no-html-link-for-pages -- The archive has a stable entry route. */
/* oxlint-disable next/no-img-element -- Uploaded data URLs render at their original proportions without a server image loader. */
'use client';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  Copy,
  Download,
  ImagePlus,
  Plus,
  Search,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import { MotusPlatformHeader } from './motus-platform-header';
import { usePlatform } from './motus-platform-provider';
import { MotusPublishDialog } from './motus-publish-dialog';
import { MotusPageTurn } from './motus-page-turn';
import {
  BASIC_DB,
  EFFECTS,
  basicStore,
  createBasicSaveQueue,
  blankComic,
  duplicateBasicPage,
  readingPageStart,
  effectFrames,
  parseBasicComic,
  type BasicComic,
  type BasicLayer,
  type BasicPage,
} from '@/lib/motus-basic';
import { isPdf, readPdfPages } from '@/lib/motus-pdf';
import '@/app/motus-basic.css';

const labels = {
  none: 'None',
  fade: 'Fade in',
  'fly-left': 'Fly in · left',
  'fly-up': 'Fly in · up',
  zoom: 'Zoom in',
  pulse: 'Pulse',
  spin: 'Gentle spin',
  'fade-out': 'Fade out',
};
const formats = {
  scroll: 'Vertical scroll',
  page: 'Single page',
  spread: 'Two-page spread',
};
function download(comic: BasicComic) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(comic)], { type: 'application/json' }),
  );
  const a = document.createElement('a');
  a.href = url;
  a.download = `${comic.title.replace(/[^a-z0-9-]/gi, '-').slice(0, 60) || 'untitled'}.motus-basic.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
async function readImage(
  file: File,
): Promise<{ src: string; width: number; height: number }> {
  if (
    !['image/png', 'image/jpeg', 'image/webp'].includes(file.type) ||
    file.size > 10_000_000
  )
    throw new Error(`${file.name}: use PNG, JPG, or WebP under 10 MB.`);
  const src = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(typeof r.result === 'string' ? r.result : '');
    r.onerror = () => reject(new Error('Could not read image.'));
    r.readAsDataURL(file);
  });
  const image = new Image();
  image.src = src;
  try {
    await image.decode();
  } catch {
    throw new Error(`${file.name} could not be opened as an image.`);
  }
  if (
    !image.naturalWidth ||
    !image.naturalHeight ||
    image.naturalWidth > 12000 ||
    image.naturalHeight > 12000 ||
    image.naturalWidth * image.naturalHeight > 40_000_000
  )
    throw new Error(
      'Images must be under 12,000 pixels per side and 40 megapixels.',
    );
  return { src, width: image.naturalWidth, height: image.naturalHeight };
}
function AnimatedLayer({
  layer,
  playing,
  snapshot,
}: {
  layer: BasicLayer;
  playing: boolean;
  snapshot: boolean;
}) {
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const img = ref.current;
    if (!img || !playing || snapshot || layer.effect === 'none') return;
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    let animation: Animation | undefined;
    const play = () => {
      animation?.cancel();
      if (!media.matches)
        animation = img.animate(effectFrames(layer.effect), {
          duration: layer.duration * 1000,
          delay: layer.delay * 1000,
          easing: 'ease-in-out',
          fill: 'both',
        });
    };
    const change = () => {
      if (media.matches) animation?.cancel();
    };
    media.addEventListener('change', change);
    const button = img.parentElement;
    let observer: IntersectionObserver | undefined;
    if (layer.trigger === 'enter') {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            play();
            observer?.disconnect();
          }
        },
        { threshold: 0 },
      );
      observer.observe(img);
    } else button?.addEventListener('click', play);
    return () => {
      observer?.disconnect();
      animation?.cancel();
      button?.removeEventListener('click', play);
      media.removeEventListener('change', change);
    };
  }, [layer, playing, snapshot]);
  const style: CSSProperties = {
    left: `${layer.x}%`,
    top: `${layer.y}%`,
    width: `${layer.width}%`,
    height: `${layer.height}%`,
  };
  const img = (
    <img ref={ref} src={layer.src} alt={layer.name} draggable={false} />
  );
  return layer.trigger === 'click' && playing && !snapshot ? (
    <button
      className="basic-layer basic-click-layer"
      style={style}
      aria-label={`Play ${layer.name} animation`}
    >
      {img}
    </button>
  ) : (
    <div className="basic-layer" style={style}>
      {img}
    </div>
  );
}
function ComicPage({
  page,
  playing = true,
  snapshot = false,
}: {
  page: BasicPage;
  playing?: boolean;
  snapshot?: boolean;
}) {
  return (
    <div
      className="basic-page"
      style={{
        aspectRatio: `${page.width}/${page.height}`,
        background: page.background,
      }}
    >
      {page.layers.map((layer) => (
        <AnimatedLayer
          key={layer.id}
          layer={layer}
          playing={playing}
          snapshot={snapshot}
        />
      ))}
    </div>
  );
}
export function BasicReader({
  comic,
  close,
}: {
  comic: BasicComic;
  close: () => void;
}) {
  const { preferences } = usePlatform();
  const direction =
    preferences.direction === 'creator'
      ? comic.direction
      : preferences.direction;
  const [mode, setMode] = useState(
    preferences.format === 'creator' ? comic.format : preferences.format,
  );
  const [index, setIndex] = useState(0);
  const [session, setSession] = useState(0);
  const [playing, setPlaying] = useState(preferences.motion);
  const [forward, setForward] = useState(true);
  const step = mode === 'spread' ? 2 : 1;
  const scrollArea = useRef<HTMLDivElement>(null);
  const pendingScrollPage = useRef<number | null>(null);
  useEffect(() => {
    // oxlint-disable-next-line react/react-compiler -- Apply changed account reading preferences to the open reader.
    setMode(
      preferences.format === 'creator' ? comic.format : preferences.format,
    );
    setPlaying(preferences.motion);
  }, [preferences.format, preferences.motion, comic.format]);
  useEffect(() => {
    if (pendingScrollPage.current !== null && mode === 'scroll') {
      scrollArea.current
        ?.querySelector(`[data-page="${pendingScrollPage.current}"]`)
        ?.scrollIntoView({ block: 'start' });
      pendingScrollPage.current = null;
      return;
    }
    if (!preferences.rememberPosition) return;
    try {
      const stored = Number(
        localStorage.getItem(`motus:reading-position:${comic.id}`),
      );
      if (Number.isFinite(stored)) {
        // oxlint-disable-next-line react/react-compiler -- Restore reading progress from browser storage after hydration.
        setIndex(
          Math.max(
            0,
            Math.floor(Math.min(comic.pages.length - 1, stored) / step) * step,
          ),
        );
        if (mode === 'scroll' && stored > 0)
          scrollArea.current
            ?.querySelector(
              `[data-page="${Math.min(comic.pages.length - 1, Math.floor(stored))}"]`,
            )
            ?.scrollIntoView({ block: 'start' });
      }
    } catch {
      /* Reading remains available without browser storage. */
    }
  }, [comic.id, comic.pages.length, preferences.rememberPosition, mode, step]);
  useEffect(() => {
    // oxlint-disable-next-line react/react-compiler -- Normalize the selected page when switching to a two-page spread.
    setIndex((i) => Math.max(0, Math.floor(i / step) * step));
  }, [step]);
  const savePosition = (value: number) => {
    if (!preferences.rememberPosition) return;
    try {
      localStorage.setItem(`motus:reading-position:${comic.id}`, String(value));
    } catch {
      /* Progress persistence is optional. */
    }
  };
  useEffect(() => {
    if (mode !== 'scroll') return;
    const area = scrollArea.current;
    if (!area) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (a, b) => a.boundingClientRect.top - b.boundingClientRect.top,
          )[0];
        if (!visible) return;
        const current = Number((visible.target as HTMLElement).dataset.page);
        if (Number.isFinite(current)) {
          setIndex(current);
          try {
            if (preferences.rememberPosition)
              localStorage.setItem(
                `motus:reading-position:${comic.id}`,
                String(current),
              );
          } catch {
            /* Reading remains available. */
          }
        }
      },
      { rootMargin: '-10% 0px -65% 0px' },
    );
    area
      .querySelectorAll('figure')
      .forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [mode, preferences.rememberPosition, comic.id, session, playing]);
  const move = (delta: number) => {
    setForward(delta > 0);
    const next = Math.max(
      0,
      Math.min(
        Math.floor((comic.pages.length - 1) / step) * step,
        index + delta * step,
      ),
    );
    setIndex(next);
    savePosition(next);
  };
  const changeMode = (value: BasicComic['format']) => {
    const next = readingPageStart(index, value, comic.pages.length);
    pendingScrollPage.current = value === 'scroll' ? next : null;
    setMode(value);
    setIndex(next);
    savePosition(next);
  };
  useEffect(() => {
    function navigate(event: KeyboardEvent) {
      if (
        mode === 'scroll' ||
        (event.target instanceof HTMLElement &&
          event.target.closest('button,input,select,textarea')) ||
        !['ArrowLeft', 'ArrowRight'].includes(event.key)
      )
        return;
      event.preventDefault();
      const delta =
        (event.key === 'ArrowRight') === (direction === 'ltr') ? 1 : -1;
      setForward(delta > 0);
      const next = Math.max(
        0,
        Math.min(
          Math.floor((comic.pages.length - 1) / step) * step,
          index + delta * step,
        ),
      );
      setIndex(next);
      if (preferences.rememberPosition) {
        try {
          localStorage.setItem(
            `motus:reading-position:${comic.id}`,
            String(next),
          );
        } catch {
          /* Reading remains available. */
        }
      }
    }
    window.addEventListener('keydown', navigate);
    return () => window.removeEventListener('keydown', navigate);
  }, [
    mode,
    direction,
    comic.pages.length,
    comic.id,
    step,
    index,
    preferences.rememberPosition,
  ]);
  return (
    <main className="basic-reader">
      <div className="basic-reader-tools">
        <button onClick={close}>← Back</button>
        <h1>{comic.title || 'Untitled comic'}</h1>
        <select
          aria-label="Reader display"
          value={mode}
          onChange={(e) => changeMode(e.target.value as BasicComic['format'])}
        >
          {Object.entries(formats).map(([v, label]) => (
            <option key={v} value={v}>
              {label}
            </option>
          ))}
        </select>
        <button onClick={() => setPlaying(!playing)}>
          {playing ? 'Turn motion off' : 'Turn motion on'}
        </button>
        <button onClick={() => setSession((s) => s + 1)}>Replay</button>
      </div>
      <div
        ref={scrollArea}
        className={`basic-reading-area ${mode === 'scroll' ? 'is-scroll' : ''}`}
        key={`${session}-${playing}`}
      >
        {mode === 'scroll' ? (
          comic.pages.map((page, i) => (
            <figure key={page.id} data-page={i}>
              <ComicPage page={page} playing={playing} />
              <figcaption>Page {i + 1}</figcaption>
            </figure>
          ))
        ) : (
          <MotusPageTurn
            pageKey={`${mode}-${index}`}
            layout={mode}
            direction={direction}
            transition={playing ? comic.transition : 'cut'}
            entryEdge={forward === (direction === 'ltr') ? 'right' : 'left'}
            durationMs={360}
            pages={comic.pages.slice(index, index + step).map((page) => (
              <ComicPage key={page.id} page={page} playing={playing} />
            ))}
          />
        )}
        {!comic.pages.length && (
          <p className="basic-empty">Upload a page to preview your comic.</p>
        )}
      </div>
      {mode !== 'scroll' && comic.pages.length > 0 && (
        <nav
          className="basic-pagination"
          aria-label="Pages"
          style={{
            flexDirection: direction === 'rtl' ? 'row-reverse' : 'row',
          }}
        >
          <button disabled={index === 0} onClick={() => move(-1)}>
            Previous
          </button>
          <span>
            Page {index + 1}
            {step === 2 && index + 1 < comic.pages.length
              ? `–${index + 2}`
              : ''}{' '}
            of {comic.pages.length}
          </span>
          <button
            disabled={index + step >= comic.pages.length}
            onClick={() => move(1)}
          >
            Next
          </button>
        </nav>
      )}
    </main>
  );
}
export function MotusBasic() {
  const { profile } = usePlatform();
  const [publishOpen, setPublishOpen] = useState(false);
  const [comics, setComics] = useState<BasicComic[]>([]);
  const [comic, setComic] = useState<BasicComic | null>(null);
  const [reader, setReader] = useState<BasicComic | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [persist] = useState(() =>
    createBasicSaveQueue((draft: BasicComic) => basicStore('save', draft)),
  );
  const latestComic = useRef<BasicComic | null>(null);
  const pendingSaves = useRef(0);
  const [dirty, setDirty] = useState(false);
  const [shelf, setShelf] = useState('drafts');
  const [search, setSearch] = useState('');
  const [rating, setRating] = useState('All ratings');
  const [format, setFormat] = useState('all');
  const [pageIndex, setPageIndex] = useState(0);
  const [layerIndex, setLayerIndex] = useState(0);
  const [preview, setPreview] = useState(false);
  const [history, setHistory] = useState<BasicComic[]>([]);
  const [future, setFuture] = useState<BasicComic[]>([]);
  const [session, setSession] = useState(0);
  const fileInput = useRef<HTMLInputElement>(null);
  const importInput = useRef<HTMLInputElement>(null);
  const layerInput = useRef<HTMLInputElement>(null);
  const page = comic?.pages[pageIndex];
  const layer = page?.layers[layerIndex];
  useEffect(() => {
    let active = true;
    basicStore('list')
      .then((items) => {
        if (active) {
          setComics(items);
          const id = new URLSearchParams(window.location.search).get('edit');
          const found = items.find((c) => c.id === id);
          if (found) setComic(structuredClone(found));
        }
      })
      .catch((e) => {
        if (active) setNotice(String(e.message));
      })
      .finally(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  useEffect(() => {
    latestComic.current = comic;
  }, [comic]);
  useEffect(() => {
    if (!comic || !dirty || busy) return;
    const snapshot = comic;
    const timer = window.setTimeout(() => {
      pendingSaves.current += 1;
      setSaving(true);
      setSaveError(false);
      void persist(snapshot)
        .then((items) => {
          setComics(items);
          if (latestComic.current === snapshot) setDirty(false);
        })
        .catch((error: Error) => {
          setSaveError(true);
          setNotice(error.message);
        })
        .finally(() => {
          pendingSaves.current -= 1;
          setSaving(pendingSaves.current > 0);
        });
    }, 700);
    return () => window.clearTimeout(timer);
  }, [comic, dirty, busy, persist]);
  function travelHistory(redo = false) {
    const target = (redo ? future : history).at(-1);
    if (!target || !comic) return;
    if (redo) {
      setFuture((items) => items.slice(0, -1));
      setHistory((items) => [...items, comic]);
    } else {
      setHistory((items) => items.slice(0, -1));
      setFuture((items) => [...items, comic]);
    }
    setComic({
      ...target,
      archived: comic.archived,
      updatedAt: new Date().toISOString(),
    });
    setPageIndex((i) => Math.min(i, Math.max(0, target.pages.length - 1)));
    setLayerIndex(0);
    setDirty(true);
    setSaveError(false);
  }
  function edit(patch: Partial<BasicComic>) {
    setFuture([]);
    setSaveError(false);
    if (comic) setHistory((items) => [...items.slice(-29), comic]);
    setComic((c) =>
      c ? { ...c, ...patch, updatedAt: new Date().toISOString() } : c,
    );
    setDirty(true);
    setNotice('');
  }
  function editPage(patch: Partial<BasicPage>) {
    if (comic && page)
      edit({
        pages: comic.pages.map((p) =>
          p.id === page.id ? { ...p, ...patch } : p,
        ),
      });
  }
  function editLayer(patch: Partial<BasicLayer>) {
    if (page && layer)
      editPage({
        layers: page.layers.map((l) =>
          l.id === layer.id ? { ...l, ...patch } : l,
        ),
      });
  }
  function openEditor(c: BasicComic) {
    setComic(
      structuredClone({
        ...c,
        author: c.author || profile?.display_name || '',
      }),
    );
    setPageIndex(0);
    setLayerIndex(0);
    setDirty(false);
    setHistory([]);
    setFuture([]);
    setSaveError(false);
    setPreview(false);
    setNotice('');
  }
  async function save(archive = false, leave = false) {
    if (!comic) return false;
    if (
      archive &&
      (!comic.title.trim() || !comic.author.trim() || !comic.pages.length)
    ) {
      setNotice(
        'Add a title, creator name, and at least one page before adding to the archive.',
      );
      return false;
    }
    setBusy(true);
    const updated = {
      ...comic,
      archived: archive || comic.archived,
      updatedAt: new Date().toISOString(),
    };
    try {
      setComics(await persist(updated));
      setSaveError(false);
      setComic(leave ? null : updated);
      setDirty(false);
      setNotice(
        archive
          ? 'Saved a local copy of your published comic.'
          : 'Saved in this browser.',
      );
      return true;
    } catch (e) {
      setNotice((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function upload(files: FileList | null, asLayer = false) {
    if (!files?.length || !comic || busy) return;
    if (
      (!asLayer && comic.pages.length + files.length > 100) ||
      (asLayer && (!page || page.layers.length + files.length > 30))
    ) {
      setNotice('Use up to 100 pages and 30 images per page.');
      return;
    }
    setBusy(true);
    setNotice('Opening pages…');
    try {
      const additions: BasicPage[] = [];
      const layers: BasicLayer[] = [];
      let dataLength = JSON.stringify(comic).length;
      for (const file of Array.from(files)) {
        const images =
          !asLayer && isPdf(file)
            ? await readPdfPages(file, {
                maxPages: 100 - comic.pages.length - additions.length,
                maxDataLength: 80_000_000 - dataLength,
                onProgress: (current, total) =>
                  setNotice(
                    `Opening ${file.name}: page ${current} of ${total}…`,
                  ),
              })
            : [{ ...(await readImage(file)), name: file.name }];
        for (const image of images) {
          if (!asLayer && comic.pages.length + additions.length >= 100)
            throw new Error('Use up to 100 pages per comic.');
          dataLength += image.src.length;
          if (dataLength > 80_000_000)
            throw new Error(
              'This comic is too large. Keep the total under 80 MB.',
            );
          let width = 100,
            height = 100;
          if (asLayer && page) {
            const scale =
              Math.min(page.width / image.width, page.height / image.height) *
              0.65;
            width = ((image.width * scale) / page.width) * 100;
            height = ((image.height * scale) / page.height) * 100;
          }
          const l: BasicLayer = {
            id: crypto.randomUUID(),
            name: image.name,
            src: image.src,
            x: (100 - width) / 2,
            y: (100 - height) / 2,
            width,
            height,
            effect: 'none',
            duration: 0.7,
            delay: 0,
            trigger: 'enter',
          };
          layers.push(l);
          additions.push({
            id: crypto.randomUUID(),
            width: image.width,
            height: image.height,
            background: '#ffffff',
            layers: [l],
          });
        }
      }
      const pages =
        asLayer && page
          ? comic.pages.map((p) =>
              p.id === page.id ? { ...p, layers: [...p.layers, ...layers] } : p,
            )
          : [...comic.pages, ...additions];
      if (JSON.stringify({ ...comic, pages }).length > 80_000_000)
        throw new Error('This comic is too large. Keep the total under 80 MB.');
      edit({ pages });
      setPageIndex(asLayer ? pageIndex : comic.pages.length);
      setLayerIndex(asLayer && page ? page.layers.length : 0);
      setNotice(
        `${asLayer ? 'Images' : 'Pages'} added. Your draft saves automatically.`,
      );
    } catch (e) {
      setNotice((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function importComic(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      if (file.size > 80_000_000)
        throw new Error('Comic files must be under 80 MB.');
      const imported = parseBasicComic(await file.text());
      imported.id = crypto.randomUUID();
      imported.updatedAt = new Date().toISOString();
      setComics(await persist(imported));
      setNotice('Comic imported as a separate copy.');
    } catch (e) {
      setNotice((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const shown = comics
    .filter(
      (c) =>
        c.archived === (shelf === 'archive') &&
        (rating === 'All ratings' || c.rating === rating) &&
        (format === 'all' || c.format === format) &&
        `${c.title} ${c.author} ${c.tags} ${c.summary}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    )
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return (
    <div className="basic-app" data-storage={BASIC_DB}>
      <MotusPlatformHeader
        active="library"
        onNavigate={(href) => {
          if (busy) return;
          void (async () => {
            if (comic && (dirty || saving) && !(await save())) return;
            window.location.assign(href);
          })();
        }}
      />
      {publishOpen && comic && (
        <MotusPublishDialog
          comic={comic}
          close={() => setPublishOpen(false)}
          onPublished={() => {
            void save(true);
          }}
        />
      )}
      <input
        ref={importInput}
        type="file"
        accept=".json"
        hidden
        onChange={(e) => {
          void importComic(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      {notice && (
        <output className="basic-notice">
          {notice}
          <button aria-label="Dismiss message" onClick={() => setNotice('')}>
            <X size={16} />
          </button>
        </output>
      )}
      {reader ? (
        <BasicReader
          key={reader.id}
          comic={reader}
          close={() => setReader(null)}
        />
      ) : comic ? (
        <main className="basic-editor">
          <div className="basic-title-row">
            <div>
              <p className="basic-eyebrow">UPLOAD & ANIMATE</p>
              <h1>{comic.title || 'A new comic'}</h1>
              <p className="basic-muted">
                {saveError
                  ? 'Could not save. Download a backup.'
                  : saving
                    ? 'Saving…'
                    : dirty
                      ? 'Changes waiting to save…'
                      : comics.some((c) => c.id === comic.id)
                        ? 'All changes saved in this browser'
                        : 'Your new draft'}
              </p>
            </div>
            <div className="basic-actions">
              <button
                disabled={busy || !comic.pages.length}
                onClick={() => setReader(comic)}
              >
                Read preview
              </button>
              <button disabled={busy} onClick={() => download(comic)}>
                <Download size={16} /> Download
              </button>
              <button
                disabled={busy || !history.length}
                onClick={() => travelHistory()}
              >
                Undo
              </button>
              <button
                disabled={busy || !future.length}
                onClick={() => travelHistory(true)}
              >
                Redo
              </button>
              <button disabled={busy} onClick={() => void save()}>
                Save draft
              </button>
              <button
                className="basic-primary"
                disabled={busy}
                onClick={() => {
                  void save().then((saved) => {
                    if (saved) setPublishOpen(true);
                  });
                }}
              >
                Publish
              </button>
            </div>
          </div>
          <fieldset disabled={busy} className="basic-editor-fieldset">
            <details className="basic-details" open={!comic.pages.length}>
              <summary>
                Comic details <span>Title, creator, summary & tags</span>
              </summary>
              <div className="basic-metadata">
                <label>
                  Title
                  <input
                    value={comic.title}
                    maxLength={200}
                    onChange={(e) => edit({ title: e.target.value })}
                  />
                </label>
                <label>
                  Creator
                  <input
                    value={comic.author}
                    maxLength={200}
                    onChange={(e) => edit({ author: e.target.value })}
                  />
                </label>
                <label className="basic-wide">
                  Summary
                  <textarea
                    value={comic.summary}
                    maxLength={5000}
                    rows={3}
                    onChange={(e) => edit({ summary: e.target.value })}
                  />
                </label>
                <label className="basic-wide">
                  Tags <small>Separate with commas</small>
                  <input
                    value={comic.tags}
                    maxLength={1000}
                    placeholder="Fantasy, found family, original work…"
                    onChange={(e) => edit({ tags: e.target.value })}
                  />
                </label>
                <label>
                  Language
                  <input
                    value={comic.language}
                    maxLength={100}
                    onChange={(e) => edit({ language: e.target.value })}
                  />
                </label>
                <label>
                  Rating
                  <select
                    value={comic.rating}
                    onChange={(e) => edit({ rating: e.target.value })}
                  >
                    {['General', 'Teen', 'Mature', 'Explicit'].map((r) => (
                      <option key={r}>{r}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Status
                  <select
                    value={comic.status}
                    onChange={(e) =>
                      edit({ status: e.target.value as BasicComic['status'] })
                    }
                  >
                    <option>Ongoing</option>
                    <option>Complete</option>
                  </select>
                </label>
              </div>
            </details>
            <div className="basic-workspace">
              <aside className="basic-pages">
                <div className="basic-section-title">
                  <h2>Pages</h2>
                  <span>{comic.pages.length}</span>
                </div>
                <input
                  ref={fileInput}
                  hidden
                  type="file"
                  accept="image/png,image/jpeg,image/webp,application/pdf,.pdf"
                  multiple
                  onChange={(e) => {
                    void upload(e.target.files);
                    e.target.value = '';
                  }}
                />
                <button
                  className="basic-upload-button"
                  onClick={() => fileInput.current?.click()}
                >
                  <Plus size={16} /> Upload pages
                </button>
                <p className="basic-muted basic-small">
                  PNG, JPG, WebP · 10 MB each. PDF · 50 MB. Up to 100 pages
                  total.
                </p>
                <ol>
                  {comic.pages.map((p, i) => (
                    <li key={p.id}>
                      <button
                        className={pageIndex === i ? 'is-selected' : ''}
                        onClick={() => {
                          setPageIndex(i);
                          setLayerIndex(0);
                          setPreview(false);
                        }}
                      >
                        <span className="basic-page-thumb">
                          <ComicPage page={p} playing={false} />
                        </span>
                        <span>Page {i + 1}</span>
                      </button>
                    </li>
                  ))}
                </ol>
              </aside>
              <section className="basic-canvas-section">
                <div className="basic-canvas-toolbar">
                  <h2>
                    {page ? `Page ${pageIndex + 1}` : 'Your pages go here'}
                  </h2>
                  {page && (
                    <div className="basic-actions">
                      <button
                        disabled={comic.pages.length >= 100}
                        title={
                          comic.pages.length >= 100
                            ? 'A comic can have up to 100 pages'
                            : 'Duplicate this page and its animations'
                        }
                        onClick={() => {
                          const pages = [...comic.pages];
                          pages.splice(
                            pageIndex + 1,
                            0,
                            duplicateBasicPage(page),
                          );
                          if (
                            JSON.stringify({ ...comic, pages }).length >
                            80_000_000
                          ) {
                            setNotice(
                              'This comic is too large to duplicate a page. Keep the total under 80 MB.',
                            );
                            return;
                          }
                          edit({ pages });
                          setPageIndex(pageIndex + 1);
                          setLayerIndex(0);
                          setPreview(false);
                          setNotice(
                            'Page duplicated. You can undo this change.',
                          );
                        }}
                      >
                        <Copy size={16} /> Duplicate page
                      </button>
                      <button
                        disabled={pageIndex === 0}
                        aria-label="Move page earlier"
                        onClick={() => {
                          const pages = [...comic.pages];
                          [pages[pageIndex - 1], pages[pageIndex]] = [
                            pages[pageIndex],
                            pages[pageIndex - 1],
                          ];
                          edit({ pages });
                          setPageIndex(pageIndex - 1);
                        }}
                      >
                        <ArrowUp size={16} />
                      </button>
                      <button
                        disabled={pageIndex === comic.pages.length - 1}
                        aria-label="Move page later"
                        onClick={() => {
                          const pages = [...comic.pages];
                          [pages[pageIndex + 1], pages[pageIndex]] = [
                            pages[pageIndex],
                            pages[pageIndex + 1],
                          ];
                          edit({ pages });
                          setPageIndex(pageIndex + 1);
                        }}
                      >
                        <ArrowDown size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setPreview((p) => !p);
                          setSession((s) => s + 1);
                        }}
                      >
                        {preview ? 'Stop preview' : '▶ Preview'}
                      </button>
                      <button
                        aria-label="Remove page"
                        onClick={() => {
                          edit({
                            pages: comic.pages.filter((p) => p.id !== page.id),
                          });
                          setPageIndex(Math.max(0, pageIndex - 1));
                          setLayerIndex(0);
                        }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>
                <div
                  className="basic-canvas"
                  onDragOver={(e) => {
                    if (e.dataTransfer.types.includes('Files')) {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = busy ? 'none' : 'copy';
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (!busy) void upload(e.dataTransfer.files);
                  }}
                >
                  {page ? (
                    <div
                      className="basic-canvas-page"
                      key={`${page.id}-${session}-${preview}`}
                    >
                      <ComicPage page={page} playing={preview} />
                    </div>
                  ) : (
                    <button
                      className="basic-upload-empty"
                      onClick={() => fileInput.current?.click()}
                    >
                      <ImagePlus size={40} strokeWidth={1} />
                      <strong>Start with your artwork</strong>
                      <span>Drop images or a PDF here, or choose files.</span>
                      <span>PDF pages and images keep their proportions.</span>
                      <span className="basic-primary">Choose files</span>
                    </button>
                  )}
                </div>
                {page && (
                  <p className="basic-canvas-caption">
                    {page.width} × {page.height} · Full artwork, original
                    proportions{preview ? ' · Motion preview' : ''}
                  </p>
                )}
              </section>
              <aside className="basic-options">
                <h2>
                  <Sparkles size={17} /> Animation
                </h2>
                <p className="basic-muted">
                  Choose an image. Pick an effect. Done.
                </p>
                {page ? (
                  <>
                    <label>
                      Image
                      <select
                        value={layerIndex}
                        onChange={(e) => setLayerIndex(Number(e.target.value))}
                      >
                        {page.layers.map((l, i) => (
                          <option key={l.id} value={i}>
                            {i + 1}. {l.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <input
                      ref={layerInput}
                      hidden
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      multiple
                      onChange={(e) => {
                        void upload(e.target.files, true);
                        e.target.value = '';
                      }}
                    />
                    <button onClick={() => layerInput.current?.click()}>
                      <Plus size={15} /> Add image layer
                    </button>
                    {layer && (
                      <>
                        <label>
                          Image description
                          <input
                            value={layer.name}
                            maxLength={500}
                            onChange={(e) =>
                              editLayer({ name: e.target.value })
                            }
                          />
                        </label>
                        <div className="basic-presets">
                          {EFFECTS.map((effect) => (
                            <button
                              key={effect}
                              aria-pressed={layer.effect === effect}
                              className={
                                layer.effect === effect ? 'is-selected' : ''
                              }
                              onClick={() => {
                                editLayer({ effect });
                                setPreview(effect !== 'none');
                                setSession((s) => s + 1);
                              }}
                            >
                              {labels[effect]}
                            </button>
                          ))}
                        </div>
                        {layer.effect !== 'none' && (
                          <div className="basic-timing">
                            <label>
                              Start
                              <select
                                value={layer.trigger}
                                onChange={(e) =>
                                  editLayer({
                                    trigger: e.target
                                      .value as BasicLayer['trigger'],
                                  })
                                }
                              >
                                <option value="enter">When page appears</option>
                                <option value="click">On image click</option>
                              </select>
                            </label>
                            <label>
                              Duration (seconds)
                              <input
                                type="number"
                                min="0.1"
                                max="10"
                                step="0.1"
                                value={layer.duration}
                                onChange={(e) =>
                                  editLayer({
                                    duration: Math.max(
                                      0.1,
                                      Math.min(
                                        10,
                                        Number(e.target.value) || 0.1,
                                      ),
                                    ),
                                  })
                                }
                              />
                            </label>
                            <label>
                              Delay (seconds)
                              <input
                                type="number"
                                min="0"
                                max="10"
                                step="0.1"
                                value={layer.delay}
                                onChange={(e) =>
                                  editLayer({
                                    delay: Math.max(
                                      0,
                                      Math.min(10, Number(e.target.value) || 0),
                                    ),
                                  })
                                }
                              />
                            </label>
                          </div>
                        )}
                        <details>
                          <summary>Image placement</summary>
                          <div className="basic-placement">
                            {(['x', 'y', 'width', 'height'] as const).map(
                              (key) => (
                                <label key={key}>
                                  {
                                    {
                                      x: 'Left',
                                      y: 'Top',
                                      width: 'Width',
                                      height: 'Height',
                                    }[key]
                                  }{' '}
                                  (%)
                                  <input
                                    type="number"
                                    value={Math.round(layer[key] * 10) / 10}
                                    min={key === 'x' || key === 'y' ? 0 : 1}
                                    max="100"
                                    onChange={(e) => {
                                      const n = Number(e.target.value) || 0;
                                      const max =
                                        key === 'x'
                                          ? 100 - layer.width
                                          : key === 'y'
                                            ? 100 - layer.height
                                            : key === 'width'
                                              ? 100 - layer.x
                                              : 100 - layer.y;
                                      editLayer({
                                        [key]: Math.min(
                                          max,
                                          Math.max(
                                            key === 'width' || key === 'height'
                                              ? 1
                                              : 0,
                                            n,
                                          ),
                                        ),
                                      });
                                    }}
                                  />
                                </label>
                              ),
                            )}
                          </div>
                          <p className="basic-small basic-muted">
                            Transparent PNGs work well as animated layers.
                          </p>
                          {page.layers.length > 1 && (
                            <button
                              onClick={() => {
                                editPage({
                                  layers: page.layers.filter(
                                    (l) => l.id !== layer.id,
                                  ),
                                });
                                setLayerIndex(0);
                              }}
                            >
                              Remove image layer
                            </button>
                          )}
                        </details>
                      </>
                    )}
                    <label>
                      Page background
                      <input
                        type="color"
                        value={page.background}
                        onChange={(e) =>
                          editPage({ background: e.target.value })
                        }
                      />
                    </label>
                  </>
                ) : (
                  <p className="basic-hint">
                    Upload a page to see animation options.
                  </p>
                )}
                <div className="basic-display">
                  <h2>Reading display</h2>
                  <label>
                    Layout
                    <select
                      value={comic.format}
                      onChange={(e) =>
                        edit({ format: e.target.value as BasicComic['format'] })
                      }
                    >
                      {Object.entries(formats).map(([v, label]) => (
                        <option key={v} value={v}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Reading direction
                    <select
                      value={comic.direction}
                      onChange={(e) =>
                        edit({
                          direction: e.target.value as BasicComic['direction'],
                        })
                      }
                    >
                      <option value="ltr">Left to right</option>
                      <option value="rtl">Right to left</option>
                    </select>
                  </label>
                  <label>
                    Page transition
                    <select
                      value={comic.transition}
                      onChange={(e) =>
                        edit({
                          transition: e.target
                            .value as BasicComic['transition'],
                        })
                      }
                    >
                      <option value="cut">None</option>
                      <option value="slide">Slide</option>
                      <option value="book">Page turn</option>
                    </select>
                  </label>
                </div>
              </aside>
            </div>
          </fieldset>
        </main>
      ) : (
        <main className="basic-archive">
          <section className="basic-intro">
            <p className="basic-eyebrow">
              A HOME FOR COMICS, STILL & IN MOTION
            </p>
            <h1>Your drafts & comics.</h1>
            <p>
              A simple place for your comics. Upload your pages, add a little
              <br className="basic-desktop-break" /> animation, and let the
              story do the talking.
            </p>
            <div className="basic-actions">
              <button
                className="basic-primary"
                disabled={!loaded || busy}
                onClick={() => openEditor(blankComic())}
              >
                <Plus size={17} /> Upload a comic
              </button>
              <button
                disabled={!loaded || busy}
                onClick={() => importInput.current?.click()}
              >
                <Upload size={16} /> Import comic file
              </button>
            </div>
            <div className="basic-intro-note">
              No ads. No payments. Just comics.
            </div>
          </section>
          <div className="basic-archive-layout">
            <section>
              <div className="basic-list-heading">
                <div className="basic-tabs">
                  <button
                    aria-pressed={shelf === 'archive'}
                    className={shelf === 'archive' ? 'is-active' : ''}
                    onClick={() => setShelf('archive')}
                  >
                    Saved copies{' '}
                    <span>{comics.filter((c) => c.archived).length}</span>
                  </button>
                  <button
                    aria-pressed={shelf === 'drafts'}
                    className={shelf === 'drafts' ? 'is-active' : ''}
                    onClick={() => setShelf('drafts')}
                  >
                    My drafts{' '}
                    <span>{comics.filter((c) => !c.archived).length}</span>
                  </button>
                </div>
                <span className="basic-muted basic-small">
                  Recently updated
                </span>
              </div>
              {!loaded ? (
                <p className="basic-empty">Opening your drafts…</p>
              ) : shown.length ? (
                shown.map((c) => (
                  <article className="basic-work" key={c.id}>
                    <button
                      className="basic-cover"
                      aria-label={`Read ${c.title || 'Untitled comic'}`}
                      onClick={() => setReader(c)}
                    >
                      {c.pages[0] ? (
                        <ComicPage page={c.pages[0]} playing={false} />
                      ) : (
                        <BookOpen />
                      )}
                    </button>
                    <div className="basic-work-copy">
                      <div className="basic-work-title">
                        <button onClick={() => setReader(c)}>
                          <h2>{c.title || 'Untitled comic'}</h2>
                        </button>
                        <span>{c.status}</span>
                      </div>
                      <p className="basic-byline">
                        by {c.author || 'Unnamed creator'}
                      </p>
                      <p className="basic-work-meta">
                        {c.rating} · {c.language} · {formats[c.format]}
                      </p>
                      <div className="basic-tags">
                        {c.tags
                          .split(',')
                          .map((t) => t.trim())
                          .filter(Boolean)
                          .map((t, i) => (
                            <button
                              key={`${t}-${i}`}
                              onClick={() => setSearch(t)}
                            >
                              {t}
                            </button>
                          ))}
                      </div>
                      <p className="basic-summary">
                        {c.summary || 'No summary yet.'}
                      </p>
                      <div className="basic-work-bottom">
                        <span>
                          {c.pages.length}{' '}
                          {c.pages.length === 1 ? 'page' : 'pages'} ·{' '}
                          {c.pages.some((p) =>
                            p.layers.some((l) => l.effect !== 'none'),
                          )
                            ? 'Animated'
                            : 'Still comic'}
                        </span>
                        <div className="basic-actions">
                          <button onClick={() => openEditor(c)}>Edit</button>
                          <button onClick={() => download(c)}>
                            <Download size={14} /> Download
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <div className="basic-empty">
                  <BookOpen size={36} strokeWidth={1} />
                  <h2>
                    {search || rating !== 'All ratings' || format !== 'all'
                      ? 'No comics match your filters.'
                      : shelf === 'drafts'
                        ? 'Your next story starts here.'
                        : 'The first page is yours.'}
                  </h2>
                  <p>
                    {search || rating !== 'All ratings' || format !== 'all'
                      ? 'Try a different tag, title, or display format.'
                      : 'Upload a comic, or import one shared with you.'}
                  </p>
                  <button
                    disabled={busy}
                    onClick={() => {
                      if (
                        search ||
                        rating !== 'All ratings' ||
                        format !== 'all'
                      ) {
                        setSearch('');
                        setRating('All ratings');
                        setFormat('all');
                      } else openEditor(blankComic());
                    }}
                  >
                    {search || rating !== 'All ratings' || format !== 'all'
                      ? 'Clear filters'
                      : 'Upload your first comic'}{' '}
                    →
                  </button>
                </div>
              )}
            </section>
            <aside className="basic-filters">
              <h2>Find a comic</h2>
              <label>
                Search
                <div className="basic-search">
                  <Search size={16} />
                  <input
                    placeholder="Title, creator, or tag"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </label>
              <label>
                Rating
                <select
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                >
                  {['All ratings', 'General', 'Teen', 'Mature', 'Explicit'].map(
                    (r) => (
                      <option key={r}>{r}</option>
                    ),
                  )}
                </select>
              </label>
              <label>
                Display
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                >
                  <option value="all">All formats</option>
                  {Object.entries(formats).map(([v, label]) => (
                    <option key={v} value={v}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <div className="basic-local-note">
                <BookOpen size={18} />
                <h3>Your browser bookshelf</h3>
                <p>
                  Drafts and saved copies stay on this device. Use Publish in
                  the editor to share a comic with the archive, or Download to
                  keep a backup.
                </p>
              </div>
            </aside>
          </div>
        </main>
      )}
      <footer className="basic-footer">
        <span>
          motus <span>· A little motion. A lot of story.</span>
        </span>
        <span>Made for reading, made for creating.</span>
      </footer>
    </div>
  );
}
