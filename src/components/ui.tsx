import type { ButtonHTMLAttributes, ReactNode, CSSProperties } from 'react'
export function Button({children,className='',variant='primary',...props}:{children:ReactNode;className?:string;variant?:'primary'|'secondary'|'ghost'} & ButtonHTMLAttributes<HTMLButtonElement>){return <button className={`btn btn-${variant} ${className}`} {...props}>{children}</button>}
export function Card({children,className=''}:{children:ReactNode;className?:string}){return <section className={`card ${className}`}>{children}</section>}
export function Badge({children,tone='neutral'}:{children:ReactNode;tone?:string}){return <span className={`badge badge-${tone}`}>{children}</span>}
export function Score({value,label}:{value:number;label?:string}){return <div className="score"><div className="score-ring" style={{'--score':`${value*3.6}deg`} as CSSProperties}><strong>{value}</strong></div>{label&&<span>{label}</span>}</div>}
export function Progress({value}:{value:number}){return <div className="progress" aria-label={`${value}%`}><span style={{width:`${value}%`}}/></div>}
export function EmptyState({title,body,action}:{title:string;body:string;action?:ReactNode}){return <div className="empty"><div className="empty-mark">○</div><h3>{title}</h3><p>{body}</p>{action}</div>}
