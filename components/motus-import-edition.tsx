/* oxlint-disable next/no-html-link-for-pages -- Reader editions open in a fresh reader. */
'use client';
import { MotusSiteHeader } from '@/components/motus-site-header';
import { useRef, useState } from 'react';
import { ArrowLeft, BookOpen, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MotusLogo } from '@/components/motus-logo';
import {
  type DevicePublication,
  resolveDevicePublication,
  saveDevicePublication,
} from '@/lib/motus-device-publication';
import {
  MAX_READER_EDITION_BYTES,
  parseReaderEdition,
} from '@/lib/motus-sharing';

export function MotusImportEdition() {
  const [edition, setEdition] = useState<DevicePublication | null>(null);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [replacement, setReplacement] = useState<DevicePublication | null>(
    null,
  );
  const request = useRef(0);
  async function readFile(file?: File) {
    const id = ++request.current;
    setEdition(null);
    setNotice('');
    setReplacement(null);
    if (!file) return;
    if (file.size > MAX_READER_EDITION_BYTES) {
      setNotice('Choose a reader edition smaller than 5 MB.');
      return;
    }
    setBusy(true);
    try {
      const parsed = parseReaderEdition(await file.text());
      if (id !== request.current) return;
      if (!parsed) {
        setNotice(
          'This file is not a valid Motus reader edition. Ask the creator to download it from Share & promote in the reader.',
        );
        return;
      }
      setEdition(parsed);
    } catch {
      if (id === request.current)
        setNotice('The file could not be read. Please try again.');
    } finally {
      if (id === request.current) setBusy(false);
    }
  }
  function openEdition() {
    if (!edition) return;
    try {
      const existing = resolveDevicePublication(
        window.localStorage,
        edition.slug,
      );
      if (existing) {
        if (
          existing.revision.revision >= edition.revision.revision ||
          Date.parse(existing.revision.createdAt) >
            Date.parse(edition.revision.createdAt)
        ) {
          setNotice(
            'An edition of this work is already in your library at the same or a newer revision. Open your saved edition below; it has not been replaced.',
          );
          return;
        }
        if (
          !replacement ||
          JSON.stringify(replacement.revision) !==
            JSON.stringify(existing.revision)
        ) {
          setReplacement(existing);
          setNotice(
            `Replace saved revision ${existing.revision.revision} of “${existing.source.title}” with revision ${edition.revision.revision}? Your Studio draft will stay intact. Keep the original reader file if you want to return to it.`,
          );
          return;
        }
      }
      if (
        !saveDevicePublication(
          window.localStorage,
          edition.projectId,
          edition.revision,
        )
      ) {
        setNotice(
          'The edition could not be saved. Your browser storage may be full or unavailable (up to 12 editions). Keep the file and try another browser.',
        );
        return;
      }
      window.location.assign(`/read/${edition.slug}`);
    } catch {
      setNotice(
        'Browser storage is unavailable. Keep the file and try again with storage enabled.',
      );
    }
  }
  return (
    <div className="discover-shell">
      <MotusSiteHeader />
      <main className="edition-import-main">
        <a href="/discover" className="edition-back">
          <ArrowLeft aria-hidden="true" /> Explore Motus
        </a>
        <MotusLogo variant="on-dark" />
        <span className="home-kicker">FROM CREATOR TO AUDIENCE</span>
        <h1>Open a shared edition.</h1>
        <p>
          Someone made something for you to experience. Open their Motus reader
          file to explore its artwork, motion, and interactive scenes.
        </p>
        <label className="edition-upload">
          <Upload aria-hidden="true" />
          <strong>Choose a reader edition</strong>
          <span>.motus-reader.json · up to 5 MB</span>
          <input
            aria-label="Choose a reader edition"
            type="file"
            accept=".json,application/json"
            disabled={busy}
            onChange={(event) => {
              void readFile(event.target.files?.[0]);
              event.target.value = '';
            }}
          />
        </label>
        {busy ? <output aria-live="polite">Checking edition…</output> : null}
        {edition ? (
          <section className="edition-preview">
            <span>REVISION {edition.revision.revision}</span>
            <h2>{edition.source.title}</h2>
            <p>by {edition.source.creatorName}</p>
            <p>{edition.source.description}</p>
            <small>
              {edition.source.chapters.length} chapters · saved on this device
              when opened
            </small>
            <Button onClick={openEdition}>
              <BookOpen />{' '}
              {replacement
                ? 'Replace saved edition & read'
                : 'Add to library & read'}
            </Button>
            {notice.startsWith('An edition') ? (
              <a href={`/read/${edition.slug}`}>Open saved edition</a>
            ) : null}
          </section>
        ) : null}
        <output>{notice}</output>
        <small>
          The file stays on this device. Your Studio draft is left intact.
        </small>
      </main>
    </div>
  );
}
