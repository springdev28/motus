export function GET(request: Request) {
  return Response.redirect(new URL('/favicon-v2.svg', request.url), 307);
}
