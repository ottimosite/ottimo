import React from "react"
import Link from "gatsby-link"

const MenuLink = (url, name) => {
  return (
    <Link to={{ url }} class="mr-5 hover:text-green-500">
      {{ name }}
    </Link>
  )
}

export default MenuLink
