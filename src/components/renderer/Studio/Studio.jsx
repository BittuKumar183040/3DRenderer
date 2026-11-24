import PropTypes from "prop-types";
import GltfViewer from "./gltf/GltfViewer";
import FbxViewer from "./fbx/FbxViewer";
import SvgViewer from "./svg/SvgViewer";
import VtkViewer from "./vtk/VTK";
import ShaderViewer from "./shader/Custom";
import "./studio.css";

const VIEWERS = {
  glb: GltfViewer,
  fbx: FbxViewer,
  svg: SvgViewer,
  vtk: VtkViewer,
  custom: ShaderViewer,
};

/**
 * Entry point for the 3D studio. Each format lives in its own folder under
 * Studio/ (gltf, fbx, svg, vtk, shader) and shares the shell chrome.
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
