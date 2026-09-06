export const titleCase=(v:string)=>v.replaceAll('_',' ').replace(/\b\w/g,m=>m.toUpperCase())
export const formatDate=(v:string)=>new Intl.DateTimeFormat('en-GB',{dateStyle:'medium'}).format(new Date(v))
export const scoreTone=(n:number)=>n>=90?'excellent':n>=80?'good':n>=60?'needs-attention':'critical'
