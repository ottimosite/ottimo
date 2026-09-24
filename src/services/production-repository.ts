import { AuthenticatedTenantRepository } from './authenticated-repository'
import { SupabaseRequestAuthenticator } from './supabase-auth'
import { SupabaseWorkspaceRepository } from './supabase-tenant-repository'
import { createNetlifyStorageAdapter } from './netlify-storage'

const SUPABASE_URL_ENV = 'SUPABASE_URL'
const SUPABASE_PUBLISHABLE_KEY_ENV = 'SUPABASE_PUBLISHABLE_KEY'
const SUPABASE_SECRET_KEY_ENV = 'SUPABASE_SECRET_KEY'

export interface ProductionAuthConfig {
  supabaseUrl: string
  supabasePublishableKey: string
  supabaseSecretKey: string
}

export function readProductionAuthConfig(env: NodeJS.ProcessEnv = process.env): ProductionAuthConfig {
  const supabaseUrl = env[SUPABASE_URL_ENV]
  const supabasePublishableKey = env[SUPABASE_PUBLISHABLE_KEY_ENV]
  const supabaseSecretKey = env[SUPABASE_SECRET_KEY_ENV]

  if (!supabaseUrl || !supabasePublishableKey || !supabaseSecretKey) {
    throw new Error('SUPABASE_AUTH_NOT_CONFIGURED')
  }

  return { supabaseUrl, supabasePublishableKey, supabaseSecretKey }
}

export function createProductionRepository(
  config = readProductionAuthConfig(),
): AuthenticatedTenantRepository {
  const tenantRepository = new SupabaseWorkspaceRepository({
    url: config.supabaseUrl,
    secretKey: config.supabaseSecretKey,
  })

  return new AuthenticatedTenantRepository(
    new SupabaseRequestAuthenticator(
      {
        url: config.supabaseUrl,
        publishableKey: config.supabasePublishableKey,
      },
      userId => tenantRepository.resolveTenant(userId),
    ),
    createNetlifyStorageAdapter(),
  )
}

export const productionAuthEnv = {
  supabaseUrl: SUPABASE_URL_ENV,
  supabasePublishableKey: SUPABASE_PUBLISHABLE_KEY_ENV,
  supabaseSecretKey: SUPABASE_SECRET_KEY_ENV,
} as const
