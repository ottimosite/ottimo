import React from "react"
import Link from "gatsby-link"
import { useStaticQuery, graphql } from "gatsby"

import Logo from './../assets/Logo'

const container = "flex title-font font-medium items-center text-green-100 mb-4 md:mb-0"
const text = "ml-3 text-xl uppercase"

const Brand = () => { 
  const data = useStaticQuery(graphql`
    query SiteTitleQuery {
      site {
        siteMetadata {
          title
        }
      }
    }
  `)

  return (
    <Link
      to="/."
      class={container}
    >
    <Logo />
    <p class={ text }>{data.site.siteMetadata.title}</p>
    </Link>
  )
}

export default Brand