import * as THREE from "three";
import { TessellateModifier } from "three/examples/jsm/modifiers/TessellateModifier.js";
import { clone as cloneSkeleton } from "three/examples/jsm/utils/SkeletonUtils.js";
import {
  ADDITION,
  Brush,
  Evaluator,
  INTERSECTION,
  SUBTRACTION,
} from "three-bvh-csg";

/** Real meshes of an object (lights, markers and helper parts excluded). */
export function collectMeshes(object) {
  const meshes = [];
  object?.traverse?.((node) => {
    if (node.isMesh && node.userData?.studioHelper !== true) meshes.push(node);
  });
  return meshes;
}

/**
 * Pushes every vertex along its normal. On an open shape this thickens it; on a
 * closed shape it is the standard push/pull extrude used by modellers.
 */
export function extrudeGeometry(mesh, amount) {
  const value = Number(amount);
  if (!mesh?.geometry || !Number.isFinite(value) || value === 0) return mesh;
  const geometry = mesh.geometry;
  if (!geometry.attributes.normal) geometry.computeVertexNormals();
  const position = geometry.attributes.position;
  const normal = geometry.attributes.normal;
  for (let index = 0; index < position.count; index += 1) {
    position.setXYZ(
      index,
      position.getX(index) + normal.getX(index) * value,
      position.getY(index) + normal.getY(index) * value,
      position.getZ(index) + normal.getZ(index) * value
    );
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return mesh;
}

/** Recomputes smooth vertex normals after an edit. */
export function smoothMesh(mesh) {
  const geometry = mesh?.geometry;
  if (!geometry) return mesh;
  geometry.deleteAttribute("normal");
  geometry.computeVertexNormals();
  if (mesh.material && "flatShading" in mesh.material) {
    mesh.material.flatShading = false;
    mesh.material.needsUpdate = true;
  }
  return mesh;
}

/** Splits long edges so the surface can take finer edits. */
export function subdivideMesh(mesh) {
  const geometry = mesh?.geometry;
  if (!geometry) return mesh;
  try {
    const modifier = new TessellateModifier(0.4, 6);
    const next = modifier.modify(geometry.clone());
    geometry.dispose();
    mesh.geometry = next;
  } catch {
    return mesh;
  }
  return mesh;
}

/** Mirrors the object on one axis (negative scale flips the winding safely). */
export function mirrorMesh(mesh, axis) {
  if (!mesh?.scale || !["x", "y", "z"].includes(axis)) return mesh;
  mesh.scale[axis] *= -1;
  return mesh;
}

/** Drops the object onto the ground plane wherever its bounds currently are. */
export function dropToGround(object) {
  if (!object) return object;
  object.updateWorldMatrix(true, false);
  const box = new THREE.Box3().setFromObject(object);
  if (box.isEmpty()) return object;
  object.position.y -= box.min.y;
  object.updateMatrixWorld(true);
  return object;
}

/** Deep clone that keeps skinned meshes bound to their bones. */
export function duplicateObject(object) {
  if (!object) return null;
  const clone = cloneSkeleton(object);
  clone.name = `${object.name || object.type} copy`;
  clone.position.copy(object.position);
  clone.quaternion.copy(object.quaternion);
  clone.scale.copy(object.scale);
  return clone;
}

const OPERATIONS = {
  union: ADDITION,
  subtract: SUBTRACTION,
  intersect: INTERSECTION,
};

/**
 * Combines real meshes with three-bvh-csg and returns one new mesh in world
 * space. Union merges every mesh, subtract cuts the followers out of the first
 * (primary) mesh, intersect keeps only the overlap.
 */
export function booleanMeshes(meshes, operation = "union") {
  const list = meshes.filter((mesh) => mesh?.isMesh && !mesh.userData?.studioHelper);
  if (list.length < 2) return null;
  const op = OPERATIONS[operation];
  if (op === undefined) return null;

  const evaluator = new Evaluator();
  evaluator.attributes = ["position", "normal"];
  evaluator.useGroups = false;

  const brushes = list.map((mesh) => {
    mesh.updateWorldMatrix(true, false);
    const brush = new Brush(mesh.geometry.clone());
    brush.applyMatrix4(mesh.matrixWorld);
    brush.updateMatrixWorld(true);
    return brush;
  });

  let result = brushes[0];
  for (let index = 1; index < brushes.length; index += 1) {
    result = evaluator.evaluate(result, brushes[index], op);
  }

  const geometry = result.geometry.clone();
  if (!geometry.attributes.position?.count) return null;
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();

  const source = list[0].material;
  const material = Array.isArray(source)
    ? source[0]?.clone?.() || new THREE.MeshStandardMaterial()
    : source?.clone?.() || new THREE.MeshStandardMaterial();
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = `${operation === "union" ? "Union" : operation === "subtract" ? "Subtract" : "Intersection"} mesh`;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData = { ...mesh.userData, studioKind: "mesh" };
  brushes.forEach((brush) => brush.geometry.dispose());
  return mesh;
}

export const BOOLEAN_LABELS = {
  union: "Union",
  subtract: "Subtract",
  intersect: "Intersect",
};
