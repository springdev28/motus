import {
  type DevicePublication,
  restoreSharedPublicationRecord,
} from './motus-device-publication.ts';

export const MAX_READER_EDITION_BYTES = 5_000_000;
export function serializeReaderEdition(publication: DevicePublication): string {
  return JSON.stringify({
    kind: 'motus-reader-edition',
    version: 1,
    projectId: publication.projectId,
    revision: publication.revision,
  });
}
export function parseReaderEdition(text: string): DevicePublication | null {
  if (
    text.length > MAX_READER_EDITION_BYTES ||
    new TextEncoder().encode(text).byteLength > MAX_READER_EDITION_BYTES
  )
    return null;
  try {
    const value = JSON.parse(text);
    if (value?.kind !== 'motus-reader-edition' || value?.version !== 1)
      return null;
    return restoreSharedPublicationRecord(value);
  } catch {
    return null;
  }
}
export function promotionText(
  title: string,
  creator: string,
  description: string,
  tags: readonly string[],
  url?: string,
) {
  const hashtags = [
    ...new Set(
      tags.map((tag) => tag.replace(/[^\p{L}\p{N}_]/gu, '')).filter(Boolean),
    ),
  ].slice(0, 5);
  return [
    `${title} — by ${creator}`,
    description.trim(),
    hashtags.map((tag) => `#${tag}`).join(' '),
    url,
  ]
    .filter(Boolean)
    .join('\n\n');
}
export function readerEditionFilename(title: string) {
  return `${
    title
      .replace(/[^\p{L}\p{N}_-]+/gu, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'motus-work'
  }.motus-reader.json`;
}
