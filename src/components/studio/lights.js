import * as THREE from "three";

/**
 * Lamps that can be dropped into a scene. Each one is a small group with the
 * real light plus a marker sphere, so a lamp is visible in the viewport,
 * selectable in the tree and removable like any other object. The light and
 * its marker are internal helpers, so the scene tree shows the lamp as a single
 * row instead of listing every piece it is built from.
 */
export const LIGHTS = [
  { key: "point", label: "Point" },
  { key: "spot", label: "Spot" },
  { key: "sun", label: "Sun" },
  { key: "ambient", label: "Ambient" },
];

/** Internal building block: hidden from the scene tree and mesh counts. */
function helper(node) {
  node.userData = { ...node.userData, studioHelper: true };
  return node;
}

function marker(color) {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.13, 18, 12),
    new THREE.MeshBasicMaterial({ color, toneMapped: false })
  );
  mesh.name = "Light marker";
  return helper(mesh);
}

function createLightObject(key) {
  switch (key) {
    case "spot": {
      const light = new THREE.SpotLight("#fff1cf", 70, 0, Math.PI / 7, 0.4, 2);
      light.position.set(0, 3.2, 1.6);
      const group = new THREE.Group();
      group.add(helper(light));
      group.add(helper(light.target));
      light.target.position.set(0, 0, 0);
      const bulb = marker("#f7c257");
      bulb.position.copy(light.position);
      group.add(bulb);
      return { group, name: "Spot light" };
    }
    case "sun": {
      const light = new THREE.DirectionalLight("#fff8ea", 2.6);
      light.position.set(1.8, 3.4, 2);
      const group = new THREE.Group();
      group.add(helper(light));
      group.add(helper(light.target));
      light.target.position.set(0, 0, 0);
      const bulb = marker("#ffe3a1");
      bulb.position.copy(light.position);
      group.add(bulb);
      return { group, name: "Sun light" };
    }
    case "ambient": {
      const light = new THREE.AmbientLight("#dfe4f5", 1.1);
      const group = new THREE.Group();
      group.add(helper(light));
      const bulb = marker("#cfd7f5");
      bulb.position.set(0, 2, 0);
      group.add(bulb);
      return { group, name: "Ambient light" };
    }
    case "point":
    default: {
      const light = new THREE.PointLight("#fff3d6", 26, 0, 2);
      light.position.set(0, 2.2, 0);
      const group = new THREE.Group();
      group.add(helper(light));
      const bulb = marker("#f7c257");
      bulb.position.copy(light.position);
      group.add(bulb);
      return { group, name: "Point light" };
    }
  }
}

/** Builds one lamp as a named group so the scene tree stays readable. */
export function createLight(key) {
  const item = LIGHTS.find((entry) => entry.key === key) || LIGHTS[0];
  const { group, name } = createLightObject(item.key);
  group.name = name;
  group.userData = { ...group.userData, studioKind: "light" };
  return group;
}
