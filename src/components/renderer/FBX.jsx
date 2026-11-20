import { useEffect, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import { Canvas } from '@react-three/fiber';
import { Bounds, GizmoHelper, GizmoViewport, Grid, OrbitControls, PerspectiveCamera, useFBX } from '@react-three/drei'
import * as THREE from "three";
import TopPanel from '../simulation/TopPanel';
import Gizmo from '../simulation/Gizmo';
import SelectionInspector from '../simulation/SelectionInspector';
import SceneGraphSidebar from '../simulation/SceneGraphSidebar';
import SelectionOutline from '../simulation/SelectionOutline';
import SceneGraphCapture from '../simulation/SceneGraphCapture';

const getFbxObj = (file) => {
  const fbx = useFBX(file);
  return fbx;
}

function Model({ fileUrl, setMeshItems, onSelect }) {

  const fbx = getFbxObj(fileUrl)
  useEffect(() => {
    const modelSize = 10
    if (fbx) {
      setMeshItems(fbx)
      const box = new THREE.Box3().setFromObject(fbx);
      const size = new THREE.Vector3();
      box.getSize(size);
      const maxDimension = Math.max(size.x, size.y, size.z);
      const scaleFactor = modelSize / maxDimension;
      fbx.scale.set(scaleFactor, scaleFactor, scaleFactor);
      const center = new THREE.Vector3();
      box.getCenter(center);
      fbx.position.set(-center.x * scaleFactor, (-center.y * scaleFactor) + modelSize / 2, -center.z * scaleFactor);
    }
  }, [fbx]);
  return (
    <primitive object={fbx} onClick={(event) => { event.stopPropagation(); onSelect(event.object); }} />
  );
}

const initial = {
  light: 2
}

const FBX = ({ file: { file, name, extension } }) => {

  const [fileUrl, setFileUrl] = useState(null);
  const [reset, setReset] = useState(false);
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
      case "random":
        const fbx = getFbxObj(fileUrl)
        if (fbx) {
          fbx.traverse((child) => {
            if (child.isMesh) {
              let randomColor;
              do {
                randomColor = new THREE.Color(Math.random(), Math.random(), Math.random());
              } while (randomColor.r > 0.9 && randomColor.g > 0.9 && randomColor.b > 0.9);

              child.material = new THREE.MeshStandardMaterial({ color: randomColor });
            }
          });
        }
        break;

      case "ambient":
        setLight(item["ambient"].value)
        break;
      case "wireframe": setWireframe((value) => !value); break;
      case "autorotate": setAutoRotate((value) => !value); break;

      case "reset":
        setReset(!reset);
        break;
    }

  }

  return (
    <div className='renderer-workspace relative h-dvh w-screen'>
      {
        fileUrl && <>
          <ToastContainer autoClose={1000} pauseOnHover={false} />
          <Canvas onPointerMissed={() => setSelectedObject(null)} gl={{
            toneMapping: THREE.ACESFilmicToneMapping,
            outputEncoding: THREE.sRGBEncoding,
          }}>

            <ambientLight intensity={light} />
            <PerspectiveCamera makeDefault={true} position={[0, 100, 250]} fov={75} />
            <OrbitControls autoRotate={autoRotate} autoRotateSpeed={1.4} />
            <Bounds fit margin={2} observe>
              <Model fileUrl={fileUrl} setMeshItems={setMeshItems} onSelect={setSelectedObject} />
            </Bounds>
            <Gizmo />
            <SceneGraphCapture onScene={setSceneRoot} />
            <SelectionOutline object={selectedObject} />
            <Grid cellSize={12} scale={100} />
          </Canvas>
          {meshItems && <>
            <TopPanel meshItems={meshItems} fallback={fallback} initial={initial} />
            {/* <StatusBar meshItems={meshItems} /> */}
          </>
          }
          <SelectionInspector object={selectedObject} root={meshItems} onSelect={setSelectedObject} onClose={() => setSelectedObject(null)} />
          <SceneGraphSidebar root={sceneRoot} selected={selectedObject} onSelect={setSelectedObject} title={name || 'Scene'} />
        </>
      }
    </div>
  )
}

export default FBX;
