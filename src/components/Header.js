import React from 'react'

import Brand from './Brand'
import Menu from './Menu'

// local assets
import logo from '../assets/logo-ottimo-inverse.svg'

// Tailwind.css styling
const outer =
  "bg-green-500 bg-fixed sm:bg-local md:bg-scroll lg:bg-local xl:bg-fixed text-green-100 body-font"
const inner =
  "container mx-auto flex flex-wrap p-5 flex-col md:flex-row items-center"

const Header = ({ brand, SiteTitle, menu }) => {
  return (
    <header class={outer}>
      <div class={inner} brand={brand} menu={menu}>
        <Brand title={SiteTitle} logo={logo} />
        <Menu />
      </div>
    </header>
  )
}

export default Header
