import { HmacSessionVerifier } from '../../src/services/session-token'

const json = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers } })

export default async (request: Request) => {
  if (request.method !== 'GET') return json(405, { error: 'Method not allowed.' })
  const secret = process.env.OTTIMO_SESSION_SECRET
  if (!secret) return json(503, { error: 'Authentication is not configured.' })
  const session = await new HmacSessionVerifier(secret).verify(request)
  if (!session) return json(401, { authenticated: false })
  return json(200, {
    authenticated: true,
    userId: session.userId,
    tenantId: session.tenantId,
    expiresAt: session.expiresAt,
  })
}
