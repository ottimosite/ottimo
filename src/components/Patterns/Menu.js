import React from 'react'

import Anchor from '../Primitives/Anchor'

/*
    Menu
*/

// Style

const menuItem = 'mr-5 hover:text-green-100 hover:underline py-3'

// Component

const Menu = () => {
  return (
    <>
      <Anchor url='/.' className={menuItem}>
        Home
      </Anchor>
      <Anchor url='/test' className={menuItem}>
        Test
      </Anchor>
    </>
  )
}

export default Menu
