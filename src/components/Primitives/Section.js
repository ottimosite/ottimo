import React from 'react'
// import PropTypes from "prop-types"

const Section = (props) => {	
	const container =
		'container mx-auto flex px-5 py-12 md:flex-row flex-col items-center'

	return (
		<section>
			<div className={container}>{props.children}</div>
		</section>
	)
}

// Section.propTypes = {}

export default Section
