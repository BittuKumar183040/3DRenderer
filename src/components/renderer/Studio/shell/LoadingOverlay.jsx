import PropTypes from "prop-types";
import { useProgress } from "@react-three/drei";
import { Box, LoaderCircle } from "lucide-react";

export default function LoadingOverlay({ name }) {
  const { active, progress, item } = useProgress();
  if (!active) return null;
  const percent = Math.max(0, Math.min(100, Math.round(progress || 0)));
  const preparing = percent >= 100;
  return (
    <div className="model-loading-overlay" role="status" aria-live="polite">
      <div className="model-loading-card">
        <div className="model-loading-icon">
          {preparing ? <LoaderCircle className="loading-spin" size={23} /> : <Box size={23} />}
        </div>
        <span className="model-loading-label">
          {preparing ? "PREPARING SCENE" : "LOADING MODEL"}
        </span>
        <h2>{name || "3D model"}</h2>
        <p>
          {preparing
            ? "Building geometry and materials…"
            : "Reading model data and textures…"}
        </p>
        <div className="model-loading-track">
          <span style={{ width: `${preparing ? 100 : percent}%` }} />
        </div>
        <div className="model-loading-meta">
          <span>{preparing ? "Almost ready" : item?.split(/[\\/]/).pop() || "Loading asset"}</span>
          <b>{percent}%</b>
        </div>
      </div>
    </div>
  );
}

LoadingOverlay.propTypes = {
  name: PropTypes.string,
};
