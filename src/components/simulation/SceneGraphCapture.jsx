import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';

export default function SceneGraphCapture({ onScene }) {
  const { scene } = useThree();
  useEffect(() => { onScene(scene); }, [scene, onScene]);
  return null;
}
