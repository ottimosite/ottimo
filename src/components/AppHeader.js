import React from "react"

import Header from './Header'
import Brand from "./Brand"
import MainMenu from "./MainMenu"

import logo from "../assets/logo-ottimo.svg"

const AppHeader = ({ siteTitle }) => {
  return (
    <Header>
        <Brand title={siteTitle} logo={logo} />
        <MainMenu />
    </Header>
  )
}

export default AppHeader
