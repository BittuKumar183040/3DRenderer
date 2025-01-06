import { useEffect, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import { Canvas } from '@react-three/fiber';
import { Bounds, GizmoHelper, GizmoViewport, Grid, OrbitControls, PerspectiveCamera, useFBX } from '@react-three/drei'
import * as THREE from "three";
import TopPanel from '../simulation/TopPanel';

const getFbxObj = (file) => {
  const fbx = useFBX(file);
  return fbx;
}

function Model({ fileUrl }) {

  const fbx = getFbxObj(fileUrl)
  useEffect(() => {
    const modelSize = 10
    if (fbx) {
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
    <primitive object={fbx} />
  );
}

const initial = {
  light: 2
}

const FBX = ({ file }) => {

  const [fileUrl, setFileUrl] = useState(null);
  const [reset, setReset] = useState(false);
  const [light, setLight] = useState(initial.light);

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

      case "reset":
        setReset(!reset);
        break;
    }

  }

  return (
    <div className='relative h-screen w-screen'>
      {
        fileUrl && <>
          <ToastContainer autoClose={1000} pauseOnHover={false} />
          <Canvas gl={{
            toneMapping: THREE.ACESFilmicToneMapping,
            outputEncoding: THREE.sRGBEncoding,
          }}>

            <ambientLight intensity={light} />
            {/* <Environment preset='lobby' background backgroundBlurriness={0.3} /> */}
            <PerspectiveCamera makeDefault={true} position={[0, 100, 250]} fov={75} />
            <OrbitControls />
            <Bounds fit margin={2} observe>
              <Model fileUrl={fileUrl} />
            </Bounds>
            <GizmoHelper
              alignment="bottom-left"
              margin={[80, 80]}
            >
              <GizmoViewport axisColors={['red', 'green', 'black']} labelColor="white" />
            </GizmoHelper>
            <Grid cellSize={12} scale={100} />
          </Canvas>
          <TopPanel fallback={fallback} initial={initial} />
        </>
      }
    </div>
  )
}

export default FBX;
