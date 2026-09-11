import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isPdf,
  MAX_PDF_BYTES,
  pdfRasterScale,
  readPdfPages,
} from './motus-pdf.ts';

void test('PDF selection handles missing MIME types and uppercase extensions', () => {
  assert.equal(isPdf({ name: 'comic.PDF', type: '' }), true);
  assert.equal(isPdf({ name: 'comic', type: 'application/pdf' }), true);
  assert.equal(isPdf({ name: 'comic.pdf.png', type: 'image/png' }), false);
});

void test('PDF rasterization preserves aspect ratio within pixel and memory limits', () => {
  for (const [width, height] of [
    [612, 792],
    [792, 612],
    [5000, 5000],
    [200, 20000],
  ]) {
    const scale = pdfRasterScale(width, height);
    assert.ok(width * scale <= 3000);
    assert.ok(height * scale <= 3000);
    assert.ok(width * height * scale ** 2 <= 6_000_001);
    assert.equal((width * scale) / (height * scale), width / height);
  }
  assert.equal(pdfRasterScale(612, 792), 2);
  for (const value of [0, -1, NaN, Infinity])
    assert.throws(() => pdfRasterScale(value, 792), /invalid dimensions/);
});

void test('oversized PDFs and full comics fail before reading or loading the renderer', async () => {
  const options = {
    maxPages: 100,
    maxDataLength: 80_000_000,
    onProgress: () => {},
  };
  const file = { name: 'large.pdf', size: MAX_PDF_BYTES + 1 } as File;
  await assert.rejects(readPdfPages(file, options), /under 50 MB/);
  await assert.rejects(
    readPdfPages({ name: 'small.pdf', size: 1 } as File, {
      ...options,
      maxPages: 0,
    }),
    /100 pages/,
  );
});
