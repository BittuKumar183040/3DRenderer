import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Layers3, SlidersHorizontal } from "lucide-react";
import ViewerBrand from "../shell/ViewerBrand";
import ViewerToolbar from "../shell/ViewerToolbar";
import LoadingOverlay from "../shell/LoadingOverlay";
import AnimationPanel from "../shell/AnimationPanel";
import ScenePanel from "../shell/ScenePanel";
import ViewerInspector from "../shell/ViewerInspector";
import useMediaQuery from "../shell/useMediaQuery";
import StudioCanvas from "../../../studio/StudioCanvas";
import "../studio.css";

const INITIAL_VIEW = {
  grid: true,
  isolate: false,
  wireframe: false,
  autoRotate: false,
  helpers: true,
};

const noop = () => {};

/**
 * Read-only model viewer for GLB, GLTF, FBX and SVG files. It renders through
 * the studio canvas, so imported models get the same shadows, light and camera
 * helpers, scene tree, selection inspector, animation playback, grid, camera
 * presets, isolate and wireframe tools. Editing (transforms, primitives,
 * material and mesh tools) stays in the Studio.
 */
export default function ModelViewer({
  file: { file, name, extension },
  onExit,
}) {
  const compact = useMediaQuery("(max-width: 760px)");

  const format = (extension || "glb").toLowerCase();
  const label = name || "3D model";

  const [url, setUrl] = useState(null);
  const [object, setObject] = useState(null);
  const [sceneRoot, setSceneRoot] = useState(null);
  const [selected, setSelected] = useState(null);
  const [brightness, setBrightness] = useState(2);
  const [brightnessMax, setBrightnessMax] = useState(10);
  const [cameraView, setCameraView] = useState({ dir: "iso", n: 0 });
  const [fitKey, setFitKey] = useState(0);
  const [view, setView] = useState(INITIAL_VIEW);
  const [sceneOpen, setSceneOpen] = useState(!compact);
  const [inspectorOpen, setInspectorOpen] = useState(!compact);
  const [notice, setNotice] = useState("");
  const [topbarHeight, setTopbarHeight] = useState(84);

  const focusApi = useRef(null);
  const topbarRef = useRef(null);

  // Files arrive either as an upload or as a URL from the asset library.
  useEffect(() => {
    if (file instanceof File) {
      const objectUrl = URL.createObjectURL(file);
      setUrl(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }
    setUrl(typeof file === "string" ? file : null);
    return undefined;
  }, [file]);

  useEffect(() => {
    setObject(null);
    setSelected(null);
    setFitKey((value) => value + 1);
  }, [url]);

  useEffect(() => {
    setSceneOpen(!compact);
    setInspectorOpen(!compact);
  }, [compact]);

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

  // The viewport wireframe switch reaches every material in the loaded model.
  useEffect(() => {
    object?.traverse?.((node) => {
      if (!node.isMesh) return;
      (Array.isArray(node.material) ? node.material : [node.material]).forEach(
        (material) => {
          if (material && "wireframe" in material) material.wireframe = view.wireframe;
        }
      );
    });
  }, [object, view.wireframe]);

  const models = useMemo(
    () =>
      url
        ? [
            {
              id: "viewer-model",
              name: label,
              url,
              ext: format,
              format: format.toUpperCase(),
              position: [0, 0, 0],
              visible: true,
              object,
            },
          ]
        : [],
    [url, label, format, object]
  );

  const animation = object?.userData?.studioMixer
    ? {
        mixer: object.userData.studioMixer,
        clips: object.userData.studioAnimations || [],
      }
    : { mixer: null, clips: [] };

  const handleSelect = useCallback((next) => {
    setSelected(next || null);
    if (next) setInspectorOpen(true);
  }, []);

  const handleReady = useCallback((id, next) => setObject(next), []);
  const handleDetach = useCallback(() => {}, []);
  const handleError = useCallback((id, modelName, message) => {
    setNotice(`Could not load “${modelName}”${message ? ` — ${message}` : ""}.`);
  }, []);

  const toggleView = (key) =>
    setView((current) => ({ ...current, [key]: !current[key] }));

  const resetScene = () => {
    setSelected(null);
    setView((current) => ({ ...current, isolate: false }));
    setCameraView((current) => ({ dir: "iso", n: current.n + 1 }));
    setFitKey((value) => value + 1);
  };

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

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
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
      if (key === "escape") setSelected(null);
      else if (key === "f" && selected) focusApi.current?.focus(selected);
      else if (key === "i" && selected) {
        setView((current) => ({ ...current, isolate: !current.isolate }));
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selected]);

  const showAnimation =
    animation.clips.length > 0 && !(compact && (sceneOpen || inspectorOpen));

  return (
    <div
      className="studio-shell renderer-workspace"
      style={{ "--studio-top": `${Math.round(topbarHeight)}px` }}
    >
      <div className="studio-canvas">
        <StudioCanvas
          models={models}
          sceneRoot={sceneRoot}
          brightness={brightness}
          view={view}
          cursor={[0, 0, 0]}
          cameraView={cameraView}
          fitKey={fitKey}
          readyKey={object ? "1" : "0"}
          selected={selected}
          selection={[]}
          transformMode="translate"
          scenePanelOpen={sceneOpen || showAnimation}
          focusApi={focusApi}
          editable={false}
          onSelect={handleSelect}
          onReady={handleReady}
          onDetach={handleDetach}
          onError={handleError}
          onScene={setSceneRoot}
          onPlaceCursor={noop}
          onCursorHold={noop}
        />
      </div>

      <div className="studio-topbar" ref={topbarRef}>
        <div className="studio-topbar-left">
          <ViewerBrand title={label} extension={format} onExit={onExit} />
          <div className="studio-panel-toggles" role="group" aria-label="Panels">
            <button
              type="button"
              className={`studio-toggle${sceneOpen ? " is-active" : ""}`}
              aria-pressed={sceneOpen}
              aria-label="Toggle scene graph"
              title="Toggle scene graph"
              disabled={!object}
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
          <ViewerToolbar
            meshItems={object}
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
            disable={["random"]}
            view={view}
            onViewChange={toggleView}
            canIsolate={Boolean(selected)}
            onCameraView={(dir) => setCameraView((c) => ({ dir, n: c.n + 1 }))}
          />
        </div>
      </div>

      {object && (
        <ScenePanel
          open={sceneOpen}
          onClose={() => setSceneOpen(false)}
          root={object}
          selected={selected}
          onSelect={handleSelect}
          title={label}
        />
      )}

      {selected && (
        <ViewerInspector
          open={inspectorOpen}
          object={selected}
          root={object}
          focusApi={focusApi}
          onClose={() => setInspectorOpen(false)}
        />
      )}

      {showAnimation && <AnimationPanel mixer={animation.mixer} clips={animation.clips} />}

      <LoadingOverlay name={label} />

      {notice && <div className="studio-notice">{notice}</div>}
    </div>
  );
}

ModelViewer.propTypes = {
  file: PropTypes.shape({
    file: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.instanceOf(File),
      PropTypes.object,
    ]),
    name: PropTypes.string,
    extension: PropTypes.string,
  }).isRequired,
  onExit: PropTypes.func.isRequired,
};
