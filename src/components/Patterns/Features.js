import React from 'react'

import Section from '../Primitives/Section'
import { Button } from '../Primitives/Button'
import Feature from './Feature'

const Separator = () => {
	const container = 'flex mt-6 justify-center'
	const separator = 'w-16 h-1 rounded-full bg-green-500 inline-flex'
	return (
		<div className={container}>
			<div className={separator}></div>
		</div>
	)
}

const FeaturesHeader = () => {
	const header = 'text-center mb-20'
	const heading = 'text-6xl font-medium title-font text-white mb-4'
	const subheading =
		'text-xl leading-relaxed xl:w-2/4 lg:w-3/4 mx-auto text-gray-400 text-opacity-80'

	const featuresTitle = 'Solve common website issues'
	const featuresDescription =
		'And not so common issues and problems. We help businesses reach their potential, by ensuring their online presence and website is using all possible channels to generate and convert leads, improve customer retention and develop a competitive and agile brand.'

	return (
		<div className={header}>
			<h1 className={heading}>{featuresTitle}</h1>
			<p className={subheading}>{featuresDescription}</p>
			<Separator />
		</div>
	)
}

const FeaturesFooter = () => {
	
	return (
			<Button
				label="How it works"
				className="flex mx-auto mt-16 text-white bg-green-500 border-0 py-2 px-8 focus:outline-none hover:bg-green-600 rounded text-lg"
			/>
	)
}

const FeaturesSection = (props) => {
	const theme = 'text-gray-400 bg-gray-900 body-font'
	const container = 'container px-5 py-24 mx-auto'
	return (
		<Section styles={theme}>
			<div className={container}>{props.children}</div>
		</Section>
	)
}

const FeaturesList = () => {
	const list = 'flex flex-wrap sm:-m-4 -mx-4 -mb-10 -mt-4 md:space-y-0 space-y-6'
	const feature = 'p-4 md:w-1/3 flex flex-col text-center items-center'
	const icon = 'w-20 h-20 inline-flex items-center justify-center rounded-full bg-gray-800 text-green-400 mb-5 flex-shrink-0'
	return (
		<div className={list}>
			<div className={feature}>
				<div className={icon }>
					<svg
						fill="none"
						stroke="currentColor"
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth="2"
						className="w-10 h-10"
						viewBox="0 0 24 24"
					>
						<path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
					</svg>
				</div>
				<div className="flex-grow">
					<h2 className="text-white text-lg title-font font-medium mb-3">
						Shooting Stars
					</h2>
					<p className="leading-relaxed text-base">
						Blue bottle crucifix vinyl post-ironic four dollar toast vegan
						taxidermy. Gastropub indxgo juice poutine, ramps microdosing banh mi
						pug VHS try-hard.
					</p>
					<a
						href="/somewhere"
						className="mt-3 text-green-400 inline-flex items-center"
					>
						Learn More
						<svg
							fill="none"
							stroke="currentColor"
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth="2"
							className="w-4 h-4 ml-2"
							viewBox="0 0 24 24"
						>
							<path d="M5 12h14M12 5l7 7-7 7"></path>
						</svg>
					</a>
				</div>
			</div>
			<div className={feature}>
				<div className={icon}>
					<svg
						fill="none"
						stroke="currentColor"
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth="2"
						className="w-10 h-10"
						viewBox="0 0 24 24"
					>
						<circle cx="6" cy="6" r="3"></circle>
						<circle cx="6" cy="18" r="3"></circle>
						<path d="M20 4L8.12 15.88M14.47 14.48L20 20M8.12 8.12L12 12"></path>
					</svg>
				</div>
				<div className="flex-grow">
					<h2 className="text-white text-lg title-font font-medium mb-3">
						The Catalyzer
					</h2>
					<p className="leading-relaxed text-base">
						Blue bottle crucifix vinyl post-ironic four dollar toast vegan
						taxidermy. Gastropub indxgo juice poutine, ramps microdosing banh mi
						pug VHS try-hard.
					</p>
					<a
						href="/somewhere"
						className="mt-3 text-green-400 inline-flex items-center"
					>
						Learn More
						<svg
							fill="none"
							stroke="currentColor"
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth="2"
							className="w-4 h-4 ml-2"
							viewBox="0 0 24 24"
						>
							<path d="M5 12h14M12 5l7 7-7 7"></path>
						</svg>
					</a>
				</div>
			</div>
			<Feature />
		</div>
	)
}

const Features = () => {
	return (
		<FeaturesSection>
			<FeaturesHeader />
			<FeaturesList />
			<FeaturesFooter />
		</FeaturesSection>
	)
}

export default Features
