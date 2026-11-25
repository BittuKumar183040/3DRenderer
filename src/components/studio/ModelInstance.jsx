import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { clone as cloneSkeleton } from "three/examples/jsm/utils/SkeletonUtils.js";
import * as THREE from "three";
import { loadModel, normalizeModel } from "./loadModel";

/**
 * One model placed on the studio canvas. The source is cloned per insertion,
 * normalized to the same size, rested on the ground plane, and registered with
 * the page so panels, isolation and the gizmo can reach it. Supports every
 * format handled by loadModel (glTF, FBX, OBJ, STL, PLY, SVG).
 */
export default function ModelInstance({
  model,
  position,
  onReady,
  onDetach,
  onSelect,
  onError,
}) {
  const groupRef = useRef(null);
  const [object, setObject] = useState(null);

  useEffect(() => {
    let active = true;
    setObject(null);
    const createPrimitive = () => {
      const geometries = {
        box: () => new THREE.BoxGeometry(1, 1, 1),
        sphere: () => new THREE.SphereGeometry(0.5, 32, 20),
        cone: () => new THREE.ConeGeometry(0.5, 1, 32),
        cylinder: () => new THREE.CylinderGeometry(0.5, 0.5, 1, 32),
        torus: () => new THREE.TorusGeometry(0.35, 0.15, 16, 48),
        plane: () => new THREE.PlaneGeometry(1, 1),
      };
      const geometry = geometries[model.primitive]?.();
      if (!geometry) throw new Error("Unknown primitive mesh");
      if (model.primitive === "plane") geometry.rotateX(-Math.PI / 2);
      const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: "#b9b4d8", roughness: 0.62 }));
      mesh.name = model.name;
      const group = new THREE.Group();
      group.add(mesh);
      return Promise.resolve(group);
    };
    (model.primitive ? createPrimitive() : loadModel(model.url, model.ext))
      .then((root) => {
        if (!active) return;
        setObject(normalizeModel(cloneSkeleton(root)));
      })
      .catch((error) => {
        if (active) onError(model.id, model.name, error?.message);
      });
    return () => {
      active = false;
    };
  }, [model.url, model.ext, model.id, model.name, model.primitive, onError]);

  useEffect(() => {
    const group = groupRef.current;
    if (!group || !object) return undefined;
    onReady(model.id, group);
    return () => onDetach(model.id);
  }, [object, model.id, onReady, onDetach]);

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
      {object && <primitive object={object} />}
    </group>
  );
}

ModelInstance.propTypes = {
  model: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    url: PropTypes.string,
    ext: PropTypes.string.isRequired,
    primitive: PropTypes.string,
  }).isRequired,
  position: PropTypes.arrayOf(PropTypes.number).isRequired,
  onReady: PropTypes.func.isRequired,
  onDetach: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
  onError: PropTypes.func.isRequired,
};
