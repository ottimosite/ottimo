import React from 'react'

// Icon assets
import UserIcon from '../../assets/Icons/UserIcon'

// Primitive components
import Anchor from '../Primitives/Anchor'

const featureTitle = "Search Engine Marketing"
const featureContent = "Expert SEM and SEO services, improve rankings, gain organic leads and forge an online presence that drives growth."

const Title = (props) => {
    const style = 'text-white text-lg title-font font-medium mb-3'
    return (
        <h2 className={style}>
            {props.content}
        </h2>
    )
}

const Detail = (props) => {
    const style = 'leading-relaxed text-base'
    return (
        <p className={style}>
            {props.content}
        </p>
    )
}

const Feature = () => {
    const style = 'p-4 md:w-1/3 flex flex-col text-center items-center'
    return (
    <div className={style}>
        <UserIcon />
        <div className="flex-grow">
            <Title content={featureTitle}/>
            <Detail content={featureContent} />
            <Anchor 
                className='mt-3 text-green-500 inline-flex items-center' 
                to='/somewhere' 
                label='Learn more'
                />
        </div>
    </div>
    )
}

export default Feature
