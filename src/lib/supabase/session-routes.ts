/**
 * Routes whose server render reads the Supabase session.
 * Public pages are left alone so middleware does not set cookies or wait on Auth,
 * and the CDN can cache the shared HTML.
 */
const SESSION_ROUTE =
  /^\/(?:login|auth|api)(?:\/|$)|^\/spots\/(?:new|mine)(?:\/|$)|^\/spots\/[^/]+\/edit(?:\/|$)/;

export function routeRefreshesAuthSession(pathname: string): boolean {
  return SESSION_ROUTE.test(pathname);
}
