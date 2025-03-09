import { GizmoHelper, GizmoViewport } from '@react-three/drei'
import React from 'react'

const Gizmo = () => {
  return (
    <GizmoHelper
      alignment="bottom-left"
      margin={[80, 80]}
    >
      <GizmoViewport axisColors={['red', 'green', 'black']} labelColor="white" />
    </GizmoHelper>
  )
}

export default Gizmo