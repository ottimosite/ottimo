import React from 'react'

import illustration from '../assets/Illustrations/404.svg'

import Layout from '../components/Layout'
import Seo from '../components/Seo'

const NotFoundPage = () => (
	<Layout>
		<Seo title="404: Not found" />
		<h1>NOT FOUND</h1>
		<p>You just hit a route that doesn&#39;t exist... the sadness.</p>
		<img
			height="100%"
			width="100%"
			src={illustration}
			alt="Page Not Found illustration"
		/>
	</Layout>
)

export default NotFoundPage
