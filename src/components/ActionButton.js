import React from 'react'
import Link from 'gatsby-link'

/*
    Action
*/

// Assets

import ActionIcon from './../assets/Icon'

// Style

const action = 'inline-flex items-center bg-green-600 border-0 py-1 px-3 focus:outline-none hover:bg-gray-900 rounded-none text-base'

// Component

const Action = ( lable, icon ) => {
    return (
        <button className={ action }>
            <Link to='/get-started'>Get started</Link>
            <ActionIcon />
        </button>
    )
}

export default Action