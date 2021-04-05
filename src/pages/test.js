import React from 'react'
// import { StaticImage } from 'gatsby-plugin-image'

/*
    # 'Test.js'
    A page made for developing a Gatsby site's UI
*/

//Components
import Header from '../components/Header'
import Hero from '../components/Hero'
import Features from '../components/Features'
import FeaturesVariant from '../components/FeaturesVariant'
import Footer from '../components/Footer'

const Test = () => {
  return (
    <>
      <Header />
      <Hero />
      <Features />
      <FeaturesVariant />
      <Footer />
    </>
  )
}

export default Test
