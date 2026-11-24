import React, { useState } from 'react'
import { BiReset } from "react-icons/bi";
import { MdDriveFolderUpload } from "react-icons/md";
import { Camera, Maximize2, RotateCw, Box, Sun } from "lucide-react";
import SelectMenu from '../module/SelectMenu';

const TopPanel = ({ meshItems, fallback, initial, disable = [] }) => {
  let meshes = null;
  if (meshItems) {
    meshes = meshItems.length ? meshItems : meshItems.children
  }
  const [range, setRange] = useState(initial.light)
  const [active, setActive] = useState({ wireframe: false, autorotate: false, fullscreen: false })

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

  const toggle = (key) => {
    setActive((prev) => ({ ...prev, [key]: !prev[key] }));
    sendBack(key);
  };

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
    setActive((prev) => ({ ...prev, fullscreen: !document.fullscreenElement }));
  };

  return (
    <div className='viewer-toolbar select-none'>
      <div className='tool-cluster'>
        {!disable.includes("random") && (
          <button type='button' className='tool-btn' onClick={() => sendBack("random")}>Random</button>
        )}
        <button type='button' className='tool-icon-btn' title='Reset the canvas' aria-label='Reset the canvas' onClick={() => sendBack("reset")}>
          <BiReset size={17} />
        </button>
      </div>

      <label className='tool-range' aria-label='Brightness'>
        <Sun size={13} />
        <span>Brightness</span>
        <input type='range' onChange={handleChange} min={1} max={10} value={range} />
        <b>{range}</b>
      </label>

      <div className='viewer-toolbar-right'>
        <button type='button' className='tool-icon-btn' title='Save viewport as PNG' aria-label='Save viewport as PNG' onClick={capture}>
          <Camera size={16} />
        </button>
        <button
          type='button'
          className={`tool-icon-btn ${active.fullscreen ? 'is-active' : ''}`}
          title='Toggle fullscreen'
          aria-label='Toggle fullscreen'
          onClick={fullscreen}
        >
          <Maximize2 size={16} />
        </button>
        <span className='tool-divider' aria-hidden='true' />
        <button
          type='button'
          className={`tool-icon-btn ${active.wireframe ? 'is-active' : ''}`}
          title='Toggle wireframe'
          aria-label='Toggle wireframe'
          aria-pressed={active.wireframe}
          onClick={() => toggle('wireframe')}
        >
          <Box size={16} />
        </button>
        <button
          type='button'
          className={`tool-icon-btn ${active.autorotate ? 'is-active' : ''}`}
          title='Toggle auto-rotate'
          aria-label='Toggle auto-rotate'
          aria-pressed={active.autorotate}
          onClick={() => toggle('autorotate')}
        >
          <RotateCw size={16} />
        </button>
        {meshes && <SelectMenu title="Objects" items={meshes} handleClick={handleSelectItemClick} />}
        <span className='tool-divider' aria-hidden='true' />
        <button type='button' className='tool-btn' title='Pick another file' onClick={() => location.reload()}>
          <MdDriveFolderUpload size={19} /> Pick
        </button>
      </div>
    </div>
  )
}

export default TopPanel
