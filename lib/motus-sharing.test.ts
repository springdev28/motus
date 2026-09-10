import { createDefaultProject } from './test-fixtures/editor-project.ts';
import assert from 'node:assert/strict';
import test from 'node:test';
import { createPublicationRevision } from './motus-model.ts';
import {
  getDevicePublicationFromProject,
  resolveDevicePublication,
  saveDevicePublication,
} from './motus-device-publication.ts';
import {
  parseReaderEdition,
  promotionText,
  readerEditionFilename,
  serializeReaderEdition,
} from './motus-sharing.ts';

void test('a shared edition carries only the published snapshot and opens on another device', () => {
  const project = createDefaultProject();
  const revision = createPublicationRevision(
    project,
    '2026-09-07T09:00:00.000Z',
  );
  project.publications = [revision];
  project.publishedRevision = revision.revision;
  project.title = 'Unpublished private draft';
  project.chapters[0].scenes[0].name = 'Unpublished scene';
  const edition = getDevicePublicationFromProject(project)!;
  const encoded = serializeReaderEdition(edition);
  assert.ok(!encoded.includes('Unpublished private draft'));
  assert.ok(!encoded.includes('Unpublished scene'));
  const imported = parseReaderEdition(encoded)!;
  assert.ok(imported);
  assert.deepEqual(
    JSON.parse(JSON.stringify(imported.revision)),
    JSON.parse(JSON.stringify(edition.revision)),
  );
  const data = new Map<string, string>([['unrelated-draft', 'keep me']]);
  const storage = {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
    removeItem: (key: string) => {
      data.delete(key);
    },
  };
  assert.equal(
    saveDevicePublication(storage, imported.projectId, imported.revision),
    true,
  );
  assert.equal(
    resolveDevicePublication(storage, imported.slug)?.source.title,
    revision.title,
  );
  assert.equal(data.get('unrelated-draft'), 'keep me');
});
void test('malformed and unsupported editions are rejected without accepting arbitrary project files', () => {
  for (const value of [
    'not json',
    'null',
    '{}',
    JSON.stringify(createDefaultProject()),
    '{"kind":"motus-reader-edition","version":2}',
    '{"kind":"motus-reader-edition","version":1,"projectId":"x","revision":{}}',
  ]) {
    assert.equal(parseReaderEdition(value), null);
  }
});
void test('promotion captions preserve international names and remove spaces from hashtags', () => {
  assert.equal(
    promotionText(
      'Gökyüzü',
      'Çağla',
      'Bir hikâye',
      ['gökyüzü', '絵', 'slow burn', '絵'],
      'https://example.com/read/work',
    ),
    'Gökyüzü — by Çağla\n\nBir hikâye\n\n#gökyüzü #絵 #slowburn\n\nhttps://example.com/read/work',
  );
  assert.equal(
    readerEditionFilename('../絵 / story?'),
    '絵-story.motus-reader.json',
  );
});
