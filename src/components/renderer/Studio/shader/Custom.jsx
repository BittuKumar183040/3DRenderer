import { useState } from "react";
import PropTypes from "prop-types";
import { Canvas } from "@react-three/fiber";
import { Bounds, Grid, OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { ArrowLeft, Box } from "lucide-react";
import ShaderSphere from "./mesh/ShaderSphere";
import { fragmentShader as defaultFragment } from "./shaders/fragment";
import { vertexShader as defaultVertex } from "./shaders/vertex";
import TextArea from "./ui/TextArea";
import { ButtonPrimary, ButtonSecondary } from "./ui/Buttons";

const initial = {
  light: 2,
};

const Custom = ({ defaultIdx = 0, onExit }) => {
  const [light] = useState(initial.light);
  const [vertexEditor, setVertexEditor] = useState(defaultVertex[defaultIdx]);
  const [fragmentEditor, setFragmentEditor] = useState(defaultFragment[defaultIdx]);
  const [vertexShader, setVertexShader] = useState(defaultVertex[defaultIdx]);
  const [fragmentShader, setFragmentShader] = useState(defaultFragment[defaultIdx]);

  const applyShader = () => {
    setVertexShader(vertexEditor);
    setFragmentShader(fragmentEditor);
  };

  const resetShader = () => {
    setVertexEditor(defaultVertex[0]);
    setFragmentEditor(defaultFragment[0]);
    setVertexShader(defaultVertex[0]);
    setFragmentShader(defaultFragment[0]);
  };

  return (
    <div className="shader-studio">
      <div className="shader-stage">
        <Canvas dpr={[1, 2]}>
          <ambientLight intensity={light} />
          <directionalLight intensity={10} position={[5, 10, 5]} />
          <PerspectiveCamera makeDefault position={[0, 100, 250]} fov={75} />
          <OrbitControls makeDefault />
          <Bounds fit observe margin={2}>
            <ShaderSphere vertexShader={vertexShader} fragmentShader={fragmentShader} />
          </Bounds>
          <Grid cellSize={12} scale={100} />
        </Canvas>
      </div>

      <aside className="shader-panel">
        <header className="shader-head">
          <button
            type="button"
            className="shader-brand"
            onClick={onExit}
            title="Back to studio home"
            aria-label="Back to studio home"
          >
            <span className="studio-brand-mark">
              <Box size={13} />
            </span>
            Bexyzo.
            <ArrowLeft size={12} />
          </button>
          <div className="shader-head-copy">
            <h2>Shader editor</h2>
            <span>Live GLSL playground</span>
          </div>
          <div className="shader-actions">
            <ButtonPrimary label="Apply" onClick={applyShader} />
            <ButtonSecondary label="Reset" onClick={resetShader} />
          </div>
        </header>
        <div className="shader-editors">
          <TextArea label="Vertex Shader" value={vertexEditor} onChange={setVertexEditor} />
          <TextArea label="Fragment Shader" value={fragmentEditor} onChange={setFragmentEditor} />
        </div>
      </aside>
    </div>
  );
};

Custom.propTypes = {
  defaultIdx: PropTypes.number,
  onExit: PropTypes.func,
};

Custom.defaultProps = {
  onExit: () => {},
};

export default Custom;
