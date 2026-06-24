import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import {
  Bounds,
  Grid,
  OrbitControls,
  PerspectiveCamera,
} from "@react-three/drei";
import TopPanel from "../simulation/TopPanel";
import Gizmo from "../simulation/Gizmo";
import AboutMesh from "../simulation/AboutMesh";
import ShaderSphere from "./mesh/ShaderSphere";

const initial = {
  light: 2,
};
const Custom = () => {
  const [light, setLight] = useState(initial.light);
  const [resetKey, setResetKey] = useState(0);
  const [randomColor, setRandomColor] = useState(0);

  const fallback = (item) => {
    let name = Object.keys(item)[0];

    switch (name) {
      case "random":
        setRandomColor(randomColor + 1);
        break;

      case "ambient":
        setLight(item.ambient.value);
        break;

      case "reset":
        setRandomColor(0);
        setResetKey(resetKey + 1);
        break;
    }
  };

  return (
    <div className="relative h-dvh w-screen">
      <Canvas key={resetKey}>
        <ambientLight intensity={light} />
        <directionalLight intensity={10} />
        <PerspectiveCamera
          makeDefault={true}
          position={[0, 100, 250]}
          fov={75}
        />

        <OrbitControls makeDefault />
        <Bounds fit margin={2} observe>
          <ShaderSphere />
        </Bounds>
        <Gizmo />
        <Grid cellSize={12} scale={100} />
      </Canvas>
    </div>
  );
};

export default Custom;
