import React from 'react'

import Brand from './Brand'
import Menu from './Menu'

import Anchor from '../Primitives/Anchor'
import ForwardArrow from '../../assets/Icons/ForwardArrow'

/*
    Header
*/

// Styles

const header = 'bg-green-500 text-green-100 body-font'
const container =
	'container p-5 mx-auto flex flex-wrap flex-col md:flex-row styles-center items-center'
const cta = [ 
	'inline-flex items-center bg-green-600 border-0 py-1 px-3 focus:outline-none hover:bg-gray-900 rounded-none text-base', 
	'Get Started', 
	'/somewhere'
]

// Component

const Header = () => {
	return (
		<header className={header}>
			<div className={container}>
				<Brand />
				<Menu />
				<Anchor className={cta[0]} label={cta[1]} to={cta[2]}>
					<ForwardArrow />
				</Anchor>
			</div>
		</header>
	)
}

export default Header
