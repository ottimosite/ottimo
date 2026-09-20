export default async (request: Request) => {
  if (request.method !== 'GET') return new Response('Method not allowed.', { status: 405 })
  const loginUrl = process.env.OTTIMO_AUTH_LOGIN_URL
  if (!loginUrl) return new Response('Authentication provider is not configured.', { status: 503 })
  return Response.redirect(loginUrl, 302)
}
