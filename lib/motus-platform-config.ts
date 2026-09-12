export function publicPlatformConfig(
  url: string | undefined,
  key: string | undefined,
) {
  // Only modern publishable keys are supported. Never serialize secret or service-role credentials.
  if (url && key?.startsWith('sb_publishable_')) {
    try {
      const endpoint = new URL(url);
      if (
        endpoint.protocol === 'https:' &&
        !endpoint.username &&
        !endpoint.password &&
        !endpoint.search &&
        !endpoint.hash &&
        endpoint.pathname === '/'
      ) {
        return {
          configured: true,
          url: endpoint.origin,
          publishableKey: key,
        };
      }
    } catch {
      /* An incomplete deployment stays safely unconfigured. */
    }
  }
  return {
    configured: false,
    url: null,
    publishableKey: null,
  };
}
