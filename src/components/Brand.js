import React from "react"
import Link from "gatsby-link"
import { useStaticQuery, graphql } from "gatsby"

import Logo from './../assets/Logo'
import Title from './Title'

const container = "flex title-font font-medium items-center text-green-100"
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
    <Logo isDark />
    <Title className={ text } title={data.site.siteMetadata.title}></Title>
    </Link>
  )
}

export default Brand