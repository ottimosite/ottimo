import React from 'react'
import Anchor from './Anchor'
// import PropTypes from 'prop-types'

const ButtonPrimary = (props) => {
	const style =
		'inline-flex text-white bg-green-500 border-0 py-4 px-6 focus:outline-none hover:bg-green-600 rounded text-lg'

	return <Button url={props.url} className={style} label={props.label}></Button>
}

const ButtonSecondary = (props) => {
	const style =
		'ml-4 inline-flex text-gray-700 bg-gray-100 border-0 py-4 px-6 focus:outline-none hover:bg-gray-200 rounded text-lg'
	return <Button url={props.url} className={style} label={props.label}></Button>
}

const ButtonGroup = () => {
	return (
		<div className="flex justify-center">
			<ButtonPrimary url="/get-stared" label="Get started" />
			<ButtonSecondary url="/learn-more" label="Learn more" />
		</div>
	)
}

const Button = ( props ) => {
	//const default = 'text-white bg-grey-700 rounde-lg p-3'
	return (
		<Anchor to={props.url}>
		<button className={props.className}>
			{props.label}
		</button>
		</Anchor>
	)
}

export { Button, ButtonPrimary, ButtonSecondary, ButtonGroup }
