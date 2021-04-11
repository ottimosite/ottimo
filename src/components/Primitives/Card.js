import React from 'react'

import Headline from './Headline'
import Lead from './Lead'
import { ButtonGroup } from './Button'
import FastLoading from '../../assets/Illustrations/FastLoading'

const Leading = () => {
	const container = 'lg:flex-grow md:w-1/2 lg:pr-24 md:pr-16 flex flex-col md:items-start md:text-left mb-12 md:mb-0 items-center text-center'
	return (
		<div className={container}>
			<Headline />
			<Lead />
			<ButtonGroup />
		</div>
	)
}

const Graphic = () => {
	const container = 'lg:max-w-lg lg:w-full md:w-1/2 w-5/6 md:pl-16 mt-6 sm:mt-0'
	const graphic =
		'object-cover object-center'
	return (
		<div className={container}>
			<FastLoading className={graphic} alt="hero" />
		</div>
	)
}

const SplashCard = (props) => {
	return (
		<Card>
			<Leading />
			<Graphic />
		</Card>
	)
}

const container =
	'container mx-auto flex px-5 py-6 md:flex-row flex-col items-center'

const Card = (props) => {
	return <div className={container}>{props.children}</div>
}

export default SplashCard