import { useEffect, useState } from 'react';
import './App.css';
import FileUpload from './components/module/FileUpload';
import Studio from './components/renderer/Studio/Studio';

function App() {
  const [file, setFile] = useState({ name: "", extension: "" })

  const viewing = Boolean(file.extension)

  const goHome = () => setFile({ name: "", extension: "" })

  // A viewer owns the whole viewport, so the document itself must not scroll.
  useEffect(() => {
    document.body.classList.toggle('is-viewing', viewing)
    return () => document.body.classList.remove('is-viewing')
  }, [viewing])

  return (
    <div className={viewing ? 'h-dvh w-full overflow-hidden' : 'w-full'}>
      {viewing
        ? <Studio file={file} onExit={goHome} />
        : <FileUpload fileData={setFile} />}
    </div>
  )
}

export default App
