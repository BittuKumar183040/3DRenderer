import * as THREE from "three";

/**
 * Basic meshes that can be dropped into a scene without loading a file. Every
 * shape is built around the origin, centred in X/Z and rested on the ground
 * plane so it lines up with imported models.
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

/**
 * Per-shape creation parameters. The add-mesh dialog and the inspector both
 * render these fields, so a shape can be created with the right dimensions and
 * re-shaped later without starting over.
 */
export const PRIMITIVE_FIELDS = {
  cube: [
    { key: "width", label: "Width", value: 1.4, min: 0.05, step: 0.05 },
    { key: "height", label: "Height", value: 1.4, min: 0.05, step: 0.05 },
    { key: "depth", label: "Length", value: 1.4, min: 0.05, step: 0.05 },
  ],
  sphere: [
    { key: "radius", label: "Radius", value: 0.8, min: 0.05, step: 0.05 },
    { key: "widthSegments", label: "Segments", value: 32, min: 3, max: 96, step: 1, integer: true },
    { key: "heightSegments", label: "Rings", value: 24, min: 2, max: 64, step: 1, integer: true },
  ],
  cylinder: [
    { key: "radiusTop", label: "Top radius", value: 0.7, min: 0, step: 0.05 },
    { key: "radiusBottom", label: "Base radius", value: 0.7, min: 0, step: 0.05 },
    { key: "height", label: "Height", value: 1.8, min: 0.05, step: 0.05 },
    { key: "radialSegments", label: "Sides", value: 32, min: 3, max: 128, step: 1, integer: true },
  ],
  cone: [
    { key: "radius", label: "Radius", value: 0.8, min: 0.01, step: 0.05 },
    { key: "height", label: "Height", value: 1.8, min: 0.05, step: 0.05 },
    { key: "radialSegments", label: "Sides", value: 32, min: 3, max: 128, step: 1, integer: true },
  ],
  capsule: [
    { key: "radius", label: "Radius", value: 0.5, min: 0.05, step: 0.05 },
    { key: "length", label: "Height", value: 1, min: 0.05, step: 0.05 },
    { key: "capSegments", label: "Cap segments", value: 8, min: 1, max: 32, step: 1, integer: true },
    { key: "radialSegments", label: "Sides", value: 20, min: 4, max: 64, step: 1, integer: true },
  ],
  torus: [
    { key: "radius", label: "Radius", value: 0.8, min: 0.05, step: 0.05 },
    { key: "tube", label: "Thickness", value: 0.28, min: 0.01, step: 0.01 },
    { key: "radialSegments", label: "Sides", value: 18, min: 3, max: 64, step: 1, integer: true },
    { key: "tubularSegments", label: "Segments", value: 48, min: 8, max: 256, step: 1, integer: true },
  ],
  knot: [
    { key: "radius", label: "Radius", value: 0.7, min: 0.05, step: 0.05 },
    { key: "tube", label: "Thickness", value: 0.22, min: 0.01, step: 0.01 },
    { key: "p", label: "P", value: 2, min: 1, max: 12, step: 1, integer: true },
    { key: "q", label: "Q", value: 3, min: 1, max: 12, step: 1, integer: true },
  ],
  plane: [
    { key: "width", label: "Width", value: 2.2, min: 0.05, step: 0.05 },
    { key: "height", label: "Height", value: 2.2, min: 0.05, step: 0.05 },
    { key: "widthSegments", label: "Columns", value: 1, min: 1, max: 64, step: 1, integer: true },
    { key: "heightSegments", label: "Rows", value: 1, min: 1, max: 64, step: 1, integer: true },
  ],
};

/** Clamps and rounds the values coming from a form/dialog. */
export function normalizeParams(key, params = {}) {
  const fields = PRIMITIVE_FIELDS[key] || PRIMITIVE_FIELDS.cube;
  const next = {};
  fields.forEach((field) => {
    const raw = params[field.key];
    let value = Number(raw);
    if (!Number.isFinite(value)) value = field.value;
    if (field.integer) value = Math.round(value);
    if (field.min !== undefined) value = Math.max(field.min, value);
    if (field.max !== undefined) value = Math.min(field.max, value);
    next[field.key] = value;
  });
  return next;
}

export const defaultPrimitiveParams = (key) => normalizeParams(key, {});

function geometryFor(key, p) {
  switch (key) {
    case "sphere":
      return new THREE.SphereGeometry(p.radius, p.widthSegments, p.heightSegments);
    case "cylinder":
      return new THREE.CylinderGeometry(
        p.radiusTop,
        p.radiusBottom,
        p.height,
        p.radialSegments
      );
    case "cone":
      return new THREE.ConeGeometry(p.radius, p.height, p.radialSegments);
    case "capsule":
      return new THREE.CapsuleGeometry(p.radius, p.length, p.capSegments, p.radialSegments);
    case "torus":
      return new THREE.TorusGeometry(p.radius, p.tube, p.radialSegments, p.tubularSegments);
    case "knot":
      return new THREE.TorusKnotGeometry(
        p.radius,
        p.tube,
        96,
        p.radialSegments,
        p.p,
        p.q
      );
    case "plane": {
      const plane = new THREE.PlaneGeometry(
        p.width,
        p.height,
        p.widthSegments,
        p.heightSegments
      );
      plane.rotateX(-Math.PI / 2);
      return plane;
    }
    case "cube":
    default:
      return new THREE.BoxGeometry(p.width, p.height, p.depth);
  }
}

/** Centres a geometry in X/Z and rests its lowest point on y=0. */
export function settleGeometry(geometry) {
  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  if (!box) return geometry;
  geometry.translate(
    -((box.min.x + box.max.x) / 2),
    -box.min.y,
    -((box.min.z + box.max.z) / 2)
  );
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

/** Swaps a primitive's geometry in place, keeping material, name and transform. */
export function reshapePrimitive(mesh, params) {
  const stored = mesh.userData?.studioPrimitive;
  if (!stored) return mesh;
  const next = normalizeParams(stored.key, params);
  const geometry = settleGeometry(geometryFor(stored.key, next));
  mesh.geometry.dispose();
  mesh.geometry = geometry;
  mesh.userData.studioPrimitive = { key: stored.key, params: next };
  return mesh;
}

/** Builds one primitive as a named mesh resting on y=0. */
export function createPrimitive(key, params) {
  const item = PRIMITIVES.find((entry) => entry.key === key) || PRIMITIVES[0];
  const values = normalizeParams(item.key, params);
  const geometry = settleGeometry(geometryFor(item.key, values));
  const material = new THREE.MeshStandardMaterial({
    color: "#b4aee6",
    roughness: 0.5,
    metalness: 0.05,
    side: item.key === "plane" ? THREE.DoubleSide : THREE.FrontSide,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = item.label;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData = {
    ...mesh.userData,
    studioPrimitive: { key: item.key, params: values },
    studioKind: "mesh",
  };
  return mesh;
}
