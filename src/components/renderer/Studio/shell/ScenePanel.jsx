import { useState } from "react";
import PropTypes from "prop-types";
import { ChevronDown, ChevronLeft, ChevronRight, Eye, EyeOff, Layers3 } from "lucide-react";
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

TypeIcon.propTypes = {
  node: PropTypes.object.isRequired,
};

function TreeItem({ node, depth, selected, onSelect, onRefresh }) {
  const [open, setOpen] = useState(true);
  const children = node.children || [];
  return (
    <div className="tree-node">
      <div
        className={`tree-row${selected === node ? " is-selected" : ""}`}
        style={{ paddingLeft: `${8 + depth * 13}px` }}
        role="treeitem"
        aria-selected={selected === node}
        aria-expanded={children.length ? open : undefined}
        tabIndex={0}
        title={node.name || node.type}
        onClick={() => onSelect(node)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onSelect(node);
          }
        }}
      >
        {children.length ? (
          <button
            type="button"
            className="tree-caret"
            aria-label={open ? "Collapse children" : "Expand children"}
            onClick={(event) => {
              event.stopPropagation();
              setOpen(!open);
            }}
          >
            {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>
        ) : (
          <i className="tree-caret-space" />
        )}
        <span className="tree-type">
          <TypeIcon node={node} />
        </span>
        <span className="tree-label">{node.name || node.type}</span>
        <button
          type="button"
          className="tree-eye"
          title={node.visible ? "Hide object" : "Show object"}
          aria-label={`${node.visible ? "Hide" : "Show"} ${node.name || node.type}`}
          onClick={(event) => {
            event.stopPropagation();
            node.visible = !node.visible;
            onRefresh();
          }}
        >
          {node.visible ? <Eye size={13} /> : <EyeOff size={13} />}
        </button>
      </div>
      {open &&
        children.map((child) => (
          <TreeItem
            key={child.uuid}
            node={child}
            depth={depth + 1}
            selected={selected}
            onSelect={onSelect}
            onRefresh={onRefresh}
          />
        ))}
    </div>
  );
}

export default function ScenePanel({ open, onClose, root, selected, onSelect, title = "Scene" }) {
  const [, refresh] = useState(0);
  let count = 0;
  root.traverse?.(() => {
    count += 1;
  });

  return (
    <aside
      className={`studio-panel studio-panel-left${open ? "" : " is-hidden"}`}
      aria-label="Scene graph"
      aria-hidden={!open}
    >
      <header className="panel-head">
        <div className="panel-head-copy">
          <span className="panel-kicker">Workspace</span>
          <h2 className="panel-title">
            <Layers3 size={14} /> {title}
          </h2>
        </div>
        <div className="panel-head-actions">
          <b className="panel-count">{count}</b>
          <button
            type="button"
            className="panel-close"
            onClick={onClose}
            title="Hide scene graph"
            aria-label="Hide scene graph"
          >
            <ChevronLeft size={15} />
          </button>
        </div>
      </header>
      <div className="panel-body" role="tree">
        <TreeItem
          node={root}
          depth={0}
          selected={selected}
          onSelect={onSelect}
          onRefresh={() => refresh((value) => value + 1)}
        />
      </div>
    </aside>
  );
}

ScenePanel.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  root: PropTypes.object.isRequired,
  selected: PropTypes.object,
  onSelect: PropTypes.func,
  title: PropTypes.string,
};

TreeItem.propTypes = {
  node: PropTypes.object.isRequired,
  depth: PropTypes.number.isRequired,
  selected: PropTypes.object,
  onSelect: PropTypes.func,
  onRefresh: PropTypes.func,
};
