export const MAX_PDF_BYTES = 50_000_000;

export function isPdf(file: Pick<File, 'name' | 'type'>) {
  return file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
}

export function pdfRasterScale(width: number, height: number) {
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0
  )
    throw new Error('This PDF contains a page with invalid dimensions.');
  return Math.min(
    2,
    3000 / Math.max(width, height),
    Math.sqrt(6_000_000 / (width * height)),
  );
}

export type ImportedPdfPage = {
  name: string;
  src: string;
  width: number;
  height: number;
};

/** Flatten PDF pages locally so the existing image-only reader and animation model can use them. */
export async function readPdfPages(
  file: File,
  options: {
    maxPages: number;
    maxDataLength: number;
    onProgress: (page: number, total: number) => void;
  },
): Promise<ImportedPdfPage[]> {
  if (file.size > MAX_PDF_BYTES)
    throw new Error(`${file.name}: PDFs must be under 50 MB.`);
  if (options.maxPages < 1) throw new Error('Use up to 100 pages per comic.');
  const pdfjs = await import('pdfjs-dist');
  const assetUrl = new URL(`/pdfjs/${pdfjs.version}/`, window.location.origin)
    .href;
  pdfjs.GlobalWorkerOptions.workerSrc = `${assetUrl}pdf.worker.min.mjs`;
  const task = pdfjs.getDocument({
    data: new Uint8Array(await file.arrayBuffer()),
    enableXfa: false,
    cMapUrl: `${assetUrl}cmaps/`,
    cMapPacked: true,
    standardFontDataUrl: `${assetUrl}standard_fonts/`,
    wasmUrl: `${assetUrl}wasm/`,
  });
  try {
    const pdf = await task.promise;
    if (pdf.numPages > options.maxPages)
      throw new Error(
        `${file.name} has ${pdf.numPages} pages. There is room for ${options.maxPages} more in this comic (100 maximum).`,
      );
    const pages: ImportedPdfPage[] = [];
    let dataLength = 0;
    for (let index = 1; index <= pdf.numPages; index++) {
      options.onProgress(index, pdf.numPages);
      const page = await pdf.getPage(index);
      const original = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({
        scale: pdfRasterScale(original.width, original.height),
      });
      const canvas = document.createElement('canvas');
      try {
        canvas.width = Math.max(1, Math.floor(viewport.width));
        canvas.height = Math.max(1, Math.floor(viewport.height));
        await page.render({ canvas, viewport, background: '#ffffff' }).promise;
        const src = canvas.toDataURL('image/jpeg', 0.92);
        if (!src.startsWith('data:image/jpeg;base64,'))
          throw new Error('Your browser could not convert this PDF page.');
        dataLength += src.length;
        if (dataLength > options.maxDataLength)
          throw new Error(
            'This comic is too large. Keep the total under 80 MB. Try a shorter PDF.',
          );
        pages.push({
          name: `${file.name.slice(0, 470)} · Page ${index}`,
          src,
          width: canvas.width,
          height: canvas.height,
        });
      } finally {
        canvas.width = canvas.height = 0;
        page.cleanup();
      }
    }
    return pages;
  } catch (error) {
    if (error instanceof Error && error.name === 'PasswordException')
      throw new Error(
        `${file.name} is password protected. Upload an unlocked copy.`,
      );
    if (error instanceof Error && error.name === 'InvalidPDFException')
      throw new Error(
        `${file.name} could not be opened. Upload a valid, undamaged PDF.`,
      );
    throw error;
  } finally {
    await task.destroy();
  }
}
