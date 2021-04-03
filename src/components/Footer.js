import React from 'react'

import Brand from './Brand'

// Footer styles
const footer = 'bg-gray-900 text-green-100 body-font items-center'
const container =
  'container px-5 py-24 mx-auto flex md:items-center lg:items-center md:flex-row md:flex-no-wrap flex-wrap flex-col'
const branding = 'w-64 flex-shrink-0 md:mx-0 mx-auto text-center md:text-left'
const logo =
  'flex title-font font-medium items-center justify-center text-green-100'
/* const siteLinks = 'flex-grow flex flex-wrap md:pl-20 -mb-10 md:mt-0 mt-10 text-center' */
const attribution = 'bg-green-500'

const Footer = () => {
  return (
    <footer className={footer}>
      <div className={container}>
        <div className={branding}>
          <Brand className={logo} />
          <p class='mt-2 text-sm text-green-100 align-left'>
            On demand, tailored Web performance Optimisation services for React, WordPress and, Gatsby.js sites. 
          </p>
        </div>
{/*         <div className={siteLinks}></div> */}
      </div>
      <div className={attribution}>
      <div class='container mx-auto py-4 px-5 flex flex-wrap flex-col sm:flex-row'>
          <p class='text-gray-100 text-sm text-center sm:text-left'>
            © {new Date().getFullYear()} ottimo.site —
            <a
              href='https://github.com/abadiu'
              rel='noopener noreferrer'
              class='text-green-100 ml-1'
              target='_blank'
            >
              @abadiu
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
