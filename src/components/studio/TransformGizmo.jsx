import PropTypes from "prop-types";
import { TransformControls } from "@react-three/drei";

/**
 * Blender-style arrows/rings/handles attached to the current selection.
 * drei's controls disable the default OrbitControls while dragging, and report
 * drag start/end so a click on the gizmo does not clear the selection.
 */
export default function TransformGizmo({ object, mode, onBusyChange }) {
  if (!object) return null;

  const busy = () => onBusyChange?.(true);
  const idle = () => {
    // Let the pointerup click settle before the selection can be cleared.
    window.setTimeout(() => onBusyChange?.(false), 90);
  };

  return (
    <TransformControls
      object={object}
      mode={mode}
      size={0.85}
      onMouseDown={busy}
      onMouseUp={idle}
    />
  );
}

TransformGizmo.propTypes = {
  object: PropTypes.object,
  mode: PropTypes.oneOf(["translate", "rotate", "scale"]).isRequired,
  onBusyChange: PropTypes.func,
};
