import { useEffect } from "react";
import PropTypes from "prop-types";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

const DIRECTIONS = {
  iso: [1, 0.8, 1],
  front: [0, 0.14, 1],
  back: [0, 0.14, -1],
  left: [-1, 0.14, 0],
  right: [1, 0.14, 0],
  top: [0, 1, 0.0001],
};

/**
 * Applies camera presets coming from the toolbar. Works with the default
 * OrbitControls instance registered by drei (makeDefault).
 */
export default function CameraRig({ view }) {
  const camera = useThree((state) => state.camera);
  const controls = useThree((state) => state.controls);

  useEffect(() => {
    if (!view?.dir) return;
    const direction = new THREE.Vector3(
      ...(DIRECTIONS[view.dir] || DIRECTIONS.iso)
    ).normalize();
    const target = controls?.target
      ? controls.target.clone()
      : new THREE.Vector3();
    const distance = Math.max(camera.position.distanceTo(target), 2);

    camera.up.set(0, view.dir === "top" ? 0 : 1, view.dir === "top" ? -1 : 0);
    camera.position.copy(target).addScaledVector(direction, distance);
    camera.lookAt(target);
    if (controls) {
      controls.target.copy(target);
      controls.update?.();
    }
  }, [view, camera, controls]);

  return null;
}

CameraRig.propTypes = {
  view: PropTypes.shape({ dir: PropTypes.string, n: PropTypes.number }),
};
