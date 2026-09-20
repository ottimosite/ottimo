import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ResourcePerformancePanel } from './ResourcePerformancePanel'

describe('ResourcePerformancePanel', () => {
  it('renders observed resource attribution without implying causality', () => {
    render(<ResourcePerformancePanel audit={{
      id: 'audit-resource-test', websiteId: 'site-test', url: 'https://example.com', createdAt: '2026-09-20T00:00:00Z',
      durationMs: 100, scores: [], issues: [], stats: {
        source: 'live',
        resourcePerformance: {
          resourceCount: 3,
          totalTransferBytes: 3072,
          byType: [{ type: 'script', count: 2, transferBytes: 2048 }, { type: 'image', count: 1, transferBytes: 1024 }],
          largest: [{ url: 'https://example.com/app.js', type: 'script', transferBytes: 2048, durationMs: 120 }],
          slowest: [{ url: 'https://example.com/hero.jpg', type: 'image', transferBytes: 1024, durationMs: 1200 }],
          contributors: [{ pageUrl: 'https://example.com/', url: 'https://example.com/app.js', type: 'script', host: 'example.com', transferBytes: 2048, durationMs: 120, transferShare: 0.6667, durationShare: 0.1, evidence: 'measured' }],
        },
      },
    }} />)
    expect(screen.getByRole('heading', { name: /where page weight and delay were observed/i })).toBeInTheDocument()
    expect(screen.getByText(/attribution evidence/i)).toBeInTheDocument()
    expect(screen.getByText(/2.0 KB · script/i)).toBeInTheDocument()
    expect(screen.getByText(/1200 ms · image/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /top observed contributors/i })).toBeInTheDocument()
    expect(screen.getByText(/67% transfer · 10% duration/i)).toBeInTheDocument()
  })
})
