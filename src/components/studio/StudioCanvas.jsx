import { Suspense, useCallback, useEffect, useMemo, useRef } from "react";
import PropTypes from "prop-types";
import { Canvas, useThree } from "@react-three/fiber";
import { Grid, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import CameraRig from "../renderer/Studio/shell/CameraRig";
import Gizmo from "../renderer/Studio/shell/Gizmo";
import IsolateObject from "../renderer/Studio/shell/IsolateObject";
import SceneCapture from "../renderer/Studio/shell/SceneCapture";
import SelectionOutline from "../renderer/Studio/shell/SelectionOutline";
import ModelInstance from "./ModelInstance";
import { consumePointerDrag } from "./pointerDrag";
import Cursor3D from "./Cursor3D";
import TransformGizmo from "./TransformGizmo";
import { MODEL_TARGET_SIZE } from "./loadModel";

const HALF_MODEL = MODEL_TARGET_SIZE / 2;

/**
 * Frames every loaded model in the viewport. Runs only when the set of loaded
 * models changes (or the user asks to refit), so orbiting and editing a model
 * is never interrupted.
 */
function FrameAll({ models, readyKey, fitKey }) {
  const camera = useThree((state) => state.camera);
  const controls = useThree((state) => state.controls);

  useEffect(() => {
    if (!controls) return;
    // Every model is normalized to MODEL_TARGET_SIZE and centered in X/Z with
    // its base at position.y, so fit the placement instead of relying on scene
    // matrices, which are still stale on the frame a model reports ready.
    const box = new THREE.Box3();
    models.forEach((model) => {
      // Lamps, text and curves are not model-sized, so adding one should not
      // reframe the camera around the model footprint.
      if (!model.object || model.light || model.text || model.curve) return;
      const { x, y, z } = model.object.position;
      box.expandByPoint(new THREE.Vector3(x - HALF_MODEL, y, z - HALF_MODEL));
      box.expandByPoint(
        new THREE.Vector3(x + HALF_MODEL, y + MODEL_TARGET_SIZE, z + HALF_MODEL)
      );
    });

    if (box.isEmpty()) {
      controls.target.set(0, 1.2, 0);
      camera.position.set(9, 7, 11);
      camera.lookAt(0, 1.2, 0);
      controls.update();
      return;
    }

    const sphere = box.getBoundingSphere(new THREE.Sphere());
    const direction = new THREE.Vector3(1, 0.72, 1).normalize();
    const verticalFov = (camera.fov * Math.PI) / 180;
    // Narrow (portrait) viewports are limited by the horizontal field of view.
    const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * camera.aspect);
    const fitFov = Math.min(verticalFov, horizontalFov);
    const distance =
      Math.max((sphere.radius + 0.8) / Math.sin(fitFov / 2), 5) * 1.08;

    controls.target.copy(sphere.center);
    camera.position.copy(sphere.center).addScaledVector(direction, distance);
    camera.lookAt(sphere.center);
    controls.update();
    // readyKey/fitKey are the intentional refit triggers; models is read live
    // so moving or editing a model does not yank the camera.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readyKey, fitKey, camera, controls]);

  return null;
}

FrameAll.propTypes = {
  models: PropTypes.array.isRequired,
  readyKey: PropTypes.string.isRequired,
  fitKey: PropTypes.number.isRequired,
};

/**
 * Places the 3D cursor: right-click (without dragging) or hold the left button
 * for three seconds. Picks the surface under the pointer, falling back to the
 * ground plane.
 */
function CursorPointer({ objects, enabled, onPlace, onHold }) {
  const gl = useThree((state) => state.gl);
  const camera = useThree((state) => state.camera);
  const objectsRef = useRef(objects);

  useEffect(() => {
    objectsRef.current = objects;
  }, [objects]);

  useEffect(() => {
    if (!enabled) return undefined;
    const element = gl.domElement;
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const holdMs = 3000;
    // The hold hint waits a moment so it does not flash while the user is
    // just orbiting or dragging in the viewport.
    const hintDelayMs = 650;
    let holdTimer = 0;
    let hintTimer = 0;
    let holdStart = null;
    let holdPoint = null;
    let rightStart = null;

    const pointAt = ({ clientX, clientY }) => {
      const rect = element.getBoundingClientRect();
      if (!rect.width || !rect.height) return null;
      pointer.set(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1
      );
      raycaster.setFromCamera(pointer, camera);
      const targets = objectsRef.current.filter(Boolean);
      const hits = targets.length ? raycaster.intersectObjects(targets, true) : [];
      const surface = hits.find((hit) => hit.object.isMesh && hit.object.visible);
      if (surface) return surface.point.clone();
      const point = new THREE.Vector3();
      if (!raycaster.ray.intersectPlane(ground, point)) return null;
      return camera.position.distanceTo(point) > 260 ? null : point;
    };

    const place = (point) => {
      if (point) onPlace([point.x, point.y, point.z]);
    };

    const stopHold = () => {
      if (holdTimer) window.clearTimeout(holdTimer);
      if (hintTimer) window.clearTimeout(hintTimer);
      holdTimer = 0;
      hintTimer = 0;
      holdStart = null;
      holdPoint = null;
      onHold(false);
    };

    const handleDown = (event) => {
      if (event.button === 2) {
        rightStart = { x: event.clientX, y: event.clientY };
        return;
      }
      if (event.button !== 0) return;
      holdStart = { x: event.clientX, y: event.clientY };
      holdPoint = { clientX: event.clientX, clientY: event.clientY };
      hintTimer = window.setTimeout(() => onHold(true), hintDelayMs);
      holdTimer = window.setTimeout(() => {
        const point = pointAt(holdPoint);
        stopHold();
        place(point);
      }, holdMs);
    };

    const handleMove = (event) => {
      holdPoint = { clientX: event.clientX, clientY: event.clientY };
      if (
        holdStart &&
        Math.hypot(event.clientX - holdStart.x, event.clientY - holdStart.y) > 6
      ) {
        stopHold();
      }
    };

    const handleUp = (event) => {
      if (event.button === 2) {
        const start = rightStart;
        rightStart = null;
        if (start && Math.hypot(event.clientX - start.x, event.clientY - start.y) <= 6) {
          place(pointAt(event));
        }
        return;
      }
      if (event.button === 0) stopHold();
    };

    const handleContextMenu = (event) => event.preventDefault();

    element.addEventListener("pointerdown", handleDown);
    element.addEventListener("pointermove", handleMove);
    element.addEventListener("pointerup", handleUp);
    element.addEventListener("pointercancel", stopHold);
    element.addEventListener("pointerleave", stopHold);
    element.addEventListener("contextmenu", handleContextMenu);

    return () => {
      stopHold();
      element.removeEventListener("pointerdown", handleDown);
      element.removeEventListener("pointermove", handleMove);
      element.removeEventListener("pointerup", handleUp);
      element.removeEventListener("pointercancel", stopHold);
      element.removeEventListener("pointerleave", stopHold);
      element.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [enabled, gl, camera, onPlace, onHold]);

  return null;
}

CursorPointer.propTypes = {
  objects: PropTypes.array.isRequired,
  enabled: PropTypes.bool,
  onPlace: PropTypes.func.isRequired,
  onHold: PropTypes.func.isRequired,
};

/** Exposes the orbit target so the Cursor menu can snap to the view centre. */
function CursorBridge({ apiRef }) {
  const controls = useThree((state) => state.controls);

  useEffect(() => {
    if (!apiRef) return undefined;
    apiRef.current = {
      center: () => (controls?.target ? controls.target.toArray() : [0, 0, 0]),
    };
    return () => {
      apiRef.current = null;
    };
  }, [apiRef, controls]);

  return null;
}

CursorBridge.propTypes = {
  apiRef: PropTypes.shape({ current: PropTypes.any }),
};

/** Exposes a camera framing helper for the selection inspector. */
function FocusBridge({ apiRef }) {
  const camera = useThree((state) => state.camera);
  const controls = useThree((state) => state.controls);

  useEffect(() => {
    if (!apiRef) return undefined;
    apiRef.current = {
      focus: (object) => {
        if (!object || !controls) return;
        object.updateWorldMatrix(true, false);
        const box = new THREE.Box3().setFromObject(object);
        if (box.isEmpty()) return;
        const sphere = box.getBoundingSphere(new THREE.Sphere());
        const direction = camera.position.clone().sub(controls.target);
        if (direction.lengthSq() < 1e-6) direction.set(1, 0.72, 1);
        direction.normalize();
        const verticalFov = (camera.fov * Math.PI) / 180;
        const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * camera.aspect);
        const distance =
          ((sphere.radius + 0.6) / Math.sin(Math.min(verticalFov, horizontalFov) / 2)) *
          1.15;
        controls.target.copy(sphere.center);
        camera.position
          .copy(sphere.center)
          .addScaledVector(direction, Math.max(distance, 2));
        camera.lookAt(sphere.center);
        controls.update();
      },
    };
    return () => {
      apiRef.current = null;
    };
  }, [apiRef, camera, controls]);

  return null;
}

FocusBridge.propTypes = {
  apiRef: PropTypes.shape({ current: PropTypes.any }),
};

export default function StudioCanvas({
  models,
  sceneRoot,
  brightness,
  view,
  cursor,
  cameraView,
  fitKey,
  readyKey,
  selected,
  selection,
  transformMode,
  scenePanelOpen,
  cursorApi,
  focusApi,
  onSelect,
  onReady,
  onDetach,
  onError,
  onScene,
  onPlaceCursor,
  onCursorHold,
}) {
  const gizmoBusy = useRef(false);
  const gridRef = useRef(null);
  const objects = useMemo(
    () => models.map((model) => model.object).filter(Boolean),
    [models]
  );

  // The grid is a transparent plane sitting a hair below y=0. Nudging it down
  // and pushing it back in depth keeps coplanar ground meshes (a freshly added
  // plane, for example) from z-fighting with the grid lines, and disabling
  // depth writes stops the transparent grid from occluding anything.
  useEffect(() => {
    const material = gridRef.current?.material;
    if (!material) return;
    material.polygonOffset = true;
    material.polygonOffsetFactor = 1;
    material.polygonOffsetUnits = 1;
    material.depthWrite = false;
    material.needsUpdate = true;
  }, [view.grid]);

  const handleBusy = useCallback((busy) => {
    gizmoBusy.current = busy;
  }, []);

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{ preserveDrawingBuffer: true, antialias: true }}
      camera={{ position: [9, 7, 11], fov: 45, near: 0.1, far: 400 }}
      onPointerMissed={(event) => {
        if (consumePointerDrag()) return;
        if (!gizmoBusy.current) onSelect(null, event);
      }}
    >
      <color attach="background" args={["#eef0f6"]} />
      <ambientLight intensity={brightness * 0.55} />
      <hemisphereLight args={["#ffffff", "#bfc4d6", brightness * 0.55]} />
      <directionalLight
        castShadow
        position={[6, 10, 7]}
        intensity={brightness * 1.7}
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0006}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-camera-near={0.5}
        shadow-camera-far={40}
      />
      <directionalLight position={[-8, 5, -6]} intensity={brightness * 0.7} />

      <OrbitControls makeDefault autoRotate={view.autoRotate} autoRotateSpeed={1.2} />
      <CameraRig view={cameraView} />

      <Suspense fallback={null}>
        {models.map((model) => (
          <ModelInstance
            key={model.id}
            model={model}
            position={model.position}
            onReady={onReady}
            onDetach={onDetach}
            onError={onError}
            onSelect={onSelect}
          />
        ))}
      </Suspense>

      {view.grid && (
        <Grid
          ref={gridRef}
          name="Studio grid"
          position={[0, -0.005, 0]}
          side={THREE.DoubleSide}
          infiniteGrid
          cellSize={1}
          cellThickness={0.6}
          cellColor="#cdcedb"
          sectionSize={5}
          sectionThickness={1}
          sectionColor="#b3abdd"
          fadeDistance={55}
          fadeStrength={1.4}
        />
      )}

      <Cursor3D position={cursor} visible={view.cursor} />
      <CursorPointer
        objects={objects}
        enabled={view.cursor}
        onPlace={onPlaceCursor}
        onHold={onCursorHold}
      />
      <CursorBridge apiRef={cursorApi} />
      <FocusBridge apiRef={focusApi} />
      <TransformGizmo object={selected} mode={transformMode} onBusyChange={handleBusy} />

      <IsolateObject enabled={view.isolate} root={sceneRoot} selected={selected} />
      <SceneCapture onScene={onScene} />
      {(selection?.length ? selection : [selected]).filter(Boolean).map((object) => (
        <SelectionOutline key={object.uuid} object={object} />
      ))}
      <Gizmo leftPanelOpen={scenePanelOpen} />
      <FrameAll models={models} readyKey={readyKey} fitKey={fitKey} />
    </Canvas>
  );
}

