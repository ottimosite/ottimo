import React from 'react'

import FastLoading from '../assets/FastLoading'

const Section = props => {
  const section = 'text-gray-600 body-font'
  const container =
    'container mx-auto flex px-5 py-24 md:flex-row flex-col items-center'

  return (
    <section className={section}>
      <div className={container}>{props.children}</div>
    </section>
  )
}

const Headline = () => {
  const headline = 'title-font text-xxl mb-2 font-bold text-gray-900'
  return <h1 class={headline}>Ottimo</h1>
}

const Lead = () => {
  const lead = 'mb-8 text-4xl leading-relaxed'
  return (
    <p class={lead}>
      Your website done right! Start transforming your online presence into a
      valuable asset for your business.
    </p>
  )
}

const ButtonPrimary = props => {
  const button =
    'inline-flex text-white bg-green-500 border-0 py-2 px-6 focus:outline-none hover:bg-green-600 rounded text-lg'

  return <button class={button}>{props.label}</button>
}

const ButtonSecondary = props => {
  const style =
    'ml-4 inline-flex text-gray-700 bg-gray-100 border-0 py-2 px-6 focus:outline-none hover:bg-gray-200 rounded text-lg'
  return <button class={style}>{props.label}</button>
}

const ButtonGroup = () => {
  return (
    <div class='flex justify-center'>
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
  return (
    <Card>
      <Headline />
      <Lead />
      <ButtonGroup />
    </Card>
  )
}

const CardGraphic = () => {
  const container = 'transition-colors w-1/2 sm:w-1'
  const graphic = 'object-fit'
  return (
    <div className={container}>
      <FastLoading className={graphic} alt='hero' />
    </div>
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
