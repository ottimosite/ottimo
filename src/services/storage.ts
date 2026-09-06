import type { Audit, Website } from '../types/domain'
const keys={websites:'ottimo-websites',audits:'ottimo-audits'}
function read<T>(key:string, fallback:T):T{ try{const raw=localStorage.getItem(key);return raw?JSON.parse(raw) as T:fallback}catch{return fallback} }
export const storage={
 websites:()=>read<Website[]>(keys.websites,[]),
 audits:()=>read<Audit[]>(keys.audits,[]),
 saveWebsites:(v:Website[])=>localStorage.setItem(keys.websites,JSON.stringify(v)),
 saveAudits:(v:Audit[])=>localStorage.setItem(keys.audits,JSON.stringify(v))
}
