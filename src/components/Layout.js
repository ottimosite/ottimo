import React from 'react'
import PropTypes from 'prop-types'

import Header from './Patterns/Header'
import Footer from './Patterns/Footer'

const Layout = ({ children }) => {
	return (
		<>
			<Header />
			<main>
				<div>
					{children}
				</div>
			</main>
			<Footer />
		</>
	)
}

Layout.propTypes = {
	children: PropTypes.node.isRequired,
}

export default Layout
