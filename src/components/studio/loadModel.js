import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { PLYLoader } from "three/examples/jsm/loaders/PLYLoader.js";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";

/**
 * Every format the studio can drop into a scene. Loaders are resolved from the
 * file extension, so uploaded blob URLs keep working (they have no path).
 */
export const MODEL_FORMATS = ["glb", "gltf", "fbx", "obj", "stl", "ply", "svg"];

export const MODEL_ACCEPT = MODEL_FORMATS.map((format) => `.${format}`).join(",");

export const MODEL_LABEL = "GLB · GLTF · FBX · OBJ · STL · PLY · SVG";

/** Longest edge every inserted model is normalized to, in world units. */
export const MODEL_TARGET_SIZE = 3.6;

export const formatOf = (name = "") => {
  const match = /\.([a-z0-9]+)$/i.exec(name);
  return match ? match[1].toLowerCase() : "";
};

export const isSupportedModel = (name) => MODEL_FORMATS.includes(formatOf(name));

const cache = new Map();

function meshFromGeometry(geometry, name, { color = "#b9b4d8", vertexColors = false } = {}) {
  if (!geometry.getAttribute("normal")) geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({ color, roughness: 0.62, metalness: 0.05, vertexColors })
  );
  mesh.name = name;
  return mesh;
}

/** SVG paths become flat, double-sided shapes that face the camera. */
function svgToGroup(data) {
  const group = new THREE.Group();
  group.name = "SVG artwork";
  data.paths.forEach((path) => {
    const material = new THREE.MeshStandardMaterial({
      color: path.color || "#23252f",
      side: THREE.DoubleSide,
      roughness: 0.55,
      metalness: 0,
    });
    path.toShapes(true).forEach((shape) => {
      const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape, 16), material);
      mesh.name = `SVG shape ${group.children.length + 1}`;
      group.add(mesh);
    });
  });
  if (!group.children.length) throw new Error("the SVG has no drawable shapes");
  return group;
}

async function load(url, format) {
  switch (format) {
    case "glb":
    case "gltf": {
      const gltf = await new GLTFLoader().loadAsync(url);
      return { scene: gltf.scene, animations: gltf.animations || [] };
    }
    case "fbx": {
      const fbx = await new FBXLoader().loadAsync(url);
      return { scene: fbx, animations: fbx.animations || [] };
    }
    case "obj":
      return { scene: await new OBJLoader().loadAsync(url), animations: [] };
    case "stl":
      return {
        scene: meshFromGeometry(await new STLLoader().loadAsync(url), "STL mesh"),
        animations: [],
      };
    case "ply": {
      const geometry = await new PLYLoader().loadAsync(url);
      return {
        scene: meshFromGeometry(geometry, "PLY mesh", {
          vertexColors: geometry.hasAttribute("color"),
        }),
        animations: [],
      };
    }
    case "svg":
      return { scene: svgToGroup(await new SVGLoader().loadAsync(url)), animations: [] };
    default:
      throw new Error(`.${format} files are not supported`);
  }
}

/**
 * Loads a model once per source and format. Callers clone the returned scene
 * for every insertion, so a model can be placed many times in the same scene.
 * Animation clips travel with the load so the studio can offer playback.
 */
export function loadModel(url, format) {
  const key = `${format}:${url}`;
  if (!cache.has(key)) {
    const request = load(url, format).then((loaded) => {
      if (!loaded?.scene) throw new Error("the file did not contain a scene");
      loaded.scene.traverse?.((node) => {
        if (!node.isMesh) return;
        node.castShadow = true;
        node.receiveShadow = true;
      });
      return loaded;
    });
    request.catch(() => cache.delete(key));
    cache.set(key, request);
  }
  return cache.get(key);
}

/**
 * Scales a freshly cloned model to MODEL_TARGET_SIZE, centers it in X/Z and
 * rests it on y=0. Must run before the clone is attached to a positioned
 * parent, otherwise the measured bounds would include the parent's transform.
 */
export function normalizeModel(object) {
  object.position.set(0, 0, 0);
  object.rotation.set(0, 0, 0);
  object.scale.setScalar(1);
  object.updateMatrixWorld(true);

  const initial = new THREE.Box3().setFromObject(object);
  const size = initial.getSize(new THREE.Vector3());
  const max = Math.max(size.x, size.y, size.z) || 1;
  object.scale.setScalar(MODEL_TARGET_SIZE / max);
  object.updateMatrixWorld(true);

  const fitted = new THREE.Box3().setFromObject(object);
  object.position.set(
    -(fitted.min.x + fitted.max.x) / 2,
    -fitted.min.y,
    -(fitted.min.z + fitted.max.z) / 2
  );
  object.updateMatrixWorld(true);
  return object;
}

/** Drops a cached upload so its geometry can be collected after removal. */
export function releaseModel(url, format) {
  cache.delete(`${format}:${url}`);
}
