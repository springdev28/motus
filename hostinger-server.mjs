import { startProdServer } from 'vinext/server/prod-server';
import { fileURLToPath } from 'node:url';

const port = Number.parseInt(process.env.PORT ?? '3000', 10);
const host = '0.0.0.0';
const root = fileURLToPath(new URL('./', import.meta.url));
const outDir = root.endsWith('/dist/') ? root : fileURLToPath(new URL('./dist/', import.meta.url));

if (!Number.isInteger(port) || port < 1 || port > 65_535) {
  throw new Error(`Invalid PORT value: ${process.env.PORT}`);
}

await startProdServer({ host, outDir, port });
