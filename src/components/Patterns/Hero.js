import React from 'react'

import FastLoading from '../../assets/Illustrations/FastLoading'

const Section = props => {
  const section = 'text-gray-600 body-font'
  const container =
    'container h-screen mx-auto flex px-5 py-24 md:flex-row flex-col items-center'

  return (
    <section className={section}>
      <div className={container}>{props.children}</div>
    </section>
  )
}

const Headline = () => {
  const headline = 'animate__animated animate__headShake title-font text-xxl mb-2 font-black text-gray-900 leading-tight'
  return <h1 className={headline}>Ottimo</h1>
}

const Lead = () => {
  const lead = 'animate__animated animate__headShake mb-8 text-4xl leading-relaxed'
  return (
    <p className={lead}>
      Your website done right! Start transforming your online presence into a
      valuable asset for your business.
    </p>
  )
}

const ButtonPrimary = props => {
  const button =
    'inline-flex text-white bg-green-500 border-0 py-4 px-6 focus:outline-none hover:bg-green-600 rounded text-lg'

  return <button className={button}>{props.label}</button>
}

const ButtonSecondary = props => {
  const style =
    'ml-4 inline-flex text-gray-700 bg-gray-100 border-0 py-4 px-6 focus:outline-none hover:bg-gray-200 rounded text-lg'
  return <button className={style}>{props.label}</button>
}

const ButtonGroup = () => {
  return (
    <div className='flex justify-center'>
      <ButtonPrimary label='Get started' />
      <ButtonSecondary label='Learn more' />
    </div>
  )
}

const Card = props => {
  const card =
    'lg:flex-grow md:w-1/2 lg:pr-24 md:pr-16 flex flex-col md:items-start md:text-left mb-0 md:mb-0 items-center text-center'

  return <div className={card}>{props.children}</div>
}

const CardLeading = () => {
  const container = 'w-1/2'
  return (
    <Card className={container}>
      <Headline />
      <Lead />
      <ButtonGroup />
    </Card>
  )
}

const CardGraphic = () => {
  const container = 'w-1/2'
  const graphic = 'animate__animated animate__bounceInRight animate__delay-1s object-fit'
  return (
    <Card className={container}>
      <FastLoading className={graphic} alt='hero' />
    </Card>
  )
}

const Hero = () => {
  return (
    <Section>
      <CardLeading />
      <CardGraphic />
    </Section>
  )
}

export default Hero
