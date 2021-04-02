/*
    # 'Test.js'
    A page made for developing a Gatsby site's UI
*/

import React from 'react'
import { Link } from "gatsby"

// Assets

import ActionIcon from './../assets/Icon'
//import Logo from './../assets/Logo'

//Componets
import Brand from '../components/Brand'

/* 
    # Styling
    Tailwind styling variables, whinch are really `const`'s, but we would digress (https://www.google.com/search?q=why+use+const+in+javascript)
    
    Here comes trouble :)
*/   
/* 
const backgroundColour = ''
const inversBackgroundColour = ''
const bodyColour = ''
const inverseBodyColour = '' */

/*
    Components
*/

/* idea: Hyperlink
const Hyperlink = (to, href) => {

}
*/ 

/*
    Menu
*/

// menuItem


// Style

const menuItem = 'mr-5 hover:text-green-600 hover:underline py-5 styles-center justify-center'

// Component

const Menu = () => {
    return (
    <>
        <Link to='./' className={menuItem}>Home</Link>
        <Link to='./test'className={menuItem}>Test</Link>
        {/*<Link className={menuItem}>Third Link</Link>
        <Link className={menuItem}>Fourth Link</Link> */}
    </>
    )
}


/* 
    Nav 
*/

// Style

const nav = 'md:ml-auto flex flex-wrap styles-center text-base justify-center'

// Component

const Nav = () => {
    return (
    <nav className={ nav }>
        <Menu />
    </nav>
    )
}

/*
    Title
*/

// Style

const title = 'ml-3 text-xl'

// Component

const Title = () => {
    return (
        <span className={ title }>Tailblocks</span>
    )
}

/*
    Brand
*/

// Styles


// Component
/* const Brand = () => {
    return(
        <Link to='./' className='flex title-font font-large styles-center text-grey-900 justify-center items-center'>
            <Logo />
            <Title />
        </Link>
    )
} */

/*
    Action
*/

// Style

const action = 'inline-flex styles-center bg-gray-100 border-0 py-3 px-3 focus:outline hover:bg-gray-200 rounded text-base mt-4 md:mt-0'

// Component

const Action = ( lable, icon ) => {
    return (
        <button className={ action }>
            <Link to='./get-started'>Get started</Link>
            <ActionIcon />
        </button>
    )
}

/*
    Header
*/

// Styles

const header = 'text-gray-600 body-font'
const container = 'container mx-auto flex flex-wrap p-5 flex-col md:flex-row styles-center items-center'

// Component

const Header = () => {
    return (
    <header className={ header }>
        <div className={ container }>
            <Brand />
            <Nav />
            <Action />
        </div>
    </header>
    )
}

/* 
    The test page component
*/

const Test = () => {
    return (
        <Header />
    )
}

export default Test
