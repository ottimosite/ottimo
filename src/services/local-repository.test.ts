import { beforeEach, describe, expect, it } from 'vitest'
import { seedAudits, seedWebsites } from '../data/mock'
import { localRepository } from './local-repository'
import { storage } from './storage'

describe('localRepository', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('uses seed data when persisted collections are empty', () => {
    expect(localRepository.audits()).toEqual(seedAudits)
    expect(localRepository.websites()).toEqual(seedWebsites)
  })

  it('prefers persisted collections when they contain data', () => {
    const audit = { ...seedAudits[0], id: 'stored-audit' }
    const website = { ...seedWebsites[0], id: 'stored-website' }

    localRepository.saveAudits([audit])
    localRepository.saveWebsites([website])

    expect(localRepository.audits()).toEqual([audit])
    expect(localRepository.websites()).toEqual([website])
    expect(localRepository.findAudit('stored-audit')).toEqual(audit)
    expect(localRepository.findWebsite('stored-website')).toEqual(website)
  })

  it('persists audits and websites through the repository boundary', () => {
    const audit = { ...seedAudits[0], id: 'written-audit' }
    const website = { ...seedWebsites[0], id: 'written-website' }

    localRepository.saveAudits([audit])
    localRepository.saveWebsites([website])

    expect(localRepository.audits()).toEqual([audit])
    expect(localRepository.websites()).toEqual([website])
  })

  it('adds a new audit without dropping the deterministic seed audit', () => {
    const audit = { ...seedAudits[0], id: 'new-audit' }

    localRepository.addAudit(audit)

    expect(localRepository.audits()).toContainEqual(seedAudits[0])
    expect(localRepository.audits()).toContainEqual(audit)
  })

  it('returns undefined for missing records', () => {
    expect(localRepository.findAudit('missing')).toBeUndefined()
    expect(localRepository.findWebsite('missing')).toBeUndefined()
  })

  it('resolves the website associated with an audit', () => {
    const audit = { ...seedAudits[0], id: 'stored-audit', websiteId: seedWebsites[0].id }
    localRepository.saveAudits([audit])

    expect(localRepository.websiteForAudit(audit)).toEqual(seedWebsites[0])
  })
})
