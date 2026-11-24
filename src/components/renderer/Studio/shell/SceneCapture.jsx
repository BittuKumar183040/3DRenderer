import { useEffect } from "react";
import PropTypes from "prop-types";
import { useThree } from "@react-three/fiber";

export default function SceneCapture({ onScene }) {
  const { scene } = useThree();
  useEffect(() => {
    onScene(scene);
  }, [scene, onScene]);
  return null;
}

SceneCapture.propTypes = {
  onScene: PropTypes.func.isRequired,
};
