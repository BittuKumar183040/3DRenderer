import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Camera, ChevronDown, Download, Loader2 } from "lucide-react";
import { EXPORT_FORMATS, captureViewport, exportObjects } from "./exportScene";

/**
 * One export button shared by the top bar (whole scene) and the selection
 * inspector (just the selected object). A single trigger opens a menu with
 * every geometry format, so no row of loose format buttons is needed.
 */
export default function ExportMenu({
  objects,
  name = "studio",
  label = "Export",
  scope = "Scene",
  includeCapture = false,
  placement = "down",
  className = "",
  onNotice,
}) {
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

  const list = (objects || []).filter(Boolean);
  const canExport = list.length > 0;

  const run = async (task) => {
    if (busy) return;
    setBusy(task.id);
    try {
      const filename = await task.run();
      onNotice?.(`Saved ${filename}`);
      setOpen(false);
    } catch (error) {
      onNotice?.(`Export failed — ${error.message}`);
    } finally {
      setBusy("");
    }
  };

  return (
    <div className={`view-menu studio-export${className ? ` ${className}` : ""}`} ref={ref}>
      <button
        type="button"
        className={`st-view-trigger studio-export-trigger${open ? " is-open" : ""}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        title={label}
        onClick={() => setOpen((value) => !value)}
      >
        <Download size={14} />
        <span>{label}</span>
        <ChevronDown size={12} />
      </button>

      <div
        className={`view-popover studio-export-popover${placement === "up" ? " is-up" : ""}${open ? " is-open" : ""}`}
        role="menu"
      >
        <span className="view-label">
          {scope}
          {canExport
            ? ` · ${list.length} object${list.length > 1 ? "s" : ""}`
            : ""}
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
                run({
                  id: format.id,
                  run: () => exportObjects(list, format.id, name),
                })
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

        {includeCapture && (
          <>
            <span className="view-label">Image</span>
            <button
              type="button"
              role="menuitem"
              className="studio-export-capture"
              disabled={Boolean(busy)}
              onClick={() =>
                run({ id: "png", run: () => captureViewport(name) })
              }
            >
              {busy === "png" ? (
                <Loader2 size={14} className="is-spinning" />
              ) : (
                <Camera size={14} />
              )}
              <span>
                <b>Viewport PNG</b>
                <small>What the camera sees right now</small>
              </span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}

ExportMenu.propTypes = {
  objects: PropTypes.array.isRequired,
  name: PropTypes.string,
  label: PropTypes.string,
  scope: PropTypes.string,
  includeCapture: PropTypes.bool,
  placement: PropTypes.oneOf(["down", "up"]),
  className: PropTypes.string,
  onNotice: PropTypes.func,
};
