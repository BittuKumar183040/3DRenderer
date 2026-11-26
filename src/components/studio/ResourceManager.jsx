import { useRef, useState } from "react";
import PropTypes from "prop-types";
import {
  Asterisk,
  Box,
  ChevronDown,
  Circle,
  CircleDashed,
  CircleDot,
  Cylinder,
  Flashlight,
  Library,
  Lightbulb,
  Orbit,
  Pill,
  Shapes,
  Spline,
  Square,
  Sun,
  SunDim,
  Triangle,
  Type,
  Waves,
} from "lucide-react";
import { LuUpload } from "react-icons/lu";
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

/** One recognisable glyph per addable object, so the tiles read at a glance. */
const MESH_ICONS = {
  cube: Box,
  sphere: Circle,
  cylinder: Cylinder,
  cone: Triangle,
  capsule: Pill,
  torus: CircleDot,
  knot: Asterisk,
  plane: Square,
};

const LIGHT_ICONS = {
  point: Lightbulb,
  spot: Flashlight,
  sun: Sun,
  ambient: SunDim,
};

const CURVE_ICONS = {
  bezier: Spline,
  helix: Orbit,
  wave: Waves,
  circle: CircleDashed,
};

/**
 * Resource Manager docked under the scene tree: insert a built-in model, add a
 * basic mesh, lamp, 3D text or curve, or upload GLB/GLTF files. Adds are split
 * into tabs so the manager shows one object type at a time, like Blender's Add
 * menu. Uploads never leave the browser.
 */
export default function ResourceManager({
  models,
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
  const [libraryOpen, setLibraryOpen] = useState(false);
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

            <button
              type="button"
              className="resource-library-toggle"
              aria-expanded={libraryOpen}
              onClick={() => setLibraryOpen((value) => !value)}
            >
              <Library size={15} />
              <span>
                <b>Pick from library</b>
                <small>{STUDIO_LIBRARY.length} ready-made models</small>
              </span>
              <ChevronDown className="resource-library-caret" size={13} />
            </button>

            {libraryOpen && (
              <div className="resource-grid">
                {STUDIO_LIBRARY.map((item) => (
                  <button key={item.key} type="button" onClick={() => onInsert(item)}>
                    <Box size={14} />
                    <span>{item.name}</span>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {tab === "meshes" && (
          <div className="resource-grid">
            {PRIMITIVES.map((item) => {
              const Icon = MESH_ICONS[item.key] || Shapes;
              return (
                <button key={item.key} type="button" onClick={() => onPrimitive(item)}>
                  <Icon size={14} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {tab === "lights" && (
          <div className="resource-grid">
            {LIGHTS.map((item) => {
              const Icon = LIGHT_ICONS[item.key] || Lightbulb;
              return (
                <button key={item.key} type="button" onClick={() => onLight(item)}>
                  <Icon size={14} />
                  <span>{item.label}</span>
                </button>
              );
            })}
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
            {CURVES.map((item) => {
              const Icon = CURVE_ICONS[item.key] || Spline;
              return (
                <button key={item.key} type="button" onClick={() => onCurve(item)}>
                  <Icon size={14} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

ResourceManager.propTypes = {
  models: PropTypes.array.isRequired,
  onInsert: PropTypes.func.isRequired,
  onPrimitive: PropTypes.func.isRequired,
  onLight: PropTypes.func.isRequired,
  onCurve: PropTypes.func.isRequired,
  onText: PropTypes.func.isRequired,
  onFiles: PropTypes.func.isRequired,
  onPick: PropTypes.func.isRequired,
};
