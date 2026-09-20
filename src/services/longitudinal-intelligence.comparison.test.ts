import { describe, expect, it } from 'vitest'
import type { Audit } from '../types/domain'
import { compareAudits } from './longitudinal-intelligence'

const audit=(id:string, issues: Audit['issues'], scores=AuditScores()): Audit=>({
 id,websiteId:'site-1',url:'https://example.com',createdAt:id,durationMs:1,scores,issues
})
function AuditScores(){return [{category:'performance',score:70,measurement:'measured'} as const]}
const issue=(id:string,severity:Audit['issues'][number]['severity'],evidence:'measured'|'unavailable'='measured')=>({
 id,category:'performance' as const,severity,title:id,summary:'summary',impact:'impact',solution:'solution',effort:'low' as const,priority:1,status:'open' as const,fingerprint:id,evidence:{status:evidence}
})
describe('compareAudits',()=>{
 it('classifies resolved, new, improved and regressed findings',()=>{
  const result=compareAudits(audit('previous',[issue('resolved','high'),issue('improved','high'),issue('regressed','low')]),audit('current',[issue('improved','medium'),issue('regressed','high'),issue('new','low')]),'2026-09-20T12:00:00Z')
  expect(result.changes.map(c=>[c.fingerprint,c.type])).toEqual([
   ['resolved','resolved'],['improved','improved'],['regressed','regressed'],['new','new'],
  ])
  expect(result.resolved).toBe(1);expect(result.newFindings).toBe(1);expect(result.improved).toBe(1);expect(result.regressed).toBe(1)
 })
 it('marks unavailable-to-unavailable changes inconclusive',()=>{
  const result=compareAudits(audit('previous',[issue('same','medium','unavailable')]),audit('current',[issue('same','medium','unavailable')]))
  expect(result.changes).toHaveLength(1);expect(result.changes[0].type).toBe('inconclusive')
 })
 it('rejects cross-website comparisons',()=>{
  const previous=audit('previous',[]);const current={...audit('current',[]),websiteId:'other'}
  expect(()=>compareAudits(previous,current)).toThrow('AUDIT_COMPARISON_WEBSITE_MISMATCH')
 })
})
