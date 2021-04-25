// eslint-disable react-hooks/rules-of-hooks
import { ChevronRightIcon } from '@chakra-ui/icons'
import {
	Stack,
	Text,
	Link,
	Icon,
	Flex,
	Box,
	Popover,
	PopoverTrigger,
	PopoverContent,
	useColorModeValue,
} from '@chakra-ui/react'
import React from 'react'

import NAV_ITEMS from './items'

const DesktopSubNav = ({ label, href, subLabel }) => {
	return React.createElement(
		Link,
		{
			href: href,
			role: 'group',
			display: 'block',
			p: 2,
			rounded: 'md',
			_hover: { bg: useColorModeValue('pink.50', 'gray.900') },
		},
		React.createElement(
			Stack,
			{ direction: 'row', align: 'center' },
			React.createElement(
				Box,
				null,
				React.createElement(
					Text,
					{
						transition: 'all .3s ease',
						_groupHover: { color: 'pink.400' },
						fontWeight: 500,
					},
					label
				),
				React.createElement(Text, { fontSize: 'sm' }, subLabel)
			),
			React.createElement(
				Flex,
				{
					transition: 'all .3s ease',
					transform: 'translateX(-10px)',
					opacity: 0,
					_groupHover: { opacity: '100%', transform: 'translateX(0)' },
					justify: 'flex-end',
					align: 'center',
					flex: 1,
				},
				React.createElement(Icon, {
					color: 'pink.400',
					w: 5,
					h: 5,
					as: ChevronRightIcon,
				})
			)
		)
	)
}

const DesktopNav = () => {
	return React.createElement(
		Stack,
		{ direction: 'row', spacing: 4 },
		NAV_ITEMS.map((navItem) => {
			var _a
			return React.createElement(
				Box,
				{ key: navItem.label },
				React.createElement(
					Popover,
					{ trigger: 'hover', placement: 'bottom-start' },
					React.createElement(
						PopoverTrigger,
						null,
						React.createElement(
							Link,
							{
								p: 2,
								href: (_a = navItem.href) !== null && _a !== void 0 ? _a : '#',
								fontSize: 'sm',
								fontWeight: 500,
                                // eslint-disable-next-line react-hooks/rules-of-hooks
								color: useColorModeValue('gray.600', 'gray.200'),
								_hover: {
									textDecoration: 'none',
                                    // eslint-disable-next-line react-hooks/rules-of-hooks
									color: useColorModeValue('gray.800', 'white'),
								},
							},
							navItem.label
						)
					),
					navItem.children &&
						React.createElement(
							PopoverContent,
							{
								border: 0,
								boxShadow: 'xl',
                                // eslint-disable-next-line react-hooks/rules-of-hooks
								bg: useColorModeValue('white', 'gray.800'),
								p: 4,
								rounded: 'xl',
								minW: 'sm',
							},
							React.createElement(
								Stack,
								null,
								navItem.children.map((child) =>
									React.createElement(
										DesktopSubNav,
										Object.assign({ key: child.label }, child)
									)
								)
							)
						)
				)
			)
		})
	)
}

export default DesktopNav
