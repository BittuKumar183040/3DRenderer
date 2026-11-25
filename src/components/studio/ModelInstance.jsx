import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { clone as cloneSkeleton } from "three/examples/jsm/utils/SkeletonUtils.js";
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
    loadModel(model.url, model.ext)
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
  }, [model.url, model.ext, model.id, model.name, onError]);

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
    url: PropTypes.string.isRequired,
    ext: PropTypes.string.isRequired,
  }).isRequired,
  position: PropTypes.arrayOf(PropTypes.number).isRequired,
  onReady: PropTypes.func.isRequired,
  onDetach: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
  onError: PropTypes.func.isRequired,
};
