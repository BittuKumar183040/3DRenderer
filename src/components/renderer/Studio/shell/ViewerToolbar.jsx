import { useState } from "react";
import PropTypes from "prop-types";
import { BiReset } from "react-icons/bi";
import { Box, Camera, Maximize2, RotateCw, Sun } from "lucide-react";
import SelectMenu from "./SelectMenu";
import ViewMenu from "./ViewMenu";

/**
 * Floating toolbar shared by the GLTF/FBX/SVG viewers.
 * Adds camera presets, grid and isolate controls on top of the original
 * reset / brightness / wireframe / auto-rotate / objects / screenshot tools.
 */
export default function ViewerToolbar({
  meshItems,
  brightness,
  onBrightness,
  brightnessMax = 10,
  onBrightnessMax,
  onReset,
  onRandom,
  disable = [],
  view,
  onViewChange,
  onCameraView,
  canIsolate = false,
}) {
  const [fullscreen, setFullscreen] = useState(false);

  const meshes = meshItems
    ? meshItems.length
      ? meshItems
      : meshItems.children
    : null;

  const toggleItem = (target) => {
    if (target && "visible" in target) target.visible = !target.visible;
  };

  const capture = () => {
    const canvas = document.querySelector(".studio-shell canvas");
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = "bexyzo-view.png";
      link.href = url;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, "image/png");
  };

  const toggleFullscreen = () => {
    const workspace = document.querySelector(".studio-shell");
    if (!document.fullscreenElement) {
      workspace?.requestFullscreen?.().then(() => setFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setFullscreen(false)).catch(() => {});
    }
  };

  return (
    <div className="studio-toolbar" role="toolbar" aria-label="Viewer tools">
      {!disable.includes("random") && (
        <button type="button" className="st-btn" onClick={onRandom}>
          Random
        </button>
      )}
      <button
        type="button"
        className="st-icon"
        title="Reset the scene"
        aria-label="Reset the scene"
        onClick={onReset}
      >
        <BiReset size={17} />
      </button>

      <div className="st-range">
        <Sun size={13} />
        <span>Brightness</span>
        <input
          type="range"
          min={0}
          max={brightnessMax}
          value={brightness}
          onChange={(event) => onBrightness(Number(event.target.value))}
          aria-label="Brightness"
        />
        <b>{brightness}</b>
        {onBrightnessMax && (
          <>
            <span className="st-range-max-label">max</span>
            <input
              className="st-range-max"
              type="number"
              min={1}
              max={1000}
              step={1}
              value={brightnessMax}
              aria-label="Maximum brightness"
              title="Highest brightness value available on the slider"
              onChange={(event) => onBrightnessMax(Number(event.target.value))}
            />
          </>
        )}
      </div>

      <span className="st-divider" aria-hidden="true" />

      <div className="st-right">
        <ViewMenu
          view={view}
          onChange={onViewChange}
          onCameraView={onCameraView}
          canIsolate={canIsolate}
        />
        <button
          type="button"
          className={`st-icon${view.wireframe ? " is-active" : ""}`}
          title="Toggle wireframe"
          aria-label="Toggle wireframe"
          aria-pressed={view.wireframe}
          onClick={() => onViewChange("wireframe")}
        >
          <Box size={16} />
        </button>
        <button
          type="button"
          className={`st-icon${view.autoRotate ? " is-active" : ""}`}
          title="Toggle auto-rotate"
          aria-label="Toggle auto-rotate"
          aria-pressed={view.autoRotate}
          onClick={() => onViewChange("autoRotate")}
        >
          <RotateCw size={16} />
        </button>
        {meshes && (
          <SelectMenu title="Objects" items={meshes} handleClick={toggleItem} />
        )}
        <span className="st-divider" aria-hidden="true" />
        {!disable.includes("camera") && (
          <button
            type="button"
            className="st-icon"
            title="Save viewport as PNG"
            aria-label="Save viewport as PNG"
            onClick={capture}
          >
            <Camera size={16} />
          </button>
        )}
        <button
          type="button"
          className={`st-icon${fullscreen ? " is-active" : ""}`}
          title="Toggle fullscreen"
          aria-label="Toggle fullscreen"
          aria-pressed={fullscreen}
          onClick={toggleFullscreen}
        >
          <Maximize2 size={16} />
        </button>
      </div>
    </div>
  );
}

ViewerToolbar.propTypes = {
  meshItems: PropTypes.object,
  brightness: PropTypes.number.isRequired,
  onBrightness: PropTypes.func.isRequired,
  brightnessMax: PropTypes.number,
  onBrightnessMax: PropTypes.func,
  onReset: PropTypes.func.isRequired,
  onRandom: PropTypes.func,
  disable: PropTypes.arrayOf(PropTypes.string),
  view: PropTypes.shape({
    grid: PropTypes.bool,
    isolate: PropTypes.bool,
    wireframe: PropTypes.bool,
    autoRotate: PropTypes.bool,
  }).isRequired,
  onViewChange: PropTypes.func.isRequired,
  onCameraView: PropTypes.func.isRequired,
  canIsolate: PropTypes.bool,
};
