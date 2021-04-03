import React from 'react'

import Anchor from './Anchor'

/*
    Menu
*/

// Style

const menuItem = 'mr-5 hover:text-green-100 hover:underline py-3'

// Component

const Menu = () => {
    return (
    <>
        <Anchor url='./' className={menuItem} label='Home' />
        <Anchor to='./test'className={menuItem} label='Test' />
    </>
    )
}

export default Menu