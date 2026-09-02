import { copyFile } from 'node:fs/promises';

const source = new URL('../hostinger-server.mjs', import.meta.url);
const destination = new URL('../dist/hostinger-server.mjs', import.meta.url);

await copyFile(source, destination);
