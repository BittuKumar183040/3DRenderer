import { useState } from 'react';
import './App.css';
import FileUpload from './components/module/FileUpload';
import Studio from './components/renderer/Studio/Studio';

function App() {
  const [file, setFile] = useState({ name: "", extension: "" })

  const goHome = () => setFile({ name: "", extension: "" })

  return (
    <div className=' h-dvh w-screen'>
      {file.extension
        ? <Studio file={file} onExit={goHome} />
        : <FileUpload fileData={setFile} />}
    </div>
  )
}

export default App
