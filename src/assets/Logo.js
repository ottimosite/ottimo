import React from 'react'

import logoIsLight from './logo-ottimo.svg'
import logoIsDark from './logo-ottimo-inverse.svg'

// Logo
const brand = "w-10 h-10 rounded-full"

const Logo = (props) => {
    const isDark = props.isDark
    if (isDark) {
        return (
            <img class={brand} src={logoIsDark} />
        )
    }
    return (
        <img class={brand} src={logoIsLight} />
    )
}

export default Logo