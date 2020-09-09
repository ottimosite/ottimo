import React from "react"
import { StaticQuery, graphql } from "gatsby"
import Img from "gatsby-image"

export default function ImgQuery() {
  return (
    <StaticQuery
      query={graphql`
        query {
          file(relativePath: { eq: "pianta-grassa.jpg" }) {
        childImageSharp {
          # Specify the image processing specifications right in the query.
          # Makes it trivial to update as your page's design changes.
          fluid(maxWidth: 720) {
            ...GatsbyImageSharpFluid
              }
            }
          }
        }
      `}
      render={data => (
        <Img
          class="object-cover object-center rounded"
          alt="hero"
          fluid={data.file.childImageSharp.fluid}
        />
      )}
    />
  )
}