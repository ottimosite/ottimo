import { describe, expect, it } from 'vitest'
import type { Audit } from '../types/domain'
import { buildWebsiteHealthTrends, buildWebsiteHistory } from './longitudinal-intelligence'

const audit=(id:string, score:number|undefined, categoryScore:number|undefined, measurement='measured' as const): Audit=>({
 id,websiteId:'site-1',url:'https://example.com',createdAt:id,durationMs:1,
 score,
 scores:[{category:'performance',score:categoryScore,measurement}],
 issues:[]
})
describe('buildWebsiteHealthTrends',()=>{
 it('reports improvement and preserves delta',()=>{
  const history=buildWebsiteHistory([audit('2026-09-01',70,65),audit('2026-09-02',80,75)],'site-1')
  const result=buildWebsiteHealthTrends(history)
  expect(result.overall.direction).toBe('improving')
  expect(result.overall.scoreDelta).toBe(10)
  expect(result.categories[0].trend.direction).toBe('improving')
  expect(result.overall.evidence).toBe('measured')
 })
 it('reports regression and stability without inventing evidence',()=>{
  const reg=buildWebsiteHealthTrends(buildWebsiteHistory([audit('a',80,80),audit('b',70,70)],'site-1'))
  expect(reg.overall.direction).toBe('regressing')
  const stable=buildWebsiteHealthTrends(buildWebsiteHistory([audit('a',80,80),audit('b',80,80)],'site-1'))
  expect(stable.overall.direction).toBe('stable')
 })
 it('reports insufficient evidence when scores are unavailable',()=>{
  const result=buildWebsiteHealthTrends(buildWebsiteHistory([audit('a',undefined,undefined,'unavailable'),audit('b',undefined,undefined,'unavailable')],'site-1'))
  expect(result.overall.direction).toBe('insufficient-evidence')
  expect(result.categories[0].trend.direction).toBe('insufficient-evidence')
 })
 it('does not compare audits from another website',()=>{
  const history=buildWebsiteHistory([audit('a',70,70)],'site-1')
  expect(history.audits).toHaveLength(1)
  expect(buildWebsiteHealthTrends(history).overall.direction).toBe('insufficient-evidence')
 })
})
