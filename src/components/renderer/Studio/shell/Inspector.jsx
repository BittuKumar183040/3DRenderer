import { useMemo, useState } from "react";
import PropTypes from "prop-types";
import {
  Box,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Layers3,
  X,
} from "lucide-react";
import * as THREE from "three";

/**
 * Selection inspector docked on the right. Owns live edits for transform,
 * geometry readouts and material colour/wireframe.
 */
export default function Inspector({ open, object, root, onClose }) {
  const [, refresh] = useState(0);

  const details = useMemo(() => {
    const chain = [];
    for (let node = object; node && node !== root; node = node.parent) {
      chain.unshift(node.name || node.type);
    }
    const geometry = object.geometry;
    const position = geometry?.attributes?.position;
    const triangles = geometry ? (geometry.index?.count ?? position?.count ?? 0) / 3 : 0;
    const box = geometry ? new THREE.Box3().setFromObject(object) : null;
    const size = box && !box.isEmpty() ? box.getSize(new THREE.Vector3()) : null;
    return { chain, vertices: position?.count ?? 0, triangles: Math.floor(triangles), size };
  }, [object, root]);

  const material = Array.isArray(object.material) ? object.material[0] : object.material;
  const update = () => refresh((value) => value + 1);

  return (
    <aside
      className={`studio-panel studio-panel-right studio-inspector${open ? "" : " is-hidden"}`}
      aria-label="Selection inspector"
      aria-hidden={!open}
    >
      <header className="panel-head">
        <div className="panel-head-copy">
          <span className="panel-kicker">Selection</span>
          <h2 className="panel-title inspector-name">
            {object.name || object.type || "Object"}
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
            <span>UUID</span>
            <code>{object.uuid.slice(0, 12)}…</code>
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
                    value={Number(vector[axis].toFixed(2))}
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
                  material.color?.set(event.target.value);
                  material.needsUpdate = true;
                  update();
                }}
              />
              <div>
                <b>{material.name || material.type}</b>
                <small>{material.type}</small>
              </div>
            </div>
            <label className="inspector-check">
              <span>Wireframe</span>
              <input
                type="checkbox"
                checked={Boolean(material.wireframe)}
                onChange={(event) => {
                  if ("wireframe" in material) material.wireframe = event.target.checked;
                  update();
                }}
              />
            </label>
          </section>
        )}

        <div className="inspector-hint">
          <Box size={13} /> Click a mesh in the viewport to inspect it
        </div>
      </div>
    </aside>
  );
}

Inspector.propTypes = {
  open: PropTypes.bool,
  object: PropTypes.object.isRequired,
  root: PropTypes.object,
  onClose: PropTypes.func,
};
