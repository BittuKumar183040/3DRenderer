import { useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import * as THREE from "three";
import {
  Box,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Download,
  Eye,
  EyeOff,
  Focus,
  ImagePlus,
  Layers3,
  Loader2,
  Trash2,
  X,
} from "lucide-react";
import { EXPORT_FORMATS, exportObjects } from "./exportScene";

const number = (value) => Number(Number(value).toFixed(2));

/**
 * Studio selection inspector. On top of the transform readouts it edits the
 * material, swaps in a custom texture and exports just the selected object.
 * The header can collapse the panel to a slim bar so the viewport keeps the
 * selection but gains working room.
 */
export default function SelectionPanel({
  open,
  object,
  root,
  focusApi,
  onClose,
  onNotice,
}) {
  const [, refresh] = useState(0);
  const [collapsed, setCollapsed] = useState(false);
  const [busy, setBusy] = useState("");
  const [textureUrl, setTextureUrl] = useState("");
  const textureFile = useRef(null);
  const customTexture = useRef(null);
  const textureUrlRef = useRef("");

  const update = () => refresh((value) => value + 1);

  useEffect(
    () => () => {
      if (customTexture.current) customTexture.current.dispose();
      if (textureUrlRef.current) URL.revokeObjectURL(textureUrlRef.current);
      customTexture.current = null;
      textureUrlRef.current = "";
    },
    []
  );

  // Recomputed every render: applying a texture swaps in cloned materials, so
  // a memo keyed only on the object would keep pointing at the old ones.
  const meshes = [];
  object.traverse?.((node) => {
    if (node.isMesh) meshes.push(node);
  });

  const found = new Set();
  meshes.forEach((mesh) => {
    const list = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    list.forEach((item) => {
      if (item) found.add(item);
    });
  });
  const materials = [...found];

  const material = materials[0];
  const map = material?.map;
  const mapSource = map?.image?.src || "";

  const details = useMemo(() => {
    const chain = [];
    for (let node = object; node && node !== root; node = node.parent) {
      chain.unshift(node.name || node.type);
    }
    const geometry = object.geometry;
    const position = geometry?.attributes?.position;
    const triangles = geometry ? (geometry.index?.count ?? position?.count ?? 0) / 3 : 0;
    const box = new THREE.Box3().setFromObject(object);
    const size = box.isEmpty() ? null : box.getSize(new THREE.Vector3());
    return {
      chain,
      vertices: position?.count ?? 0,
      triangles: Math.floor(triangles),
      size,
    };
  }, [object, root]);

  const editMaterial = (edit) => {
    materials.forEach((item) => {
      edit(item);
      item.needsUpdate = true;
    });
    update();
  };

  const detachTexture = () => {
    meshes.forEach((mesh) => {
      const list = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      list.forEach((item) => {
        if (item) item.map = null;
      });
    });
    if (customTexture.current) customTexture.current.dispose();
    if (textureUrlRef.current) URL.revokeObjectURL(textureUrlRef.current);
    customTexture.current = null;
    textureUrlRef.current = "";
    setTextureUrl("");
    update();
  };

  const applyTexture = (file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    new THREE.TextureLoader().load(
      url,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.needsUpdate = true;
        if (customTexture.current) customTexture.current.dispose();
        if (textureUrlRef.current) URL.revokeObjectURL(textureUrlRef.current);
        customTexture.current = texture;
        textureUrlRef.current = url;
        setTextureUrl(url);
        // Clone materials per mesh so the custom texture does not leak into
        // other copies of the same library model.
        meshes.forEach((mesh) => {
          const cloneMaterial = (item) => {
            const copy = item.clone();
            copy.map = texture;
            copy.color?.set("#ffffff");
            copy.needsUpdate = true;
            return copy;
          };
          mesh.material = Array.isArray(mesh.material)
            ? mesh.material.map(cloneMaterial)
            : cloneMaterial(mesh.material);
        });
        update();
        onNotice?.(`Texture applied from “${file.name}”`);
      },
      undefined,
      () => {
        URL.revokeObjectURL(url);
        onNotice?.("Could not read that image.");
      }
    );
  };

  const runExport = async (format) => {
    if (busy) return;
    setBusy(format);
    try {
      const filename = await exportObjects(
        [object],
        format,
        object.name || "selection"
      );
      onNotice?.(`Saved ${filename}`);
    } catch (error) {
      onNotice?.(`Export failed — ${error.message}`);
    } finally {
      setBusy("");
    }
  };

  const name = object.name || object.type || "Object";

  if (collapsed) {
    return (
      <aside
        className={`studio-panel studio-panel-right studio-inspector is-collapsed${open ? "" : " is-hidden"}`}
        aria-label="Selection inspector"
        aria-hidden={!open}
      >
        <header className="panel-head">
          <button
            type="button"
            className="panel-close"
            title="Expand inspector"
            aria-label="Expand inspector"
            onClick={() => setCollapsed(false)}
          >
            <ChevronLeft size={15} />
          </button>
          <div className="panel-head-copy">
            <span className="panel-kicker">Selection</span>
            <h2 className="panel-title inspector-name">{name}</h2>
          </div>
          <button
            type="button"
            className="panel-close"
            onClick={onClose}
            title="Hide inspector — keeps the selection"
            aria-label="Hide inspector"
          >
            <X size={15} />
          </button>
        </header>
      </aside>
    );
  }

  return (
    <aside
      className={`studio-panel studio-panel-right studio-inspector${open ? "" : " is-hidden"}`}
      aria-label="Selection inspector"
      aria-hidden={!open}
    >
      <header className="panel-head">
        <div className="panel-head-copy">
          <span className="panel-kicker">Selection</span>
          <h2 className="panel-title inspector-name">{name}</h2>
        </div>
        <div className="panel-head-actions">
          <button
            type="button"
            className="panel-close"
            title="Collapse inspector"
            aria-label="Collapse inspector"
            onClick={() => setCollapsed(true)}
          >
            <ChevronRight size={15} />
          </button>
          <button
            type="button"
            className="panel-close"
            onClick={onClose}
            title="Hide inspector — keeps the selection"
            aria-label="Hide inspector"
          >
            <X size={15} />
          </button>
        </div>
      </header>

      <div className="panel-body inspector-scroll">
        <div className="inspector-crumbs">
          <Layers3 size={13} />
          {details.chain.map((part, index) => (
            <span key={`${part}-${index}`}>
              {index > 0 && <ChevronRight size={11} />}
              {part}
            </span>
          ))}
        </div>

        <section className="inspector-section">
          <h3>Object</h3>
          <div className="inspector-actions">
            <button
              type="button"
              onClick={() => focusApi.current?.focus(object)}
              title="Frame the selection with the camera"
            >
              <Focus size={13} /> Focus
            </button>
            <button
              type="button"
              onClick={() => {
                object.visible = !object.visible;
                update();
              }}
              title={object.visible ? "Hide the selection" : "Show the selection"}
            >
              {object.visible ? <Eye size={13} /> : <EyeOff size={13} />}
              {object.visible ? "Hide" : "Show"}
            </button>
          </div>
          <div className="inspector-grid">
            <span>Type</span>
            <b>{object.type}</b>
            <span>UUID</span>
            <code>{object.uuid.slice(0, 12)}…</code>
            <span>Meshes</span>
            <b>{meshes.length}</b>
          </div>
        </section>

        <section className="inspector-section">
          <h3>Transform</h3>
          {[
            ["Position", object.position],
            ["Rotation", object.rotation],
            ["Scale", object.scale],
          ].map(([label, vector]) => (
            <div className="inspector-row" key={label}>
              <span className="inspector-row-label">{label}</span>
              {["x", "y", "z"].map((axis) => (
                <label className="inspector-input" key={axis}>
                  <small>{axis}</small>
                  <input
                    type="number"
                    step="0.1"
                    value={number(vector[axis])}
                    onChange={(event) => {
                      vector[axis] = Number(event.target.value);
                      object.updateMatrix();
                      update();
                    }}
                  />
                  <span className="inspector-stepper-box">
                    <button
                      type="button"
                      aria-label={`Increase ${label} ${axis}`}
                      onClick={() => {
                        vector[axis] += 0.1;
                        object.updateMatrix();
                        update();
                      }}
                    >
                      <ChevronUp size={11} />
                    </button>
                    <button
                      type="button"
                      aria-label={`Decrease ${label} ${axis}`}
                      onClick={() => {
                        vector[axis] -= 0.1;
                        object.updateMatrix();
                        update();
                      }}
                    >
                      <ChevronDown size={11} />
                    </button>
                  </span>
                </label>
              ))}
            </div>
          ))}
        </section>

        {object.isMesh && (
          <section className="inspector-section">
            <h3>Geometry</h3>
            <div className="inspector-grid">
              <span>Vertices</span>
              <b>{details.vertices.toLocaleString()}</b>
              <span>Triangles</span>
              <b>{details.triangles.toLocaleString()}</b>
              <span>Bounds</span>
              <b>
                {details.size
                  ? `${details.size.x.toFixed(2)} × ${details.size.y.toFixed(2)} × ${details.size.z.toFixed(2)}`
                  : "—"}
              </b>
            </div>
          </section>
        )}

        {material && (
          <section className="inspector-section">
            <h3>Material</h3>
            <div className="inspector-material">
              <input
                type="color"
                aria-label="Material colour"
                value={`#${material.color?.getHexString?.() || "8b82ee"}`}
                onChange={(event) => {
                  const color = event.target.value;
                  editMaterial((item) => item.color?.set(color));
                }}
              />
              <div>
                <b>{material.name || material.type}</b>
                <small>{material.type}</small>
              </div>
            </div>

            {[
              ["Roughness", "roughness", 0, 1, 0.05],
              ["Metalness", "metalness", 0, 1, 0.05],
              ["Opacity", "opacity", 0, 1, 0.05],
            ].map(([label, key, min, max, step]) => (
              <label className="inspector-slider" key={key}>
                <span>{label}</span>
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={step}
                  value={material[key] ?? 1}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    editMaterial((item) => {
                      if (!(key in item)) return;
                      item[key] = value;
                      if (key === "opacity") item.transparent = value < 1;
                    });
                  }}
                />
                <b>{Number(material[key] ?? 1).toFixed(2)}</b>
              </label>
            ))}

            <div className="inspector-toggles">
              <label className="inspector-check">
                <span>Wireframe</span>
                <input
                  type="checkbox"
                  checked={Boolean(material.wireframe)}
                  onChange={(event) => {
                    const checked = event.target.checked;
                    editMaterial((item) => {
                      if ("wireframe" in item) item.wireframe = checked;
                    });
                  }}
                />
              </label>
              <label className="inspector-check">
                <span>Flat shading</span>
                <input
                  type="checkbox"
                  checked={Boolean(material.flatShading)}
                  onChange={(event) => {
                    const checked = event.target.checked;
                    editMaterial((item) => {
                      if ("flatShading" in item) item.flatShading = checked;
                    });
                  }}
                />
              </label>
              <label className="inspector-check">
                <span>Double sided</span>
                <input
                  type="checkbox"
                  checked={material.side === THREE.DoubleSide}
                  onChange={(event) => {
                    const checked = event.target.checked;
                    editMaterial((item) => {
                      item.side = checked ? THREE.DoubleSide : THREE.FrontSide;
                    });
                  }}
                />
              </label>
            </div>
          </section>
        )}

        <section className="inspector-section">
          <h3>Texture</h3>
          <div className="inspector-texture">
            {(mapSource || textureUrl) && (
              <img src={textureUrl || mapSource} alt="" />
            )}
            <div>
              <b>{map ? "Custom texture applied" : "No texture"}</b>
              <small>Replaces the base colour map on this selection</small>
            </div>
          </div>
          <div className="inspector-actions">
            <button
              type="button"
              onClick={() => textureFile.current?.click()}
              title="Upload a PNG, JPEG or WebP texture"
            >
              <ImagePlus size={13} /> Upload
            </button>
            {map && (
              <button type="button" onClick={detachTexture} title="Remove the texture">
                <Trash2 size={13} /> Remove
              </button>
            )}
          </div>
          <input
            ref={textureFile}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/avif"
            hidden
            onChange={(event) => {
              applyTexture(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
        </section>

        <section className="inspector-section inspector-export">
          <h3>Export selection</h3>
          <div className="studio-export-grid">
            {EXPORT_FORMATS.map((format) => (
              <button
                key={format.id}
                type="button"
                title={`${format.title} — ${name}`}
                disabled={Boolean(busy)}
                onClick={() => runExport(format.id)}
              >
                {busy === format.id ? <Loader2 size={12} className="is-spinning" /> : null}
                {format.label}
              </button>
            ))}
          </div>
          <p className="studio-export-note">Only this object is written to the file.</p>
        </section>

        <div className="inspector-hint">
          <Box size={13} /> Click a mesh in the viewport to inspect it · Esc clears
          the selection
        </div>
        <div className="inspector-hint">
          <Download size={13} /> Exports download straight to your device
        </div>
      </div>
    </aside>
  );
}

SelectionPanel.propTypes = {
  open: PropTypes.bool,
  object: PropTypes.object.isRequired,
  root: PropTypes.object,
  focusApi: PropTypes.shape({ current: PropTypes.any }),
  onClose: PropTypes.func.isRequired,
  onNotice: PropTypes.func,
};
