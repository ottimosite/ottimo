import { AuthenticatedTenantRepository } from './authenticated-repository'
import { HmacSessionVerifier } from './session-token'
import { createNetlifyStorageAdapter } from './netlify-storage'

const SESSION_SECRET_ENV = 'OTTIMO_SESSION_SECRET'

export function createProductionRepository(secret = process.env[SESSION_SECRET_ENV]): AuthenticatedTenantRepository {
  if (!secret) throw new Error('SESSION_SECRET_NOT_CONFIGURED')
  return new AuthenticatedTenantRepository(
    new HmacSessionVerifier(secret),
    createNetlifyStorageAdapter(),
  )
}

export const productionSessionSecretEnv = SESSION_SECRET_ENV
