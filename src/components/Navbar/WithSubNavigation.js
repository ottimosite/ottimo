import React from 'react'
import {
	Box,
	Flex,
	Text,
	IconButton,
	Button,
	Stack,
	Collapse,
	Icon,
	Link,
	Popover,
	PopoverTrigger,
	PopoverContent,
	useColorModeValue,
	useDisclosure,
} from '@chakra-ui/react'
import {
	HamburgerIcon,
	CloseIcon,
	ChevronDownIcon,
	ChevronRightIcon,
} from '@chakra-ui/icons'
export default function WithSubnavigation() {
	const { isOpen, onToggle } = useDisclosure()
	return React.createElement(
		Box,
		null,
		React.createElement(
			Flex,
			{
				bg: useColorModeValue('white', 'gray.800'),
				color: useColorModeValue('gray.600', 'white'),
				minH: '60px',
				py: { base: 2 },
				px: { base: 4 },
				borderBottom: 1,
				borderStyle: 'solid',
				borderColor: useColorModeValue('gray.200', 'gray.900'),
				align: 'center',
			},
			React.createElement(
				Flex,
				{
					flex: { base: 1, md: 'auto' },
					ml: { base: -2 },
					display: { base: 'flex', md: 'none' },
				},
				React.createElement(IconButton, {
					onClick: onToggle,
					icon: isOpen
						? React.createElement(CloseIcon, { w: 3, h: 3 })
						: React.createElement(HamburgerIcon, { w: 5, h: 5 }),
					variant: 'ghost',
					'aria-label': 'Toggle Navigation',
				})
			),
			React.createElement(
				Flex,
				{ flex: { base: 1 }, justify: { base: 'center', md: 'start' } },
				React.createElement(
					Text,
					{
						textAlign: ({ base: 'center', md: 'left' }),
						fontFamily: 'heading',
						color: useColorModeValue('gray.800', 'white'),
					},
					'Logo'
				),
				React.createElement(
					Flex,
					{ display: { base: 'none', md: 'flex' }, ml: 10 },
					React.createElement(DesktopNav, null)
				)
			),
			React.createElement(
				Stack,
				{
					flex: { base: 1, md: 0 },
					justify: 'flex-end',
					direction: 'row',
					spacing: 6,
				},
				React.createElement(
					Button,
					{
						as: 'a',
						fontSize: 'sm',
						fontWeight: 400,
						variant: 'link',
						href: '#',
					},
					'Sign In'
				),
				React.createElement(
					Button,
					{
						display: { base: 'none', md: 'inline-flex' },
						fontSize: 'sm',
						fontWeight: 600,
						color: 'white',
						bg: 'pink.400',
						href: '#',
						_hover: {
							bg: 'pink.300',
						},
					},
					'Sign Up'
				)
			)
		),
		React.createElement(
			Collapse,
			{ in: isOpen, animateOpacity: true },
			React.createElement(MobileNav, null)
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
const NAV_ITEMS = [
	{
		label: 'Inspiration',
		children: [
			{
				label: 'Explore Design Work',
				subLabel: 'Trending Design to inspire you',
				href: '#',
			},
			{
				label: 'New & Noteworthy',
				subLabel: 'Up-and-coming Designers',
				href: '#',
			},
		],
	},
	{
		label: 'Find Work',
		children: [
			{
				label: 'Job Board',
				subLabel: 'Find your dream design job',
				href: '#',
			},
			{
				label: 'Freelance Projects',
				subLabel: 'An exclusive list for contract work',
				href: '#',
			},
		],
	},
	{
		label: 'Learn Design',
		href: '#',
	},
	{
		label: 'Hire Designers',
		href: '#',
	},
]
