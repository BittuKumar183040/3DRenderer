import { useState } from "react";
import PropTypes from "prop-types";
import { ChevronDown, ChevronLeft, ChevronRight, Eye, EyeOff, Layers3 } from "lucide-react";
import { LuBox, LuCamera, LuCircle, LuLightbulb, LuPackage, LuScanLine } from "react-icons/lu";
import ResourceManager from "./ResourceManager";

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

function NodeRow({ node, depth, selected, onSelect, onToggleNode, onRefresh }) {
  const [open, setOpen] = useState(depth === 0);
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
            onToggleNode(node);
            onRefresh();
          }}
        >
          {node.visible ? <Eye size={13} /> : <EyeOff size={13} />}
        </button>
      </div>
      {open &&
        children.map((child) => (
          <NodeRow
            key={child.uuid}
            node={child}
            depth={depth + 1}
            selected={selected}
            onSelect={onSelect}
            onToggleNode={onToggleNode}
            onRefresh={onRefresh}
          />
        ))}
    </div>
  );
}

NodeRow.propTypes = {
  node: PropTypes.object.isRequired,
  depth: PropTypes.number.isRequired,
  selected: PropTypes.object,
  onSelect: PropTypes.func.isRequired,
  onToggleNode: PropTypes.func.isRequired,
  onRefresh: PropTypes.func.isRequired,
};

/**
 * Left dock: the scene graph for every inserted model, with the Resource
 * Manager section underneath for uploads and library models.
 */
export default function ModelSidebar({
  open,
  onClose,
  models,
  selected,
  onSelect,
  onToggleModel,
  onRemove,
  onInsert,
  onFiles,
  onPick,
}) {
  const [, refresh] = useState(0);
  const bump = () => refresh((value) => value + 1);

  const toggleNode = (node) => {
    const id = node.userData?.studioModelId;
    if (id) {
      onToggleModel(id);
      return;
    }
    node.visible = !node.visible;
    bump();
  };

  const meshCount = models.reduce((total, model) => {
    let count = 0;
    model.object?.traverse?.((node) => {
      if (node.isMesh) count += 1;
    });
    return total + count;
  }, 0);

  return (
    <aside
      className={`studio-panel studio-panel-left studio-assets${open ? "" : " is-hidden"}`}
      aria-label="Scene and resources"
      aria-hidden={!open}
    >
      <header className="panel-head">
        <div className="panel-head-copy">
          <span className="panel-kicker">Scene</span>
          <h2 className="panel-title">
            <Layers3 size={14} /> Objects
          </h2>
        </div>
        <div className="panel-head-actions">
          <b className="panel-count">{meshCount}</b>
          <button
            type="button"
            className="panel-close"
            onClick={onClose}
            title="Hide scene panel"
            aria-label="Hide scene panel"
          >
            <ChevronLeft size={15} />
          </button>
        </div>
      </header>

      <div className="panel-body studio-assets-tree" role="tree">
        {models.length === 0 && (
          <p className="studio-tree-empty">
            Your scene is empty. Add a model from the resource manager below.
          </p>
        )}
        {models.map((model) =>
          model.object ? (
            <NodeRow
              key={model.id}
              node={model.object}
              depth={0}
              selected={selected}
              onSelect={onSelect}
              onToggleNode={toggleNode}
              onRefresh={bump}
            />
          ) : (
            <div className="tree-row is-loading" key={model.id}>
              <i className="tree-caret-space" />
              <span className="tree-type">
                <LuBox />
              </span>
              <span className="tree-label">{model.name}</span>
              <small>loading…</small>
            </div>
          )
        )}
      </div>

      <ResourceManager
        models={models}
        selected={selected}
        onSelect={onSelect}
        onToggle={onToggleModel}
        onRemove={onRemove}
        onInsert={onInsert}
        onFiles={onFiles}
        onPick={onPick}
      />
    </aside>
  );
}

ModelSidebar.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  models: PropTypes.array.isRequired,
  selected: PropTypes.object,
  onSelect: PropTypes.func.isRequired,
  onToggleModel: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  onInsert: PropTypes.func.isRequired,
  onFiles: PropTypes.func.isRequired,
  onPick: PropTypes.func.isRequired,
};
