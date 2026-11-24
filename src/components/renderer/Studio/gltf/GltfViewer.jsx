import { Suspense, useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Canvas } from "@react-three/fiber";
import { Bounds, Grid, OrbitControls, useGLTF } from "@react-three/drei";
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

function Model({ fileUrl, setMeshItems, onSelect }) {
  const gltf = useGLTF(fileUrl);

  useEffect(() => {
    const scene = gltf.scene;
    setMeshItems(scene);
    const box = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDimension = Math.max(size.x, size.y, size.z) || 1;
    const scaleFactor = MODEL_SIZE / maxDimension;
    scene.scale.set(scaleFactor, scaleFactor, scaleFactor);
    const center = new THREE.Vector3();
    box.getCenter(center);
    scene.position.set(
      -center.x * scaleFactor,
      -center.y * scaleFactor,
      -center.z * scaleFactor
    );
  }, [gltf, setMeshItems]);

  return (
    <primitive
      object={gltf.scene}
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
};

const GltfViewer = ({ file: { file, name }, onExit }) => {
  const [fileUrl, setFileUrl] = useState(null);
  const [meshItems, setMeshItems] = useState(null);
  const [selected, setSelected] = useState(null);
  const [sceneRoot, setSceneRoot] = useState(null);
  const [brightness, setBrightness] = useState(2);
  const [fitKey, setFitKey] = useState(0);
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
      extension="glb"
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
          disable={["random"]}
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
          <directionalLight position={[-200, 300, 400]} intensity={brightness * 2} />
          <directionalLight position={[-200, -300, 400]} intensity={brightness * 4} />
          <OrbitControls makeDefault autoRotate={view.autoRotate} autoRotateSpeed={1.4} />
          <CameraRig view={cameraView} />
          <Bounds key={`fit-${fitKey}`} fit observe margin={3}>
            <Suspense fallback={null}>
              {fileUrl && (
                <Model fileUrl={fileUrl} setMeshItems={setMeshItems} onSelect={setSelected} />
              )}
            </Suspense>
          </Bounds>
          {view.grid && (
            <Grid
              name="Reference grid"
              position={[0, -MODEL_SIZE / 2, 0]}
              infiniteGrid
              cellSize={1}
              cellThickness={0.6}
              cellColor="#cdcedb"
              sectionSize={5}
              sectionThickness={1}
              sectionColor="#b3abdd"
              fadeDistance={38}
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

GltfViewer.propTypes = {
  file: PropTypes.shape({
    file: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(File)]),
    name: PropTypes.string,
  }).isRequired,
  onExit: PropTypes.func.isRequired,
};

export default GltfViewer;
