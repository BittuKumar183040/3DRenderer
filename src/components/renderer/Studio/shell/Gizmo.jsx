import { GizmoHelper, GizmoViewport } from "@react-three/drei";
import useMediaQuery from "./useMediaQuery";

/**
 * Axis widget. Keeps clear of the docked scene panel on desktop while
 * collapsing back to the corner once the panel becomes a mobile sheet.
 */
export default function Gizmo() {
  const compact = useMediaQuery("(max-width: 760px)");
  return (
    <GizmoHelper alignment="bottom-left" margin={compact ? [64, 64] : [334, 86]}>
      <GizmoViewport axisColors={["red", "green", "black"]} labelColor="white" />
    </GizmoHelper>
  );
}
