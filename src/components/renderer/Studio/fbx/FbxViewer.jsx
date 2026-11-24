import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Canvas } from "@react-three/fiber";
import {
  Bounds,
  Grid,
  OrbitControls,
  PerspectiveCamera,
  useFBX,
} from "@react-three/drei";
import * as THREE from "three";
import ViewerLayout from "../shell/ViewerLayout";
import ViewerToolbar from "../shell/ViewerToolbar";
import LoadingOverlay from "../shell/LoadingOverlay";
import SelectionOutline from "../shell/SelectionOutline";
import SceneCapture from "../shell/SceneCapture";
import CameraRig from "../shell/CameraRig";
import IsolateObject from "../shell/IsolateObject";
import Gizmo from "../shell/Gizmo";

const MODEL_SIZE = 10;

function Model({ fileUrl, setMeshItems, onSelect, randomSeed }) {
  const fbx = useFBX(fileUrl);

  useEffect(() => {
    if (!fbx) return;
    setMeshItems(fbx);
    const box = new THREE.Box3().setFromObject(fbx);
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDimension = Math.max(size.x, size.y, size.z) || 1;
    const scaleFactor = MODEL_SIZE / maxDimension;
    fbx.scale.set(scaleFactor, scaleFactor, scaleFactor);
    const center = new THREE.Vector3();
    box.getCenter(center);
    fbx.position.set(
      -center.x * scaleFactor,
      -center.y * scaleFactor + MODEL_SIZE / 2,
      -center.z * scaleFactor
    );
  }, [fbx, setMeshItems]);

  // Applies random colours when the toolbar asks for it. Runs as an effect so
  // the loader hook is never called from an event handler.
  useEffect(() => {
    if (!fbx || !randomSeed) return;
    fbx.traverse((child) => {
      if (!child.isMesh) return;
      let color;
      do {
        color = new THREE.Color(Math.random(), Math.random(), Math.random());
      } while (color.r > 0.92 && color.g > 0.92 && color.b > 0.92);
      child.material = new THREE.MeshStandardMaterial({ color });
    });
  }, [fbx, randomSeed]);

  return (
    <primitive
      object={fbx}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(event.object);
      }}
    />
  );
}

Model.propTypes = {
  fileUrl: PropTypes.string.isRequired,
  setMeshItems: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
  randomSeed: PropTypes.number,
};

const FbxViewer = ({ file: { file, name }, onExit }) => {
  const [fileUrl, setFileUrl] = useState(null);
  const [meshItems, setMeshItems] = useState(null);
  const [selected, setSelected] = useState(null);
  const [sceneRoot, setSceneRoot] = useState(null);
  const [brightness, setBrightness] = useState(2);
  const [fitKey, setFitKey] = useState(0);
  const [randomSeed, setRandomSeed] = useState(0);
  const [cameraView, setCameraView] = useState({ dir: "iso", n: 0 });
  const [view, setView] = useState({
    grid: true,
    isolate: false,
    wireframe: false,
    autoRotate: false,
  });

  useEffect(() => {
    if (file instanceof File) {
      const url = URL.createObjectURL(file);
      setFileUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    if (typeof file === "string") {
      setFileUrl(file);
      return undefined;
    }
    return undefined;
  }, [file]);

  useEffect(() => {
    meshItems?.traverse?.((node) => {
      if (!node.isMesh) return;
      (Array.isArray(node.material) ? node.material : [node.material]).forEach(
        (material) => {
          if (material && "wireframe" in material) material.wireframe = view.wireframe;
        }
      );
    });
  }, [meshItems, view.wireframe]);

  const toggleView = (key) =>
    setView((current) => ({ ...current, [key]: !current[key] }));

  const resetScene = () => {
    setFitKey((value) => value + 1);
    setSelected(null);
    setView((current) => ({ ...current, isolate: false }));
    setCameraView((current) => ({ dir: "iso", n: current.n + 1 }));
  };

  return (
    <ViewerLayout
      title={name || "3D model"}
      extension="fbx"
      onExit={onExit}
      sceneRoot={sceneRoot}
      selected={selected}
      onSelect={setSelected}
      onClearSelection={() => setSelected(null)}
      overlay={<LoadingOverlay name={name} />}
      toolbar={
        <ViewerToolbar
          meshItems={meshItems}
          brightness={brightness}
          onBrightness={setBrightness}
          onReset={resetScene}
          onRandom={() => setRandomSeed((value) => value + 1)}
          view={view}
          onViewChange={toggleView}
          canIsolate={Boolean(selected)}
          onCameraView={(dir) => setCameraView((c) => ({ dir, n: c.n + 1 }))}
        />
      }
      canvas={
        <Canvas
          dpr={[1, 2]}
          gl={{ preserveDrawingBuffer: true }}
          onPointerMissed={() => setSelected(null)}
        >
          <color attach="background" args={["#e9ebf1"]} />
          <ambientLight intensity={brightness} />
          <PerspectiveCamera makeDefault position={[0, 100, 250]} fov={75} />
          <OrbitControls makeDefault autoRotate={view.autoRotate} autoRotateSpeed={1.4} />
          <CameraRig view={cameraView} />
          <Bounds key={`fit-${fitKey}`} fit margin={2} observe>
            {fileUrl && (
              <Model
                fileUrl={fileUrl}
                setMeshItems={setMeshItems}
                onSelect={setSelected}
                randomSeed={randomSeed}
              />
            )}
          </Bounds>
          {view.grid && (
            <Grid
              name="Reference grid"
              infiniteGrid
              cellSize={1}
              cellThickness={0.6}
              cellColor="#cdcedb"
              sectionSize={5}
              sectionThickness={1}
              sectionColor="#b3abdd"
              fadeDistance={90}
              fadeStrength={1.4}
            />
          )}
          <IsolateObject enabled={view.isolate} root={meshItems} selected={selected} />
          <SceneCapture onScene={setSceneRoot} />
          <SelectionOutline object={selected} />
          <Gizmo />
        </Canvas>
      }
    />
  );
};

FbxViewer.propTypes = {
  file: PropTypes.shape({
    file: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(File)]),
    name: PropTypes.string,
  }).isRequired,
  onExit: PropTypes.func.isRequired,
};

export default FbxViewer;
