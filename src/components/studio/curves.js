import * as THREE from "three";

/**
 * Curve presets for the studio. Each one is swept into a thin tube mesh so it
 * keeps the usual selection, material and export behaviour of a mesh.
 */
export const CURVES = [
  { key: "bezier", label: "Bezier" },
  { key: "helix", label: "Helix" },
  { key: "wave", label: "Wave" },
  { key: "circle", label: "Circle" },
];

function pathFor(key) {
  switch (key) {
    case "helix": {
      const points = [];
      const turns = 2.4;
      const steps = 96;
      for (let index = 0; index <= steps; index += 1) {
        const t = index / steps;
        const angle = t * Math.PI * 2 * turns;
        points.push(
          new THREE.Vector3(
            Math.cos(angle) * 0.8,
            t * 2.2,
            Math.sin(angle) * 0.8
          )
        );
      }
      return { curve: new THREE.CatmullRomCurve3(points), closed: false };
    }
    case "wave": {
      const points = [];
      const steps = 96;
      for (let index = 0; index <= steps; index += 1) {
        const t = index / steps;
        const x = -1.5 + t * 3;
        points.push(
          new THREE.Vector3(x, 0.55 + Math.sin(t * Math.PI * 4) * 0.5, 0)
        );
      }
      return { curve: new THREE.CatmullRomCurve3(points), closed: false };
    }
    case "circle": {
      const points = [];
      const steps = 80;
      for (let index = 0; index < steps; index += 1) {
        const angle = (index / steps) * Math.PI * 2;
        points.push(
          new THREE.Vector3(Math.cos(angle) * 1.05, Math.sin(angle) * 1.05, 0)
        );
      }
      return { curve: new THREE.CatmullRomCurve3(points, true), closed: true };
    }
    case "bezier":
    default:
      return {
        curve: new THREE.CubicBezierCurve3(
          new THREE.Vector3(-1.3, 0, -0.9),
          new THREE.Vector3(-0.4, 2.1, -0.5),
          new THREE.Vector3(0.5, 0.1, 0.4),
          new THREE.Vector3(1.3, 1.2, 0.9)
        ),
        closed: false,
      };
  }
}

/** Builds one curve as a named group resting on the ground plane. */
export function createCurve(key) {
  const item = CURVES.find((entry) => entry.key === key) || CURVES[0];
  const { curve, closed } = pathFor(item.key);
  const geometry = new THREE.TubeGeometry(curve, 128, 0.06, 10, closed);
  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  geometry.translate(
    -((box.min.x + box.max.x) / 2),
    -box.min.y,
    -((box.min.z + box.max.z) / 2)
  );

  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({
      color: "#b4aee6",
      roughness: 0.45,
      metalness: 0.08,
    })
  );
  mesh.name = `${item.label} tube`;

  const group = new THREE.Group();
  group.name = `${item.label} curve`;
  group.add(mesh);
  return group;
}
