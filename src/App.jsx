import { useCallback, useEffect, useState } from 'react';
import './App.css';
import FileUpload from './components/module/FileUpload';
import Studio from './components/renderer/Studio/Studio';
import StudioPage from './components/studio/StudioPage';

const STUDIO_PATH = '/studio';

const currentPath = () => {
  const path = window.location.pathname.replace(/\/+$/, '');
  return path || '/';
};

function App() {
  const [route, setRoute] = useState(currentPath);
  const [file, setFile] = useState({ name: "", extension: "" })

  const inStudio = route === STUDIO_PATH
  const viewing = Boolean(file.extension)
  const immersive = viewing || inStudio

  const goHome = () => setFile({ name: "", extension: "" })

  const goStudio = useCallback(() => {
    window.history.pushState({}, '', STUDIO_PATH)
    setRoute(STUDIO_PATH)
    setFile({ name: "", extension: "" })
  }, [])

  const leaveStudio = useCallback(() => {
    window.history.pushState({}, '', '/')
    setRoute('/')
  }, [])

  useEffect(() => {
    const onPopState = () => setRoute(currentPath())
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  // A viewer or the studio owns the whole viewport, so the document itself
  // must not scroll.
  useEffect(() => {
    document.body.classList.toggle('is-viewing', immersive)
    return () => document.body.classList.remove('is-viewing')
  }, [immersive])

  let content
  if (inStudio) content = <StudioPage onExit={leaveStudio} />
  else if (viewing) content = <Studio file={file} onExit={goHome} />
  else content = <FileUpload fileData={setFile} onOpenStudio={goStudio} />

  return (
    <div className={immersive ? 'h-dvh w-full overflow-hidden' : 'w-full'}>
      {content}
    </div>
  )
}

export default App
