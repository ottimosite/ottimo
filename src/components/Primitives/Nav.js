import React from 'react'

import Menu from '../Patterns/Menu'

/* 
Nav 
*/

// Style

const nav = 'md:ml-auto flex flex-wrap styles-center text-base justify-center'

// Component

const Nav = () => {
	return (
		<nav className={nav}>
			<Menu />
		</nav>
	)
}

export default Nav
