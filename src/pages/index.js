import React from 'react'

import Layout from '../components/Layout'
import SEO from '../components/SEO'

const IndexPage = () => (
  <Layout className='styles-center justify-center'>
    <SEO title='Home' />
    <div>
    <h1 className='text-6xl lg:text-xxl font-extrabold text-center'>
      Web Performance Optimisation
    </h1>
    </div>
  </Layout>
)

export default IndexPage
