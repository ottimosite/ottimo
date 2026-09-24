import { requestEmailVerification, type AuthRateLimiter } from './supabase-email-auth'
import { TenantRepository, type TenantPrincipal } from './persistence'
import { SupabaseWorkspaceRepository } from './supabase-tenant-repository'
import { transitionLifecycle, type LifecycleState } from './account-lifecycle'

export interface OnboardingConfig {
  url: string
  publishableKey: string
  secretKey: string
}

export interface OnboardingInput {
  email: string
  websiteUrl: string
  websiteName?: string
  rateLimitKey: string
}

export interface OnboardingResult {
  accepted: boolean
  created: boolean
  tenantId?: string
  websiteId?: string
}

function normaliseUrl(value: string): string {
  return value.trim().replace(/\/+$/, '')
}

function validWebsiteUrl(value: string): boolean {
  try {
    const parsed = new URL(value)
    return (parsed.protocol === 'https:' || parsed.protocol === 'http:') && Boolean(parsed.hostname)
  } catch {
    return false
  }
}

function validEmail(value: string): boolean {
  return value.length >= 3 && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

async function createUnconfirmedUser(config: OnboardingConfig, email: string): Promise<{ user?: { id: string }; status: number }> {
  const response = await fetch(config.url.replace(/\/+$/, '') + '/auth/v1/admin/users', {
    method: 'POST',
    headers: {
      apikey: config.secretKey,
      authorization: 'Bearer ' + config.secretKey,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({ email, email_confirm: false }),
  })

  if (!response.ok) return { status: response.status }

  const payload = await response.json() as { id?: unknown }
  return {
    status: response.status,
    user: typeof payload.id === 'string' && payload.id ? { id: payload.id } : undefined,
  }
}

export async function startOnboarding(
  config: OnboardingConfig,
  input: OnboardingInput,
  storage: ConstructorParameters<typeof TenantRepository>[0],
  rateLimiter?: AuthRateLimiter,
): Promise<OnboardingResult> {
  const email = input.email.trim().toLowerCase()
  const websiteUrl = normaliseUrl(input.websiteUrl)

  if (!validEmail(email)) throw new Error('ONBOARDING_EMAIL_INVALID')
  if (!validWebsiteUrl(websiteUrl)) throw new Error('ONBOARDING_WEBSITE_INVALID')

  const limiter = rateLimiter ?? { allow: () => true }
  if (!limiter.allow(input.rateLimitKey)) throw new Error('ONBOARDING_RATE_LIMITED')

  const createdUser = await createUnconfirmedUser(config, email)
  if (createdUser.status >= 500) throw new Error('ONBOARDING_PROVIDER_UNAVAILABLE')
  const user = createdUser.user

  // Existing accounts are deliberately opaque. They receive the same
  // passwordless email flow and can continue through their existing workspace.
  if (!user) {
    const emailResult = await requestEmailVerification(
      { url: config.url, publishableKey: config.publishableKey },
      email,
      limiter,
      input.rateLimitKey,
    )
    if (emailResult.providerStatus === 429) throw new Error('ONBOARDING_RATE_LIMITED')
    if (emailResult.providerStatus >= 500) throw new Error('ONBOARDING_PROVIDER_UNAVAILABLE')
    return { accepted: true, created: false }
  }

  const workspaceRepository = new SupabaseWorkspaceRepository({
    url: config.url,
    secretKey: config.secretKey,
  })
  const workspace = await workspaceRepository.createWorkspace(user.id, 'My Ottimo workspace')
  const website = await workspaceRepository.createWebsite(
    workspace.id,
    user.id,
    (input.websiteName?.trim() || new URL(websiteUrl).hostname).slice(0, 160),
    websiteUrl,
  )

  const principal: TenantPrincipal = { userId: user.id, tenantId: workspace.id }
  const initial: LifecycleState = {
    account: 'visitor',
    updatedAt: new Date().toISOString(),
  }
  const pending = transitionLifecycle(initial, 'start_onboarding')
  const verifying = transitionLifecycle(pending, 'request_verification')
  await new TenantRepository(storage).saveLifecycle(principal, verifying)

  const emailResult = await requestEmailVerification(
    { url: config.url, publishableKey: config.publishableKey },
    email,
    limiter,
    input.rateLimitKey,
  )

  if (emailResult.providerStatus === 429) throw new Error('ONBOARDING_RATE_LIMITED')
  if (emailResult.providerStatus >= 500) throw new Error('ONBOARDING_PROVIDER_UNAVAILABLE')

  return {
    accepted: true,
    created: true,
    tenantId: workspace.id,
    websiteId: website.id,
  }
}
