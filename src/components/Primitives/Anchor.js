import React from 'react'
import Link from 'gatsby-link'

const Anchor = props => {
  return (
    <Link className={props.className} to={props.url}>
      {props.label}
      {props.children}
    </Link>
  )
}

export default Anchor