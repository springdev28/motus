'use client';

import { useState } from 'react';
import { Copy, Download, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import type { DevicePublication } from '@/lib/motus-device-publication';
import {
  MAX_READER_EDITION_BYTES,
  promotionText,
  readerEditionFilename,
  serializeReaderEdition,
} from '@/lib/motus-sharing';

export function MotusShare({
  title,
  creator,
  description,
  path,
  tags = [],
  publication,
  compact = false,
}: {
  title: string;
  creator: string;
  description: string;
  path: string;
  tags?: readonly string[];
  publication?: DevicePublication;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [notice, setNotice] = useState('');
  const [nativeShare, setNativeShare] = useState(false);
  function openShare() {
    const link = new URL(path, window.location.origin).href;
    setUrl(link);
    setCaption(
      promotionText(
        title,
        creator,
        description,
        tags,
        publication ? undefined : link,
      ),
    );
    setNativeShare(typeof navigator.share === 'function');
    setNotice('');
    setOpen(true);
  }
  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setNotice('Copied to clipboard.');
    } catch {
      setNotice(
        'Clipboard unavailable. Select the text below and copy it manually.',
      );
    }
  }
  function download() {
    const blob = new Blob([serializeReaderEdition(publication!)], {
      type: 'application/json',
    });
    if (blob.size > MAX_READER_EDITION_BYTES) {
      setNotice(
        'This edition is too large to share. Reduce image sizes in Studio and publish again.',
      );
      return;
    }
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = readerEditionFilename(title);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    setNotice(
      'Edition downloaded. Send the file to your audience; they can open it with “Open a shared edition” in Motus.',
    );
  }
  return (
    <>
      <button
        className="motus-share-trigger"
        type="button"
        onClick={openShare}
        aria-label={`Share ${title}`}
      >
        <Share2 aria-hidden="true" />
        {compact ? null : 'Share & promote'}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="motus-share-dialog">
          <DialogHeader>
            <DialogTitle>Share {title}</DialogTitle>
            <DialogDescription>
              {publication
                ? 'Send an interactive reader edition with its artwork and motion. Your unpublished changes stay in Studio.'
                : 'Help someone discover this work. Edit the caption for your audience, then copy or share it.'}
            </DialogDescription>
          </DialogHeader>
          {publication ? (
            <>
              <p className="share-edition-note">
                This edition is saved in your browser. Its address will not open
                the work on another device. Download the edition and send the
                file instead. Anyone with the file can view its contents,
                including artwork.
              </p>
              <Button onClick={download}>
                <Download /> Download reader edition
              </Button>
              <label className="share-field">
                Where to open the file
                <input
                  readOnly
                  value={url ? new URL('/read/import', url).href : ''}
                  onFocus={(event) => event.target.select()}
                />
              </label>
            </>
          ) : (
            <label className="share-field">
              Link
              <input
                readOnly
                value={url}
                onFocus={(event) => event.target.select()}
              />
              <Button variant="outline" onClick={() => copy(url)}>
                <Copy /> Copy link
              </Button>
              <small>Access follows the site’s sharing settings.</small>
            </label>
          )}
          <label className="share-field">
            Promotion caption
            <textarea
              rows={6}
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
            />
          </label>
          <div className="share-actions">
            <Button variant="outline" onClick={() => copy(caption)}>
              <Copy /> Copy caption
            </Button>
            {nativeShare && !publication ? (
              <Button
                onClick={async () => {
                  try {
                    await navigator.share({ title, text: caption, url });
                    setNotice('Shared.');
                  } catch (error) {
                    if (
                      !(error instanceof Error && error.name === 'AbortError')
                    )
                      setNotice(
                        'Sharing unavailable. Copy the link or caption instead.',
                      );
                  }
                }}
              >
                <Share2 /> Share
              </Button>
            ) : null}
          </div>
          <output aria-live="polite">{notice}</output>
        </DialogContent>
      </Dialog>
    </>
  );
}
