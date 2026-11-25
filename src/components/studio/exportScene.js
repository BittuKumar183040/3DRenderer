import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { OBJExporter } from "three/examples/jsm/exporters/OBJExporter.js";
import { PLYExporter } from "three/examples/jsm/exporters/PLYExporter.js";
import { STLExporter } from "three/examples/jsm/exporters/STLExporter.js";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";

/**
 * File formats the studio can write. GLB/GLTF keep materials and textures;
 * OBJ/STL/PLY export geometry only.
 */
export const EXPORT_FORMATS = [
  { id: "glb", label: "GLB", title: "Binary glTF — geometry, materials, textures", mime: "model/gltf-binary" },
  { id: "gltf", label: "GLTF", title: "glTF JSON — geometry, materials, textures", mime: "model/gltf+json" },
  { id: "obj", label: "OBJ", title: "Wavefront OBJ — geometry only", mime: "text/plain" },
  { id: "stl", label: "STL", title: "Binary STL — geometry only", mime: "model/stl" },
  { id: "ply", label: "PLY", title: "Binary PLY — geometry only", mime: "application/octet-stream" },
];

const SLUG = /[^a-z0-9-_]+/gi;

export const slug = (name) => {
  const value = String(name || "studio")
    .replace(/\.[^.]+$/, "")
    .replace(SLUG, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  return value || "studio";
};

/** Saves a blob as a file through a temporary anchor. */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = filename;
  link.href = url;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Clone for writing to a file: keeps skinned meshes bound to their bones and
 * bakes the object's world transform so the exported file does not depend on
 * the scene hierarchy it was placed in.
 */
function cloneForExport(source) {
  if (!source) return null;
  const clone = cloneSkinned(source);
  source.updateWorldMatrix(true, false);
  source.matrixWorld.decompose(clone.position, clone.quaternion, clone.scale);
  clone.updateMatrixWorld(true);
  return clone;
}

/** Groups and writes the supplied scene objects in the requested format. */
export async function exportObjects(objects, format, name = "studio") {
  const list = objects.filter(Boolean);
  if (!list.length) throw new Error("nothing to export");

  const root = new THREE.Group();
  root.name = name || "studio";
  list.forEach((object) => {
    const clone = cloneForExport(object);
    if (clone) root.add(clone);
  });
  if (!root.children.length) throw new Error("nothing to export");

  const base = slug(name);
  const option = EXPORT_FORMATS.find((item) => item.id === format);
  if (!option) throw new Error(`${format} is not an export format`);

  let blob;
  let extension = format;

  if (format === "glb" || format === "gltf") {
    const binary = format === "glb";
    const result = await new GLTFExporter().parseAsync(root, {
      binary,
      onlyVisible: false,
    });
    if (binary) {
      blob = new Blob([result], { type: option.mime });
    } else {
      blob = new Blob([JSON.stringify(result, null, 2)], { type: option.mime });
      extension = "gltf";
    }
  } else if (format === "obj") {
    blob = new Blob([new OBJExporter().parse(root)], { type: option.mime });
  } else if (format === "stl") {
    blob = new Blob([new STLExporter().parse(root, { binary: true })], {
      type: option.mime,
    });
  } else {
    const data = await new Promise((resolve, reject) => {
      try {
        new PLYExporter().parse(root, resolve, { binary: true });
      } catch (error) {
        reject(error);
      }
    });
    blob = new Blob([data], { type: option.mime });
  }

  const filename = `${base}.${extension}`;
  downloadBlob(blob, filename);
  return filename;
}

/** Saves the current viewport exactly as framed, as a PNG. */
export function captureViewport(name = "studio") {
  const canvas =
    document.querySelector(".studio-page canvas") ||
    document.querySelector(".studio-shell canvas");
  if (!canvas) throw new Error("no viewport to capture");
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("the viewport could not be captured"));
        return;
      }
      const filename = `${slug(name)}-view.png`;
      downloadBlob(blob, filename);
      resolve(filename);
    }, "image/png");
  });
}
