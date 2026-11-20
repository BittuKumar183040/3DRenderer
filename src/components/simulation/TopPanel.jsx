import React, { useState } from 'react'
import { BiReset } from "react-icons/bi";
import { MdDriveFolderUpload } from "react-icons/md";
import { CgLoadbar } from "react-icons/cg";
import { Camera, Maximize2, RotateCw, Box } from "lucide-react";
import SelectMenu from '../module/SelectMenu';

const TopPanel = ({ meshItems, fallback, initial, disable = [] }) => {
  let meshes = null;
  if (meshItems) {
    meshes = meshItems.length ? meshItems : meshItems.children
  }
  const [range, setRange] = useState(initial.light)

  const sendBack = (clicked, data = {}) => {
    fallback({ [clicked]: { ...data } })
  }

  const handleChange = (e) => {
    setRange(e.target.value)
    sendBack("ambient", { value: e.target.value })
  }

  const handleSelectItemClick = (target) => {
    if (target) target.visible = !target.visible;
  }

  const capture = () => {
    const canvas = document.querySelector(".renderer-workspace canvas");
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = "bexyzo-view.png";
      link.href = url;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, "image/png");
  };
  const fullscreen = () => {
    const canvas = document.querySelector("canvas");
    const workspace = canvas?.closest(".renderer-workspace") || canvas?.parentElement;
    if (!document.fullscreenElement) workspace?.requestFullscreen?.();
    else document.exitFullscreen?.();
  };

  return (
    <div className=' container w-11/12 md:w-full flex gap-2 items-center p-2 rounded-b-lg shadow-md bg-opacity-60 text-gray-600  select-none absolute top-0 left-1/2 -translate-x-1/2 z-10 bg-white'
      style={{ backdropFilter: "blur(10px)" }}>
      <div className=' flex items-center border rounded-lg shadow-sm'>
        {!disable.includes("random") && <>
          <p onClick={() => sendBack("random")} className=' bg-opacity-50 hover:bg-opacity-70 cursor-pointer p-0.5 px-4 active:scale-90 rounded-md text-sm'>Random</p>
          <CgLoadbar className=' rotate-90 opacity-20' />
        </>
        }
        <BiReset title='Reset the Canvas' onClick={() => sendBack("reset")} size={25} className=' p-1 cursor-pointer active:scale-90 rounded-md text-sm' />
      </div>
      <div className=' flex items-center text-xs gap-1 p-1 border rounded-lg shadow-sm'>
        <label htmlFor='range'>Brightness</label>
        <input type='range' onChange={handleChange} min={1} max={10} value={range} className='w-16 sm:w-28' />
      </div>
      <div className=' relative flex items-center flex-1 justify-end gap-4'>
        <button title="Save viewport as PNG" className="flex items-center gap-1 text-xs hover:text-violet-600" onClick={capture}><Camera size={16}/><span className="hidden sm:inline">Capture</span></button>
        <button title="Toggle fullscreen" className="hover:text-violet-600" onClick={fullscreen}><Maximize2 size={16}/></button>
        <button title="Toggle wireframe" className="hover:text-violet-600" onClick={() => sendBack("wireframe")}><Box size={16}/></button>
        <button title="Toggle auto-rotate" className="hover:text-violet-600" onClick={() => sendBack("autorotate")}><RotateCw size={16}/></button>
        {meshes && <SelectMenu title={"Objects"} items={meshes} handleClick={handleSelectItemClick} />}
        <button className=' cursor-pointer active:scale-90 flex gap-2' onClick={() => location.reload()} >
          <MdDriveFolderUpload size={25} className=' p-0.5opacity-70 ' />
          <p>Pick</p>
        </button>
      </div>

    </div>
  )
}

export default TopPanel
