import React, { useEffect, useState } from 'react'
import { HiBars3BottomRight, HiBars3 } from "react-icons/hi2";

const AboutMesh = ({ meshItems, fileInfo: { name, extension } }) => {
  const [toggle, setToggle] = useState(false);

  useEffect(() => {
    if (window.innerWidth < 1366) { setToggle(true) }
  }, [])


  return (<>
    <div className={` p-4 absolute rounded-r-lg shadow-xl left-0 top-20 overflow-hidden h-48 bg-white bg-opacity-60 backdrop-blur-md transition-all
      ${toggle ? "w-8 h-12 " : " w-48"}
      `}>
      <div onClick={() => setToggle(!toggle)} className=' absolute top-0 right-0 cursor-pointer p-1 opacity-80 '>
        {toggle ? <HiBars3 size={25} className=' p-0.5' /> : <HiBars3BottomRight size={25} className=' p-0.5' />}
      </div>
      <div className={`${toggle && "invisible"} flex gap-2 flex-col`}>
        <p className=' bg-slate-400 tracking-wider text-white bg-opacity-50 w-fit px-4 rounded-full text-sm font-bold opacity-80 border uppercase'>{extension}</p>
        <div className=' flex flex-col w-40 text-sm gap-1 rounded-md p-1 shadow-inner '>
          <p className=' text-sm overflow-hidden whitespace-nowrap border-b-2 border-gray-200 ' title={`${name}.${extension}`}>{name.split(".").pop()}</p>
          <div className=' h-24 overflow-y-scroll pl-2 text-xs flex flex-col gap-1'>
            <p>Mesh : {meshItems.children.length}</p>

          </div>
        </div>
      </div>
    </div>
  </>
  )
}

export default AboutMesh