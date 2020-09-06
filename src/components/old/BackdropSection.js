import React from "react"

const BackDrop = ({ activeClass, click }) => (
  // eslint-disable-next-line
  <div className={activeClass} onClick={click}></div>
)

export default BackDrop
