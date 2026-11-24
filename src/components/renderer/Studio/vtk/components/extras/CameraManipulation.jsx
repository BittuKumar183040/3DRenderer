import React, { useMemo } from 'react';
import { MOUSE, Vector3 } from 'three';
import { useThree } from '@react-three/fiber';
import { OrbitControls, GizmoHelper, GizmoViewcube, GizmoViewport } from '@react-three/drei';
import useMediaQuery from '../../../shell/useMediaQuery';


const CameraManipulation = ({ dimension }) => {
    const { gl, camera } = useThree();
    const compact = useMediaQuery('(max-width: 760px)');
    // Keep the axis widget clear of the docked scene panel on desktop, and
    // pull it back into the corner once that panel becomes a mobile sheet.
    const margin = useMemo(() => (compact ? [58, 58] : [382, 86]), [compact]);
    return <>
        <OrbitControls
            mouseButtons={{
                LEFT: MOUSE.PAN,
                RIGHT: MOUSE.ROTATE,
                MIDDLE: MOUSE.DOLLY,
            }}
            zoomSpeed={3}
            dampingFactor={0.25}
            enableDamping
            enableRotate={dimension}
            args={[camera, gl.domElement]}
        />
        <GizmoHelper alignment="bottom-left" margin={margin}>
            <group scale={new Vector3(0.85, 0.85, 0.85)}>
                <GizmoViewport disabled={true} hideNegativeAxes={true} labelColor="white" labels={dimension ? ["X", "Y", "Z"] : ["X", "Y", ""]} axisHeadScale={1} />
            </group>
            {!compact && <group scale={new Vector3(1.5, 1.5, 1.5)}>
                <GizmoViewcube textColor='black' opacity={0.8} strokeColor='blue' />
            </group>}
        </GizmoHelper>
    </>
}

export default React.memo(CameraManipulation)
