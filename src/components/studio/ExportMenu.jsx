import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Camera, ChevronDown, Download, Loader2 } from "lucide-react";
import { EXPORT_FORMATS, captureViewport, exportObjects } from "./exportScene";

/**
 * Topbar export menu for the whole scene. Keeps the viewport screenshot here
 * too, so all file outputs live behind one Export button.
 */
export default function ExportMenu({ models, onNotice }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState("");
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

  const objects = models.map((model) => model.object).filter(Boolean);
  const canExport = objects.length > 0;

  const run = async (label, task) => {
    if (busy) return;
    setBusy(label);
    try {
      const filename = await task();
      onNotice?.(`Saved ${filename}`);
      setOpen(false);
    } catch (error) {
      onNotice?.(`Export failed — ${error.message}`);
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="view-menu studio-export" ref={ref}>
      <button
        type="button"
        className={`st-view-trigger studio-export-trigger${open ? " is-open" : ""}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Export scene"
        title="Export scene"
        onClick={() => setOpen((value) => !value)}
      >
        <Download size={14} />
        <span>Export</span>
        <ChevronDown size={12} />
      </button>

      <div
        className={`view-popover studio-export-popover${open ? " is-open" : ""}`}
        role="menu"
      >
        <span className="view-label">
          Scene{canExport ? ` · ${objects.length} object${objects.length > 1 ? "s" : ""}` : ""}
        </span>
        <div className="studio-export-grid">
          {EXPORT_FORMATS.map((format) => (
            <button
              key={format.id}
              type="button"
              role="menuitem"
              title={format.title}
              disabled={!canExport || Boolean(busy)}
              onClick={() =>
                run(format.id, () => exportObjects(objects, format.id, "studio-scene"))
              }
            >
              {busy === format.id ? <Loader2 size={12} className="is-spinning" /> : null}
              {format.label}
            </button>
          ))}
        </div>
        <p className="studio-export-note">
          OBJ, STL and PLY contain geometry only. GLB and GLTF keep materials and
          textures.
        </p>

        <span className="view-label">Image</span>
        <button
          type="button"
          role="menuitem"
          className="studio-export-capture"
          disabled={Boolean(busy)}
          onClick={() => run("png", () => captureViewport("studio-scene"))}
        >
          <Camera size={14} />
          <span>
            <b>Viewport PNG</b>
            <small>What the camera sees right now</small>
          </span>
        </button>
      </div>
    </div>
  );
}

ExportMenu.propTypes = {
  models: PropTypes.array.isRequired,
  onNotice: PropTypes.func,
};
