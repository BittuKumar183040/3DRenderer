import { useState } from "react";
import { ChevronDown, ChevronRight, Eye, EyeOff, Layers3 } from "lucide-react";
import {
  LuBox,
  LuCamera,
  LuCircle,
  LuLightbulb,
  LuPackage,
  LuScanLine,
} from "react-icons/lu";

function TypeIcon({ node }) {
  if (node.isMesh) return <LuBox />;
  if (node.isLight) return <LuLightbulb />;
  if (node.isCamera) return <LuCamera />;
  if (node.isScene) return <LuScanLine />;
  if (node.isGroup) return <LuPackage />;
  return <LuCircle />;
}

function TreeItem({ node, selected, onSelect, onVisibilityChange, depth = 0 }) {
  const [open, setOpen] = useState(true);
  return (
    <div>
      <div
        className={`tree-row group flex h-[29px] cursor-pointer items-center gap-1.5 rounded-md pr-2 text-[10px] text-[#5c606d] hover:bg-[#f3f2fa] ${selected === node ? "bg-[#ece9ff] font-semibold text-[#5b4cb9] shadow-[inset_2px_0_#7667df]" : ""}`}
        style={{ paddingLeft: 10 + depth * 13 }}
        onClick={() => onSelect(node)}
        title={node.name || node.type}
      >
        {node.children?.length ? (
          <button
            onClick={(event) => {
              event.stopPropagation();
              setOpen(!open);
            }}
            className="grid h-4 w-3 place-items-center border-0 bg-transparent p-0 text-[#989ba6]"
          >
            {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>
        ) : (
          <i className="w-3 shrink-0" />
        )}
        <span className="grid w-[15px] shrink-0 place-items-center text-[13px] text-[#8275df]">
          <TypeIcon node={node} />
        </span>
        <span className="flex-1 truncate">{node.name || node.type}</span>
        <button
          className="grid h-[22px] w-5 shrink-0 place-items-center rounded border-0 bg-transparent p-0 text-[#858997] opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-[#e8e6f5] hover:text-[#6355c5]"
          title={node.visible ? "Hide object" : "Show object"}
          onClick={(event) => {
            event.stopPropagation();
            node.visible = !node.visible;
            onVisibilityChange();
          }}
        >
          <span className="sr-only">
            {node.visible ? "Hide" : "Show"} {node.name || node.type}
          </span>
          {node.visible ? <Eye size={13} /> : <EyeOff size={13} />}
        </button>
      </div>
      {open &&
        node.children?.map((child) => (
          <TreeItem
            key={child.uuid}
            node={child}
            selected={selected}
            onSelect={onSelect}
            onVisibilityChange={onVisibilityChange}
            depth={depth + 1}
          />
        ))}
    </div>
  );
}

export default function SceneGraphSidebar({
  root,
  selected,
  onSelect,
  title = "Scene",
}) {
  if (!root) return null;
  let count = 0;
  root.traverse?.(() => {
    count += 1;
  });
  const [, refresh] = useState(0);
  return (
    <aside className="scene-sidebar absolute bottom-4 left-4 top-[72px] z-[12] flex w-[250px] flex-col overflow-hidden rounded-[13px] border border-[#e7e8ef] bg-white/[.95] text-xs text-[#303240] shadow-[0_12px_38px_#24233b12] backdrop-blur-2xl max-[640px]:bottom-[10px] max-[640px]:left-2 max-[640px]:top-[60px] max-[640px]:max-h-[52vh] max-[640px]:w-[205px]">
      <header className="flex items-center justify-between border-b border-[#eeeef3] p-[14px]">
        <div>
          <span className="text-[8px] font-bold tracking-[1.2px] text-[#999daa]">WORKSPACE</span>
          <h2 className="mt-[5px] flex items-center gap-[7px] text-[13px]">
            <Layers3 size={15} /> {title}
          </h2>
        </div>
        <b className="rounded-full bg-[#f2f2f6] px-[7px] py-1 text-[9px] font-medium text-[#898d99]">{count}</b>
      </header>
      <div className="flex-1 overflow-auto px-[5px] py-2">
        <TreeItem
          node={root}
          selected={selected}
          onSelect={onSelect}
          onVisibilityChange={() => refresh((v) => v + 1)}
        />
      </div>
    </aside>
  );
}
