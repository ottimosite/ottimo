import React from 'react'

import Brand from './Brand'
import Menu from './Menu'

import Action from '../Primitives/ActionButton'

/*
    Header
*/

// Styles

const header = 'bg-green-500 text-green-100 body-font'
const container =
	'container p-5 mx-auto flex flex-wrap flex-col md:flex-row styles-center items-center'

// Component

const Header = () => {
	return (
		<header className={header}>
			<div className={container}>
				<Brand />
				<Menu />
				<Action />
			</div>
		</header>
	)
}

export default Header
