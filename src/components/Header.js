import React from "react"

const Header = ({ children }) => {
  return (
    <header class="bg-fixed sm:bg-local md:bg-scroll lg:bg-local xl:bg-fixed bg-green-100 text-gray-700 body-font">
      <div class="container mx-auto flex flex-wrap p-5 flex-col md:flex-row items-center">
        {children}
      </div>
    </header>
  )
}

export default Header
