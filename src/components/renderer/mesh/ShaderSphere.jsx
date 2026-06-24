import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { fragmentShader } from "../customShader/fragment";
import { vertexShader } from "../customShader/vertex";

const ShaderSphere = () => {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          uTime: { value: 0.0 },
        },
      }),
    []
  );

  useFrame(({ clock }) => {
    material.uniforms.uTime.value = clock.elapsedTime;
  });

  return (
    <mesh>
      <sphereGeometry args={[50, 128, 128]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
};

export default ShaderSphere;