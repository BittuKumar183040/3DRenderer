import { Suspense, useEffect, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import { Canvas } from '@react-three/fiber';
import { Bounds, GizmoHelper, GizmoViewport, Loader, OrbitControls, useGLTF } from '@react-three/drei'
import * as THREE from "three";
import TopPanel from '../simulation/TopPanel';
import AboutMesh from '../simulation/AboutMesh';
import StatusBar from '../simulation/StatusBar';
import Gizmo from '../simulation/Gizmo';

const getGlbObj = (file) => {
  const gltf = useGLTF(file);
  return gltf;
}

function Model({ fileUrl, setMeshItems }) {
  const gltf = getGlbObj(fileUrl);
  useEffect(() => {
    const modelSize = 10
    let gltfScene = gltf.scene
    setMeshItems(gltf.scene)
    if (gltf) {
      const box = new THREE.Box3().setFromObject(gltfScene);
      const size = new THREE.Vector3();
      box.getSize(size);
      const maxDimension = Math.max(size.x, size.y, size.z);
      const scaleFactor = modelSize / maxDimension;
      gltfScene.scale.set(scaleFactor, scaleFactor, scaleFactor);
      const center = new THREE.Vector3();
      box.getCenter(center);
      gltfScene.position.set(-center.x * scaleFactor, -center.y * scaleFactor, -center.z * scaleFactor);
    }
  }, [gltf]);

  return <primitive object={gltf.scene} />;
}


const initial = {
  light: 2
}

const GLTF = ({ file: { file, name, extension } }) => {
  const [fileUrl, setFileUrl] = useState(null);
  const [reset, setReset] = useState(false)
  const [light, setLight] = useState(initial.light);
  const [meshItems, setMeshItems] = useState(null)

  useEffect(() => {
    if (file instanceof File) {
      const url = URL.createObjectURL(file);
      setFileUrl(url);
      return () => URL.revokeObjectURL(url);
    } else if (typeof file === 'string') {
      setFileUrl(file);
    } else {
      toast.error("File having issue!")
    }
  }, [file, reset]);

  const fallback = (item) => {
    let name = Object.keys(item)[0]

    switch (name) {
      case "reset":
        setReset(!reset);
        break;
      case "ambient":
        setLight(item["ambient"].value)
        break;
    }

  }

  return (
    <div className=' h-dvh w-screen'>
      <ToastContainer autoClose={1800} pauseOnHover={false} />
      <Canvas>
        <ambientLight intensity={light} />
        <directionalLight position={[-200, 300, 400]} intensity={light * 2} />
        <directionalLight position={[-200, -300, 400]} intensity={light * 4} />
        <OrbitControls />
        <Bounds fit observe margin={3}  >
          <Suspense fallback={null}>
            {fileUrl && <Model fileUrl={fileUrl} setMeshItems={setMeshItems} />}
          </Suspense>
        </Bounds>
        <Gizmo />
      </Canvas>
      <Loader />
      {meshItems && <>
        <TopPanel meshItems={meshItems} fallback={fallback} initial={initial} disable={["random"]} />
        <AboutMesh meshItems={meshItems} fileInfo={{ name, extension }} />
        {/* <StatusBar meshItems={meshItems} /> */}
      </>
      }
    </div>
  )
}

export default GLTF;
