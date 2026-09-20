import { describe, expect, it } from 'vitest'
import { deploymentReady, validateDeploymentEnvironment } from './deployment-checks'

describe('deployment checks', () => {
  it('accepts declared runtime configuration', () => {
    const checks = validateDeploymentEnvironment({ NODE_VERSION: '22' })
    expect(deploymentReady(checks)).toBe(true)
  })

  it('rejects invalid required configuration', () => {
    const checks = validateDeploymentEnvironment({ NODE_VERSION: '', OTTIMO_AUDIT_TIMEOUT_MS: 'not-a-number' })
    expect(deploymentReady(checks)).toBe(false)
  })
})
