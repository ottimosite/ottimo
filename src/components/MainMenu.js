import React from "react"
import Link from "gatsby-link"
// import MenuLink from "./MenuLink"

const MainMenu = () => {
  return (
    <nav class="md:ml-auto flex flex-wrap items-center text-base justify-center">
      <Link to="/." class="mr-5 hover:text-green-500">
        Home
      </Link>
      <Link to="/#services" class="mr-5 hover:text-green-500">
        Services
      </Link>
      <Link to="/#insights" class="mr-5 hover:text-green-500">
        Insights
      </Link>
      <Link to="/#contact" class="mr-5 hover:text-green-500">
        Contact
      </Link>
    </nav>
  )
}

export default MainMenu
