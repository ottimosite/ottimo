import React from "react"
import Link from "gatsby-link"

const container = "flex title-font font-medium items-center text-green-500 mb-4 md:mb-0 hover:text-green-700"
const brand = "w-10 h-10 rounded-full"
const text = "ml-3 text-xl uppercase"

const Brand = ({ logo, title }) => {
  return (
    <Link
      to="/."
      class={container}
    >
      <img class={brand} src={logo} />
      <p class={text}>{title}</p>
    </Link>
  )
}

export default Brand
