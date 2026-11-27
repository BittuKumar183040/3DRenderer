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

/** Locally built objects (mesh, lamp, text, curve, group) need no file loading. */
function buildObject(model) {
  if (model.builtObject) return model.builtObject;
  if (model.primitive) return createPrimitive(model.primitive, model.params);
  if (model.light) return createLight(model.light);
  if (model.curve) return createCurve(model.curve, model.params);
  if (model.text || model.textOptions) {
    return createText(model.textOptions || model.text);
  }
  return null;
}

/**
 * One model placed on the studio canvas — either a loaded file or a built-in
 * object. The built or loaded object itself is the model root, so every
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

    Promise.resolve(buildObject(model))
      .then((built) => {
        if (!active || !built) return;
        built.position.add(offset);
        setObject(built);
      })
      .catch((error) => {
        if (active) onError(model.id, model.name, error?.message);
      });

    const loading = !model.builtObject && !model.primitive && !model.light && !model.curve && !model.text && !model.textOptions;
    if (loading) {
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
    }

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
    model.textOptions,
    model.builtObject,
    model.id,
    onError,
  ]);

  useEffect(() => {
    if (!object) return undefined;
    object.name = model.name;
    object.userData = { ...object.userData, studioModelId: model.id };
    // Meshes added to the scene take part in the shadow pass; internal helper
    // parts (lamp markers, light targets) never cast or receive.
    object.traverse((node) => {
      if (!node.isMesh || node.userData?.studioHelper) return;
      node.castShadow = true;
      node.receiveShadow = true;
    });
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
        // the scene tree. Shift extends the selection with a secondary object.
        onSelect(object, event.nativeEvent || event);
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
    textOptions: PropTypes.object,
    params: PropTypes.object,
    builtObject: PropTypes.object,
  }).isRequired,
  position: PropTypes.arrayOf(PropTypes.number).isRequired,
  onReady: PropTypes.func.isRequired,
  onDetach: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
  onError: PropTypes.func.isRequired,
};
