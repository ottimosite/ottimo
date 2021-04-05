import React from 'react'
// import PropTypes from 'prop-types'

const Button = ({props}) => {
  return (
    <button type={type} className='text-white bg-grey-100 rounde-lg p-3'>
      {props.label}
    </button>
  )
}

export default Button
