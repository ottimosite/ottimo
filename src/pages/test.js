import React from 'react'
import { StaticImage } from "gatsby-plugin-image"

/*
    # 'Test.js'
    A page made for developing a Gatsby site's UI
*/

//Components
import Header from '../components/Header'


const Test = () => {
    return (
        <>
        <Header />
        <section className='flex flex-col md:flex-row items-center'>
            <div className='w-full'>
                <StaticImage src='https://placekitten.com/800/600' alt='hero-image' placeholder='blurred' width={200} height={200} className='bg-contain'/>
            </div>
        </section>
        </>
    )
}

export default Test
