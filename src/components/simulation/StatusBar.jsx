import React from 'react'

const StatusBar = ({ meshItems }) => {
  console.log(meshItems)
  return (
    <div className=' absolute bottom-0 px-2 py-1 select-none text-sm w-full bg-white bg-opacity-60 backdrop-blur-lg flex justify-between '>
      <div>
        <p></p>
      </div>
      <div>
        <p>Mesh: <span>{meshItems.children.length}</span></p>
      </div>
    </div>
  )
}

export default StatusBar