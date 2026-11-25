import { useCallback, useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Layers3, SlidersHorizontal, UploadCloud } from "lucide-react";
import ViewerBrand from "../renderer/Studio/shell/ViewerBrand";
import ViewerToolbar from "../renderer/Studio/shell/ViewerToolbar";
import Inspector from "../renderer/Studio/shell/Inspector";
import LoadingOverlay from "../renderer/Studio/shell/LoadingOverlay";
import useMediaQuery from "../renderer/Studio/shell/useMediaQuery";
import StudioCanvas from "./StudioCanvas";
import ModelSidebar from "./ModelSidebar";
import CursorMenu from "./CursorMenu";
import TransformBar from "./TransformBar";
import STUDIO_LIBRARY from "./library";
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

/**
 * First free spot around the 3D cursor: exactly on it when nothing is there,
 * otherwise a widening spiral so repeated inserts never stack.
 */
function freeSpotNear(cursor, positions) {
  for (let slot = 0; slot < 64; slot += 1) {
    const radius = slot === 0 ? 0 : 4.2 * Math.sqrt(slot);
    const angle = slot * 2.399963;
    const point = [
      cursor[0] + Math.cos(angle) * radius,
      cursor[1],
      cursor[2] + Math.sin(angle) * radius,
    ];
    const free = positions.every(
      (position) =>
        Math.hypot(position[0] - point[0], position[2] - point[2]) > 2.4 ||
        Math.abs(position[1] - point[1]) > 0.8
    );
    if (free) return point;
  }
  return [...cursor];
}

/**
 * Blank-canvas studio: insert models (glTF, FBX, OBJ, STL, PLY, SVG) onto a
 * grid, position them at the 3D cursor, transform the selection with the
 * viewport gizmo, inspect them, then capture the viewport.
 */
export default function StudioPage({ onExit }) {
  const compact = useMediaQuery("(max-width: 760px)");

  const [models, setModels] = useState([]);
  const [sceneRoot, setSceneRoot] = useState(null);
  const [selected, setSelected] = useState(null);
  const [brightness, setBrightness] = useState(2);
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
  });

  const [sceneOpen, setSceneOpen] = useState(!compact);
  const [inspectorOpen, setInspectorOpen] = useState(!compact);
  const [dragging, setDragging] = useState(false);
  const [notice, setNotice] = useState("");

  const dragDepth = useRef(0);
  const uploadedUrls = useRef(new Set());
  const fileInputRef = useRef(null);
  const topbarRef = useRef(null);
  const cursorRef = useRef(cursor);
  const cursorApi = useRef(null);
  const [topbarHeight, setTopbarHeight] = useState(64);

  const readyKey = models.map((model) => (model.object ? "1" : "0")).join("");

  useEffect(() => {
    cursorRef.current = cursor;
  }, [cursor]);

  useEffect(() => {
    setSceneOpen(!compact);
    setInspectorOpen(!compact);
  }, [compact]);

  useEffect(() => {
    if (!selected) return;
    setInspectorOpen(true);
    if (compact) setSceneOpen(false);
  }, [selected, compact]);

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
      else if (key === "escape") setSelected(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const placeCursor = useCallback((position) => setCursor(position), []);
  const handleCursorHold = useCallback((holding) => setCursorHold(holding), []);

  const addModels = useCallback((entries) => {
    if (!entries.length) return;
    const point = cursorRef.current;
    setModels((prev) => {
      const placed = [...prev];
      const additions = entries.map((entry) => {
        const position = freeSpotNear(
          point,
          placed.map((model) => model.position)
        );
        const model = { ...entry, id: nextId(), position, object: null, visible: true };
        placed.push(model);
        return model;
      });
      return [...prev, ...additions];
    });
    setFitKey((value) => value + 1);
    setNotice("");
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
        setSelected(null);
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
    setSelected((current) => {
      if (!current) return current;
      for (let node = current; node; node = node.parent) {
        if (node.userData?.studioModelId === id) return null;
      }
      return current;
    });
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
    setSelected(null);
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
          transformMode={transformMode}
          cursorApi={cursorApi}
          onSelect={setSelected}
          onReady={handleReady}
          onDetach={handleDetach}
          onError={handleError}
          onScene={setSceneRoot}
          onPlaceCursor={placeCursor}
          onCursorHold={handleCursorHold}
        />
      </div>

      {models.length === 0 && (
        <div className="studio-empty">
          <div className="studio-empty-card">
            <span className="studio-empty-badge">Blank canvas</span>
            <h1>Start your scene</h1>
            <p>
              Drop a 3D model anywhere, or insert one from the library. New models
              appear at the 3D cursor. Everything stays on your device.
            </p>
            <div className="studio-empty-actions">
              <button type="button" className="st-btn is-primary" onClick={openPicker}>
                <UploadCloud size={14} /> Upload model
              </button>
              <button
                type="button"
                className="st-btn"
                onClick={() => insertLibrary(STUDIO_LIBRARY[0])}
              >
                Insert a sample
              </button>
            </div>
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
              className={`studio-toggle${inspectorOpen && selected ? " is-active" : ""}`}
              aria-pressed={inspectorOpen && Boolean(selected)}
              aria-label="Toggle selection inspector"
              title="Toggle selection inspector"
              disabled={!selected}
              onClick={toggleInspector}
            >
              <SlidersHorizontal size={15} />
              <span>Inspect</span>
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
            onBrightness={setBrightness}
            onReset={resetScene}
            disable={["random"]}
            view={view}
            onViewChange={toggleView}
            canIsolate={Boolean(selected)}
            onCameraView={(dir) => setCameraView((current) => ({ dir, n: current.n + 1 }))}
          />
        </div>
      </div>

      <ModelSidebar
        open={sceneOpen}
        onClose={() => setSceneOpen(false)}
        models={models}
        selected={selected}
        onSelect={setSelected}
        onToggleModel={toggleModel}
        onRemove={removeModel}
        onInsert={insertLibrary}
        onFiles={addFiles}
        onPick={openPicker}
      />

      {selected && (
        <Inspector
          open={inspectorOpen}
          object={selected}
          root={sceneRoot}
          onSelect={setSelected}
          onClose={() => {
            setInspectorOpen(false);
            setSelected(null);
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
