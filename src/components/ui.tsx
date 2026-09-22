import type { ButtonHTMLAttributes, ReactNode, CSSProperties } from 'react'

export function Button({children,className='',variant='primary',...props}:{children:ReactNode;className?:string;variant?:'primary'|'secondary'|'ghost'} & ButtonHTMLAttributes<HTMLButtonElement>){
  return <button className={`btn btn-${variant} ${className}`} {...props}>{children}</button>
}

export function PageHeading({eyebrow,title,description,action}:{eyebrow:ReactNode;title:string;description:ReactNode;action?:ReactNode}){
  return <div className="page-heading"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>{action}</div>
}

export function Card({children,className='',id}:{children:ReactNode;className?:string;id?:string}){
  return <section id={id} className={`card ${className}`}>{children}</section>
}

export function Badge({children,tone='neutral'}:{children:ReactNode;tone?:string}){
  return <span className={`badge badge-${tone}`}>{children}</span>
}

export function Score({value,label}:{value:number;label?:string}){
  const bounded = Math.max(0, Math.min(100, value))
  return <div className="score" aria-label={label ? `${label}: ${bounded} out of 100` : `Score: ${bounded} out of 100`}>
    <div className="score-ring" aria-hidden="true" style={{'--score':`${bounded*3.6}deg`} as CSSProperties}><strong>{bounded}</strong></div>
    {label&&<span>{label}</span>}
  </div>
}

export function Progress({value,label='Progress'}:{value:number;label?:string}){
  const bounded = Math.max(0, Math.min(100, value))
  return <div className="progress" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={bounded}><span aria-hidden="true" style={{width:`${bounded}%`}}/></div>
}

export function EmptyState({title,body,action}:{title:string;body:string;action?:ReactNode}){
  return <div className="empty"><div className="empty-mark" aria-hidden="true">○</div><h3>{title}</h3><p>{body}</p>{action}</div>
}
