import React from 'react'

const contact = 'text-gray-600 body-font relative'
const bg = 'absolute inset-0 bg-gray-300'
const formCard = 'container px-5 py-24 mx-auto flex'
const container = 'lg:w-1/3 md:w-1/2 bg-white rounded-lg p-8 flex flex-col md:ml-auto w-full mt-10 md:mt-0 relative z-10 shadow-md'

const Contact = () => {
	return (
		<div id='contact-section' className={contact}>
			<div id='contact-bg' className={bg}>
				{/* <iframe
					title="map"
					src="https://maps.google.com/maps?hl=en&amp;q=Southampton+(My%20Business%20Name)&amp;ie=UTF8&amp;t=&amp;z=14&amp;iwloc=B&amp;output=embed"
				></iframe> */}
			</div>
			<div id='contact-form-card' className={formCard}>
				<div className={container}>
					<h2 className="text-gray-900 text-lg mb-1 font-medium title-font">
						Get in touch
					</h2>
					<p className="leading-relaxed mb-5 text-gray-600">
						Post-ironic portland shabby chic echo park, banjo fashion axe
					</p>
					<div className="relative mb-4">
						<label htmlFor="email" className="leading-7 text-sm text-gray-600">
							Email
						</label>
						<input
							type="email"
							id="email"
							name="email"
							className="w-full bg-white rounded border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"
						/>
					</div>
					<div className="relative mb-4">
						<label
							htmlFor="message"
							className="leading-7 text-sm text-gray-600"
						>
							Message
						</label>
						<textarea
							id="message"
							name="message"
							className="w-full bg-white rounded border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 h-32 text-base outline-none text-gray-700 py-1 px-3 resize-none leading-6 transition-colors duration-200 ease-in-out"
						></textarea>
					</div>
					<button className="text-white bg-green-500 border-0 py-2 px-6 focus:outline-none hover:bg-green-600 rounded text-lg">
						Button
					</button>
					<p className="text-xs text-gray-500 mt-3">
						Chicharrones blog helvetica normcore iceland tousled brook viral
						artisan.
					</p>
				</div>
			</div>
		</div>
	)
}

export default Contact
