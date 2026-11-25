import * as THREE from "three";

/**
 * Basic meshes that can be dropped into a scene without loading a file. Every
 * shape is built around the origin, scaled to a common size and rested on the
 * ground plane so it lines up with imported models.
 */
export const PRIMITIVES = [
  { key: "cube", label: "Cube" },
  { key: "sphere", label: "Sphere" },
  { key: "cylinder", label: "Cylinder" },
  { key: "cone", label: "Cone" },
  { key: "capsule", label: "Capsule" },
  { key: "torus", label: "Torus" },
  { key: "knot", label: "Knot" },
  { key: "plane", label: "Plane" },
];

const SIZE = 1.6;

function geometryFor(key) {
  switch (key) {
    case "sphere":
      return new THREE.SphereGeometry(0.7, 32, 24);
    case "cylinder":
      return new THREE.CylinderGeometry(0.55, 0.55, 1.2, 32);
    case "cone":
      return new THREE.ConeGeometry(0.62, 1.2, 32);
    case "capsule":
      return new THREE.CapsuleGeometry(0.45, 0.7, 10, 20);
    case "torus":
      return new THREE.TorusGeometry(0.62, 0.22, 18, 48);
    case "knot":
      return new THREE.TorusKnotGeometry(0.5, 0.16, 96, 14);
    case "plane": {
      const plane = new THREE.PlaneGeometry(1.4, 1.4);
      plane.rotateX(-Math.PI / 2);
      return plane;
    }
    case "cube":
    default:
      return new THREE.BoxGeometry(1.1, 1.1, 1.1);
  }
}

/** Builds one primitive as a named group with the mesh resting on y=0. */
export function createPrimitive(key) {
  const item = PRIMITIVES.find((entry) => entry.key === key) || PRIMITIVES[0];
  const geometry = geometryFor(item.key);
  const material = new THREE.MeshStandardMaterial({
    color: "#b4aee6",
    roughness: 0.5,
    metalness: 0.05,
    side: item.key === "plane" ? THREE.DoubleSide : THREE.FrontSide,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = item.label;

  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  const extent = box.getSize(new THREE.Vector3());
  const scale = SIZE / (Math.max(extent.x, extent.y, extent.z) || 1);
  mesh.scale.setScalar(scale);
  mesh.position.set(
    -((box.min.x + box.max.x) / 2) * scale,
    -box.min.y * scale,
    -((box.min.z + box.max.z) / 2) * scale
  );

  const group = new THREE.Group();
  group.name = item.label;
  group.add(mesh);
  return group;
}
