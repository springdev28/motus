import type { SupabaseClient } from '@supabase/supabase-js';
import { parseBasicComic, type BasicComic } from './motus-basic';
import type { PlatformWork } from './motus-platform';
export async function loadEdition(client: SupabaseClient, work: PlatformWork) {
  const result = await client.storage
    .from('comic-editions')
    .download(work.edition_path);
  if (result.error) throw result.error;
  return { ...parseBasicComic(await result.data.text()), id: work.id };
}
async function makeCover(comic: BasicComic) {
  const page = comic.pages[0];
  if (!page) return '';
  const canvas = document.createElement('canvas');
  const ratio = Math.min(240 / page.width, 360 / page.height);
  canvas.width = Math.max(1, Math.round(page.width * ratio));
  canvas.height = Math.max(1, Math.round(page.height * ratio));
  const context = canvas.getContext('2d');
  if (!context) return '';
  context.fillStyle = page.background;
  context.fillRect(0, 0, canvas.width, canvas.height);
  for (const layer of page.layers) {
    const image = new Image();
    image.src = layer.src;
    await image.decode();
    const frameWidth = (layer.width / 100) * canvas.width,
      frameHeight = (layer.height / 100) * canvas.height;
    const ratio = Math.min(
      frameWidth / image.naturalWidth,
      frameHeight / image.naturalHeight,
    );
    const width = image.naturalWidth * ratio,
      height = image.naturalHeight * ratio;
    context.drawImage(
      image,
      (layer.x / 100) * canvas.width + (frameWidth - width) / 2,
      (layer.y / 100) * canvas.height + (frameHeight - height) / 2,
      width,
      height,
    );
  }
  return canvas.toDataURL('image/jpeg', 0.75);
}
export async function publishComic(
  client: SupabaseClient,
  userId: string,
  comic: BasicComic,
  communityId: string | null,
) {
  if (!comic.title.trim() || !comic.author.trim() || !comic.pages.length)
    throw new Error(
      'Add a title, creator, and at least one page before publishing.',
    );
  const encoded = JSON.stringify(comic);
  parseBasicComic(encoded);
  const blob = new Blob([encoded], { type: 'application/json' });
  if (blob.size > 50_000_000)
    throw new Error(
      'Online editions must be under 50 MB. You can still download and share a larger comic file.',
    );
  const existing = await client
    .from('works')
    .select('edition_path')
    .eq('id', comic.id)
    .eq('owner_id', userId)
    .maybeSingle();
  if (existing.error) throw existing.error;
  const editionPath = `${userId}/${comic.id}/${crypto.randomUUID()}.json`;
  const cover = await makeCover(comic);
  const upload = await client.storage
    .from('comic-editions')
    .upload(editionPath, blob, {
      contentType: 'application/json',
      upsert: false,
    });
  if (upload.error) throw upload.error;
  const record: PlatformWork = {
    id: comic.id,
    owner_id: userId,
    title: comic.title.trim(),
    author: comic.author.trim(),
    summary: comic.summary,
    tags: [
      ...new Set(
        comic.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      ),
    ].slice(0, 50),
    language: comic.language || 'Unspecified',
    rating: comic.rating,
    status: comic.status,
    format: comic.format,
    page_count: comic.pages.length,
    animated: comic.pages.some((p) =>
      p.layers.some((l) => l.effect !== 'none'),
    ),
    cover,
    edition_path: editionPath,
    community_id: communityId,
    published: true,
    updated_at: new Date().toISOString(),
  };
  const result = await client.from('works').upsert(record);
  if (result.error) {
    await client.storage.from('comic-editions').remove([editionPath]);
    throw result.error;
  }
  if (existing.data?.edition_path)
    await client.storage
      .from('comic-editions')
      .remove([String(existing.data.edition_path)]);
  return record;
}
