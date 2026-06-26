import { useEffect, useRef, memo, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useTexture } from "@react-three/drei";

const ShaderSphere = ({ vertexShader, fragmentShader }) => {
  const material = useRef();
  const texture = useTexture("/texture.jpg");

  useFrame(({ clock, pointer, size }) => {
    if (material.current) {
      const uniforms = material.current.uniforms;

      uniforms.uTime.value = clock.elapsedTime;
      uniforms.uFrame.value++;

      uniforms.uResolution.value.set(
        size.width * window.devicePixelRatio,
        size.height * window.devicePixelRatio,
      );

      uniforms.uMouse.value.set(
        (pointer.x * 0.5 + 0.5) * size.width * window.devicePixelRatio,
        (pointer.y * 0.5 + 0.5) * size.height * window.devicePixelRatio,
      );
    }
  });

  useEffect(() => {
    if (!material.current) return;

    material.current.vertexShader = vertexShader;
    material.current.fragmentShader = fragmentShader;
    material.current.needsUpdate = true;
  }, [vertexShader, fragmentShader]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0.0 },
      uFrame: { value: 0.0 },
      uResolution: {
        value: new THREE.Vector2(
          window.innerWidth,
          window.innerHeight,
        ).multiplyScalar(window.devicePixelRatio),
      },
      uMouse: {
        value: new THREE.Vector2(
          0.5 * window.innerWidth,
          window.innerHeight,
        ).multiplyScalar(window.devicePixelRatio),
      },
      uTexture: { value: texture },
    }),
    [],
  );

  return (
    <mesh>
      <sphereGeometry args={[50, 128, 128]} />

      <shaderMaterial
        ref={material}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  );
};

export default memo(ShaderSphere);
