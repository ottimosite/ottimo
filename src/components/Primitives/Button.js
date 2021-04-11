import React from 'react'
// import PropTypes from 'prop-types'

const ButtonPrimary = (props) => {
	const button =
		'inline-flex text-white bg-green-500 border-0 py-4 px-6 focus:outline-none hover:bg-green-600 rounded text-lg'

	return <button className={button}>{props.label}</button>
}

const ButtonSecondary = (props) => {
	const style =
		'ml-4 inline-flex text-gray-700 bg-gray-100 border-0 py-4 px-6 focus:outline-none hover:bg-gray-200 rounded text-lg'
	return <button className={style}>{props.label}</button>
}

const ButtonGroup = () => {
	return (
		<div className="flex justify-center">
			<ButtonPrimary label="Get started" />
			<ButtonSecondary label="Learn more" />
		</div>
	)
}

const Button = ({ props }) => {
	return (
		<button type={props.type} className="text-white bg-grey-700 rounde-lg p-3">
			{props.label}
		</button>
	)
}

export { Button, ButtonPrimary, ButtonSecondary, ButtonGroup }
