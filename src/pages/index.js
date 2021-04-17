import React from 'react'

import Layout from '../components/Layout'
import Seo from '../components/Seo'
import Hero from '../components/Patterns/Hero'

const IndexPage = () => (
	<Layout className="styles-center justify-center">
		<Seo title="Home" />
		<Hero />
	</Layout>
)

export default IndexPage
