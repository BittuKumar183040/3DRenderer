import { useMemo, useState } from 'react';
import { Box, ChevronDown, ChevronRight, ChevronUp, Layers3, X } from 'lucide-react';
import * as THREE from 'three';

function GraphNode({ node, selected, onSelect, depth = 0 }) {
  const [expanded, setExpanded] = useState(true);
  const children = node.children || [];
  return <div>
    <div className={`graph-node ${selected === node ? 'selected' : ''}`} style={{ paddingLeft: 8 + depth * 13 }} onClick={() => onSelect(node)} title={node.name || node.type}>
      {children.length ? <button onClick={(event) => { event.stopPropagation(); setExpanded(!expanded); }}>{expanded ? <ChevronDown size={12}/> : <ChevronRight size={12}/>}</button> : <span className="graph-spacer"/>}
      <span className={`graph-type graph-${node.type?.toLowerCase()}`}>{node.isMesh ? '◇' : node.isLight ? '☼' : node.isCamera ? '▣' : '◌'}</span>
      <span className="graph-label">{node.name || node.type || 'Object'}</span>
      {node.visible === false && <EyeOff size={11} className="graph-hidden"/>}
    </div>
    {expanded && children.map((child) => <GraphNode key={child.uuid} node={child} selected={selected} onSelect={onSelect} depth={depth + 1}/>) }
  </div>;
}

