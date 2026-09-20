export interface DeploymentCheck {
  name: string
  ok: boolean
  required: boolean
  message: string
}

export function validateDeploymentEnvironment(env: Record<string, string | undefined>): DeploymentCheck[] {
  const checks: DeploymentCheck[] = [
    {
      name: 'node-runtime',
      required: true,
      ok: Boolean(env.NODE_VERSION),
      message: env.NODE_VERSION ? `Node runtime declared: ${env.NODE_VERSION}` : 'NODE_VERSION must be declared.',
    },
    {
      name: 'audit-timeout',
      required: true,
      ok: !env.OTTIMO_AUDIT_TIMEOUT_MS || Number.isFinite(Number(env.OTTIMO_AUDIT_TIMEOUT_MS)),
      message: env.OTTIMO_AUDIT_TIMEOUT_MS ? 'Audit timeout configuration is numeric.' : 'Default audit timeout will be used.',
    },
  ]
  return checks
}

export function deploymentReady(checks: DeploymentCheck[]): boolean {
  return checks.filter(check => check.required).every(check => check.ok)
}
