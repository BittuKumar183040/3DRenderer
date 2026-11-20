import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Canvas, useLoader } from "@react-three/fiber";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader";
import { Bounds, Grid, OrbitControls, PerspectiveCamera } from "@react-three/drei";
import TopPanel from "../simulation/TopPanel";
import Gizmo from "../simulation/Gizmo";
import SelectionInspector from "../simulation/SelectionInspector";
import SceneGraphSidebar from "../simulation/SceneGraphSidebar";
import SelectionOutline from "../simulation/SelectionOutline";
import ModelLoadingOverlay from "../simulation/ModelLoadingOverlay";
import SceneGraphCapture from "../simulation/SceneGraphCapture";


const SvgMesh = ({ fileUrl, setMeshItems, randomColor, wireframe, onSelect }) => {
  const groupRef = useRef(null);
  const data = useLoader(SVGLoader, fileUrl);
  let paths = data?.paths || [];

  paths = paths.map((item) => {
    item.uuid = crypto.randomUUID();
    item.name = item.uuid;
    item.id = item.uuid;
    return item;
  });

  useEffect(() => {
    if (groupRef.current) setMeshItems(groupRef.current);
  }, [setMeshItems, paths]);

  const generateRGBRandomColor = () => {
    return `rgb(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)})`;
  }

  const shapes = useMemo(() => {
    return paths.length > 0
      ? paths.flatMap((path) =>
        path.toShapes(true).map((shape) => ({
          shape,
          color: randomColor && generateRGBRandomColor() || path.color || "black",
        }))
      )
      : [];
  }, [paths]);

  if (paths.length === 0) {
    alert("SVG file loaded but contains no paths. Upload a different file.");
    return null;
  }

  return (
    <group ref={groupRef} name="SVG Scene" scale={[0.01, 0.01, 0.01]}>
      {shapes.map(({ shape, color }, index) => (
        <mesh key={index} name={`SVG shape ${index + 1}`} onClick={(event) => { event.stopPropagation(); onSelect(event.object); }}>
          <shapeGeometry args={[shape]} />
          <meshBasicMaterial color={color} side={2} wireframe={wireframe} />
        </mesh>
      ))}
    </group>
  );
};


const initial = {
  light: 2
}
const SVG = ({ file: { file, name, extension } }) => {
  const [light, setLight] = useState(initial.light);
  const [resetKey, setResetKey] = useState(0);
  const [meshItems, setMeshItems] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);
  const [randomColor, setRandomColor] = useState(0);
  const [wireframe, setWireframe] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);
  const [selectedObject, setSelectedObject] = useState(null);
  const [sceneRoot, setSceneRoot] = useState(null);

  useEffect(() => {
    if (file instanceof File && file.type === "image/svg+xml") {
      const url = URL.createObjectURL(file);
      setFileUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      console.log("File", file)
      console.error("Invalid file format. Expected an SVG file.");
      setFileUrl(null);
    }
  }, [file]);

  const fallback = (item) => {
    let name = Object.keys(item)[0]

    switch (name) {
      case "random":
        setRandomColor(randomColor + 1);
        break;

      case "ambient":
        setLight(item.ambient.value);
        break;
      case "wireframe": setWireframe((value) => !value); break;
      case "autorotate": setAutoRotate((value) => !value); break;

      case "reset":
        setRandomColor(0);
        setResetKey(resetKey + 1);
        break;
    }

  }

  const handleSetMeshItems = useCallback((newMeshItems) => {
    setMeshItems((prevMeshItems) => {
      if (JSON.stringify(prevMeshItems) !== JSON.stringify(newMeshItems)) {
        return newMeshItems;
      }
      return prevMeshItems;
    });
  }, []);

  return (
    <div className='renderer-workspace relative h-dvh w-screen'>
      {fileUrl ? <Canvas key={resetKey} onPointerMissed={() => setSelectedObject(null)}>
        <color attach="background" args={["#e9ebf1"]} />
        <ambientLight intensity={light} />
        <PerspectiveCamera makeDefault={true} position={[0, 100, 250]} fov={75} />

        <OrbitControls makeDefault autoRotate={autoRotate} autoRotateSpeed={1.4} />
        <Bounds fit margin={2} observe>
          <SvgMesh fileUrl={fileUrl} setMeshItems={handleSetMeshItems} randomColor={randomColor} wireframe={wireframe} onSelect={setSelectedObject} />
        </Bounds>
        <Gizmo />
        <SelectionOutline object={selectedObject} />
        <SceneGraphCapture onScene={setSceneRoot} />
        <Grid cellSize={12} scale={100} />
      </Canvas> : <></>
      }
      <TopPanel meshItems={meshItems} fallback={fallback} initial={initial} />
      <SelectionInspector object={selectedObject} root={meshItems} onSelect={setSelectedObject} onClose={() => setSelectedObject(null)} />
      <SceneGraphSidebar root={sceneRoot} selected={selectedObject} onSelect={setSelectedObject} title={name || 'SVG Scene'} />
      <ModelLoadingOverlay name={name} />
    </div>
  );
};

export default SVG;
