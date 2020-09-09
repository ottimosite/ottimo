import React from "react"

const header = "bg-fixed sm:bg-local md:bg-scroll lg:bg-local xl:bg-fixed text-gray-700 body-font"
const container = "container mx-auto flex flex-wrap p-5 flex-col md:flex-row items-center"

const Header = ({ children }) => {
  return (
    <header class={header}>
      <div class={container}>
        {children}
      </div>
    </header>
  )
}

export default Header
