import { useEffect, useRef, memo, useMemo } from "react";
import { useFrame } from "@react-three/fiber";

const ShaderSphere = ({ vertexShader, fragmentShader }) => {
  const material = useRef();

  useFrame(({ clock }) => {
    if (material.current) {
      material.current.uniforms.uTime.value = clock.elapsedTime;
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
      uTime: { value: 0 },
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
