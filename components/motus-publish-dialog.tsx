/* oxlint-disable next/no-html-link-for-pages -- Account and reader links use stable routes. */
'use client';
import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { usePlatform } from './motus-platform-provider';
import { BackendNotice } from './motus-platform-header';
import { publishComic } from '@/lib/motus-platform-client';
import type { BasicComic } from '@/lib/motus-basic';
import type { PlatformCommunity } from '@/lib/motus-platform';
export function MotusPublishDialog({
  comic,
  close,
  onPublished,
}: {
  comic: BasicComic;
  close: () => void;
  onPublished: () => void;
}) {
  const { client, user, profile } = usePlatform();
  const [communities, setCommunities] = useState<PlatformCommunity[]>([]);
  const [community, setCommunity] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [published, setPublished] = useState(false);
  useEffect(() => {
    let active = true;
    if (!client || !user) return;
    async function load() {
      const [groups, membership, existing] = await Promise.all([
        client!.from('communities').select('*').order('name'),
        client!
          .from('community_members')
          .select('community_id')
          .eq('user_id', user!.id),
        client!
          .from('works')
          .select('community_id')
          .eq('id', comic.id)
          .eq('owner_id', user!.id)
          .maybeSingle(),
      ]);
      if (!active) return;
      for (const result of [groups, membership, existing])
        if (result.error) throw result.error;
      const allowed = ((groups.data as PlatformCommunity[]) || []).filter(
        (c) =>
          c.owner_id === user!.id ||
          membership.data?.some((m) => m.community_id === c.id),
      );
      setCommunities(allowed);
      setCommunity(
        allowed.some((c) => c.id === existing.data?.community_id)
          ? existing.data!.community_id
          : '',
      );
    }
    void load().catch((e) => {
      if (active) setNotice((e as Error).message);
    });
    return () => {
      active = false;
    };
  }, [client, user, comic.id]);
  return (
    <Dialog
      open
      onOpenChange={(value) => {
        if (!value && !busy) close();
      }}
    >
      <DialogContent className="motus-settings-dialog">
        <DialogHeader>
          <DialogTitle>
            {published ? 'Your comic is published' : 'Publish your comic'}
          </DialogTitle>
          <DialogDescription>
            Publish a snapshot to the shared archive. Everyone can read it.
            Further edits stay private until you publish again.
          </DialogDescription>
        </DialogHeader>
        <BackendNotice />
        {published ? (
          <div className="platform-actions">
            <a className="basic-primary" href={`/comic/${comic.id}`}>
              View published comic
            </a>
            <button onClick={close}>Keep editing</button>
          </div>
        ) : !user || !profile ? (
          <p>
            <a href="/account">
              {user ? 'Complete your profile' : 'Sign in or create an account'}
            </a>{' '}
            to publish. Your draft is saved on this device.
          </p>
        ) : (
          <form
            className="platform-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (!client) return;
              setBusy(true);
              setNotice('Uploading your comic…');
              void publishComic(client, user.id, comic, community || null)
                .then(() => {
                  setPublished(true);
                  setNotice(
                    'Published. Your comic has a permanent share link.',
                  );
                  onPublished();
                })
                .catch((e) => setNotice((e as Error).message))
                .finally(() => setBusy(false));
            }}
          >
            <p>
              <strong>{comic.title || 'Untitled comic'}</strong>
              <br />
              {comic.pages.length} pages · {comic.rating}
            </p>
            <label>
              Publish to
              <select
                value={community}
                onChange={(e) => setCommunity(e.target.value)}
                disabled={busy}
              >
                <option value="">The main archive</option>
                {communities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <small>
                You can also publish to a community you own or have joined.
              </small>
            </label>
            <label className="platform-check">
              <input type="checkbox" required disabled={busy} />I have
              permission to publish this work and have checked its content
              rating.
            </label>
            <button className="basic-primary" disabled={busy || !client}>
              {busy ? 'Publishing…' : 'Publish comic'}
            </button>
          </form>
        )}
        {notice && <output className="platform-notice">{notice}</output>}
      </DialogContent>
    </Dialog>
  );
}
