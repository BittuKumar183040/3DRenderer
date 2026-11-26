import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { clone as cloneSkeleton } from "three/examples/jsm/utils/SkeletonUtils.js";
import { createPrimitive } from "./primitives";
import { createLight } from "./lights";
import { createCurve } from "./curves";
import { createText } from "./texts";
import { loadModel, normalizeModel } from "./loadModel";

/** Locally built objects (mesh, lamp, text, curve) need no file loading. */
function buildObject(model) {
  if (model.primitive) return createPrimitive(model.primitive);
  if (model.light) return createLight(model.light);
  if (model.curve) return createCurve(model.curve);
  if (model.text) return createText(model.text);
  return null;
}

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
    const built = buildObject(model);
    if (built) {
      setObject(built);
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
  }, [
    model.url,
    model.ext,
    model.primitive,
    model.light,
    model.curve,
    model.text,
    model.id,
    onError,
  ]);

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
        // Raycasting still hits invisible meshes, so walk up the parents and
        // ignore clicks on anything the user has hidden.
        for (let node = event.object; node; node = node.parent) {
          if (!node.visible) return;
        }
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
    light: PropTypes.string,
    curve: PropTypes.string,
    text: PropTypes.string,
  }).isRequired,
  position: PropTypes.arrayOf(PropTypes.number).isRequired,
  onReady: PropTypes.func.isRequired,
  onDetach: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
  onError: PropTypes.func.isRequired,
};
