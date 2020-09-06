import React from "react"
import Link from "gatsby-link"

import hero from "../assets/fast-loading.svg"

const LandingHero = () => {
  return (
    <section class="text-gray-700 body-font text-xl">
      <div class="container mx-auto flex px-5 py-24 md:flex-row flex-col items-center">
        <div class="lg:flex-grow md:w-1/2 lg:pr-24 md:pr-16 flex flex-col md:items-start md:text-left mb-16 md:mb-0 items-center text-center">
          <h1 class="title-font font-black sm:text-4xl text-5xl mb-4 font-medium text-gray-900">
            Website Performance Optimisation
          </h1>
          <p class="mb-8 leading-relaxed">
            Performance plays a major role in the success of any online venture.
            High-performing sites engage and retain users better than
            low-performing ones. Let's make your site faster!
          </p>

          <div class="flex justify-center">
            <Link to="/contact">
            <button class="inline-flex text-white bg-green-500 border-0 py-2 px-6 focus:outline-none hover:bg-green-600 rounded text-lg">
              Get started
            </button>
            <Link/>
            <Link to="/services"></Link>
            <button class="ml-4 inline-flex text-gray-700 bg-gray-200 border-0 py-2 px-6 focus:outline-none hover:bg-gray-300 rounded text-lg">
              Find out more
            </button>
            </Link>
          </div>
        </div>

        <div class="lg:max-w-lg lg:w-full md:w-1/2 w-5/6">
          <img
            class="object-cover object-center rounded"
            alt="hero"
            src={hero}
            width="720"
            height="600"
          />
        </div>
      </div>
    </section>
  )
}

export default LandingHero
