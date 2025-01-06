import { useState } from 'react';
import './App.css';
import FileUpload from './components/module/FileUpload';
import GLTF from './components/renderer/GLTF';
import FBX from './components/renderer/FBX';

function App() {
  const [file, setFile] = useState({ name: "", extension: "" })

  return (
    <div className=' h-dvh w-screen'>

      {{
        "": <FileUpload fileData={setFile} />,
        "glb": <GLTF file={file.file} />,
        "fbx": <FBX file={file.file} />
      }[file.extension]}
    </div>
  )
}

export default App
