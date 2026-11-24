import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Canvas, useLoader } from "@react-three/fiber";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader";
import { Bounds, Grid, OrbitControls, PerspectiveCamera } from "@react-three/drei";
import ViewerLayout from "../shell/ViewerLayout";
import ViewerToolbar from "../shell/ViewerToolbar";
import LoadingOverlay from "../shell/LoadingOverlay";
import SelectionOutline from "../shell/SelectionOutline";
import SceneCapture from "../shell/SceneCapture";
import CameraRig from "../shell/CameraRig";
import Gizmo from "../shell/Gizmo";

const randomRgb = () =>
  `rgb(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)})`;

function SvgMesh({ fileUrl, setMeshItems, randomColor, wireframe, onSelect }) {
  const groupRef = useRef(null);
  const data = useLoader(SVGLoader, fileUrl);

  const paths = useMemo(
    () =>
      (data?.paths || []).map((item) => {
        const id = crypto.randomUUID();
        item.uuid = id;
        item.name = id;
        item.id = id;
        return item;
      }),
    [data]
  );

  useEffect(() => {
    if (groupRef.current) setMeshItems(groupRef.current);
  }, [setMeshItems, paths]);

  const shapes = useMemo(
    () =>
      paths.flatMap((path) =>
        path.toShapes(true).map((shape) => ({
          shape,
          color: (randomColor && randomRgb()) || path.color || "black",
        }))
      ),
    [paths, randomColor]
  );

  if (paths.length === 0) {
    return null;
  }

  return (
    <group ref={groupRef} name="SVG Scene" scale={[0.01, 0.01, 0.01]}>
      {shapes.map(({ shape, color }, index) => (
        <mesh
          key={index}
          name={`SVG shape ${index + 1}`}
          onClick={(event) => {
            event.stopPropagation();
            onSelect(event.object);
          }}
        >
          <shapeGeometry args={[shape]} />
          <meshBasicMaterial color={color} side={2} wireframe={wireframe} />
        </mesh>
      ))}
    </group>
  );
}

SvgMesh.propTypes = {
  fileUrl: PropTypes.string.isRequired,
  setMeshItems: PropTypes.func.isRequired,
  randomColor: PropTypes.number,
  wireframe: PropTypes.bool,
  onSelect: PropTypes.func.isRequired,
};

const SvgViewer = ({ file: { file, name }, onExit }) => {
  const [fileUrl, setFileUrl] = useState(null);
  const [meshItems, setMeshItems] = useState(null);
  const [selected, setSelected] = useState(null);
  const [sceneRoot, setSceneRoot] = useState(null);
  const [brightness, setBrightness] = useState(2);
  const [fitKey, setFitKey] = useState(0);
  const [randomColor, setRandomColor] = useState(0);
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
    setFileUrl(null);
    return undefined;
  }, [file]);

  const handleSetMeshItems = useCallback((next) => {
    setMeshItems(next);
  }, []);

  const toggleView = (key) =>
    setView((current) => ({ ...current, [key]: !current[key] }));

  const resetScene = () => {
    setRandomColor(0);
    setFitKey((value) => value + 1);
    setSelected(null);
    setView((current) => ({ ...current, isolate: false }));
    setCameraView((current) => ({ dir: "iso", n: current.n + 1 }));
  };

  return (
    <ViewerLayout
      title={name || "SVG scene"}
      extension="svg"
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
          onRandom={() => setRandomColor((value) => value + 1)}
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
            <Suspense fallback={null}>
              {fileUrl && (
                <SvgMesh
                  fileUrl={fileUrl}
                  setMeshItems={handleSetMeshItems}
                  randomColor={randomColor}
                  wireframe={view.wireframe}
                  onSelect={setSelected}
                />
              )}
            </Suspense>
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
          <SceneCapture onScene={setSceneRoot} />
          <SelectionOutline object={selected} />
          <Gizmo />
        </Canvas>
      }
    />
  );
};

SvgViewer.propTypes = {
  file: PropTypes.shape({
    file: PropTypes.instanceOf(File),
    name: PropTypes.string,
  }).isRequired,
  onExit: PropTypes.func.isRequired,
};

export default SvgViewer;
