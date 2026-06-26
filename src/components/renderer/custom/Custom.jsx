import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import {
  Bounds,
  Grid,
  OrbitControls,
  PerspectiveCamera,
} from "@react-three/drei";
import ShaderSphere from "./mesh/ShaderSphere";
import { fragmentShader as defaultFragment } from "./shaders/fragment";
import { vertexShader as defaultVertex } from "./shaders/vertex";
import TextArea from "./ui/TextArea";
import { ButtonPrimary, ButtonSecondary } from "./ui/Buttons";

const initial = {
  light: 2,
};

const Custom = () => {
  const [light] = useState(initial.light);

  const [vertexEditor, setVertexEditor] = useState(defaultVertex);
  const [fragmentEditor, setFragmentEditor] = useState(defaultFragment);
  const [vertexShader, setVertexShader] = useState(defaultVertex);
  const [fragmentShader, setFragmentShader] = useState(defaultFragment);

  const applyShader = () => {
    setVertexShader(vertexEditor);
    setFragmentShader(fragmentEditor);
  };

  const resetShader = () => {
    setVertexEditor(defaultVertex);
    setFragmentEditor(defaultFragment);

    setVertexShader(defaultVertex);
    setFragmentShader(defaultFragment);
  };

  return (
    <div className="flex md:flex-row flex-col h-dvh w-screen overflow-hidden bg-neutral-950">

      <div className="flex-1">
        <Canvas>
          <ambientLight intensity={light} />
          <directionalLight intensity={10} position={[5, 10, 5]} />

          <PerspectiveCamera
            makeDefault
            position={[0, 100, 250]}
            fov={75}
          />

          <OrbitControls makeDefault />

          <Bounds fit observe margin={2}>
            <ShaderSphere
              vertexShader={vertexShader}
              fragmentShader={fragmentShader}
            />
          </Bounds>

          <Grid cellSize={12} scale={100} />
        </Canvas>
      </div>

      <div className=" bg-neutral-950 md:w-[45%] w-full md:h-full h-1/2 text-white flex flex-col border-l border-neutral-800">
        <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-800">
          <h2 className="text-lg font-semibold"> Shader Editor </h2>
          <div className="flex gap-3">
            <ButtonPrimary label={"Apply"} onClick={applyShader} />
            <ButtonSecondary label={"Reset"} onClick={resetShader} />
          </div>
        </div>

        <div className="flex flex-1 flex-col border-b border-neutral-800">
          <TextArea label={"Vertex Shader"} value={vertexEditor} onChange={setVertexEditor} />
        </div>
        <div className="flex flex-1 flex-col">
          <TextArea label={"Fragment Shader"} value={fragmentEditor} onChange={setFragmentEditor} />
        </div>
      </div>
    </div>
  );
};

export default Custom;