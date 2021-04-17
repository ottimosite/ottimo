import React from 'react'
import Link from 'gatsby-link'

const Anchor = ( props ) => {
	const internal = /^\/(?!\/)/.test(props.to)
	if (internal) {
		return (
			<Link className={props.className} to={props.to}>
				{props.label}
				{props.children}
			</Link>
		)
	}
	return (
		<a className={props.className} href={props.to} >
			{props.label}
			{props.children}
		</a>
	)
}

export default Anchor
