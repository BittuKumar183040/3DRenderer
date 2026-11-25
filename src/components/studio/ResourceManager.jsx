import { useRef, useState } from "react";
import PropTypes from "prop-types";
import { X } from "lucide-react";
import { LuBox, LuUpload } from "react-icons/lu";
import STUDIO_LIBRARY from "./library";

/**
 * Resource Manager docked under the scene tree: insert a built-in model or
 * upload GLB/GLTF files. Uploads never leave the browser.
 */
export default function ResourceManager({
  models,
  selected,
  onSelect,
  onToggle,
  onRemove,
  onInsert,
  onFiles,
  onPick,
}) {
  const [dragging, setDragging] = useState(false);
  const depth = useRef(0);

  const acceptsFiles = (event) =>
    Array.from(event.dataTransfer?.types || []).includes("Files");

  const onDragEnter = (event) => {
    if (!acceptsFiles(event)) return;
    event.stopPropagation();
    depth.current += 1;
    setDragging(true);
  };

  const onDragOver = (event) => {
    if (!acceptsFiles(event)) return;
    event.preventDefault();
    event.stopPropagation();
    setDragging(true);
  };

  const onDragLeave = (event) => {
    event.stopPropagation();
    depth.current = Math.max(0, depth.current - 1);
    if (depth.current === 0) setDragging(false);
  };

  const onDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    depth.current = 0;
    setDragging(false);
    onFiles(Array.from(event.dataTransfer?.files || []));
  };

  return (
    <section className="studio-resources" aria-label="Resource manager">
      <header className="resource-head">
        <span className="resource-kicker">Resource manager</span>
        <b className="panel-count">{models.length}</b>
      </header>

      <button
        type="button"
        className={`resource-drop${dragging ? " is-drag" : ""}`}
        onClick={onPick}
        onDragEnter={onDragEnter}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <LuUpload size={15} />
        <span>
          <b>Upload model</b>
          <small>GLB · GLTF · FBX · OBJ · STL · PLY · SVG</small>
        </span>
      </button>

      <div className="resource-library">
        <span className="resource-kicker">Insert from library</span>
        <div className="resource-library-row">
          {STUDIO_LIBRARY.map((item) => (
            <button key={item.key} type="button" onClick={() => onInsert(item)}>
              {item.name}
            </button>
          ))}
        </div>
      </div>

      <div className="resource-list">
        {models.length === 0 && (
          <p className="resource-empty">No models yet — add one to start.</p>
        )}
        {models.map((model) => {
          const visible = model.object ? model.object.visible : model.visible;
          const isSelected =
            selected && model.object
              ? selected === model.object ||
                (() => {
                  for (let node = selected; node; node = node.parent) {
                    if (node === model.object) return true;
                  }
                  return false;
                })()
              : false;
          return (
            <div
              key={model.id}
              className={`resource-item${isSelected ? " is-selected" : ""}`}
              role="button"
              tabIndex={0}
              title={model.name}
              onClick={() => model.object && onSelect(model.object)}
              onKeyDown={(event) => {
                if ((event.key === "Enter" || event.key === " ") && model.object) {
                  event.preventDefault();
                  onSelect(model.object);
                }
              }}
            >
              <span className="resource-icon">
                <LuBox />
              </span>
              <span className="resource-meta">
                <b>{model.name}</b>
                <small>{model.source === "upload" ? "Uploaded" : "Library"}</small>
              </span>
              <span className="resource-format">{model.format}</span>
              <button
                type="button"
                className="resource-action"
                title={visible ? "Hide model" : "Show model"}
                aria-label={`${visible ? "Hide" : "Show"} ${model.name}`}
                onClick={(event) => {
                  event.stopPropagation();
                  onToggle(model.id);
                }}
              >
                <i className={`resource-eye${visible ? " is-on" : ""}`} />
              </button>
              <button
                type="button"
                className="resource-action"
                title="Remove model"
                aria-label={`Remove ${model.name}`}
                onClick={(event) => {
                  event.stopPropagation();
                  onRemove(model.id);
                }}
              >
                <X size={13} />
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

ResourceManager.propTypes = {
  models: PropTypes.array.isRequired,
  selected: PropTypes.object,
  onSelect: PropTypes.func.isRequired,
  onToggle: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  onInsert: PropTypes.func.isRequired,
  onFiles: PropTypes.func.isRequired,
  onPick: PropTypes.func.isRequired,
};
