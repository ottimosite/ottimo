import React from 'react'
import { useStaticQuery, graphql } from 'gatsby'

import Anchor from '../Primitives/Anchor'
import Title from '../Primitives/Title'
import Logo from '../../assets/Logo/Logo'

const container =
  'flex title-font font-bold uppercase items-center text-green-100'
const text = 'ml-3 text-xl font-bold uppercase'

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
    <Anchor url='/.' className={container}>
      <Logo isDark />
      <Title className={text} title={data.site.siteMetadata.title} />
    </Anchor>
  )
}

export default Brand
