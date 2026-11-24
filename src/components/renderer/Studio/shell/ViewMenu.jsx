import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { ChevronDown, Grid2X2 } from "lucide-react";

const PRESETS = [
  { dir: "iso", label: "ISO" },
  { dir: "front", label: "Front" },
  { dir: "top", label: "Top" },
  { dir: "right", label: "Right" },
];

/**
 * Popover with camera presets and display switches. Keeping these behind one
 * trigger keeps the toolbar usable on narrow screens.
 */
export default function ViewMenu({ view, onChange, onCameraView, canIsolate }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const pickCamera = (dir) => {
    onCameraView(dir);
    setOpen(false);
  };

  return (
    <div className="view-menu" ref={ref}>
      <button
        type="button"
        className={`st-btn st-view-trigger${open ? " is-open" : ""}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Grid2X2 size={14} />
        <span>View</span>
        <ChevronDown size={12} />
      </button>
      <div className={`view-popover${open ? " is-open" : ""}`} role="menu">
        <span className="view-label">Camera</span>
        <div className="view-presets">
          {PRESETS.map((preset) => (
            <button
              key={preset.dir}
              type="button"
              role="menuitem"
              onClick={() => pickCamera(preset.dir)}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <span className="view-label">Display</span>
        <button
          type="button"
          role="menuitemcheckbox"
          aria-checked={view.grid}
          className="view-switch"
          onClick={() => onChange("grid")}
        >
          <span>Show grid</span>
          <i className={view.grid ? "is-on" : ""} />
        </button>
        <button
          type="button"
          role="menuitemcheckbox"
          aria-checked={view.isolate}
          className="view-switch"
          disabled={!canIsolate}
          title={canIsolate ? "Hide everything except the selection" : "Select an object first"}
          onClick={() => onChange("isolate")}
        >
          <span>Isolate selection</span>
          <i className={view.isolate && canIsolate ? "is-on" : ""} />
        </button>
      </div>
    </div>
  );
}

ViewMenu.propTypes = {
  view: PropTypes.shape({
    grid: PropTypes.bool,
    isolate: PropTypes.bool,
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  onCameraView: PropTypes.func.isRequired,
  canIsolate: PropTypes.bool,
};
