import { useMemo, useState } from "react";
import {
  Box,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Layers3,
  X,
} from "lucide-react";
import * as THREE from "three";

export default function SelectionInspector({
  object,
  root,
  onClose,
  onSelect,
}) {
  const [, refresh] = useState(0);
  const details = useMemo(() => {
    if (!object) return null;
    const chain = [];
    for (let node = object; node && node !== root; node = node.parent)
      chain.unshift(node.name || node.type);
    const geometry = object.geometry;
    const position = geometry?.attributes?.position;
    const triangles = geometry
      ? (geometry.index?.count ?? position?.count ?? 0) / 3
      : 0;
    const box = geometry ? new THREE.Box3().setFromObject(object) : null;
    const size =
      box && !box.isEmpty() ? box.getSize(new THREE.Vector3()) : null;
    return {
      chain,
      vertices: position?.count ?? 0,
      triangles: Math.floor(triangles),
      size,
    };
  }, [object, root]);
  if (!object || !details) return null;
  const material = Array.isArray(object.material)
    ? object.material[0]
    : object.material;
  const update = () => refresh((value) => value + 1);
  return <aside className="absolute bottom-[18px] right-[18px] top-[72px] z-[15] w-[310px] overflow-auto rounded-[14px] border border-[#e7e8ef] bg-white/[.96] text-xs text-[#303240] shadow-[0_16px_48px_#25243c20] backdrop-blur-2xl max-[640px]:bottom-[10px] max-[640px]:left-[10px] max-[640px]:right-[10px] max-[640px]:top-auto max-[640px]:max-h-[58vh] max-[640px]:w-auto">
    <header className="sticky top-0 z-[1] flex items-start justify-between border-b border-[#eeeef3] bg-white/[.95] px-4 pb-3 pt-[17px] backdrop-blur-xl">
      <div>
        <span className="text-[9px] font-bold tracking-[1.1px] text-[#8274dc]">
          SELECTION
        </span>
        <h2 className="mt-[5px] max-w-[240px] truncate text-base">
          {object.name || object.type || "Object"}
        </h2>
      </div>
      <button
        className="cursor-pointer rounded-[7px] border-0 bg-[#f4f4f8] p-1.5 text-[#777]"
        title="Close inspector"
        onClick={onClose}
      >
        <X size={17} />
      </button>
    </header>
    <div className="flex items-center gap-[5px] overflow-hidden whitespace-nowrap px-4 py-2.5 text-[10px] text-[#858997]">
      <Layers3 size={13} />
      {details.chain.map((part, i) => (
        <span className="flex items-center gap-1" key={`${part}-${i}`}>
          {i > 0 && <ChevronRight size={11} />} {part}
        </span>
      ))}
    </div>
    <section className="border-t border-[#eeeef3] px-4 py-3">
      <h3 className="mb-2.5 text-[11px] text-[#525563]">Object</h3>
      <div className="grid grid-cols-2 gap-2 text-[10px] text-[#8c909c]">
        <span>Type</span>
        <b className="truncate text-[#383a47]">{object.type}</b>
        <span>UUID</span>
        <code className="truncate text-[#383a47]">
          {object.uuid.slice(0, 12)}…
        </code>
      </div>
    </section>
    <section className="border-t border-[#eeeef3] px-4 py-3">
      <h3 className="mb-2.5 text-[11px] text-[#525563]">Transform</h3>
      {[
        ["Position", object.position],
        ["Rotation", object.rotation],
        ["Scale", object.scale],
      ].map(([label, vector]) => (
        <div
          className="my-2 grid grid-cols-[58px_repeat(3,minmax(0,1fr))] items-center gap-[5px] text-[10px] text-[#858997]"
          key={label}
        >
          <span>{label}</span>
          {["x", "y", "z"].map((axis) => (
            <label
              key={axis}
              className="flex h-8 min-w-0 items-center overflow-hidden rounded-[5px] border border-[#e9e9ef]"
            >
              <small className="pl-[5px] text-[#a0a3ad]">{axis}</small>
              <input
                className="h-[30px] w-full min-w-0 appearance-none border-0 p-[3px] text-[10px] text-[#424451] outline-none"
                type="number"
                step="0.1"
                value={Number(vector[axis].toFixed(2))}
                onChange={(e) => {
                  vector[axis] = Number(e.target.value);
                  object.updateMatrix();
                  update();
                }}
              />
              <span className="flex h-full w-[17px] shrink-0 flex-col border-l border-[#eeeef3]">
                <button
                  className="grid flex-1 place-items-center border-0 bg-transparent p-0 text-[#777b89] hover:bg-[#f0edff] hover:text-[#6557c9]"
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
                  className="grid flex-1 place-items-center border-0 bg-transparent p-0 text-[#777b89] hover:bg-[#f0edff] hover:text-[#6557c9]"
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
      <section className="border-t border-[#eeeef3] px-4 py-3">
        <h3 className="mb-2.5 text-[11px] text-[#525563]">Geometry</h3>
        <div className="grid grid-cols-2 gap-2 text-[10px] text-[#8c909c]">
          <span>Vertices</span>
          <b className="text-[#383a47]">{details.vertices.toLocaleString()}</b>
          <span>Triangles</span>
          <b className="text-[#383a47]">{details.triangles.toLocaleString()}</b>
          <span>Bounds</span>
          <b className="text-[#383a47]">
            {details.size
              ? `${details.size.x.toFixed(2)} × ${details.size.y.toFixed(2)} × ${details.size.z.toFixed(2)}`
              : "—"}
          </b>
        </div>
      </section>
    )}
    {material && (
      <section className="border-t border-[#eeeef3] px-4 py-3">
        <h3 className="mb-2.5 text-[11px] text-[#525563]">Material</h3>
        <div className="mb-2 flex items-center gap-[9px]">
          <input
            className="h-[25px] w-[25px] cursor-pointer rounded-[7px] border border-[#ddd] bg-transparent p-0"
            aria-label="Material color"
            type="color"
            value={`#${material.color?.getHexString?.() || "8b82ee"}`}
            onChange={(e) => {
              material.color?.set(e.target.value);
              material.needsUpdate = true;
              update();
            }}
          />
          <div>
            <b className="block text-[10px]">
              {material.name || material.type}
            </b>
            <small className="mt-[3px] block text-[10px] text-[#969aa5]">
              {material.type}
            </small>
          </div>
        </div>
        <label className="flex items-center justify-between py-1 text-[#777b89]">
          <span>Wireframe</span>
          <input
            className="accent-[#7568dc]"
            type="checkbox"
            checked={Boolean(material.wireframe)}
            onChange={(e) => {
              if ("wireframe" in material)
                material.wireframe = e.target.checked;
              update();
            }}
          />
        </label>
      </section>
    )}
    <div className="flex items-center gap-[7px] p-[13px] text-[10px] text-[#999daa]">
      <Box size={13} /> Click a mesh in the viewport to inspect it
    </div>
  </aside>;
}
