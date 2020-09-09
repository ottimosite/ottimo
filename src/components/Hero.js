import React from "react"

const section = "text-gray-700 body-font text-xl"
const container =
  "container mx-auto flex px-5 py-24 md:flex-row flex-col items-center"

const Hero = ({children}) => {
  return (
    <section class={section}>
      <div class={container}>{children}</div>
    </section>
  )
}

export default Hero
