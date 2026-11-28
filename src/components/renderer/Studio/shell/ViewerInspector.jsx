import { useMemo } from "react";
import PropTypes from "prop-types";
import * as THREE from "three";
import { Box, ChevronRight, Focus, Layers3, Lock, X } from "lucide-react";

const round = (value) => Number(Number(value).toFixed(2));

const vectorText = (vector) =>
  `${round(vector.x)}, ${round(vector.y)}, ${round(vector.z)}`;

const materialList = (mesh) =>
  (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).filter(Boolean);

/**
 * Read-only selection inspector for the format viewers. It mirrors the studio
 * panel's structure — what the object is, where it sits and which materials it
 * carries — but everything is a readout: viewing a model never edits it.
 */
export default function ViewerInspector({ open, object, root, focusApi, onClose }) {
  const details = useMemo(() => {
    const chain = [];
    for (let node = object; node && node !== root; node = node.parent) {
      chain.unshift(node.name || node.type);
    }

    let vertices = 0;
    let triangles = 0;
    let meshCount = 0;
    const materials = [];
    object.traverse?.((node) => {
      if (!node.isMesh) return;
      meshCount += 1;
      const geometry = node.geometry;
      const position = geometry?.attributes?.position;
      vertices += position?.count ?? 0;
      triangles += Math.floor((geometry?.index?.count ?? position?.count ?? 0) / 3);
      materialList(node).forEach((material) => {
        if (!materials.includes(material)) materials.push(material);
      });
    });

    const box = new THREE.Box3().setFromObject(object);
    const size = box.isEmpty() ? null : box.getSize(new THREE.Vector3());

    return { chain, vertices, triangles, meshCount, materials, size };
  }, [object, root]);

  const name = object.name || object.type || "Object";

  return (
    <aside
      className={`studio-panel studio-panel-right studio-inspector${open ? "" : " is-hidden"}`}
      aria-label="Selection inspector"
      aria-hidden={!open}
    >
      <header className="panel-head">
        <div className="panel-head-copy">
          <span className="panel-kicker">Selection</span>
          <h2 className="panel-title inspector-name" title={name}>
            {name}
          </h2>
        </div>
        <button
          type="button"
          className="panel-close"
          onClick={onClose}
          title="Hide inspector"
          aria-label="Hide inspector"
        >
          <X size={15} />
        </button>
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
          <div className="inspector-grid">
            <span>Type</span>
            <b>{object.type}</b>
            <span>Meshes</span>
            <b>{details.meshCount.toLocaleString()}</b>
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
          <div className="inspector-actions is-plain">
            <button
              type="button"
              className="st-btn"
              onClick={() => focusApi.current?.focus(object)}
              title="Frame the selection with the camera"
            >
              <Focus size={13} /> Focus
            </button>
          </div>
        </section>

        <section className="inspector-section">
          <h3>Transform</h3>
          <div className="inspector-grid">
            <span>Position</span>
            <b>{vectorText(object.position)}</b>
            <span>Rotation</span>
            <b>{vectorText(object.rotation)}</b>
            <span>Scale</span>
            <b>{vectorText(object.scale)}</b>
          </div>
        </section>

        {details.materials.length > 0 && (
          <section className="inspector-section">
            <h3>Materials</h3>
            {details.materials.map((material) => (
              <div
                className="inspector-material"
                key={material.uuid || material.name}
              >
                <i
                  className="inspector-swatch"
                  aria-hidden="true"
                  style={{
                    background: material.color
                      ? `#${material.color.getHexString()}`
                      : "#c9cbd6",
                  }}
                />
                <div>
                  <b>{material.name || material.type}</b>
                  <small>{material.type}</small>
                </div>
              </div>
            ))}
          </section>
        )}

        <div className="inspector-hint">
          <Lock size={13} /> Read-only view — open the Studio to edit or add meshes
        </div>
        <div className="inspector-hint">
          <Box size={13} /> Click a mesh in the viewport to inspect it
        </div>
      </div>
    </aside>
  );
}

ViewerInspector.propTypes = {
  open: PropTypes.bool,
  object: PropTypes.object.isRequired,
  root: PropTypes.object,
  focusApi: PropTypes.shape({ current: PropTypes.any }),
  onClose: PropTypes.func.isRequired,
};
