import React from 'react'

import Anchor from '../Primitives/Anchor'

/*
    Menu
*/

// Style

const nav = 'md:ml-auto flex flex-wrap styles-center text-base justify-center'
const menuItem = 'mr-5 font-bold hover:text-green-100 hover:underline py-3'

// Component

const Menu = () => {
	return (
		<nav className={nav}>
			<Anchor url="/" className={menuItem}>
				Home
			</Anchor>
			<Anchor url="/test" className={menuItem}>
				Test
			</Anchor>
		</nav>
	)
}

export default Menu
