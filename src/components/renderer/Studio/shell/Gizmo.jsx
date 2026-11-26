import { GizmoHelper, GizmoViewport } from "@react-three/drei";
import PropTypes from "prop-types";
import useMediaQuery from "./useMediaQuery";

/**
 * Axis widget. Sits clear of the docked scene panel on desktop and slides into
 * the bottom-left corner once that panel is hidden; on small screens the panel
 * is a bottom sheet, so the widget always keeps a little breathing room.
 */
export default function Gizmo({ leftPanelOpen = true }) {
  const compact = useMediaQuery("(max-width: 760px)");
  const margin = compact ? [64, 64] : leftPanelOpen ? [334, 86] : [40, 40];
  return (
    <GizmoHelper alignment="bottom-left" margin={margin}>
      <GizmoViewport axisColors={["red", "green", "black"]} labelColor="white" />
    </GizmoHelper>
  );
}

Gizmo.propTypes = {
  leftPanelOpen: PropTypes.bool,
};
