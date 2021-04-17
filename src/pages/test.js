import React from 'react'
// import { StaticImage } from 'gatsby-plugin-image'

/*
    # 'Test.js'
    A page made for developing a Gatsby site's UI
*/

//Components
import Layout from '../components/Layout'
// import Header from '../components/Patterns/Header'
import Hero from '../components/Patterns/Hero'
import Features from '../components/Patterns/Features'
import FeaturesVariant from '../components/Patterns/FeaturesVariant'
import Statistics from '../components/Patterns/Statistics'
import Steps from '../components/Patterns/Steps'
import Testimonials from '../components/Patterns/Testimonials'
import Contact from '../components/Patterns/Contact'
// import Footer from '../components/Patterns/Footer'

const Test = () => {
	return (
		<Layout>
			<Hero />
			<Features />
			<FeaturesVariant />
			<Statistics />
			<Steps />
			<Testimonials />
			<Contact />
		</Layout>
	)
}

export default Test
