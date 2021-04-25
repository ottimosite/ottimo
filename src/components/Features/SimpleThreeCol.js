import React from 'react'
import { Box, SimpleGrid, Icon, Text, Stack, Flex } from '@chakra-ui/react'
import { FcAssistant, FcDonate, FcInTransit } from 'react-icons/fc'
const Feature = ({ title, text, icon }) => {
	return React.createElement(
		Stack,
		null,
		React.createElement(
			Flex,
			{
				w: 16,
				h: 16,
				align: 'center',
				justify: 'center',
				color: 'white',
				rounded: 'full',
				bg: 'gray.100',
				mb: 1,
			},
			icon
		),
		React.createElement(Text, { fontWeight: 600 }, title),
		React.createElement(Text, { color: 'gray.600' }, text)
	)
}
export default function SimpleThreeColumns() {
	return React.createElement(
		Box,
		{ p: 4 },
		React.createElement(
			SimpleGrid,
			{ columns: { base: 1, md: 3 }, spacing: 10 },
			React.createElement(Feature, {
				icon: React.createElement(Icon, { as: FcAssistant, w: 10, h: 10 }),
				title: 'Lifetime Support',
				text:
					'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore...',
			}),
			React.createElement(Feature, {
				icon: React.createElement(Icon, { as: FcDonate, w: 10, h: 10 }),
				title: 'Unlimited Donations',
				text:
					'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore...',
			}),
			React.createElement(Feature, {
				icon: React.createElement(Icon, { as: FcInTransit, w: 10, h: 10 }),
				title: 'Instant Delivery',
				text:
					'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore...',
			})
		)
	)
}
