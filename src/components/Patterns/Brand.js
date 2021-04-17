import React from 'react'
import { useStaticQuery, graphql } from 'gatsby'

import Anchor from '../Primitives/Anchor'
import Title from '../Primitives/Title'
import Logo from '../../assets/Logo/Logo'

const container =
	'flex title-font styles-center items-center md:styles-center md:items-center text-green-100'

const Brand = () => {
	const data = useStaticQuery(graphql`
		query SiteTitleQuery {
			site {
				siteMetadata {
					title
				}
			}
		}
	`)

	return (
		<Anchor to="/" className={container}>
			<Logo isDark />
			<Title title={data.site.siteMetadata.title} />
		</Anchor>
	)
}

export default Brand
