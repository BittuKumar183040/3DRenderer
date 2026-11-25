import { Suspense, useEffect } from "react";
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
    const box = new THREE.Box3();
    models.forEach((model) => {
      if (model.object) box.expandByObject(model.object);
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
    const fov = (camera.fov * Math.PI) / 180;
    const distance = Math.max((sphere.radius + 0.8) / Math.sin(fov / 2), 5) * 1.08;

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

export default function StudioCanvas({
  models,
  sceneRoot,
  brightness,
  view,
  cameraView,
  fitKey,
  readyKey,
  selected,
  onSelect,
  onReady,
  onDetach,
  onScene,
}) {
  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ preserveDrawingBuffer: true }}
      camera={{ position: [9, 7, 11], fov: 45, near: 0.1, far: 400 }}
      onPointerMissed={() => onSelect(null)}
    >
      <color attach="background" args={["#eef0f6"]} />
      <ambientLight intensity={brightness * 0.55} />
      <hemisphereLight args={["#ffffff", "#bfc4d6", brightness * 0.55]} />
      <directionalLight position={[6, 10, 7]} intensity={brightness * 1.7} />
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
            onSelect={onSelect}
          />
        ))}
      </Suspense>

      {view.grid && (
        <Grid
          name="Studio grid"
          position={[0, 0, 0]}
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

      <IsolateObject enabled={view.isolate} root={sceneRoot} selected={selected} />
      <SceneCapture onScene={onScene} />
      <SelectionOutline object={selected} />
      <Gizmo />
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
  }).isRequired,
  cameraView: PropTypes.shape({ dir: PropTypes.string, n: PropTypes.number }).isRequired,
  fitKey: PropTypes.number.isRequired,
  readyKey: PropTypes.string.isRequired,
  selected: PropTypes.object,
  onSelect: PropTypes.func.isRequired,
  onReady: PropTypes.func.isRequired,
  onDetach: PropTypes.func.isRequired,
  onScene: PropTypes.func.isRequired,
};
