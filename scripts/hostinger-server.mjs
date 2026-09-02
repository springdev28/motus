import { startProdServer } from 'vinext/server/prod-server';
import { fileURLToPath } from 'node:url';

const port = Number.parseInt(process.env.PORT ?? '3000', 10);
const host = '0.0.0.0';
const outDir = fileURLToPath(new URL('./', import.meta.url));

if (!Number.isInteger(port) || port < 1 || port > 65_535) {
  throw new Error(`Invalid PORT value: ${process.env.PORT}`);
}

await startProdServer({ host, outDir, port });
