import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import * as THREE from "three";
import { clone as cloneSkeleton } from "three/examples/jsm/utils/SkeletonUtils.js";
import { createPrimitive } from "./primitives";
import { createLight } from "./lights";
import { createCurve } from "./curves";
import { createText } from "./texts";
import { loadModel, normalizeModel } from "./loadModel";
import { consumePointerDrag } from "./pointerDrag";

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
 * primitive. The built or loaded object itself is the model root, so every
 * insertion is a single scene-tree row instead of a wrapper group around the
 * real object.
 */
export default function ModelInstance({
  model,
  position,
  onReady,
  onDetach,
  onSelect,
  onError,
}) {
  const [object, setObject] = useState(null);
  const positionRef = useRef(position);

  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  useEffect(() => {
    let active = true;
    setObject(null);
    const offset = new THREE.Vector3(...positionRef.current);
    const built = buildObject(model);
    if (built) {
      built.position.add(offset);
      setObject(built);
      return () => {
        active = false;
      };
    }
    loadModel(model.url, model.ext)
      .then((root) => {
        if (!active) return;
        const placed = normalizeModel(cloneSkeleton(root));
        placed.position.add(offset);
        setObject(placed);
      })
      .catch((error) => {
        if (active) onError(model.id, model.name, error?.message);
      });
    return () => {
      active = false;
    };
    // Only the source and kind of object define what has to be built; renaming
    // or toggling visibility must not rebuild (and reset) the object.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    if (!object) return undefined;
    object.name = model.name;
    object.userData = { ...object.userData, studioModelId: model.id };
    onReady(model.id, object);
    return () => onDetach(model.id);
  }, [object, model.id, model.name, onReady, onDetach]);

  if (!object) return null;

  return (
    <primitive
      object={object}
      onClick={(event) => {
        // Raycasting still hits invisible meshes, so walk up the parents and
        // ignore clicks on anything the user has hidden.
        for (let node = event.object; node; node = node.parent) {
          if (!node.visible) return;
        }
        // Selection only happens on a click; dragging the camera across a mesh
        // (or releasing over one) must not change the selection.
        if (consumePointerDrag()) return;
        event.stopPropagation();
        // The whole inserted object is selected; its parts stay reachable from
        // the scene tree.
        onSelect(object);
      }}
    />
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
