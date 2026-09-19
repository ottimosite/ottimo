import { randomUUID } from 'node:crypto'
import { PlaywrightPageCollector,type PageCollector } from './collector'
import { runAuditRules } from './rules'
import type { AuditReport,AuditRequest } from './types'
export const AUDIT_ENGINE_VERSION='0.1.0'
export class AuditEngine{constructor(private readonly collector:PageCollector=new PlaywrightPageCollector()){}async audit(request:AuditRequest):Promise<AuditReport>{const startedAt=new Date().toISOString();const started=performance.now();const page=await this.collector.collect(request);const evidence=[];const measurements=[];const checks=[];const findings=[];runAuditRules({page,evidence,measurements,checks,findings},request.categories??['performance','accessibility','seo','technical']);return{engineVersion:AUDIT_ENGINE_VERSION,run:{id:randomUUID(),status:'completed',startedAt,completedAt:new Date().toISOString(),durationMs:Math.round(performance.now()-started)},page,evidence,measurements,checks,findings}}}
