import { GizmoHelper, GizmoViewport } from '@react-three/drei'
import React from 'react'

const Gizmo = () => {
  return (
    <GizmoHelper
      alignment="bottom-left"
      // Keep the axis widget clear of the persistent 250px scene tree.
      margin={[334, 86]}
    >
      <GizmoViewport axisColors={['red', 'green', 'black']} labelColor="white" />
    </GizmoHelper>
  )
}

export default Gizmo
