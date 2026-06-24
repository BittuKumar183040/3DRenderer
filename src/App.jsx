import { useState } from 'react';
import './App.css';
import FileUpload from './components/module/FileUpload';
import GLTF from './components/renderer/GLTF';
import FBX from './components/renderer/FBX';
import SVG from './components/renderer/SVG';
import VTK from './components/renderer/VTK/VTK';
import Custom from './components/renderer/Custom';

function App() {
  const [file, setFile] = useState({ name: "", extension: "" })

  return (
    <div className=' h-dvh w-screen'>

      {{
        "": <FileUpload fileData={setFile} />,
        "glb": <GLTF file={file} />,
        "fbx": <FBX file={file} />,
        "vtk": <VTK file={file} />,
        "svg": <SVG file={file} />,
        "custom": <Custom file={file} />,
      }[file.extension]}
    </div>
  )
}

export default App
