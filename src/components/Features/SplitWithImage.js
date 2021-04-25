import React from 'react'
import {
	Container,
	SimpleGrid,
	Image,
	Flex,
	Heading,
	Text,
	Stack,
	StackDivider,
	Icon,
	useColorModeValue,
} from '@chakra-ui/react'
import { IoAnalyticsSharp, IoLogoBitcoin, IoSearchSharp } from 'react-icons/io5'
import SimpleThreeColumns from './simpleThreeCol'

const Feature = ({ text, icon, iconBg }) => {
	return React.createElement(
		Stack,
		{ direction: 'row', align: 'center' },
		React.createElement(
			Flex,
			{
				w: 8,
				h: 8,
				align: 'center',
				justify: 'center',
				rounded: 'full',
				bg: iconBg,
			},
			icon
		),
		React.createElement(Text, { fontWeight: 600 }, text)
	)
}
export default function SplitWithImage() {
	return React.createElement(
		Container,
		{ maxW: '5xl', py: 12 },
		React.createElement(
			SimpleGrid,
			{ columns: { base: 1, md: 2 }, spacing: 10 },
			React.createElement(
				Stack,
				{ spacing: 4 },
				React.createElement(
					Text,
					{
						textTransform: 'uppercase',
						color: 'blue.400',
						fontWeight: 600,
						fontSize: 'sm',
						bg: useColorModeValue('blue.50', 'blue.900'),
						p: 2,
						alignSelf: 'flex-start',
						rounded: 'md',
					},
					'Our Story'
				),
				React.createElement(Heading, null, 'A digital Product design agency'),
				React.createElement(
					Text,
					{ color: 'gray.500', fontSize: 'lg' },
					'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore'
				),
				React.createElement(
					Stack,
					{
						spacing: 4,
						divider: React.createElement(StackDivider, {
							borderColor: useColorModeValue('gray.100', 'gray.700'),
						}),
					},
					React.createElement(Feature, {
						icon: React.createElement(Icon, {
							as: IoAnalyticsSharp,
							color: 'yellow.500',
							w: 5,
							h: 5,
						}),
						iconBg: useColorModeValue('yellow.100', 'yellow.900'),
						text: 'Business Planning',
					}),
					React.createElement(Feature, {
						icon: React.createElement(Icon, {
							as: IoLogoBitcoin,
							color: 'green.500',
							w: 5,
							h: 5,
						}),
						iconBg: useColorModeValue('green.100', 'green.900'),
						text: 'Financial Planning',
					}),
					React.createElement(Feature, {
						icon: React.createElement(Icon, {
							as: IoSearchSharp,
							color: 'purple.500',
							w: 5,
							h: 5,
						}),
						iconBg: useColorModeValue('purple.100', 'purple.900'),
						text: 'Market Analysis',
					})
				)
			),
			React.createElement(
				Flex,
				null,
				React.createElement(Image, {
					rounded: 'md',
					alt: 'feature image',
					src:
						'https://images.unsplash.com/photo-1554200876-56c2f25224fa?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
				})
			)
		),
        React.createElement(
            SimpleThreeColumns,
        )
	)
}
