import * as THREE from "three";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { settleGeometry } from "./primitives";

/**
 * 3D text faces available in the studio. Each family is a Google font that has
 * been converted to three's typeface format at build time (see
 * scripts/build-studio-fonts.mjs), so changing the font needs no network call
 * at runtime and the text stays a real extruded mesh.
 */
export const TEXT_FONTS = [
  { key: "roboto", label: "Roboto", bold: true },
  { key: "montserrat", label: "Montserrat", bold: true },
  { key: "oswald", label: "Oswald", bold: true },
  { key: "spacegrotesk", label: "Space Grotesk", bold: true },
  { key: "playfairdisplay", label: "Playfair Display", bold: true },
  { key: "bebasneue", label: "Bebas Neue", bold: false },
  { key: "lobster", label: "Lobster", bold: false },
  { key: "pacifico", label: "Pacifico", bold: false },
];

export const TEXT_FONT_KEYS = TEXT_FONTS.map((font) => font.key);

const LOADERS = {
  roboto: () => import("./fonts/roboto.json"),
  "roboto-bold": () => import("./fonts/roboto-bold.json"),
  montserrat: () => import("./fonts/montserrat.json"),
  "montserrat-bold": () => import("./fonts/montserrat-bold.json"),
  oswald: () => import("./fonts/oswald.json"),
  "oswald-bold": () => import("./fonts/oswald-bold.json"),
  spacegrotesk: () => import("./fonts/spacegrotesk.json"),
  "spacegrotesk-bold": () => import("./fonts/spacegrotesk-bold.json"),
  playfairdisplay: () => import("./fonts/playfairdisplay.json"),
  "playfairdisplay-bold": () => import("./fonts/playfairdisplay-bold.json"),
  bebasneue: () => import("./fonts/bebasneue.json"),
  lobster: () => import("./fonts/lobster.json"),
  pacifico: () => import("./fonts/pacifico.json"),
};

const cache = new Map();

async function fontFor(fontKey, bold) {
  const family = TEXT_FONTS.find((entry) => entry.key === fontKey) || TEXT_FONTS[0];
  const key = bold && family.bold ? `${family.key}-bold` : family.key;
  const loader = LOADERS[key] || LOADERS[family.key] || LOADERS.roboto;
  if (!cache.has(key)) {
    const request = loader()
      .then((module) => new FontLoader().parse(module.default || module))
      .catch((error) => {
        cache.delete(key);
        throw error;
      });
    cache.set(key, request);
  }
  return cache.get(key);
}

export const TEXT_DEFAULTS = {
  value: "Text",
  font: "roboto",
  bold: false,
  italic: false,
  underline: false,
  size: 0.9,
  depth: 0.2,
  curveSegments: 6,
  bevel: 0.02,
};

/** Accepts a bare string (older insertions) or a full options object. */
export function normalizeTextParams(options) {
  const source =
    typeof options === "string" ? { value: options } : options && typeof options === "object" ? options : {};
  const value = String(source.value ?? TEXT_DEFAULTS.value).slice(0, 120) || "Text";
  const font = TEXT_FONT_KEYS.includes(source.font) ? source.font : TEXT_DEFAULTS.font;
  const clamp = (input, min, max, fallback) => {
    const number = Number(input);
    if (!Number.isFinite(number)) return fallback;
    return Math.min(max, Math.max(min, number));
  };
  return {
    value,
    font,
    bold: Boolean(source.bold),
    italic: Boolean(source.italic),
    underline: Boolean(source.underline),
    size: clamp(source.size, 0.1, 6, TEXT_DEFAULTS.size),
    depth: clamp(source.depth, 0.01, 2, TEXT_DEFAULTS.depth),
    curveSegments: Math.round(
      clamp(source.curveSegments, 1, 24, TEXT_DEFAULTS.curveSegments)
    ),
    bevel: clamp(source.bevel, 0, 0.2, TEXT_DEFAULTS.bevel),
  };
}

async function buildGeometry(params) {
  const font = await fontFor(params.font, params.bold);
  const geometry = new TextGeometry(params.value, {
    font,
    size: params.size,
    depth: params.depth,
    curveSegments: params.curveSegments,
    bevelEnabled: params.bevel > 0,
    bevelThickness: params.bevel,
    bevelSize: params.bevel * 0.6,
    bevelSegments: 2,
  });
  // Italic is a shear of the whole shape: every face of the font list can slant
  // without shipping a second italic typeface.
  if (params.italic) {
    geometry.applyMatrix4(new THREE.Matrix4().makeShear(0.22, 0, 0, 0, 0, 0));
  }
  settleGeometry(geometry);
  geometry.computeVertexNormals();
  return geometry;
}

/** Draws the optional underline rule under the text, sized to its bounds. */
function syncUnderline(mesh, params) {
  const existing = mesh.children.find((child) => child.userData?.studioUnderline);
  if (existing) {
    mesh.remove(existing);
    existing.geometry.dispose();
    existing.material.dispose();
  }
  if (!params.underline) return;
  mesh.geometry.computeBoundingBox();
  const box = mesh.geometry.boundingBox;
  const width = box ? box.max.x - box.min.x : params.size * params.value.length;
  const depth = box ? Math.max(box.max.z - box.min.z, params.depth) : params.depth;
  const underline = new THREE.Mesh(
    new THREE.BoxGeometry(width, 0.035, depth * 0.5),
    new THREE.MeshStandardMaterial({ color: "#5a5d70", roughness: 0.55 })
  );
  underline.name = "Underline";
  underline.position.set(0, 0.02, depth * 0.25);
  underline.castShadow = true;
  underline.userData = { studioUnderline: true, studioHelper: true };
  mesh.add(underline);
}

/**
 * Builds a 3D text object for the studio. The mesh is centred in X/Z and its
 * baseline rests on y=0, so it sits on the grid like every other object.
 */
export async function createText(options = "Text") {
  const params = normalizeTextParams(options);
  const geometry = await buildGeometry(params);
  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({ color: "#5a5d70", roughness: 0.55, metalness: 0.05 })
  );
  mesh.name = params.value;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData = {
    ...mesh.userData,
    studioText: params,
    studioKind: "text",
  };
  syncUnderline(mesh, params);
  return mesh;
}

/** Rebuilds the letters (and underline) in place after an inspector edit. */
export async function rebuildText(mesh, options) {
  const stored = mesh.userData?.studioText || {};
  const params = normalizeTextParams({ ...stored, ...options });
  const geometry = await buildGeometry(params);
  mesh.geometry.dispose();
  mesh.geometry = geometry;
  mesh.userData.studioText = params;
  syncUnderline(mesh, params);
  return mesh;
}

/** Preloads one family so a font change feels instant. */
export function preloadTypeface(fontKey, bold = false) {
  return fontFor(fontKey, bold).catch(() => null);
}
