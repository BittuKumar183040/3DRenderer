import { useCallback, useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import * as THREE from "three";
import { Layers3, Library, SlidersHorizontal, UploadCloud, X } from "lucide-react";
import ViewerBrand from "../renderer/Studio/shell/ViewerBrand";
import ViewerToolbar from "../renderer/Studio/shell/ViewerToolbar";
import LoadingOverlay from "../renderer/Studio/shell/LoadingOverlay";
import useMediaQuery from "../renderer/Studio/shell/useMediaQuery";
import StudioCanvas from "./StudioCanvas";
import ModelSidebar from "./ModelSidebar";
import CursorMenu from "./CursorMenu";
import TransformBar from "./TransformBar";
import ExportMenu from "./ExportMenu";
import SelectionPanel from "./SelectionPanel";
import MultiSelectionPanel from "./MultiSelectionPanel";
import PrimitiveDialog from "./PrimitiveDialog";
import STUDIO_LIBRARY from "./library";
import { PRIMITIVES } from "./primitives";
import {
  BOOLEAN_LABELS,
  booleanMeshes,
  collectMeshes,
  dropToGround,
  duplicateObject,
  extrudeGeometry,
} from "./meshEdit";
import {
  MODEL_ACCEPT,
  MODEL_LABEL,
  formatOf,
  isSupportedModel,
  releaseModel,
} from "./loadModel";
import "../renderer/Studio/studio.css";
import "./studio-page.css";

let uid = 0;
const nextId = () => {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  uid += 1;
  return `model-${Date.now()}-${uid}`;
};

const roundPoint = (value) => Math.round(value * 100) / 100;

/** Model id of the inserted object a node belongs to, if any. */
function modelIdOf(node) {
  for (let current = node; current; current = current.parent) {
    if (current.userData?.studioModelId) return current.userData.studioModelId;
  }
  return null;
}

const isDescendant = (parent, node) => {
  for (let current = node?.parent; current; current = current.parent) {
    if (current === parent) return true;
  }
  return false;
};

/**
 * Blank-canvas studio: insert models (glTF, FBX, OBJ, STL, PLY, SVG) onto a
 * grid, position them at the 3D cursor, transform the selection with the
 * viewport gizmo, inspect them, then capture the viewport.
 */
export default function StudioPage({ onExit }) {
  const compact = useMediaQuery("(max-width: 760px)");

  const [models, setModels] = useState([]);
  const [sceneRoot, setSceneRoot] = useState(null);
  const [selection, setSelection] = useState([]);
  const [brightness, setBrightness] = useState(2);
  const [brightnessMax, setBrightnessMax] = useState(10);
  const [fitKey, setFitKey] = useState(0);
  const [cameraView, setCameraView] = useState({ dir: "iso", n: 0 });
  const [cursor, setCursor] = useState([0, 0, 0]);
  const [cursorHold, setCursorHold] = useState(false);
  const [transformMode, setTransformMode] = useState("translate");
  const [view, setView] = useState({
    grid: true,
    isolate: false,
    wireframe: false,
    autoRotate: false,
    cursor: true,
    helpers: true,
  });

  const [sceneOpen, setSceneOpen] = useState(!compact);
  const [inspectorOpen, setInspectorOpen] = useState(!compact);
  const [dragging, setDragging] = useState(false);
  const [notice, setNotice] = useState("");
  const [emptyDismissed, setEmptyDismissed] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [primitiveItem, setPrimitiveItem] = useState(null);

  const dragDepth = useRef(0);
  const uploadedUrls = useRef(new Set());
  const fileInputRef = useRef(null);
  const topbarRef = useRef(null);
  const cursorRef = useRef(cursor);
  const cursorApi = useRef(null);
  const focusApi = useRef(null);
  const selectionRef = useRef(selection);
  const keyActions = useRef({});
  const [topbarHeight, setTopbarHeight] = useState(64);

  const selected = selection[0] || null;
  const readyKey = models.map((model) => (model.object ? "1" : "0")).join("");

  useEffect(() => {
    cursorRef.current = cursor;
  }, [cursor]);

  useEffect(() => {
    selectionRef.current = selection;
  }, [selection]);

  useEffect(() => {
    setSceneOpen(!compact);
    setInspectorOpen(!compact);
  }, [compact]);

  useEffect(() => {
    if (!selection.length) return;
    setInspectorOpen(true);
    if (compact) setSceneOpen(false);
    // Only the arrival of a selection should open the dock, not every edit.
  }, [selection.length, compact]);

  useEffect(() => {
    const node = topbarRef.current;
    if (!node || typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(() => {
      setTopbarHeight(node.getBoundingClientRect().height + 22);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(""), 3600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    models.forEach((model) => {
      model.object?.traverse?.((node) => {
        if (!node.isMesh) return;
        const materials = Array.isArray(node.material) ? node.material : [node.material];
        materials.forEach((material) => {
          if (material && "wireframe" in material) material.wireframe = view.wireframe;
        });
      });
    });
  }, [models, view.wireframe]);

  const urls = uploadedUrls.current;
  useEffect(
    () => () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
      urls.clear();
    },
    [urls]
  );

  const placeCursor = useCallback((position) => setCursor(position), []);
  const handleCursorHold = useCallback((holding) => setCursorHold(holding), []);

  // Shift-click extends the selection with a secondary object; a plain click
  // replaces it and clicking empty space clears it.
  const handleSelect = useCallback((object, event) => {
    setSelection((prev) => {
      if (!object) return event?.shiftKey ? prev : [];
      if (event?.shiftKey) {
        if (prev.includes(object)) return prev.filter((item) => item !== object);
        return [...prev, object];
      }
      return [object];
    });
  }, []);

  const addModels = useCallback((entries) => {
    if (!entries.length) return;
    const point = cursorRef.current;
    setModels((prev) => [
      ...prev,
      ...entries.map((entry) => ({
        ...entry,
        id: nextId(),
        // Every object lands exactly where the 3D cursor is, like Blender's
        // Add menu, until the cursor is moved somewhere else.
        position: [...point],
        object: null,
        visible: true,
      })),
    ]);
    setFitKey((value) => value + 1);
    setNotice("");
  }, []);

  // Adds an already-built object (group, duplicate, boolean result) as a new
  // scene entry without any loading or normalising.
  const addBuiltObject = useCallback((object, name) => {
    const id = nextId();
    object.userData = { ...object.userData, studioModelId: id };
    setModels((prev) => [
      ...prev,
      {
        id,
        name: name || object.name || "Object",
        builtObject: object,
        position: [0, 0, 0],
        object: null,
        visible: true,
        format: "Mesh",
        source: "primitive",
      },
    ]);
    return object;
  }, []);

  const addFiles = useCallback(
    (files) => {
      if (!files?.length) return;
      const accepted = files.filter((file) => isSupportedModel(file.name));
      const entries = accepted.map((file) => {
        const url = URL.createObjectURL(file);
        uploadedUrls.current.add(url);
        const ext = formatOf(file.name);
        return {
          name: file.name.replace(/\.[^.]+$/, ""),
          url,
          ext,
          format: ext.toUpperCase(),
          source: "upload",
        };
      });
      if (entries.length) {
        addModels(entries);
        setSelection([]);
      }
      if (accepted.length !== files.length) {
        setNotice(`Unsupported file format. Add ${MODEL_LABEL} models.`);
      }
    },
    [addModels]
  );

  const insertLibrary = useCallback(
    (item) => {
      addModels([
        {
          name: item.name,
          url: item.url,
          ext: item.ext || item.format.toLowerCase(),
          format: item.format,
          source: "library",
        },
      ]);
    },
    [addModels]
  );

  const insertPrimitive = useCallback(
    (item, params) => {
      addModels([
        {
          name: item.label,
          primitive: item.key,
          params,
          format: "Mesh",
          source: "primitive",
        },
      ]);
    },
    [addModels]
  );

  const requestPrimitive = useCallback((item) => setPrimitiveItem(item), []);

  const insertLight = useCallback(
    (item) => {
      addModels([
        {
          name: `${item.label} light`,
          light: item.key,
          format: "Light",
          source: "primitive",
        },
      ]);
    },
    [addModels]
  );

  const insertCurve = useCallback(
    (item) => {
      addModels([
        {
          name: `${item.label} curve`,
          curve: item.key,
          format: "Curve",
          source: "primitive",
        },
      ]);
    },
    [addModels]
  );

  const insertText = useCallback(
    (value) => {
      addModels([
        {
          name: value,
          textOptions: { value },
          format: "Text",
          source: "primitive",
        },
      ]);
    },
    [addModels]
  );

  const handleReady = useCallback((id, group) => {
    setModels((prev) =>
      prev.map((model) =>
        model.id === id ? { ...model, object: group, visible: group.visible } : model
      )
    );
  }, []);

  const handleDetach = useCallback((id) => {
    setModels((prev) => {
      if (!prev.some((model) => model.id === id && model.object)) return prev;
      return prev.map((model) => (model.id === id ? { ...model, object: null } : model));
    });
  }, []);

  const handleError = useCallback((id, name, message) => {
    setModels((prev) =>
      prev.map((model) =>
        model.id === id ? { ...model, failed: true, object: null } : model
      )
    );
    setNotice(`Could not load “${name}”${message ? ` — ${message}` : ""}.`);
  }, []);

  // Renames the selected object; model roots rename the inserted model itself so
  // the scene tree, inspector and export names all follow along.
  const renameSelection = useCallback(
    (value) => {
      const next = String(value || "").trim();
      if (!next || !selected) return;
      let owner = null;
      for (let node = selected; node; node = node.parent) {
        if (node.userData?.studioModelId) {
          owner = node;
          break;
        }
      }
      if (owner === selected) {
        selected.name = next;
        setModels((prev) =>
          prev.map((model) =>
            model.id === owner.userData.studioModelId ? { ...model, name: next } : model
          )
        );
      } else {
        selected.name = next;
        setModels((prev) =>
          prev.map((model) =>
            model.id === owner?.userData?.studioModelId ? { ...model } : model
          )
        );
      }
      setNotice(`Renamed to “${next}”`);
    },
    [selected]
  );

  // Clicking through a hidden object in the viewport must not select it, and
  // hiding any selected object drops it so the gizmo cannot move something
  // invisible.
  useEffect(() => {
    if (!selection.length) return;
    const visible = selection.filter((object) => {
      for (let node = object; node; node = node.parent) {
        if (node.visible === false) return false;
      }
      return true;
    });
    if (visible.length !== selection.length) setSelection(visible);
  }, [models, selection]);

  const toggleModel = useCallback((id) => {
    setModels((prev) =>
      prev.map((model) => {
        if (model.id !== id || !model.object) return model;
        model.object.visible = !model.object.visible;
        return { ...model, visible: model.object.visible };
      })
    );
  }, []);

  const removeModel = useCallback((id) => {
    setModels((prev) => {
      const target = prev.find((model) => model.id === id);
      if (!target) return prev;
      if (target.source === "upload") {
        uploadedUrls.current.delete(target.url);
        releaseModel(target.url, target.ext);
        window.setTimeout(() => URL.revokeObjectURL(target.url), 0);
      }
      return prev.filter((model) => model.id !== id);
    });
    setSelection((current) =>
      current.filter((object) => modelIdOf(object) !== id)
    );
  }, []);

  // Removes the selected node (or its whole inserted model when a model root is
  // selected) from the scene. Delete/Backspace and the inspector's Delete
  // button both use this, for one or many objects.
  const removeSelection = useCallback(() => {
    const targets = selectionRef.current.filter(Boolean);
    if (!targets.length) return;
    targets.forEach((target) => {
      if (target === sceneRoot || !target.parent) return;
      if (target.userData?.studioModelId) {
        removeModel(target.userData.studioModelId);
        return;
      }
      const parent = target.parent;
      parent.remove(target);
      // Drop the whole inserted model once its last mesh is gone, so the scene
      // tree does not keep an empty group behind.
      const rootOwnerId = modelIdOf(parent);
      if (rootOwnerId) {
        let hasMesh = false;
        const ownerModel = models.find((model) => model.id === rootOwnerId);
        ownerModel?.object?.traverse?.((node) => {
          if (node.isMesh && !node.userData?.studioHelper) hasMesh = true;
        });
        if (!hasMesh) removeModel(rootOwnerId);
      }
    });
    setSelection([]);
    setNotice(targets.length > 1 ? `Removed ${targets.length} objects` : `Removed ${targets[0].name || targets[0].type}`);
  }, [sceneRoot, removeModel, models]);

  const duplicateSelection = useCallback(() => {
    const objects = selectionRef.current.filter(Boolean);
    if (!objects.length) return;
    const clones = objects.map((object) => {
      const clone = duplicateObject(object);
      clone.position.x += 0.4;
      clone.position.z += 0.4;
      return addBuiltObject(clone, clone.name);
    });
    setSelection(clones);
    setNotice(`Duplicated ${clones.length} object${clones.length > 1 ? "s" : ""}`);
  }, [addBuiltObject]);

  const hideSelection = useCallback(() => {
    const objects = selectionRef.current.filter(Boolean);
    if (!objects.length) return;
    objects.forEach((object) => {
      object.visible = false;
    });
    setSelection([]);
    setModels((prev) => prev.map((model) => ({ ...model })));
    setNotice(`Hid ${objects.length} object${objects.length > 1 ? "s" : ""}`);
  }, []);

  const extrudeSelection = useCallback(() => {
    const objects = selectionRef.current;
    if (!objects.length) return;
    objects.forEach((object) => collectMeshes(object).forEach((mesh) => extrudeGeometry(mesh, 0.08)));
    setSelection((current) => [...current]);
    setNotice("Extruded the selected mesh");
  }, []);

  const groupSelection = useCallback(() => {
    const objects = selectionRef.current.filter(Boolean);
    if (objects.length < 2) {
      setNotice("Select at least two objects to group.");
      return;
    }
    const roots = objects.filter(
      (object) => !objects.some((other) => other !== object && isDescendant(other, object))
    );
    // Collect the owning models before attaching anything: attach() re-parents
    // the objects, which would hide the model id used to find them.
    const consumed = new Set(roots.map(modelIdOf).filter(Boolean));
    const group = new THREE.Group();
    group.name = "Group";
    roots.forEach((object) => group.attach(object));
    setModels((prev) => prev.filter((model) => !consumed.has(model.id)));
    addBuiltObject(group, "Group");
    setSelection([group]);
    setNotice(`Grouped ${roots.length} objects`);
  }, [addBuiltObject]);

  const ungroupSelection = useCallback(() => {
    const group = selectionRef.current[0];
    if (!group?.isGroup || !group.children.length) {
      setNotice("Select a group to ungroup.");
      return;
    }
    group.updateMatrixWorld(true);
    const children = group.children.filter((child) => !child.userData?.studioHelper);
    const detached = children.map((child) => {
      const position = new THREE.Vector3();
      const quaternion = new THREE.Quaternion();
      const scale = new THREE.Vector3();
      child.matrixWorld.decompose(position, quaternion, scale);
      group.remove(child);
      child.position.copy(position);
      child.quaternion.copy(quaternion);
      child.scale.copy(scale);
      child.updateMatrixWorld(true);
      return child;
    });
    const groupId = modelIdOf(group);
    if (groupId) setModels((prev) => prev.filter((model) => model.id !== groupId));
    detached.forEach((child) => addBuiltObject(child, child.name || "Object"));
    setSelection(detached);
    setNotice(`Split into ${detached.length} objects`);
  }, [addBuiltObject]);

  const booleanSelection = useCallback(
    (operation) => {
      const meshes = [];
      selectionRef.current.forEach((object) => {
        meshes.push(...collectMeshes(object));
      });
      if (meshes.length < 2) {
        setNotice("Boolean needs at least two meshes.");
        return;
      }
      let result = null;
      try {
        result = booleanMeshes(meshes, operation);
      } catch (error) {
        setNotice(`Boolean failed${error?.message ? ` — ${error.message}` : ""}.`);
        return;
      }
      if (!result) {
        setNotice("The boolean produced no geometry.");
        return;
      }
      const consumed = new Set();
      meshes.forEach((mesh) => {
        const id = modelIdOf(mesh);
        if (id) consumed.add(id);
      });
      setModels((prev) => prev.filter((model) => !consumed.has(model.id)));
      result.name = BOOLEAN_LABELS[operation];
      addBuiltObject(result, BOOLEAN_LABELS[operation]);
      setSelection([result]);
      setNotice(`${BOOLEAN_LABELS[operation]} applied`);
    },
    [addBuiltObject]
  );

  const moveToCursor = useCallback(() => {
    const objects = selectionRef.current.filter(Boolean);
    if (!objects.length) return;
    const target = new THREE.Vector3(...cursorRef.current);
    const offset = target.clone().sub(objects[0].position);
    objects.forEach((object) => object.position.add(offset));
    setSelection((current) => [...current]);
    setNotice("Moved the selection to the 3D cursor");
  }, []);

  const alignSelection = useCallback(() => {
    const objects = selectionRef.current.filter(Boolean);
    if (objects.length < 2) return;
    const primary = objects[0];
    objects.slice(1).forEach((object) => {
      object.position.x = primary.position.x;
      object.position.z = primary.position.z;
    });
    setSelection((current) => [...current]);
    setNotice("Aligned the selection");
  }, []);

  const dropSelection = useCallback(() => {
    selectionRef.current.forEach((object) => dropToGround(object));
    setSelection((current) => [...current]);
    setNotice("Dropped the selection onto the grid");
  }, []);

  const resetSelectionTransform = useCallback(() => {
    selectionRef.current.forEach((object) => {
      object.rotation.set(0, 0, 0);
      object.scale.set(1, 1, 1);
    });
    setSelection((current) => [...current]);
    setNotice("Reset rotation and scale");
  }, []);

  const removeFromSelection = useCallback((object) => {
    setSelection((current) => current.filter((item) => item !== object));
  }, []);

  useEffect(() => {
    keyActions.current = {
      delete: removeSelection,
      duplicate: duplicateSelection,
      hide: hideSelection,
      extrude: extrudeSelection,
      boolean: () => booleanSelection("union"),
    };
  }, [removeSelection, duplicateSelection, hideSelection, extrudeSelection, booleanSelection]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }
      const key = event.key.toLowerCase();
      if (key === "g") setTransformMode("translate");
      else if (key === "r") setTransformMode("rotate");
      else if (key === "s") setTransformMode("scale");
      else if (key === "escape") setSelection([]);
      else if (key === "d") {
        event.preventDefault();
        keyActions.current.duplicate?.();
      } else if (key === "e") {
        event.preventDefault();
        keyActions.current.extrude?.();
      } else if (key === "h") {
        event.preventDefault();
        keyActions.current.hide?.();
      } else if (key === "b") {
        event.preventDefault();
        keyActions.current.boolean?.();
      } else if (key === "f") {
        if (selectionRef.current[0]) focusApi.current?.focus(selectionRef.current[0]);
      } else if (key === "i") {
        setView((current) => ({ ...current, isolate: !current.isolate }));
      } else if (key === "delete" || key === "backspace" || key === "x") {
        event.preventDefault();
        keyActions.current.delete?.();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const toggleView = (key) =>
    setView((current) => ({ ...current, [key]: !current[key] }));

  // On small screens both docks are bottom sheets, so only one may be open.
  const toggleScene = () => {
    const next = !sceneOpen;
    setSceneOpen(next);
    if (next && compact) setInspectorOpen(false);
  };

  const toggleInspector = () => {
    const next = !inspectorOpen;
    setInspectorOpen(next);
    if (next && compact) setSceneOpen(false);
  };

  const resetScene = () => {
    setSelection([]);
    setView((current) => ({ ...current, isolate: false }));
    setCameraView((current) => ({ dir: "iso", n: current.n + 1 }));
    setFitKey((value) => value + 1);
  };

  const resetCursor = useCallback(() => setCursor([0, 0, 0]), []);

  const cursorToSelection = useCallback(() => {
    if (!selected) return;
    selected.updateWorldMatrix?.(true, false);
    const { elements } = selected.matrixWorld;
    setCursor([
      roundPoint(elements[12]),
      roundPoint(elements[13]),
      roundPoint(elements[14]),
    ]);
  }, [selected]);

  const cursorToView = useCallback(() => {
    const center = cursorApi.current?.center?.();
    if (!center) return;
    setCursor(center.map(roundPoint));
  }, []);

  const openPicker = () => fileInputRef.current?.click();

  const acceptsFiles = (event) =>
    Array.from(event.dataTransfer?.types || []).includes("Files");

  const onDragEnter = (event) => {
    if (!acceptsFiles(event)) return;
    dragDepth.current += 1;
    setDragging(true);
  };

  const onDragOver = (event) => {
    if (!acceptsFiles(event)) return;
    event.preventDefault();
    setDragging(true);
  };

  const onDragLeave = () => {
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setDragging(false);
  };

  const onDrop = (event) => {
    event.preventDefault();
    dragDepth.current = 0;
    setDragging(false);
    addFiles(Array.from(event.dataTransfer?.files || []));
  };

  const latestModel = models[models.length - 1];

  return (
    <div
      className="studio-shell studio-page"
      style={{ "--studio-top": `${Math.round(topbarHeight)}px` }}
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className="studio-canvas">
        <StudioCanvas
          models={models}
          sceneRoot={sceneRoot}
          brightness={brightness}
          view={view}
          cursor={cursor}
          cameraView={cameraView}
          fitKey={fitKey}
          readyKey={readyKey}
          selected={selected}
          selection={selection}
          transformMode={transformMode}
          scenePanelOpen={sceneOpen}
          cursorApi={cursorApi}
          focusApi={focusApi}
          onSelect={handleSelect}
          onReady={handleReady}
          onDetach={handleDetach}
          onError={handleError}
          onScene={setSceneRoot}
          onPlaceCursor={placeCursor}
          onCursorHold={handleCursorHold}
        />
      </div>

      {models.length === 0 && !emptyDismissed && (
        <div className="studio-empty">
          <div className="studio-empty-card">
            <button
              type="button"
              className="studio-empty-close"
              onClick={() => setEmptyDismissed(true)}
              title="Continue with a blank canvas"
              aria-label="Continue with a blank canvas"
            >
              <X size={14} />
            </button>
            <span className="studio-empty-badge">Blank canvas</span>
            <h1>Start your scene</h1>
            <p>
              Drop a 3D model anywhere, pick one from the library, or add a basic
              mesh. New models appear at the 3D cursor. Everything stays on your
              device.
            </p>
            <div className="studio-empty-actions">
              <button type="button" className="st-btn is-primary" onClick={openPicker}>
                <UploadCloud size={14} /> Upload model
              </button>
              <button
                type="button"
                className={`st-btn is-secondary${pickerOpen ? " is-active" : ""}`}
                aria-expanded={pickerOpen}
                onClick={() => setPickerOpen((value) => !value)}
              >
                <Library size={14} /> Pick from library
              </button>
            </div>
            {pickerOpen && (
              <div className="studio-empty-picker">
                <span className="studio-empty-picker-label">Library</span>
                <div className="studio-empty-picker-row">
                  {STUDIO_LIBRARY.map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => insertLibrary(item)}
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
                <span className="studio-empty-picker-label">Basic meshes</span>
                <div className="studio-empty-picker-row">
                  {PRIMITIVES.map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => requestPrimitive(item)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <small>{MODEL_LABEL}</small>
          </div>
        </div>
      )}

      <div className="studio-topbar" ref={topbarRef}>
        <div className="studio-topbar-left">
          <ViewerBrand
            title={models.length ? `${models.length} model${models.length > 1 ? "s" : ""}` : "Untitled scene"}
            extension="studio"
            onExit={onExit}
          />
          <div className="studio-panel-toggles" role="group" aria-label="Panels">
            <button
              type="button"
              className={`studio-toggle${sceneOpen ? " is-active" : ""}`}
              aria-pressed={sceneOpen}
              aria-label="Toggle scene and resources"
              title="Toggle scene and resources"
              onClick={toggleScene}
            >
              <Layers3 size={15} />
              <span>Scene</span>
            </button>
            <button
              type="button"
              className={`studio-toggle${inspectorOpen && selection.length ? " is-active" : ""}`}
              aria-pressed={inspectorOpen && Boolean(selection.length)}
              aria-label={selection.length > 1 ? "Toggle multiple selection inspector" : "Toggle selection inspector"}
              title={selection.length > 1 ? "Multiple selection" : "Selection"}
              disabled={!selection.length}
              onClick={toggleInspector}
            >
              <SlidersHorizontal size={15} />
              <span>{selection.length > 1 ? `Inspect (${selection.length})` : "Inspect"}</span>
            </button>
          </div>
        </div>
        <div className="studio-topbar-right">
          <TransformBar mode={transformMode} onChange={setTransformMode} />
          <CursorMenu
            cursor={cursor}
            visible={view.cursor}
            canSnap={Boolean(selected)}
            onReset={resetCursor}
            onToSelection={cursorToSelection}
            onToView={cursorToView}
            onToggleVisible={() => toggleView("cursor")}
          />
          <ViewerToolbar
            meshItems={models.map((model) => model.object).filter(Boolean)}
            brightness={brightness}
            onBrightness={(value) =>
              setBrightness(Math.min(Math.max(0, value), brightnessMax))
            }
            brightnessMax={brightnessMax}
            onBrightnessMax={(value) => {
              const max = Math.min(Math.max(1, Math.round(value)), 1000);
              setBrightnessMax(max);
              setBrightness((current) => Math.min(current, max));
            }}
            onReset={resetScene}
            disable={["random", "camera"]}
            view={view}
            onViewChange={toggleView}
            canIsolate={Boolean(selected)}
            onCameraView={(dir) => setCameraView((current) => ({ dir, n: current.n + 1 }))}
          />
          <ExportMenu
            objects={models.map((model) => model.object).filter(Boolean)}
            name="studio-scene"
            label="Export"
            scope="Scene"
            includeCapture
            onNotice={setNotice}
          />
        </div>
      </div>

      <ModelSidebar
        open={sceneOpen}
        onClose={() => setSceneOpen(false)}
        models={models}
        selected={selected}
        selection={selection}
        onSelect={handleSelect}
        onToggleModel={toggleModel}
        onInsert={insertLibrary}
        onPrimitive={requestPrimitive}
        onLight={insertLight}
        onCurve={insertCurve}
        onText={insertText}
        onFiles={addFiles}
        onPick={openPicker}
      />

      {selection.length === 1 && (
        <SelectionPanel
          open={inspectorOpen}
          object={selected}
          root={sceneRoot}
          focusApi={focusApi}
          onNotice={setNotice}
          onDelete={removeSelection}
          onRename={renameSelection}
          onUngroup={ungroupSelection}
          onClose={() => setInspectorOpen(false)}
        />
      )}

      {selection.length > 1 && (
        <MultiSelectionPanel
          open={inspectorOpen}
          objects={selection}
          onClose={() => setInspectorOpen(false)}
          onRemove={removeFromSelection}
          onDelete={removeSelection}
          onGroup={groupSelection}
          onUngroup={ungroupSelection}
          onBoolean={booleanSelection}
          onDuplicate={duplicateSelection}
          onMoveToCursor={moveToCursor}
          onAlign={alignSelection}
          onDropToGround={dropSelection}
          onResetTransform={resetSelectionTransform}
          onNotice={setNotice}
        />
      )}

      {primitiveItem && (
        <PrimitiveDialog
          key={primitiveItem.key}
          item={primitiveItem}
          onCancel={() => setPrimitiveItem(null)}
          onCreate={(params) => {
            insertPrimitive(primitiveItem, params);
            setPrimitiveItem(null);
          }}
        />
      )}

      <LoadingOverlay name={latestModel?.name} />

      <input
        ref={fileInputRef}
        type="file"
        accept={MODEL_ACCEPT}
        multiple
        hidden
        onChange={(event) => {
          addFiles(Array.from(event.target.files || []));
          event.target.value = "";
        }}
      />

      {dragging && (
        <div className="studio-drop-veil">
          <div>
            <UploadCloud size={28} />
            <strong>Drop to add models</strong>
            <small>{MODEL_LABEL}</small>
          </div>
        </div>
      )}

      {cursorHold && (
        <div className="studio-cursor-hold" role="status">
          <i aria-hidden="true" />
          <span>Hold to place the 3D cursor…</span>
        </div>
      )}

      {notice && <div className="studio-notice">{notice}</div>}
    </div>
  );
}

StudioPage.propTypes = {
  onExit: PropTypes.func.isRequired,
};
