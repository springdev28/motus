// Hostinger classifies repositories with an Express runtime as server-side
// applications. Keep this conventional entry point at the repository root so
// GitHub-triggered deployments do not fall back to static Vite hosting.
import './hostinger-server.mjs';
