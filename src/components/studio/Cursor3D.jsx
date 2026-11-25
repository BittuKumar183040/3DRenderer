import { useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import * as THREE from "three";

const RADIUS = 0.55;
const SEGMENTS = 84;
const RED = new THREE.Color("#e2493d");
const WHITE = new THREE.Color("#ffffff");

/** Red/white dashed ring plus crosshair, like the 3D cursor of a DCC tool. */
export default function Cursor3D({ position, visible }) {
  const geometry = useMemo(() => {
    const points = [];
    const colors = [];

    const push = (ax, ay, az, bx, by, bz, color) => {
      points.push(ax, ay, az, bx, by, bz);
      colors.push(color.r, color.g, color.b, color.r, color.g, color.b);
    };

    for (let index = 0; index < SEGMENTS; index += 1) {
      const start = (index / SEGMENTS) * Math.PI * 2;
      const end = ((index + 1) / SEGMENTS) * Math.PI * 2;
      push(
        Math.cos(start) * RADIUS,
        0,
        Math.sin(start) * RADIUS,
        Math.cos(end) * RADIUS,
        0,
        Math.sin(end) * RADIUS,
        Math.floor(index / 7) % 2 === 0 ? RED : WHITE
      );
    }

    const outer = RADIUS + 0.5;
    const inner = RADIUS + 0.14;
    [
      [outer, 0, 0, inner, 0, 0],
      [-outer, 0, 0, -inner, 0, 0],
      [0, 0, outer, 0, 0, inner],
      [0, 0, -outer, 0, 0, -inner],
      [0, 0, 0, 0, RADIUS + 0.45, 0],
    ].forEach((line, index) => {
      push(...line, index === 4 ? WHITE : RED);
    });

    const buffer = new THREE.BufferGeometry();
    buffer.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
    buffer.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    return buffer;
  }, []);

  useEffect(() => () => geometry.dispose(), [geometry]);

  if (!visible) return null;

  return (
    <group
      position={position}
      name="3D cursor"
      userData={{ studioSkipRay: true }}
      renderOrder={999}
    >
      <lineSegments geometry={geometry} frustumCulled={false}>
        <lineBasicMaterial vertexColors depthTest={false} transparent opacity={0.95} />
      </lineSegments>
    </group>
  );
}

Cursor3D.propTypes = {
  position: PropTypes.arrayOf(PropTypes.number).isRequired,
  visible: PropTypes.bool,
};
