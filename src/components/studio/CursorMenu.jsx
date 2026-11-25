import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { ChevronDown } from "lucide-react";
import { LuCrosshair } from "react-icons/lu";

/**
 * Toolbar popover for the 3D cursor: shows the live position and offers reset,
 * snapping to the selection or the view centre, and a visibility switch.
 */
export default function CursorMenu({
  cursor,
  visible,
  canSnap,
  onReset,
  onToSelection,
  onToView,
  onToggleVisible,
}) {
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

  const run = (action) => {
    action();
    setOpen(false);
  };

  return (
    <div className="view-menu" ref={ref}>
      <button
        type="button"
        className={`st-view-trigger studio-cursor-trigger${open ? " is-open" : ""}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="3D cursor options"
        title="3D cursor"
        onClick={() => setOpen((value) => !value)}
      >
        <LuCrosshair size={14} />
        <span>Cursor</span>
        <ChevronDown size={12} />
      </button>

      <div
        className={`view-popover studio-cursor-popover${open ? " is-open" : ""}`}
        role="menu"
      >
        <span className="view-label">3D cursor</span>
        <div className="studio-cursor-readout">
          {["x", "y", "z"].map((axis, index) => (
            <span key={axis}>
              <b>{axis.toUpperCase()}</b>
              {Number(cursor[index] || 0).toFixed(2)}
            </span>
          ))}
        </div>

        <div className="studio-cursor-actions">
          <button type="button" role="menuitem" onClick={() => run(onReset)}>
            Reset to world origin
          </button>
          <button
            type="button"
            role="menuitem"
            disabled={!canSnap}
            title={canSnap ? undefined : "Select an object first"}
            onClick={() => run(onToSelection)}
          >
            Move to selection
          </button>
          <button type="button" role="menuitem" onClick={() => run(onToView)}>
            Move to view center
          </button>
        </div>

        <span className="view-label">Display</span>
        <button
          type="button"
          role="menuitemcheckbox"
          aria-checked={visible}
          className="view-switch"
          onClick={onToggleVisible}
        >
          <span>Show 3D cursor</span>
          <i className={visible ? "is-on" : ""} />
        </button>

        <p className="studio-cursor-note">
          Right-click the scene to place it, or hold left click for 3 seconds. New
          models appear at the cursor.
        </p>
      </div>
    </div>
  );
}

CursorMenu.propTypes = {
  cursor: PropTypes.arrayOf(PropTypes.number).isRequired,
  visible: PropTypes.bool.isRequired,
  canSnap: PropTypes.bool,
  onReset: PropTypes.func.isRequired,
  onToSelection: PropTypes.func.isRequired,
  onToView: PropTypes.func.isRequired,
  onToggleVisible: PropTypes.func.isRequired,
};
