import { useState } from 'react';
import { ChevronDown, ChevronRight, Eye, EyeOff, Layers3 } from 'lucide-react';
import { LuBox, LuCamera, LuCircle, LuLightbulb, LuPackage, LuScanLine } from 'react-icons/lu';

function TypeIcon({ node }) {
  if (node.isMesh) return <LuBox/>;
  if (node.isLight) return <LuLightbulb/>;
  if (node.isCamera) return <LuCamera/>;
  if (node.isScene) return <LuScanLine/>;
  if (node.isGroup) return <LuPackage/>;
  return <LuCircle/>;
}

function TreeItem({ node, selected, onSelect, onVisibilityChange, depth = 0 }) {
  const [open, setOpen] = useState(true);
  return <div>
    <div className={`scene-tree-row ${selected === node ? 'active' : ''}`} style={{ paddingLeft: 10 + depth * 13 }} onClick={() => onSelect(node)} title={node.name || node.type}>
      {node.children?.length ? <button onClick={(event) => { event.stopPropagation(); setOpen(!open); }}>{open ? <ChevronDown size={12}/> : <ChevronRight size={12}/>}</button> : <i/>}
      <span className="scene-tree-icon"><TypeIcon node={node}/></span><span className="scene-tree-name">{node.name || node.type}</span>
      <button className="scene-tree-visibility" title={node.visible ? 'Hide object' : 'Show object'} onClick={(event) => { event.stopPropagation(); node.visible = !node.visible; onVisibilityChange(); }}><span className="sr-only">{node.visible ? 'Hide' : 'Show'} {node.name || node.type}</span>{node.visible ? <Eye size={13}/> : <EyeOff size={13}/>}</button>
    </div>
    {open && node.children?.map((child) => <TreeItem key={child.uuid} node={child} selected={selected} onSelect={onSelect} onVisibilityChange={onVisibilityChange} depth={depth + 1}/>)}
  </div>;
}

export default function SceneGraphSidebar({ root, selected, onSelect, title = 'Scene' }) {
  if (!root) return null;
  let count = 0;
  root.traverse?.(() => { count += 1; });
  const [, refresh] = useState(0);
  return <aside className="scene-graph-sidebar"><header><div><span>WORKSPACE</span><h2><Layers3 size={15}/> {title}</h2></div><b>{count}</b></header><div className="scene-graph-tree"><TreeItem node={root} selected={selected} onSelect={onSelect} onVisibilityChange={() => refresh((v) => v + 1)}/></div>
    <style>{`.scene-graph-sidebar{position:absolute;z-index:12;left:16px;top:72px;bottom:16px;width:250px;background:rgba(255,255,255,.95);border:1px solid #e7e8ef;border-radius:13px;box-shadow:0 12px 38px #24233b12;backdrop-filter:blur(16px);font:12px Inter,system-ui,sans-serif;color:#303240;overflow:hidden;display:flex;flex-direction:column}.scene-graph-sidebar header{display:flex;justify-content:space-between;align-items:center;padding:14px;border-bottom:1px solid #eeeef3}.scene-graph-sidebar header span{font-size:8px;letter-spacing:1.2px;color:#999daa;font-weight:700}.scene-graph-sidebar header h2{display:flex;align-items:center;gap:7px;margin:5px 0 0;font-size:13px}.scene-graph-sidebar header h2 svg{color:#7769d5}.scene-graph-sidebar header>b{font-size:9px;font-weight:500;color:#898d99;background:#f2f2f6;border-radius:10px;padding:4px 7px}.scene-graph-tree{padding:8px 5px;overflow:auto}.scene-tree-row{height:29px;display:flex;align-items:center;gap:6px;padding-right:7px;border-radius:5px;color:#5c606d;cursor:pointer;font-size:10px}.scene-tree-row:hover{background:#f3f2fa}.scene-tree-row.active{background:#ece9ff;color:#5b4cb9;font-weight:650;box-shadow:inset 2px 0 #7667df}.scene-tree-row button{border:0;background:none;padding:0;width:12px;height:16px;color:#989ba6;display:grid;place-items:center;cursor:pointer}.scene-tree-row button.scene-tree-visibility{width:20px;height:22px;border-radius:4px;opacity:0;color:#858997}.scene-tree-row:hover button.scene-tree-visibility,.scene-tree-row button.scene-tree-visibility:focus{opacity:1}.scene-tree-row button.scene-tree-visibility:hover{background:#e8e6f5;color:#6355c5}.scene-tree-row i{width:12px}.scene-tree-icon{font-size:13px;color:#8275df;width:15px;display:grid;place-items:center}.scene-tree-name{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1}.scene-tree-sidebar .sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}@media(max-width:640px){.scene-graph-sidebar{top:60px;bottom:10px;left:8px;width:205px;max-height:52vh}}`}</style>
  </aside>;
}