StudioCanvas.propTypes = {
  models: PropTypes.array.isRequired,
  sceneRoot: PropTypes.object,
  brightness: PropTypes.number.isRequired,
  view: PropTypes.shape({
    grid: PropTypes.bool,
    isolate: PropTypes.bool,
    wireframe: PropTypes.bool,
    autoRotate: PropTypes.bool,
    cursor: PropTypes.bool,
  }).isRequired,
  cursor: PropTypes.arrayOf(PropTypes.number).isRequired,
  cameraView: PropTypes.shape({ dir: PropTypes.string, n: PropTypes.number }).isRequired,
  fitKey: PropTypes.number.isRequired,
  readyKey: PropTypes.string.isRequired,
  selected: PropTypes.object,
  selection: PropTypes.arrayOf(PropTypes.object),
  transformMode: PropTypes.oneOf(["translate", "rotate", "scale"]).isRequired,
  scenePanelOpen: PropTypes.bool,
  cursorApi: PropTypes.shape({ current: PropTypes.any }),
  focusApi: PropTypes.shape({ current: PropTypes.any }),
  onSelect: PropTypes.func.isRequired,
  onReady: PropTypes.func.isRequired,
  onDetach: PropTypes.func.isRequired,
  onError: PropTypes.func.isRequired,
  onScene: PropTypes.func.isRequired,
  onPlaceCursor: PropTypes.func.isRequired,
  onCursorHold: PropTypes.func.isRequired,
};
