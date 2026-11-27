import * as THREE from "three";
import { settleGeometry } from "./primitives";

/**
 * Curve presets for the studio. Each one is swept into a thin tube mesh so it
 * keeps the usual selection, material and export behaviour of a mesh. The
 * control points stay editable from the inspector, so a curve can be reshaped
 * or extended after it has been placed.
 */
export const CURVES = [
  { key: "bezier", label: "Bezier" },
  { key: "helix", label: "Helix" },
  { key: "wave", label: "Wave" },
  { key: "circle", label: "Circle" },
];

export const CURVE_FIELDS = {
  bezier: [
    { key: "c1x", label: "Control 1 X", value: -0.4, min: -6, max: 6, step: 0.1 },
    { key: "c1y", label: "Control 1 Y", value: 2.1, min: -6, max: 6, step: 0.1 },
    { key: "c1z", label: "Control 1 Z", value: -0.5, min: -6, max: 6, step: 0.1 },
    { key: "c2x", label: "Control 2 X", value: 0.5, min: -6, max: 6, step: 0.1 },
    { key: "c2y", label: "Control 2 Y", value: 0.1, min: -6, max: 6, step: 0.1 },
    { key: "c2z", label: "Control 2 Z", value: 0.4, min: -6, max: 6, step: 0.1 },
    { key: "tube", label: "Thickness", value: 0.06, min: 0.01, max: 0.4, step: 0.01 },
  ],
  helix: [
    { key: "radius", label: "Radius", value: 0.8, min: 0.05, max: 6, step: 0.05 },
    { key: "height", label: "Height", value: 2.2, min: 0.1, max: 12, step: 0.1 },
    { key: "turns", label: "Turns", value: 2.4, min: 0.25, max: 12, step: 0.1 },
    { key: "tube", label: "Thickness", value: 0.06, min: 0.01, max: 0.4, step: 0.01 },
  ],
  wave: [
    { key: "length", label: "Length", value: 3, min: 0.2, max: 16, step: 0.1 },
    { key: "amplitude", label: "Amplitude", value: 0.5, min: 0, max: 4, step: 0.05 },
    { key: "frequency", label: "Waves", value: 2, min: 0.25, max: 12, step: 0.25 },
    { key: "tube", label: "Thickness", value: 0.06, min: 0.01, max: 0.4, step: 0.01 },
  ],
  circle: [
    { key: "radius", label: "Radius", value: 1.05, min: 0.05, max: 8, step: 0.05 },
    { key: "tube", label: "Thickness", value: 0.06, min: 0.01, max: 0.4, step: 0.01 },
  ],
};

export function normalizeCurveParams(key, params = {}) {
  const fields = CURVE_FIELDS[key] || CURVE_FIELDS.bezier;
  const next = {};
  fields.forEach((field) => {
    let value = Number(params[field.key]);
    if (!Number.isFinite(value)) value = field.value;
    if (field.min !== undefined) value = Math.max(field.min, value);
    if (field.max !== undefined) value = Math.min(field.max, value);
    next[field.key] = value;
  });
  return next;
}

export const defaultCurveParams = (key) => normalizeCurveParams(key, {});

function pathFor(key, p) {
  switch (key) {
    case "helix": {
      const points = [];
      const steps = Math.max(64, Math.round(p.turns * 40));
      for (let index = 0; index <= steps; index += 1) {
        const t = index / steps;
        const angle = t * Math.PI * 2 * p.turns;
        points.push(
          new THREE.Vector3(
            Math.cos(angle) * p.radius,
            t * p.height,
            Math.sin(angle) * p.radius
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
        const x = -p.length / 2 + t * p.length;
        points.push(
          new THREE.Vector3(
            x,
            p.amplitude + Math.sin(t * Math.PI * 2 * p.frequency) * p.amplitude,
            0
          )
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
          new THREE.Vector3(Math.cos(angle) * p.radius, Math.sin(angle) * p.radius, 0)
        );
      }
      return { curve: new THREE.CatmullRomCurve3(points, true), closed: true };
    }
    case "bezier":
    default:
      return {
        curve: new THREE.CubicBezierCurve3(
          new THREE.Vector3(-1.3, 0, -0.9),
          new THREE.Vector3(p.c1x, p.c1y, p.c1z),
          new THREE.Vector3(p.c2x, p.c2y, p.c2z),
          new THREE.Vector3(1.3, 1.2, 0.9)
        ),
        closed: false,
      };
  }
}

function tubeGeometry(key, params) {
  const p = normalizeCurveParams(key, params);
  const { curve, closed } = pathFor(key, p);
  const geometry = new THREE.TubeGeometry(curve, 160, p.tube, 10, closed);
  return settleGeometry(geometry);
}

/** Builds one curve as a named tube mesh resting on the ground plane. */
export function createCurve(key, params) {
  const item = CURVES.find((entry) => entry.key === key) || CURVES[0];
  const values = normalizeCurveParams(item.key, params);
  const geometry = tubeGeometry(item.key, values);
  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({
      color: "#b4aee6",
      roughness: 0.45,
      metalness: 0.08,
    })
  );
  mesh.name = `${item.label} curve`;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData = {
    ...mesh.userData,
    studioCurve: { key: item.key, params: values },
    studioKind: "curve",
  };
  return mesh;
}

/** Rebuilds a curve's tube from new control values, in place. */
export function reshapeCurve(mesh, params) {
  const stored = mesh.userData?.studioCurve;
  if (!stored) return mesh;
  const next = normalizeCurveParams(stored.key, params);
  const geometry = tubeGeometry(stored.key, next);
  mesh.geometry.dispose();
  mesh.geometry = geometry;
  mesh.userData.studioCurve = { key: stored.key, params: next };
  return mesh;
}
