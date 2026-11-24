import { useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

export default function SelectionOutline({ object }) {
  const { scene } = useThree();
  const helper = useMemo(
    () => (object ? new THREE.BoxHelper(object, "#8b72ff") : null),
    [object]
  );
  useEffect(() => {
    if (!helper) return undefined;
    helper.material.depthTest = false;
    helper.material.transparent = true;
    helper.material.opacity = 1;
    helper.renderOrder = 1000;
    scene.add(helper);
    return () => {
      scene.remove(helper);
      helper.geometry.dispose();
      helper.material.dispose();
    };
  }, [helper, scene]);
  useFrame(() => helper?.update());
  return null;
}

SelectionOutline.propTypes = {
  object: PropTypes.object,
};
