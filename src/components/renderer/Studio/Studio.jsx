import PropTypes from "prop-types";
import ModelViewer from "./viewer/ModelViewer";
import VtkViewer from "./vtk/VTK";
import ShaderViewer from "./shader/Custom";
import "./studio.css";

// One read-only viewer built on the studio canvas handles every 3D model and
// vector format, so shadows, helpers, scene tree, inspector and animation
// playback are identical across formats.
const VIEWERS = {
  glb: ModelViewer,
  gltf: ModelViewer,
  fbx: ModelViewer,
  svg: ModelViewer,
  vtk: VtkViewer,
  custom: ShaderViewer,
};

/**
 * Entry point for the 3D viewers. GLB, GLTF, FBX and SVG open in the shared
 * read-only model viewer; VTK and the live shader keep their own stages.
 */
export default function Studio({ file, onExit }) {
  const Viewer = VIEWERS[file.extension];

  if (!Viewer) {
    return (
      <div className="studio-shell studio-fallback">
        <div className="studio-fallback-card">
          <h1>Unsupported format</h1>
          <p>“.{file.extension}” is not handled by the studio yet.</p>
          <button type="button" className="st-btn" onClick={onExit}>
            Back to studio
          </button>
        </div>
      </div>
    );
  }

  return <Viewer file={file} onExit={onExit} />;
}

Studio.propTypes = {
  file: PropTypes.shape({
    name: PropTypes.string,
    extension: PropTypes.string,
  }).isRequired,
  onExit: PropTypes.func.isRequired,
};
