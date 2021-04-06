import React from 'react'

const container =
'lg:flex-grow \
md:w-1/2 \
lg:pr-24 \
md:pr-16 \
flex \
flex-col \
md:items-start \
md:text-left \
mb-0 \
md:mb-0 \
items-center \
text-center'

const Card = (props) => {
    return (
        <div className={container}>
            {props.children}
        </div>
    ) 
}

export default Card