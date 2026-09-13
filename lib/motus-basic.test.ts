import test from 'node:test';
import assert from 'node:assert/strict';
import {
  blankComic,
  parseBasicComic,
  effectFrames,
  EFFECTS,
  duplicateBasicPage,
  readingPageStart,
} from './motus-basic.ts';
function sample() {
  const comic = blankComic();
  comic.pages = [
    {
      id: 'page',
      background: '#ffffff',
      width: 1200,
      height: 1800,
      layers: [
        {
          id: 'image',
          name: 'Artwork',
          src: 'data:image/png;base64,aGVsbG8=',
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          effect: 'fade',
          duration: 0.7,
          delay: 0,
          trigger: 'enter',
        },
      ],
    },
  ];
  return comic;
}
void test('duplicated pages retain artwork and animations with independent layer IDs and edits', () => {
  const comic = sample();
  const original = comic.pages[0];
  const copy = duplicateBasicPage(original);
  comic.pages.push(copy);
  assert.notEqual(copy.id, original.id);
  assert.notEqual(copy.layers[0].id, original.layers[0].id);
  assert.equal(copy.layers[0].src, original.layers[0].src);
  assert.equal(copy.layers[0].effect, original.layers[0].effect);
  assert.deepEqual(parseBasicComic(JSON.stringify(comic)), comic);
  copy.layers[0].effect = 'spin';
  copy.layers[0].name = 'Changed copy';
  assert.equal(original.layers[0].effect, 'fade');
  assert.equal(original.layers[0].name, 'Artwork');
});

void test('layout changes retain the current page or the spread containing it', () => {
  assert.equal(readingPageStart(6, 'page', 10), 6);
  assert.equal(readingPageStart(6, 'scroll', 10), 6);
  assert.equal(readingPageStart(7, 'spread', 10), 6);
  assert.equal(readingPageStart(20, 'spread', 9), 8);
  assert.equal(readingPageStart(-1, 'page', 9), 0);
  assert.equal(readingPageStart(NaN, 'page', 9), 0);
  assert.equal(readingPageStart(0, 'spread', 0), 0);
});
void test('basic comic files preserve artwork, presets, and every reading display', () => {
  for (const format of ['scroll', 'page', 'spread'] as const)
    for (const direction of ['ltr', 'rtl'] as const) {
      const comic = { ...sample(), format, direction };
      assert.deepEqual(parseBasicComic(JSON.stringify(comic)), comic);
    }
});
void test('imports reject remote images, invalid geometry, timing and duplicate ids', () => {
  for (const patch of [
    { src: 'https://example.com/track.png' },
    { src: 'data:image/svg+xml;base64,aGVsbG8=' },
    { x: 30 },
    { duration: -1 },
    { delay: 99 },
    { effect: 'unknown' },
    { id: 'page' },
  ]) {
    const comic = sample();
    Object.assign(comic.pages[0].layers[0], patch);
    assert.throws(() => parseBasicComic(JSON.stringify(comic)));
  }
});
void test('invalid structures fail import without affecting the original comic', () => {
  for (const input of ['null', '{}', '[]', 'false', '{'])
    assert.throws(() => parseBasicComic(input));
  const original = sample();
  const edited = parseBasicComic(JSON.stringify(original));
  edited.pages[0].layers[0].effect = 'zoom';
  assert.equal(original.pages[0].layers[0].effect, 'fade');
});
void test('motion presets end at a readable resting position except explicit exit', () => {
  for (const effect of EFFECTS) {
    const frames = effectFrames(effect);
    if (effect === 'none') assert.deepEqual(frames, []);
    else assert.ok(frames.length >= 2);
  }
  assert.equal(effectFrames('fade').at(-1)?.opacity, 1);
  assert.equal(effectFrames('fade-out').at(-1)?.opacity, 0);
  assert.equal(effectFrames('pulse').at(-1)?.transform, 'scale(1)');
});

void test('draft saves stay ordered even while a previous write is pending', async () => {
  const { createBasicSaveQueue } = await import('./motus-basic.ts');
  const writes: string[] = [];
  let finishFirst: () => void = () => {};
  const gate = new Promise<void>((resolve) => {
    finishFirst = resolve;
  });
  const persist = createBasicSaveQueue(async (comic) => {
    writes.push(comic.title);
    if (comic.title === 'first') await gate;
    return comic.title;
  });
  const first = persist({ ...blankComic(), title: 'first' });
  const second = persist({ ...blankComic(), title: 'second' });
  await Promise.resolve();
  assert.deepEqual(writes, ['first']);
  finishFirst();
  assert.deepEqual(await Promise.all([first, second]), ['first', 'second']);
  assert.deepEqual(writes, ['first', 'second']);
});

void test('a failed save does not block the next save attempt', async () => {
  const { createBasicSaveQueue } = await import('./motus-basic.ts');
  let attempts = 0;
  const persist = createBasicSaveQueue(async (comic) => {
    if (++attempts === 1) throw new Error('Storage full');
    return comic.title;
  });
  await assert.rejects(persist(blankComic()), /Storage full/);
  assert.equal(
    await persist({ ...blankComic(), title: 'Recovered' }),
    'Recovered',
  );
});
