import React from 'react'
import PropTypes from 'prop-types'

import Header from './Header'
import Footer from './Footer'

const Layout = ({ children }) => {
  return (
    <>
      <Header />
      <main className='container px-5 py-24 mx-auto'>
        <div classsName='flex flex-col text-center w-full mb-20'>
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