export default function SelectionInspector({ object, root, onClose, onSelect }) {
  const [, refresh] = useState(0);
  const details = useMemo(() => {
    if (!object) return null;
    const chain = [];
    for (let node = object; node && node !== root; node = node.parent) chain.unshift(node.name || node.type);
    const geometry = object.geometry;
    const position = geometry?.attributes?.position;
    const triangles = geometry ? (geometry.index?.count ?? position?.count ?? 0) / 3 : 0;
    const box = geometry ? new THREE.Box3().setFromObject(object) : null;
    const size = box && !box.isEmpty() ? box.getSize(new THREE.Vector3()) : null;
    return { chain, vertices: position?.count ?? 0, triangles: Math.floor(triangles), size };
  }, [object, root]);
  if (!object || !details) return null;
  const material = Array.isArray(object.material) ? object.material[0] : object.material;
  const color = material?.color?.getStyle() ?? '#8b82ee';
  const update = () => refresh((value) => value + 1);
  return <aside className="selection-inspector">
    <header><div><span className="selection-kicker">SELECTION</span><h2>{object.name || object.type || 'Object'}</h2></div><button title="Close inspector" onClick={onClose}><X size={17}/></button></header>
    <div className="selection-breadcrumb"><Layers3 size={13}/>{details.chain.map((part, i) => <span key={`${part}-${i}`}>{i > 0 && <ChevronRight size={11}/>} {part}</span>)}</div>
    <section><h3>Object</h3><div className="selection-grid"><span>Type</span><b>{object.type}</b><span>UUID</span><code>{object.uuid.slice(0, 12)}…</code></div></section>
    <section><h3>Transform</h3>{[['Position', object.position], ['Rotation', object.rotation], ['Scale', object.scale]].map(([label, vector]) => <div className="transform-row" key={label}><span>{label}</span>{['x','y','z'].map((axis) => <label key={axis} className="transform-field"><small>{axis}</small><input type="number" step="0.1" value={Number(vector[axis].toFixed(2))} onChange={(e) => { vector[axis] = Number(e.target.value); object.updateMatrix(); update(); }}/><span className="transform-stepper"><button type="button" aria-label={`Increase ${label} ${axis}`} onClick={() => { vector[axis] += 0.1; object.updateMatrix(); update(); }}><ChevronUp size={11}/></button><button type="button" aria-label={`Decrease ${label} ${axis}`} onClick={() => { vector[axis] -= 0.1; object.updateMatrix(); update(); }}><ChevronDown size={11}/></button></span></label>)}</div>)}</section>
    {object.isMesh && <section><h3>Geometry</h3><div className="selection-grid"><span>Vertices</span><b>{details.vertices.toLocaleString()}</b><span>Triangles</span><b>{details.triangles.toLocaleString()}</b><span>Bounds</span><b>{details.size ? `${details.size.x.toFixed(2)} × ${details.size.y.toFixed(2)} × ${details.size.z.toFixed(2)}` : '—'}</b></div></section>}
    {material && <section><h3>Material</h3><div className="material-row"><span className="material-chip" style={{ background: color }}/><div><b>{material.name || material.type}</b><small>{material.type}</small></div><input aria-label="Material color" type="color" value={`#${material.color?.getHexString?.() || '8b82ee'}`} onChange={(e) => { material.color?.set(e.target.value); material.needsUpdate = true; update(); }}/></div><label className="selection-visibility"><span>Wireframe</span><input type="checkbox" checked={Boolean(material.wireframe)} onChange={(e) => { if ('wireframe' in material) material.wireframe = e.target.checked; update(); }}/></label></section>}
    <div className="selection-hint"><Box size={13}/> Click a mesh in the viewport to inspect it</div>
    <style>{`.selection-inspector{position:absolute;z-index:15;right:18px;top:72px;bottom:18px;width:310px;overflow:auto;background:rgba(255,255,255,.96);border:1px solid #e7e8ef;border-radius:14px;box-shadow:0 16px 48px #25243c20;backdrop-filter:blur(18px);font:12px Inter,system-ui,sans-serif;color:#303240}.selection-inspector header{position:sticky;top:0;background:#fffffff2;backdrop-filter:blur(12px);display:flex;justify-content:space-between;align-items:flex-start;padding:17px 16px 12px;border-bottom:1px solid #eeeef3;z-index:1}.selection-inspector header button{border:0;background:#f4f4f8;border-radius:7px;padding:6px;cursor:pointer;color:#777}.selection-kicker{font-size:9px;font-weight:700;letter-spacing:1.1px;color:#8274dc}.selection-inspector h2{font-size:16px;margin:5px 0 0;max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.selection-breadcrumb{display:flex;align-items:center;gap:5px;padding:10px 16px;color:#858997;font-size:10px;overflow:hidden;white-space:nowrap}.selection-breadcrumb span{display:flex;align-items:center;gap:4px}.selection-inspector section{padding:12px 16px;border-top:1px solid #eeeef3}.selection-inspector section h3{font-size:11px;margin:0 0 10px;color:#525563}.selection-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;color:#8c909c;font-size:10px}.selection-grid b,.selection-grid code{color:#383a47;font-size:10px;overflow:hidden;text-overflow:ellipsis}.transform-row{display:grid;grid-template-columns:58px repeat(3,minmax(0,1fr));gap:5px;align-items:center;margin:8px 0;color:#858997;font-size:10px}.transform-field{height:32px;display:flex;align-items:center;border:1px solid #e9e9ef;border-radius:5px;overflow:hidden;min-width:0}.transform-field>small{padding-left:5px;color:#a0a3ad}.transform-field input{height:30px;width:100%;min-width:0;border:0;outline:0;padding:3px;font:10px inherit;color:#424451;appearance:textfield}.transform-field input::-webkit-inner-spin-button,.transform-field input::-webkit-outer-spin-button{display:none}.transform-stepper{height:100%;width:17px;flex:none;display:flex;flex-direction:column;border-left:1px solid #eeeef3}.transform-stepper button{flex:1;padding:0;border:0;background:transparent;color:#777b89;display:grid;place-items:center;cursor:pointer}.transform-stepper button:hover{background:#f0edff;color:#6557c9}.material-row{display:flex;align-items:center;gap:9px;margin-bottom:8px}.material-chip{width:25px;height:25px;border-radius:7px;border:1px solid #ddd}.material-row b,.material-row small{display:block;font-size:10px}.material-row small{color:#969aa5;margin-top:3px}.material-row input[type=color]{margin-left:auto;width:30px;height:25px;padding:0;border:0;background:none}.selection-hint{display:flex;align-items:center;gap:7px;padding:13px 16px;color:#999daa;font-size:10px}@media(max-width:640px){.selection-inspector{top:auto;left:10px;right:10px;bottom:10px;width:auto;max-height:58vh}}`}</style>
  </aside>;
}

function countNodes(root) { let count = 0; root?.traverse?.(() => { count += 1; }); return count; }
