import { ChevronDownIcon } from '@chakra-ui/icons'
import {
	Collapse,
	Flex,
	Icon,
	Text,
	Link,
	Stack,
	useColorModeValue,
	useDisclosure,
} from '@chakra-ui/react'
import React from 'react'

import NAV_ITEMS from './items'

const MobileNavItem = ({ label, children, href }) => {
	const { isOpen, onToggle } = useDisclosure()
	return React.createElement(
		Stack,
		{ spacing: 4, onClick: children && onToggle },
		React.createElement(
			Flex,
			{
				py: 2,
				as: Link,
				href: href !== null && href !== void 0 ? href : '#',
				justify: 'space-between',
				align: 'center',
				_hover: {
					textDecoration: 'none',
				},
			},
			React.createElement(
				Text,
				{ fontWeight: 600, color: useColorModeValue('gray.600', 'gray.200') },
				label
			),
			children &&
				React.createElement(Icon, {
					as: ChevronDownIcon,
					transition: 'all .25s ease-in-out',
					transform: isOpen ? 'rotate(180deg)' : '',
					w: 6,
					h: 6,
				})
		),
		React.createElement(
			Collapse,
			{ in: isOpen, animateOpacity: true, style: { marginTop: '0!important' } },
			React.createElement(
				Stack,
				{
					mt: 2,
					pl: 4,
					borderLeft: 1,
					borderStyle: 'solid',
					borderColor: useColorModeValue('gray.200', 'gray.700'),
					align: 'start',
				},
				children &&
					children.map((child) =>
						React.createElement(
							Link,
							{ key: child.label, py: 2, href: child.href },
							child.label
						)
					)
			)
		)
	)
}
const MobileNav = () => {
	return React.createElement(
		Stack,
		{
			bg: useColorModeValue('white', 'gray.800'),
			p: 4,
			display: { md: 'none' },
		},
		NAV_ITEMS.map((navItem) =>
			React.createElement(
				MobileNavItem,
				Object.assign({ key: navItem.label }, navItem)
			)
		)
	)
}

export default MobileNav
