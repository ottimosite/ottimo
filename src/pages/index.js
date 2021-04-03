import React from 'react'

import Layout from '../components/Layout'
import SEO from '../components/SEO'

const IndexPage = () => (
  <Layout className='styles-center justify-center'>
    <SEO title='Home' />
    <h1 className='text-6xl lg:text-xxl'>
      Web Performance Optimisation
    </h1>
  </Layout>
)

export default IndexPage
