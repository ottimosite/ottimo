export type AuditCategory = 'performance' | 'accessibility' | 'seo' | 'technical'
export type AuditSeverity = 'critical' | 'high' | 'medium' | 'low'
export type MeasurementStatus = 'measured' | 'inferred' | 'unavailable'
export type CheckStatus = 'pass' | 'fail' | 'not_applicable' | 'unavailable'
export type HealthStatus = 'good' | 'needs-improvement' | 'needs-attention' | 'not-measured'
export interface AuditCategoryScore { category: AuditCategory; score?: number; checks: number; passed: number; failed: number; unavailable: number; weight: number }
export interface AuditHealth { score?: number; status: HealthStatus; measuredCategories: AuditCategory[]; excludedCategories: AuditCategory[]; checks: number; passed: number; failed: number; unavailable: number; categoryScores: AuditCategoryScore[]; methodology: string }
export type AuditErrorCode = 'invalid_url' | 'security_blocked' | 'dns_failure' | 'timeout' | 'navigation_failed' | 'http_error' | 'response_too_large' | 'browser_error' | 'audit_failed'
export interface AuditError { code: AuditErrorCode; message: string; recoverable: boolean }
export interface AuditEvidence { id:string; category:AuditCategory; kind:'dom'|'network'|'timing'|'accessibility'|'http'|'resource'; description:string; value?:string|number|boolean; unit?:string; source:'playwright'|'browser-performance'|'axe-core'; url?:string; selector?:string; observedAt:string }
export interface AuditMeasurement { id:string; category:AuditCategory; metric:string; value?:number; unit?:string; status:MeasurementStatus; source?:string; evidenceIds:string[] }
export interface AuditCheck { id:string; category:AuditCategory; criterion:string; status:CheckStatus; message:string; evidenceIds:string[] }
export interface AuditFinding { id:string; category:AuditCategory; severity:AuditSeverity; title:string; summary:string; impact:string; recommendation:string; scope:'page'|'resource'|'site'; selector?:string; resourceUrl?:string; evidenceIds:string[] }
export interface ResourceSnapshot { url:string; type:string; status?:number; contentType?:string; transferSize?:number; encodedBodySize?:number; decodedBodySize?:number; durationMs?:number; failed?:boolean }
export interface PageSnapshot { requestedUrl:string; finalUrl:string; status:number; statusText:string; contentType:string; redirectChain:string[]; html:string; title:string; language?:string; secureContext:boolean; timing:{dnsMs?:number;connectionMs?:number;requestMs?:number;ttfbMs?:number;domContentLoadedMs?:number;loadMs?:number;fcpMs?:number;lcpMs?:number;cls?:number;inpMs?:number;transferSize?:number;encodedBodySize?:number;decodedBodySize?:number}; resources:ResourceSnapshot[]; requestFailures:Array<{url:string;errorText:string}>; accessibility:{violations:Array<{id:string;impact?:string;help:string;description:string;nodes:Array<{target:string[];html?:string;failureSummary?:string}>}>} }
export interface AuditRequest { url:string; timeoutMs?:number; categories?:AuditCategory[]; viewport?:{width:number;height:number} }
export interface AuditRuleContext { page:PageSnapshot; evidence:AuditEvidence[]; measurements:AuditMeasurement[]; checks:AuditCheck[]; findings:AuditFinding[] }
export interface AuditReport {
  health?: AuditHealth; engineVersion:string; run:{id:string;status:'completed'|'failed';startedAt:string;completedAt:string;durationMs:number}; page?:PageSnapshot; error?:AuditError; measurements:AuditMeasurement[]; checks:AuditCheck[]; findings:AuditFinding[]; evidence:AuditEvidence[] }
