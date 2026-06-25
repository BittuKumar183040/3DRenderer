import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import {
  Bounds,
  Grid,
  OrbitControls,
  PerspectiveCamera,
} from "@react-three/drei";
import ShaderSphere from "./mesh/ShaderSphere";
import { fragmentShader as defaultFragment } from "./customShader/fragment";
import { vertexShader as defaultVertex } from "./customShader/vertex";

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
    <div className="flex h-dvh w-screen overflow-hidden bg-neutral-950">

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

      <div className="w-[45%] bg-neutral-950 text-white flex flex-col border-l border-neutral-800">
        <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-800">
          <h2 className="text-lg font-semibold"> Shader Editor </h2>
          <div className="flex gap-3">
            <button onClick={applyShader} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium transition hover:bg-blue-500">
              Apply
            </button>

            <button onClick={resetShader} className="rounded-md bg-neutral-700 px-4 py-2 text-sm font-medium transition hover:bg-neutral-600" >
              Reset
            </button>

          </div>
        </div>

        <div className="flex flex-1 flex-col border-b border-neutral-800">
          <div className="px-5 py-2 font-semibold text-neutral-300">
            Vertex Shader
          </div>

          <textarea
            spellCheck={false}
            value={vertexEditor}
            onChange={(e) => setVertexEditor(e.target.value)}
            className="flex-1 resize-none bg-neutral-900 p-4 font-mono text-sm outline-none"
          />
        </div>
        <div className="flex flex-1 flex-col">
          <div className="px-5 py-2 font-semibold text-neutral-300">
            Fragment Shader
          </div>

          <textarea
            spellCheck={false}
            value={fragmentEditor}
            onChange={(e) => setFragmentEditor(e.target.value)}
            className="flex-1 resize-none bg-neutral-900 p-4 font-mono text-sm outline-none"
          />

        </div>
      </div>
    </div>
  );
};

export default Custom;