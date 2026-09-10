import { copyFile } from 'node:fs/promises';

const entries = ['hostinger-server.mjs', 'server.js'];

await Promise.all(
  entries.map((entry) =>
    copyFile(
      new URL(`../${entry}`, import.meta.url),
      new URL(`../dist/${entry}`, import.meta.url),
    ),
  ),
);
