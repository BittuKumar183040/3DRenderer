import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Layers3, SlidersHorizontal } from "lucide-react";
import ViewerBrand from "./ViewerBrand";
import ScenePanel from "./ScenePanel";
import Inspector from "./Inspector";
import useMediaQuery from "./useMediaQuery";

/**
 * Shared chrome for every 3D viewer: brand, floating toolbar slot, a scene
 * graph panel and a selection inspector. Panels dock on desktop and collapse
 * into sheets on small screens so they never cover the viewport.
 */
export default function ViewerLayout({
  title,
  extension,
  onExit,
  toolbar,
  canvas,
  overlay,
  sceneRoot,
  selected,
  onSelect,
  onClearSelection,
}) {
  const compact = useMediaQuery("(max-width: 760px)");
  const [sceneOpen, setSceneOpen] = useState(!compact);
  const [inspectorOpen, setInspectorOpen] = useState(!compact);
  const topbarRef = useRef(null);
  const [topbarHeight, setTopbarHeight] = useState(84);

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

  return (
    <div
      className="studio-shell renderer-workspace"
      style={{ "--studio-top": `${Math.round(topbarHeight)}px` }}
    >
      <div className="studio-canvas">{canvas}</div>

      <div className="studio-topbar" ref={topbarRef}>
        <div className="studio-topbar-left">
          <ViewerBrand title={title} extension={extension} onExit={onExit} />
          <div className="studio-panel-toggles" role="group" aria-label="Panels">
            <button
              type="button"
              className={`studio-toggle${sceneOpen ? " is-active" : ""}`}
              aria-pressed={sceneOpen}
              aria-label="Toggle scene graph"
              title="Toggle scene graph"
              disabled={!sceneRoot}
              onClick={() => setSceneOpen((value) => !value)}
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
              onClick={() => setInspectorOpen((value) => !value)}
            >
              <SlidersHorizontal size={15} />
              <span>Inspect</span>
            </button>
          </div>
        </div>
        <div className="studio-topbar-right">{toolbar}</div>
      </div>

      {sceneRoot && (
        <ScenePanel
          open={sceneOpen}
          onClose={() => setSceneOpen(false)}
          root={sceneRoot}
          selected={selected}
          onSelect={onSelect}
          title={title || "Scene"}
        />
      )}

      {selected && (
        <Inspector
          open={inspectorOpen}
          object={selected}
          root={sceneRoot}
          onSelect={onSelect}
          onClose={() => {
            setInspectorOpen(false);
            onClearSelection?.();
          }}
        />
      )}

      {overlay}
    </div>
  );
}

ViewerLayout.propTypes = {
  title: PropTypes.string,
  extension: PropTypes.string,
  onExit: PropTypes.func.isRequired,
  toolbar: PropTypes.node,
  canvas: PropTypes.node,
  overlay: PropTypes.node,
  sceneRoot: PropTypes.object,
  selected: PropTypes.object,
  onSelect: PropTypes.func,
  onClearSelection: PropTypes.func,
};
