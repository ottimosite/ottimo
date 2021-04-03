import React from 'react'
import Link from "gatsby-link"

/*
    Menu
*/

// Style

const menuItem = 'mr-5 hover:text-green-100 hover:underline py-3'

// Component

const Menu = () => {
    return (
    <>
        <Link to='./' className={menuItem}>Home</Link>
        <Link to='./test'className={menuItem}>Test</Link>
    </>
    )
}

export default Menu