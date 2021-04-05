import React from 'react'
// import PropTypes from 'prop-types'

const Button = ({
  type, // string = secondary(default) | primary | danger | warn
  backgroundColor, // default.none = body.backgroundColor,
  size, // string =
  full, //  bool = false(default [doc]--> sets button to fill parent width )
  label, // string.isRequired
  to, // string
  href, //string
  ...props
}) => {
  return (
    <button type={type} className='text-white bg-grey-100 rounde-lg p-3'>
      {props.label}
    </button>
  )
}

export default Button
