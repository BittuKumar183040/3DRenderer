import { useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import * as THREE from "three";
import {
  Box,
  Check,
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
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import ExportMenu from "./ExportMenu";
import { downloadBlob, slug } from "./exportScene";

const number = (value) => Number(Number(value).toFixed(2));

/** Ready-made surfaces that can be applied to the whole selection. */
const MATERIAL_PRESETS = [
  { key: "plastic", label: "Plastic", color: "#cfd3e8", roughness: 0.55, metalness: 0.05 },
  { key: "matte", label: "Matte", color: "#e8e8ef", roughness: 0.95, metalness: 0 },
  { key: "metal", label: "Metal", color: "#b8bcc7", roughness: 0.3, metalness: 1 },
  { key: "chrome", label: "Chrome", color: "#e9ecf2", roughness: 0.05, metalness: 1 },
  { key: "gold", label: "Gold", color: "#d8b264", roughness: 0.25, metalness: 1 },
  { key: "copper", label: "Copper", color: "#c07a52", roughness: 0.32, metalness: 1 },
  {
    key: "glass",
    label: "Glass",
    color: "#dfe6f2",
    roughness: 0.06,
    metalness: 0,
    opacity: 0.32,
    transparent: true,
  },
  { key: "rubber", label: "Rubber", color: "#2d2f38", roughness: 0.95, metalness: 0 },
  { key: "clay", label: "Clay", color: "#d9a58c", roughness: 1, metalness: 0 },
  {
    key: "neon",
    label: "Neon",
    color: "#8f7bff",
    roughness: 0.4,
    metalness: 0,
    emissive: "#6a4dff",
    emissiveIntensity: 1.2,
  },
];

/** Material slots of one mesh, always as a flat list. */
const materialList = (mesh) =>
  (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).filter(Boolean);

/**
 * Stores the material slots on a mesh. More than one slot needs geometry
 * groups, so the index buffer is split evenly across the slots; three.js then
 * draws each slice with its own material.
 */
function assignSlots(mesh, list) {
  const next = list.filter(Boolean);
  if (!next.length) return;
  mesh.material = next.length > 1 ? next : next[0];

  const geometry = mesh.geometry;
  if (!geometry) return;
  geometry.clearGroups();
  if (next.length < 2) return;

  const total = geometry.index
    ? geometry.index.count
    : geometry.attributes?.position?.count || 0;
  if (!total) return;

  const span = Math.floor(total / next.length);
  next.forEach((_, index) => {
    const start = index * span;
    const count = index === next.length - 1 ? total - start : span;
    if (count > 0) geometry.addGroup(start, count, index);
  });
}

/**
 * Studio selection inspector. On top of the transform readouts it renames the
 * object, edits or stacks materials, swaps in (or downloads) a custom texture,
 * deletes the selection and exports just that object. The header can collapse
 * the panel to a slim bar so the viewport keeps the selection but gains room.
 */
export default function SelectionPanel({
  open,
  object,
  root,
  focusApi,
  onClose,
  onDelete,
  onRename,
  onNotice,
}) {
  const [, refresh] = useState(0);
  const [collapsed, setCollapsed] = useState(false);
  const [more, setMore] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [activeSlot, setActiveSlot] = useState(0);
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState("");
  const [textureUrl, setTextureUrl] = useState("");
  const textureFile = useRef(null);
  const customTexture = useRef(null);
  const textureUrlRef = useRef("");
  const moreRef = useRef(null);
  const addRef = useRef(null);

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

  // A new selection starts fresh: no half-finished rename or open popover.
  useEffect(() => {
    setRenaming(false);
    setMore(false);
    setAddOpen(false);
    setActiveSlot(0);
    setDraft(object.name || object.type || "Object");
  }, [object]);

  useEffect(() => {
    if (!more && !addOpen) return undefined;
    const onPointerDown = (event) => {
      if (more && moreRef.current && !moreRef.current.contains(event.target)) {
        setMore(false);
      }
      if (addOpen && addRef.current && !addRef.current.contains(event.target)) {
        setAddOpen(false);
      }
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setMore(false);
        setAddOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [more, addOpen]);

  // Recomputed every render: applying a texture swaps in cloned materials, so
  // a memo keyed only on the object would keep pointing at the old ones.
  const meshes = [];
  object.traverse?.((node) => {
    if (node.isMesh) meshes.push(node);
  });

  const slotCount = meshes.reduce(
    (max, mesh) => Math.max(max, materialList(mesh).length),
    0
  );
  const slotIndex = Math.min(activeSlot, Math.max(0, slotCount - 1));
  const material = meshes.map((mesh) => materialList(mesh)[slotIndex]).find(Boolean) || null;
  const slots = Array.from({ length: slotCount }, (_, index) => {
    const item = meshes.map((mesh) => materialList(mesh)[index]).find(Boolean);
    return {
      index,
      name: item?.name || item?.type || `Material ${index + 1}`,
      hex: item?.color ? `#${item.color.getHexString()}` : "#c9cbd6",
    };
  });

  const map = material?.map;
  const mapSource = map?.image?.src || "";

  const details = useMemo(() => {
    const chain = [];
    for (let node = object; node && node !== root; node = node.parent) {
      chain.unshift(node.name || node.type);
    }
    let vertices = 0;
    let triangles = 0;
    let meshCount = 0;
    object.traverse?.((node) => {
      if (!node.isMesh) return;
      meshCount += 1;
      const geometry = node.geometry;
      const position = geometry?.attributes?.position;
      vertices += position?.count ?? 0;
      triangles += Math.floor((geometry?.index?.count ?? position?.count ?? 0) / 3);
    });
    const box = new THREE.Box3().setFromObject(object);
    const size = box.isEmpty() ? null : box.getSize(new THREE.Vector3());
    return {
      chain,
      vertices,
      triangles,
      meshCount,
      size,
      children: object.children?.length ?? 0,
    };
    // object.name is read inside, so a rename has to recompute the crumbs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [object, root, object.name]);

  const editMaterial = (edit) => {
    meshes.forEach((mesh) => {
      const item = materialList(mesh)[slotIndex];
      if (!item) return;
      edit(item);
      item.needsUpdate = true;
    });
    update();
  };

  const detachTexture = () => {
    meshes.forEach((mesh) => {
      const item = materialList(mesh)[slotIndex];
      if (item) {
        item.map = null;
        item.needsUpdate = true;
      }
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
        // Clone the active slot per mesh so the custom texture does not leak
        // into other copies of the same library model.
        meshes.forEach((mesh) => {
          const list = [...materialList(mesh)];
          const current = list[slotIndex];
          if (!current) return;
          const copy = current.clone();
          copy.map = texture;
          copy.color?.set("#ffffff");
          copy.needsUpdate = true;
          list[slotIndex] = copy;
          assignSlots(mesh, list);
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

  const downloadTexture = () => {
    const image = map?.image;
    if (!image?.width) {
      onNotice?.("There is no texture to download.");
      return;
    }
    try {
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      canvas.getContext("2d").drawImage(image, 0, 0);
      canvas.toBlob((blob) => {
        if (!blob) {
          onNotice?.("Could not read the texture.");
          return;
        }
        const filename = `${slug(object.name || "selection")}-texture.png`;
        downloadBlob(blob, filename);
        onNotice?.(`Saved ${filename}`);
      }, "image/png");
    } catch {
      onNotice?.("This texture cannot be downloaded.");
    }
  };

  // Adding a preset stacks another material slot on every mesh in the
  // selection, so one object can carry several materials at once.
  const addMaterial = (choice) => {
    if (!meshes.length) return;
    meshes.forEach((mesh) => {
      const list = materialList(mesh);
      const base = list[list.length - 1] || new THREE.MeshStandardMaterial();
      const copy = base.clone();
      copy.name = choice.label;
      copy.color?.set(choice.color);
      if ("roughness" in copy) copy.roughness = choice.roughness;
      if ("metalness" in copy) copy.metalness = choice.metalness;
      copy.opacity = choice.opacity ?? 1;
      copy.transparent = Boolean(choice.transparent);
      if (copy.emissive) {
        copy.emissive.set(choice.emissive || "#000000");
        copy.emissiveIntensity = choice.emissiveIntensity ?? 1;
      }
      copy.needsUpdate = true;
      assignSlots(mesh, [...list, copy]);
    });
    setActiveSlot(slotCount);
    update();
    onNotice?.(`Added the ${choice.label.toLowerCase()} material`);
  };

  const removeMaterial = (index) => {
    meshes.forEach((mesh) => {
      const list = materialList(mesh);
      if (list.length <= 1) return;
      const next = [...list];
      next.splice(index, 1);
      assignSlots(mesh, next);
    });
    setActiveSlot(Math.max(0, Math.min(index, slotCount - 2)));
    update();
    onNotice?.(`Removed material ${index + 1}`);
  };

  const submitRename = (event) => {
    event.preventDefault();
    const next = draft.trim();
    if (!next) {
      setRenaming(false);
      return;
    }
    onRename?.(next);
    setRenaming(false);
    update();
  };

  const startRename = () => {
    setDraft(object.name || object.type || "Object");
    setRenaming(true);
  };

  const name = object.name || object.type || "Object";
  const meshLabel = `${details.meshCount} ${details.meshCount === 1 ? "mesh" : "meshes"}`;

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
          {renaming ? (
            <form className="inspector-rename" onSubmit={submitRename}>
              <input
                autoFocus
                type="text"
                value={draft}
                aria-label="Object name"
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") setRenaming(false);
                }}
              />
              <button type="submit" title="Save name" aria-label="Save name">
                <Check size={13} />
              </button>
            </form>
          ) : (
            <div className="inspector-name-row">
              <h2 className="panel-title inspector-name" title={name}>
                {name}
              </h2>
              <button
                type="button"
                className="inspector-rename-btn"
                title="Rename object"
                aria-label="Rename object"
                onClick={startRename}
              >
                <Pencil size={12} />
              </button>
            </div>
          )}
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
            <button
              type="button"
              className="inspector-delete"
              onClick={onDelete}
              title="Remove from the scene (Delete)"
            >
              <Trash2 size={13} /> Delete
            </button>
          </div>

          <div className="inspector-facts">
            <span>{object.type}</span>
            <i aria-hidden="true" />
            <span>{meshLabel}</span>
            <div className="inspector-more-wrap" ref={moreRef}>
              <button
                type="button"
                className={`inspector-more${more ? " is-open" : ""}`}
                aria-expanded={more}
                aria-haspopup="dialog"
                onClick={() => setMore((value) => !value)}
              >
                {more ? "Less" : "More"}
                <ChevronDown size={12} />
              </button>
              {more && (
                <div
                  className="view-popover inspector-more-popover is-open"
                  role="dialog"
                  aria-label="Object details"
                >
                  <span className="view-label">Details</span>
                  <div className="inspector-grid inspector-more-grid">
                    <span>UUID</span>
                    <code>{object.uuid.slice(0, 12)}…</code>
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
                    <span>Materials</span>
                    <b>{slotCount}</b>
                    <span>Children</span>
                    <b>{details.children}</b>
                  </div>
                </div>
              )}
            </div>
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

        {meshes.length > 0 && (
        <section className="inspector-section">
          <div className="inspector-section-head">
            <h3>Materials</h3>
            <div className="inspector-more-wrap" ref={addRef}>
              <button
                type="button"
                className={`inspector-add${addOpen ? " is-open" : ""}`}
                aria-expanded={addOpen}
                aria-haspopup="menu"
                title="Add a material to this selection"
                onClick={() => setAddOpen((value) => !value)}
              >
                <Plus size={12} /> Add
              </button>
              {addOpen && (
                <div
                  className="view-popover inspector-add-popover is-open"
                  role="menu"
                  aria-label="Material presets"
                >
                  <span className="view-label">Add material</span>
                  <div className="inspector-add-list">
                    {MATERIAL_PRESETS.map((choice) => (
                      <button
                        key={choice.key}
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          addMaterial(choice);
                          setAddOpen(false);
                        }}
                      >
                        <i
                          aria-hidden="true"
                          style={{
                            background: choice.color,
                            opacity: choice.transparent ? 0.45 : 1,
                          }}
                        />
                        <span>{choice.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="inspector-slots">
            {slots.map((slot) => (
              <div
                key={slot.index}
                className={`inspector-slot${slot.index === slotIndex ? " is-active" : ""}`}
                role="button"
                tabIndex={0}
                title={slot.name}
                onClick={() => {
                  setActiveSlot(slot.index);
                  update();
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setActiveSlot(slot.index);
                    update();
                  }
                }}
              >
                <i
                  aria-hidden="true"
                  style={{ background: slot.hex }}
                  className="inspector-slot-swatch"
                />
                <span>{slot.name}</span>
                <b>{slot.index + 1}</b>
                {slotCount > 1 && (
                  <button
                    type="button"
                    className="inspector-slot-remove"
                    title={`Remove ${slot.name}`}
                    aria-label={`Remove ${slot.name}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      removeMaterial(slot.index);
                    }}
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
        )}

        {material && (
          <section className="inspector-section">
            <h3>Material settings</h3>
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
                <small>
                  {material.type} · slot {slotIndex + 1} of {slotCount}
                </small>
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
              <small>Replaces the base colour map on the active material</small>
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
            <button
              type="button"
              onClick={downloadTexture}
              disabled={!map}
              title={map ? "Download this texture as a PNG" : "No texture to download"}
            >
              <Download size={13} /> Download
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

        <div className="inspector-hint">
          <Box size={13} /> Delete removes the selection · Esc clears it
        </div>
      </div>

      <footer className="inspector-foot">
        <ExportMenu
          objects={[object]}
          name={name}
          label="Export selection"
          scope="Selection"
          placement="up"
          onNotice={onNotice}
        />
      </footer>
    </aside>
  );
}

SelectionPanel.propTypes = {
  open: PropTypes.bool,
  object: PropTypes.object.isRequired,
  root: PropTypes.object,
  focusApi: PropTypes.shape({ current: PropTypes.any }),
  onClose: PropTypes.func.isRequired,
  onDelete: PropTypes.func,
  onRename: PropTypes.func,
  onNotice: PropTypes.func,
};
