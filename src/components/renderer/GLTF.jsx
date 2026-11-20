import { Suspense, useEffect, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import { Canvas } from '@react-three/fiber';
import { Bounds, GizmoHelper, GizmoViewport, OrbitControls, useGLTF } from '@react-three/drei'
import * as THREE from "three";
import TopPanel from '../simulation/TopPanel';
import StatusBar from '../simulation/StatusBar';
import Gizmo from '../simulation/Gizmo';
import SelectionInspector from '../simulation/SelectionInspector';
import SceneGraphSidebar from '../simulation/SceneGraphSidebar';
import SelectionOutline from '../simulation/SelectionOutline';
import ModelLoadingOverlay from '../simulation/ModelLoadingOverlay';
import SceneGraphCapture from '../simulation/SceneGraphCapture';

const getGlbObj = (file) => {
  const gltf = useGLTF(file);
  return gltf;
}

function Model({ fileUrl, setMeshItems, onSelect }) {
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

  return <primitive object={gltf.scene} onClick={(event) => { event.stopPropagation(); onSelect(event.object); }} />;
}


const initial = {
  light: 2
}

const GLTF = ({ file: { file, name, extension } }) => {
  const [fileUrl, setFileUrl] = useState(null);
  const [reset, setReset] = useState(false)
  const [light, setLight] = useState(initial.light);
  const [meshItems, setMeshItems] = useState(null)
  const [wireframe, setWireframe] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);
  const [selectedObject, setSelectedObject] = useState(null);
  const [sceneRoot, setSceneRoot] = useState(null);

  useEffect(() => {
    meshItems?.traverse?.((node) => {
      if (node.isMesh) (Array.isArray(node.material) ? node.material : [node.material]).forEach((material) => { if (material && 'wireframe' in material) material.wireframe = wireframe; });
    });
  }, [meshItems, wireframe]);

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
      case "wireframe": setWireframe((value) => !value); break;
      case "autorotate": setAutoRotate((value) => !value); break;
    }

  }

  return (
    <div className='renderer-workspace h-dvh w-screen'>
      <ToastContainer autoClose={1800} pauseOnHover={false} />
      <Canvas onPointerMissed={() => setSelectedObject(null)}>
        <color attach="background" args={["#e9ebf1"]} />
        <ambientLight intensity={light} />
        <directionalLight position={[-200, 300, 400]} intensity={light * 2} />
        <directionalLight position={[-200, -300, 400]} intensity={light * 4} />
        <OrbitControls autoRotate={autoRotate} autoRotateSpeed={1.4} />
        <Bounds fit observe margin={3}  >
          <Suspense fallback={null}>
            {fileUrl && <Model fileUrl={fileUrl} setMeshItems={setMeshItems} onSelect={setSelectedObject} />}
          </Suspense>
        </Bounds>
        <Gizmo />
        <SceneGraphCapture onScene={setSceneRoot} />
        <SelectionOutline object={selectedObject} />
      </Canvas>
      <ModelLoadingOverlay name={name} />
      {meshItems && <>
        <TopPanel meshItems={meshItems} fallback={fallback} initial={initial} disable={["random"]} />
        {/* <StatusBar meshItems={meshItems} /> */}
      </>
      }
      <SelectionInspector object={selectedObject} root={meshItems} onSelect={setSelectedObject} onClose={() => setSelectedObject(null)} />
      <SceneGraphSidebar root={sceneRoot} selected={selectedObject} onSelect={setSelectedObject} title={name || 'Scene'} />
    </div>
  )
}

export default GLTF;
