import React from 'react'
/*
    Title
*/

// Style

const style = 'ml-3 text-xl'

// Component

const Title = (props) => {
    return (
        <span className={ style }>{props.title}</span>
    )
}

export default Title