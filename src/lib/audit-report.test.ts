import { describe, expect, it, vi } from 'vitest'
import { buildAuditReportHtml, downloadAuditReport } from './audit-report'
import type { Audit } from '../types/domain'

const audit: Audit = {
  id: 'audit-1', websiteId: 'site-1', url: 'https://example.com', createdAt: '2026-09-20T07:00:00Z',
  durationMs: 1200, scores: [], issues: [{
    id:'issue-1', category:'performance', severity:'high', title:'Slow page', summary:'The page is slow.',
    impact:'Visitors wait longer.', solution:'Reduce blocking work.', effort:'low', priority:90, status:'open',
    evidence:{status:'measured',value:3200,unit:'ms',details:'LCP observed at 3200ms'}
  }],
  actions:[{
    id:'action-1', issueId:'issue-1', fingerprint:'performance|slow-page', title:'Improve page performance',
    category:'performance', severity:'high', impact:'high', confidence:'high', effort:'low', priorityScore:90,
    status:'open', lifecycleStatus:'planned', affectedPages:['https://example.com'], affectedResources:[],
    evidenceCount:1, dependencies:[], implementationSteps:['Reduce blocking work'],
    verification:[{description:'Finding no longer reported',affectedPages:['https://example.com']}],
    expectedOutcome:'Faster page', priority:{impact:80,severity:80,confidence:1,effort:1,evidence:2,score:90}
  }],
  health:{score:72,status:'needs-improvement',measuredCategories:['performance'],excludedCategories:[],checks:1,passed:0,failed:1,unavailable:0,methodology:'Evidence-backed score'},
  comparison:{previousAuditId:'audit-0',previousCreatedAt:'2026-09-19T07:00:00Z',comparedAt:'2026-09-20T07:00:00Z',changes:[{type:'new',fingerprint:'performance|slow-page',title:'Slow page',category:'performance',currentSeverity:'high',affectedPages:['https://example.com']}],resolved:0,newFindings:1,improved:0,regressed:0,unchanged:0},
  standards:['Core Web Vitals']
}

describe('audit report export',()=>{
  it('builds a deterministic evidence-backed HTML report',()=>{
    const html=buildAuditReportHtml(audit,'Example')
    expect(html).toContain('Example')
    expect(html).toContain('72/100')
    expect(html).toContain('Slow page')
    expect(html).toContain('LCP observed at 3200ms')
    expect(html).toContain('Improve page performance')
    expect(html).toContain('new')
    expect(html).not.toContain('conversion rate')
  })
  it('downloads the generated report',()=>{
    const click=vi.fn()
    const anchor={click,href:'',download:'',remove:vi.fn()} as unknown as HTMLAnchorElement
    vi.spyOn(document,'createElement').mockReturnValue(anchor)
    vi.spyOn(document.body,'appendChild').mockImplementation(() => anchor)
    Object.defineProperty(URL, 'createObjectURL', { configurable:true, value:vi.fn(() => 'blob:test') })
    Object.defineProperty(URL, 'revokeObjectURL', { configurable:true, value:vi.fn() })
    downloadAuditReport(audit,'Example')
    expect(click).toHaveBeenCalledOnce()
    expect(anchor.download).toBe('example-ottimo-audit.html')
  })
})