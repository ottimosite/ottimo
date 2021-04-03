import React from 'react'
import { useStaticQuery, graphql } from 'gatsby'

import Anchor from './Anchor'
import Logo from './../assets/Logo'
import Title from './Title'

const container = 'flex title-font font-medium items-center text-green-100'
const text = 'ml-3 text-xl uppercase'

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
    <Anchor
      to='/.'
      className={container}
    >
    <Logo isDark />
    <Title className={ text } title={data.site.siteMetadata.title}></Title>
    </Anchor>
  )
}

export default Brand