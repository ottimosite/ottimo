import React, { StrictMode } from 'react'
import {
	ChakraProvider,
	Box,
	Grid,
	theme,
	ColorModeScript,
} from '@chakra-ui/react'
import PropTypes from 'prop-types'

import Navbar from './Navbar'
import Footer from './Footer'

const Layout = ({ children }) => {
	return (
		<StrictMode>
			<ChakraProvider theme={theme}>
				<Box textAlign="center" fontSize="xl">
					<Grid>
						<ColorModeScript />
						<Navbar />
						<main>
							<div>{children}</div>
						</main>
						<Footer />
					</Grid>
				</Box>s
			</ChakraProvider>
		</StrictMode>
	)
}

Layout.propTypes = {
	children: PropTypes.node.isRequired,
}

export default Layout
