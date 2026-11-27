import { useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const CAMERA_COLOR = "#5f6bff";
const HELPER_NAME = "Studio helpers";

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const TARGET = new THREE.Vector3();

/** Inserted object a light or camera belongs to, if any. */
function ownerOf(node) {
  for (let current = node; current; current = current.parent) {
    if (current.userData?.studioModelId) return current;
  }
  return null;
}

/**
 * World-space helpers are only drawn for lamps and cameras that belong to an
 * inserted object, so the studio's own key and fill lights never get a gizmo.
 */
function collect(scene) {
  const found = [];
  scene.traverse((node) => {
    if (!node.isLight && !node.isCamera) return;
    if (node.isAmbientLight || node.isHemisphereLight) return;
    const owner = ownerOf(node);
    if (!owner) return;
    found.push({ node, owner, kind: node.isCamera ? "camera" : "light" });
  });
  return found;
}

function CameraGlyph({ color }) {
  const geometry = useMemo(() => {
    const depth = 0.55;
    const width = 0.24;
    const height = 0.17;
    const points = [
      0, 0, 0, -width, -height, -depth,
      0, 0, 0, width, -height, -depth,
      0, 0, 0, width, height, -depth,
      0, 0, 0, -width, height, -depth,
      -width, -height, -depth, width, -height, -depth,
      width, -height, -depth, width, height, -depth,
      width, height, -depth, -width, height, -depth,
      -width, height, -depth, -width, -height, -depth,
    ];
    const buffer = new THREE.BufferGeometry();
    buffer.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
    return buffer;
  }, []);

  return (
    <group>
      <lineSegments geometry={geometry} frustumCulled={false}>
        <lineBasicMaterial
          color={color}
          transparent
          opacity={0.85}
          depthTest={false}
          depthWrite={false}
          toneMapped={false}
        />
      </lineSegments>
      <mesh>
        <boxGeometry args={[0.1, 0.07, 0.12]} />
        <meshBasicMaterial
          color={color}
          depthTest={false}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

CameraGlyph.propTypes = {
  color: PropTypes.string.isRequired,
};

function LightGlyph({ color, ray }) {
  return (
    <group>
      {/* Dark halo keeps the gizmo readable on light and dark materials. */}
      <mesh renderOrder={999}>
        <octahedronGeometry args={[0.152, 0]} />
        <meshBasicMaterial
          color="#23252f"
          wireframe
          transparent
          opacity={0.45}
          depthTest={false}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <mesh renderOrder={1000}>
        <octahedronGeometry args={[0.12, 0]} />
        <meshBasicMaterial
          color={color}
          wireframe
          depthTest={false}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <mesh renderOrder={1000}>
        <sphereGeometry args={[0.042, 12, 8]} />
        <meshBasicMaterial
          color={color}
          depthTest={false}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      {ray && (
        <line ref={ray} renderOrder={1000} frustumCulled={false}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={2}
              array={new Float32Array(6)}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial
            color={color}
            transparent
            opacity={0.8}
            depthTest={false}
            depthWrite={false}
            toneMapped={false}
          />
        </line>
      )}
    </group>
  );
}

LightGlyph.propTypes = {
  color: PropTypes.string.isRequired,
  ray: PropTypes.shape({ current: PropTypes.any }),
};

LightGlyph.defaultProps = {
  ray: null,
};

/**
 * One gizmo, kept in world space and drawn on top of the scene, so the lamp or
 * camera can be seen where it actually points without adding a marker mesh to
 * the model. Clicking the gizmo selects the object that owns it.
 */
function Helper({ item, onSelect, active }) {
  const group = useRef(null);
  const ray = useRef(null);
  const { node, owner, kind } = item;

  const color =
    kind === "camera" ? CAMERA_COLOR : `#${node.color?.getHexString?.() || "f0b64a"}`;
  const aimed =
    kind === "light" && Boolean(node.target) && !node.isPointLight && !node.isAmbientLight;

  useFrame(() => {
    const outer = group.current;
    if (!outer) return;

    let visible = true;
    for (let current = node; current; current = current.parent) {
      if (current.visible === false) {
        visible = false;
        break;
      }
    }
    outer.visible = visible;
    if (!visible) return;

    // A lamp or camera has no geometry of its own, so its gizmo is the only
    // cue that it is selected.
    outer.scale.setScalar(active ? 1.45 : 1);

    node.updateWorldMatrix(true, false);
    outer.position.setFromMatrixPosition(node.matrixWorld);

    if (kind === "camera") {
      outer.quaternion.setFromRotationMatrix(node.matrixWorld);
      return;
    }

    if (aimed && ray.current) {
      node.target.updateWorldMatrix(true, false);
      TARGET.setFromMatrixPosition(node.target.matrixWorld).sub(outer.position);
      const length = TARGET.length();
      if (length > 1e-4) {
        // Long enough to read as a direction, short enough to stay on screen.
        TARGET.multiplyScalar(clamp(length, 0.6, 24) / length);
        const position = ray.current.geometry.attributes.position;
        position.setXYZ(1, TARGET.x, TARGET.y, TARGET.z);
        position.needsUpdate = true;
      }
    }
  });

  return (
    <group ref={group} userData={{ studioHelper: true }}>
      <group
        onClick={(event) => {
          event.stopPropagation();
          onSelect?.(owner, event.nativeEvent || event);
        }}
      >
        {kind === "camera" ? (
          <CameraGlyph color={color} />
        ) : (
          <LightGlyph color={color} ray={aimed ? ray : null} />
        )}
      </group>
    </group>
  );
}

Helper.propTypes = {
  item: PropTypes.shape({
    node: PropTypes.object.isRequired,
    owner: PropTypes.object.isRequired,
    kind: PropTypes.string.isRequired,
  }).isRequired,
  onSelect: PropTypes.func,
  active: PropTypes.bool,
};

Helper.defaultProps = {
  active: false,
};

/**
 * Overlay layer for light and camera gizmos. Rescans the scene whenever the
 * inserted objects change, then tracks each node's world transform every frame.
 */
export default function SceneHelpers({ models, selected, onSelect }) {
  const scene = useThree((state) => state.scene);
  const [items, setItems] = useState([]);

  useEffect(() => {
    setItems(collect(scene));
  }, [scene, models]);

  if (!items.length) return null;

  return (
    <group name={HELPER_NAME} renderOrder={900}>
      {items.map((item) => (
        <Helper
          key={`${item.kind}-${item.node.uuid}`}
          item={item}
          active={item.owner === selected}
          onSelect={onSelect}
        />
      ))}
    </group>
  );
}

SceneHelpers.propTypes = {
  models: PropTypes.array.isRequired,
  selected: PropTypes.object,
  onSelect: PropTypes.func,
};

SceneHelpers.defaultProps = {
  selected: null,
  onSelect: null,
};
