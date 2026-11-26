import { useRef, useState } from "react";
import PropTypes from "prop-types";
import { Box, Lightbulb, Shapes, Spline, Type, X } from "lucide-react";
import { LuBox, LuUpload } from "react-icons/lu";
import STUDIO_LIBRARY from "./library";
import { PRIMITIVES } from "./primitives";
import { LIGHTS } from "./lights";
import { CURVES } from "./curves";

const TABS = [
  { key: "models", label: "Models", Icon: Box },
  { key: "meshes", label: "Meshes", Icon: Shapes },
  { key: "lights", label: "Lights", Icon: Lightbulb },
  { key: "text", label: "Text", Icon: Type },
  { key: "curves", label: "Curves", Icon: Spline },
];

const sourceLabel = (model) => {
  if (model.light) return "Light";
  if (model.text) return "Text";
  if (model.curve) return "Curve";
  if (model.primitive) return "Mesh";
  return model.source === "upload" ? "Uploaded" : "Library";
};

/**
 * Resource Manager docked under the scene tree: insert a built-in model, add a
 * basic mesh, lamp, 3D text or curve, or upload GLB/GLTF files. Adds are split
 * into tabs so the manager shows one object type at a time, like Blender's Add
 * menu. Uploads never leave the browser.
 */
export default function ResourceManager({
  models,
  selected,
  onSelect,
  onToggle,
  onRemove,
  onInsert,
  onPrimitive,
  onLight,
  onCurve,
  onText,
  onFiles,
  onPick,
}) {
  const [dragging, setDragging] = useState(false);
  const [tab, setTab] = useState("models");
  const [text, setText] = useState("Text");
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

  const submitText = (event) => {
    event.preventDefault();
    onText(text.trim() || "Text");
  };

  return (
    <section className="studio-resources" aria-label="Resource manager">
      <header className="resource-head">
        <span className="resource-kicker">Add</span>
        <b className="panel-count">{models.length}</b>
      </header>

      <div className="resource-tabs" role="tablist" aria-label="Add object">
        {TABS.map(({ key, label, Icon }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            className={tab === key ? "is-active" : ""}
            title={label}
            onClick={() => setTab(key)}
          >
            <Icon size={13} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      <div className="resource-pane" role="tabpanel" aria-label="Add object">
        {tab === "models" && (
          <>
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
            <div className="resource-grid">
              {STUDIO_LIBRARY.map((item) => (
                <button key={item.key} type="button" onClick={() => onInsert(item)}>
                  <Box size={14} />
                  <span>{item.name}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {tab === "meshes" && (
          <div className="resource-grid">
            {PRIMITIVES.map((item) => (
              <button key={item.key} type="button" onClick={() => onPrimitive(item)}>
                <Shapes size={14} />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        )}

        {tab === "lights" && (
          <div className="resource-grid">
            {LIGHTS.map((item) => (
              <button key={item.key} type="button" onClick={() => onLight(item)}>
                <Lightbulb size={14} />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        )}

        {tab === "text" && (
          <form className="resource-text-row" onSubmit={submitText}>
            <input
              type="text"
              value={text}
              aria-label="Text to add"
              placeholder="Your text"
              onChange={(event) => setText(event.target.value)}
            />
            <button type="submit">Add</button>
          </form>
        )}

        {tab === "curves" && (
          <div className="resource-grid">
            {CURVES.map((item) => (
              <button key={item.key} type="button" onClick={() => onCurve(item)}>
                <Spline size={14} />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="resource-list-wrap">
        <span className="resource-kicker">In scene</span>
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
                  <small>{sourceLabel(model)}</small>
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
  onPrimitive: PropTypes.func.isRequired,
  onLight: PropTypes.func.isRequired,
  onCurve: PropTypes.func.isRequired,
  onText: PropTypes.func.isRequired,
  onFiles: PropTypes.func.isRequired,
  onPick: PropTypes.func.isRequired,
};
