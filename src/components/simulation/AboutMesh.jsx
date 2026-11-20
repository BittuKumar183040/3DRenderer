import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Layers3, Ruler, Triangle, Box } from 'lucide-react';
import * as THREE from 'three';

const AboutMesh = ({ meshItems, fileInfo: { name, extension } }) => {
  const [collapsed, setCollapsed] = useState(false);
  const stats = useMemo(() => {
    const root = meshItems?.isObject3D ? meshItems : null;
    const meshes = [];
    if (root) root.traverse((node) => { if (node.isMesh) meshes.push(node); });
    else if (Array.isArray(meshItems)) meshes.push(...meshItems);
    let triangles = 0;
    meshes.forEach((mesh) => {
      const geometry = mesh.geometry;
      triangles += geometry?.index ? geometry.index.count / 3 : (geometry?.attributes?.position?.count || 0) / 3;
    });
    let dimensions = '—';
    if (root) {
      const box = new THREE.Box3().setFromObject(root);
      if (!box.isEmpty()) { const size = box.getSize(new THREE.Vector3()); dimensions = `${size.x.toFixed(2)} × ${size.y.toFixed(2)} × ${size.z.toFixed(2)}`; }
    }
    return { meshes: meshes.length, triangles: Math.floor(triangles).toLocaleString(), dimensions };
  }, [meshItems]);

  return <aside className={`scene-inspector ${collapsed ? 'is-collapsed' : ''}`}>
    <button className="scene-inspector-toggle" aria-label={collapsed ? 'Expand scene details' : 'Collapse scene details'} onClick={() => setCollapsed(!collapsed)}>{collapsed ? <ChevronRight size={16}/> : <ChevronLeft size={16}/>}</button>
    {!collapsed && <><div className="scene-inspector-kicker">SCENE INSPECTOR</div><span className="scene-inspector-format">{extension?.toUpperCase()}</span><h3 title={`${name}.${extension}`}>{name}</h3>
      <div className="scene-stat"><Layers3 size={14}/><span>Objects</span><b>{stats.meshes}</b></div>
      <div className="scene-stat"><Triangle size={14}/><span>Triangles</span><b>{stats.triangles}</b></div>
      <div className="scene-stat"><Ruler size={14}/><span>Bounds</span></div><div className="scene-bounds"><Box size={12}/>{stats.dimensions}</div>
    </>}
    <style>{`.scene-inspector{position:absolute;z-index:8;left:18px;top:82px;width:220px;padding:16px;background:rgba(255,255,255,.88);border:1px solid rgba(220,222,232,.8);border-radius:13px;box-shadow:0 10px 32px #24233b12;backdrop-filter:blur(16px);font:12px Inter,system-ui,sans-serif;color:#303240;transition:width .2s,padding .2s}.scene-inspector.is-collapsed{width:38px;height:38px;padding:9px}.scene-inspector-toggle{position:absolute;right:8px;top:8px;border:0;background:transparent;color:#777b89;cursor:pointer;padding:3px}.scene-inspector-kicker{font-size:9px;letter-spacing:1.2px;color:#898d9b;font-weight:700;margin-bottom:12px}.scene-inspector-format{display:inline-block;font-size:9px;letter-spacing:.6px;font-weight:700;padding:4px 7px;border-radius:5px;background:#f0edff;color:#6d5cd2}.scene-inspector h3{font-size:14px;margin:9px 20px 13px 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.scene-stat{display:flex;align-items:center;gap:8px;padding:7px 0;color:#858997;border-top:1px solid #eeeef3}.scene-stat b{margin-left:auto;color:#383a47;font-size:11px}.scene-bounds{display:flex;align-items:center;gap:6px;color:#545867;font-size:10px;padding:6px 0 0 22px}`}</style>
  </aside>;
};

export default AboutMesh;
