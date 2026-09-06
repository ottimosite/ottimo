export function isValidUrl(value:string){ try{const u=new URL(value); return ['http:','https:'].includes(u.protocol) && Boolean(u.hostname) }catch{return false} }
export function normaliseUrl(value:string){ const v=value.trim(); return /^https?:\/\//i.test(v)?v:`https://${v}` }
