// Hostinger loads this conventional entry with require(). Keep its module graph
// synchronous and load the asynchronous Vinext server through dynamic import.
import('./hostinger-server.mjs').catch((error) => {
  console.error('Motus failed to start:', error);
  process.exitCode = 1;
});
