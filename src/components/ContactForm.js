import React from "react"

export default function ContactForm() {
  return (
    <section class="text-gray-700 body-font relative">
      <div class="container px-5 py-24 mx-auto">
        <div class="flex flex-col text-center w-full mb-12">
          <h1 class="sm:text-3xl text-2xl font-medium title-font mb-4 text-gray-900">
            Contact Us
          </h1>
          <p class="lg:w-2/3 mx-auto leading-relaxed text-base">
            Whatever cardigan tote bag tumblr hexagon brooklyn asymmetrical
            gentrify.
          </p>
        </div>
        <div class="lg:w-1/2 md:w-2/3 mx-auto">
          <div class="flex flex-wrap -m-2">
            <div class="p-2 w-1/2">
              <input
                class="w-full bg-gray-100 rounded border border-gray-400 focus:outline-none focus:border-green-500 text-base px-4 py-2"
                placeholder="Name"
                type="text"
              />
            </div>
            <div class="p-2 w-1/2">
              <input
                class="w-full bg-gray-100 rounded border border-gray-400 focus:outline-none focus:border-green-500 text-base px-4 py-2"
                placeholder="Email"
                type="email"
              />
            </div>
            <div class="p-2 w-full">
              <textarea
                class="w-full bg-gray-100 rounded border border-gray-400 focus:outline-none h-48 focus:border-green-500 text-base px-4 py-2 resize-none block"
                placeholder="Message"
              ></textarea>
            </div>
            <div class="p-2 w-full">
              <button class="flex mx-auto text-white bg-green-500 border-0 py-2 px-8 focus:outline-none hover:bg-green-600 rounded text-lg">
                Button
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
