import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { clone as cloneSkeleton } from "three/examples/jsm/utils/SkeletonUtils.js";
import { createPrimitive } from "./primitives";
import { loadModel, normalizeModel } from "./loadModel";

/**
 * One model placed on the studio canvas — either a loaded file or a built-in
 * primitive. File sources are cloned per insertion, normalized to the same
 * size and rested on the ground plane; primitives are built on demand.
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
    if (model.primitive) {
      setObject(createPrimitive(model.primitive));
      return () => {
        active = false;
      };
    }
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
  }, [model.url, model.ext, model.primitive, model.id, model.name, onError]);

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
    ext: PropTypes.string,
    primitive: PropTypes.string,
  }).isRequired,
  position: PropTypes.arrayOf(PropTypes.number).isRequired,
  onReady: PropTypes.func.isRequired,
  onDetach: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
  onError: PropTypes.func.isRequired,
};
