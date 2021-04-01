import React from 'react'
import Link from 'gatsby-link'

const Menu = () => {
    return (
      <nav class="md:ml-auto flex flex-wrap items-center text-base justify-center">
        <Link to="/." class="mr-5 hover:text-green-100">
          Home
        </Link>
        <Link to="/#services" class="mr-5 hover:text-green-100">
          Services
        </Link>
        <Link to="/#insights" class="mr-5 hover:text-green-100">
          Insights
        </Link>
        <Link to="/#contact" class="mr-5 hover:text-green-100">
          Contact
        </Link>
      </nav>
    )
  }

export default Menu