import React from "react"

import Layout from "../components/Layout"
import SEO from "../components/SEO"
/* import LandingHero from "../components/LandingHero"
import MainFeatures from "../components/MainFeatures"
import FeatureVariant from "../components/FeatureVariant"
import StepsToOptimise from "../components/StepsToOptimise"
import Insights from "../components/Insights"
import ContactForm from "../components/ContactForm" */

const IndexPage = () => (
  <Layout className='styles-center justify-center'>
    <SEO title="Home" />
    <h1 className='text-xxl sm:text-xl'>
      Web Performance Optimisation
    </h1>
{/*     <LandingHero />
    <MainFeatures id="services" />
    <FeatureVariant />
    <StepsToOptimise />
    <Insights id="insights" />
    <ContactForm id="contact" /> */}
  </Layout>
)

export default IndexPage
