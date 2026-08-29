export function GET(request: Request) {
  return Response.redirect(new URL('/motus-logo-256.png', request.url), 307);
}
