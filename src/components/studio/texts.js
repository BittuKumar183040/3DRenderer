import * as THREE from "three";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import helvetiker from "three/examples/fonts/helvetiker_regular.typeface.json";

let font = null;

function getFont() {
  if (!font) font = new FontLoader().parse(helvetiker);
  return font;
}

/**
 * Builds a 3D text object for the studio. The mesh is centred in X/Z and its
 * baseline rests on y=0, so it sits on the grid like every other object.
 */
export function createText(value = "Text") {
  const label = String(value || "Text").slice(0, 120);
  const geometry = new TextGeometry(label, {
    font: getFont(),
    size: 0.9,
    depth: 0.2,
    curveSegments: 6,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.012,
    bevelSegments: 2,
  });
  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  geometry.translate(
    -((box.min.x + box.max.x) / 2),
    -box.min.y,
    -((box.min.z + box.max.z) / 2)
  );
  geometry.computeVertexNormals();

  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({ color: "#5a5d70", roughness: 0.55, metalness: 0.05 })
  );
  mesh.name = label;
  return mesh;
}
