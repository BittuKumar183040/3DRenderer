import * as THREE from "three";

/**
 * Lamps that can be dropped into a scene. Each one is a small group holding the
 * real light (and its target), so a lamp is one scene-tree row. Where the light
 * sits and what it points at is shown by the world-space helper overlay in the
 * viewport, not by a marker mesh baked into the object.
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

/** Sensible slider ranges per lamp type, shared with the light inspector. */
export const LIGHT_RANGES = {
  point: { max: 200, step: 1 },
  spot: { max: 300, step: 1 },
  sun: { max: 10, step: 0.1 },
  ambient: { max: 5, step: 0.05 },
};

function configureShadow(light, size = 1024) {
  light.castShadow = true;
  light.shadow.mapSize.set(size, size);
  light.shadow.bias = -0.0008;
  light.shadow.normalBias = 0.02;
  return light;
}

function createLightObject(key) {
  switch (key) {
    case "spot": {
      const light = new THREE.SpotLight("#fff1cf", 70, 0, Math.PI / 7, 0.4, 2);
      light.position.set(0, 3.2, 1.6);
      light.shadow.camera.near = 0.5;
      light.shadow.camera.far = 40;
      configureShadow(light, 1024);
      const group = new THREE.Group();
      group.add(helper(light));
      group.add(helper(light.target));
      light.target.position.set(0, 0, 0);
      group.userData = { studioLight: "spot" };
      return { group, name: "Spot light" };
    }
    case "sun": {
      const light = new THREE.DirectionalLight("#fff8ea", 2.6);
      light.position.set(2.6, 5, 3);
      light.shadow.camera.left = -9;
      light.shadow.camera.right = 9;
      light.shadow.camera.top = 9;
      light.shadow.camera.bottom = -9;
      light.shadow.camera.near = 0.5;
      light.shadow.camera.far = 40;
      configureShadow(light, 2048);
      const group = new THREE.Group();
      group.add(helper(light));
      group.add(helper(light.target));
      light.target.position.set(0, 0, 0);
      group.userData = { studioLight: "sun" };
      return { group, name: "Sun light" };
    }
    case "ambient": {
      const light = new THREE.AmbientLight("#dfe4f5", 1.1);
      const group = new THREE.Group();
      group.add(helper(light));
      group.userData = { studioLight: "ambient" };
      return { group, name: "Ambient light" };
    }
    case "point":
    default: {
      const light = new THREE.PointLight("#fff3d6", 32, 0, 2);
      light.position.set(0, 2.2, 0);
      configureShadow(light, 1024);
      const group = new THREE.Group();
      group.add(helper(light));
      group.userData = { studioLight: "point" };
      return { group, name: "Point light" };
    }
  }
}

/** Builds one lamp as a named group so the scene tree stays readable. */
export function createLight(key) {
  const item = LIGHTS.find((entry) => entry.key === key) || LIGHTS[0];
  const { group, name } = createLightObject(item.key);
  group.name = name;
  group.userData = {
    ...group.userData,
    studioKind: "light",
    studioLight: item.key,
  };
  return group;
}

/** Finds the real light inside a lamp group. */
export function lightOf(object) {
  let found = null;
  object?.traverse?.((node) => {
    if (!found && node.isLight) found = node;
  });
  return found;
}

/** Every lamp light in the scene, for the global intensity controls. */
export function sceneLights(root) {
  const list = [];
  root?.traverse?.((node) => {
    if (node.isLight && !node.isAmbientLight) list.push(node);
  });
  return list;
}
