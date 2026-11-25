import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import PropTypes from "prop-types";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { clone as cloneSkeleton } from "three/examples/jsm/utils/SkeletonUtils.js";

const TARGET_SIZE = 3.6;

/**
 * One model placed on the studio canvas. The glTF scene is cloned so the same
 * source can be inserted several times, then normalized to the same size and
 * rested on the ground plane.
 */
export default function ModelInstance({ model, position, onReady, onDetach, onSelect }) {
  const { scene } = useGLTF(model.url);
  const groupRef = useRef(null);

  const object = useMemo(() => cloneSkeleton(scene), [scene]);

  useLayoutEffect(() => {
    object.position.set(0, 0, 0);
    object.rotation.set(0, 0, 0);
    object.scale.setScalar(1);
    object.updateMatrixWorld(true);

    const initial = new THREE.Box3().setFromObject(object);
    const size = initial.getSize(new THREE.Vector3());
    const max = Math.max(size.x, size.y, size.z) || 1;
    object.scale.setScalar(TARGET_SIZE / max);
    object.updateMatrixWorld(true);

    const fitted = new THREE.Box3().setFromObject(object);
    object.position.set(
      -(fitted.min.x + fitted.max.x) / 2,
      -fitted.min.y,
      -(fitted.min.z + fitted.max.z) / 2
    );
    object.updateMatrixWorld(true);
  }, [object]);

  useEffect(() => {
    const group = groupRef.current;
    if (!group) return undefined;
    onReady(model.id, group);
    return () => onDetach(model.id);
  }, [model.id, onReady, onDetach]);

  return (
    <group
      ref={groupRef}
      name={model.name}
      position={position}
      userData={{ studioModelId: model.id }}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(event.object);
      }}
    >
      <primitive object={object} />
    </group>
  );
}

ModelInstance.propTypes = {
  model: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    url: PropTypes.string.isRequired,
  }).isRequired,
  position: PropTypes.arrayOf(PropTypes.number).isRequired,
  onReady: PropTypes.func.isRequired,
  onDetach: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
};
