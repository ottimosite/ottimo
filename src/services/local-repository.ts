import { seedAudits, seedWebsites } from '../data/mock'
import { storage } from './storage'
import type { Audit, Website } from '../types/domain'

export const localRepository = {
  audits(): Audit[] {
    const stored = storage.audits()
    return stored.length ? stored : seedAudits
  },

  websites(): Website[] {
    const stored = storage.websites()
    return stored.length ? stored : seedWebsites
  },

  saveAudits(audits: Audit[]): void {
    storage.saveAudits(audits)
  },

  saveWebsites(websites: Website[]): void {
    storage.saveWebsites(websites)
  },

  addAudit(audit: Audit): void {
    storage.saveAudits([...seedAudits, ...storage.audits(), audit])
  },

  findAudit(id: string): Audit | undefined {
    return localRepository.audits().find(audit => audit.id === id)
  },

  findWebsite(id: string): Website | undefined {
    return localRepository.websites().find(website => website.id === id)
  },

  websiteForAudit(audit: Audit): Website | undefined {
    return localRepository.findWebsite(audit.websiteId)
  },
}
