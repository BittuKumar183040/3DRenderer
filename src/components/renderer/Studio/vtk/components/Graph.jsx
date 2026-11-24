import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { GripHorizontal, X } from 'lucide-react';

const Graph = ({ colorPalette = ['#00f', '#fff', '#f00'], distance, open = true, onClose }) => {
  const min = Number(distance?.Min ?? 0);
  const max = Number(distance?.Max ?? 1);
  const [height, setHeight] = useState(260);
  const [dragging, setDragging] = useState(false);
  const start = useRef({ y: 0, height: 0 });
  const palette = colorPalette.length > 1 ? colorPalette : ['#1646d8', '#ffffff', '#e83b36'];
  const gradient = `linear-gradient(to top, ${palette.map((color, index) => `${color} ${(index / (palette.length - 1)) * 100}%`).join(', ')})`;
  const count = Math.max(3, Math.min(11, Math.floor(height / 39)));
  const values = Array.from({ length: count }, (_, i) => max - ((max - min) * i) / (count - 1));
  const format = (value) => Math.abs(value) >= 10000 || (Math.abs(value) > 0 && Math.abs(value) < 0.001) ? value.toExponential(2) : Number(value.toPrecision(4)).toString();

  useEffect(() => {
    if (!dragging) return undefined;
    const move = (event) => setHeight(Math.min(window.innerHeight * 0.78, Math.max(150, start.current.height + start.current.y - event.clientY)));
    const up = () => setDragging(false);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
  }, [dragging]);

  if (!open) return null;

  return <aside className="vtk-legend" style={{ height }}>
    <button className="vtk-legend-resize" aria-label="Resize scalar legend" onPointerDown={(event) => { event.preventDefault(); start.current = { y: event.clientY, height }; setDragging(true); }}><GripHorizontal size={15}/></button>
    <div className="vtk-legend-title">
      <span>SCALAR</span>
      <b>Color map</b>
      <button type="button" className="vtk-legend-close" aria-label="Hide color map" onClick={onClose}><X size={13}/></button>
    </div>
    <div className="vtk-legend-content"><div className="vtk-legend-values">{values.map((value, index) => <div className="vtk-legend-tick" key={index}><span>{format(value)}</span><i/></div>)}</div><div className="vtk-legend-ramp" style={{ background: gradient }}/></div>
  </aside>;
};

Graph.propTypes = {
  colorPalette: PropTypes.arrayOf(PropTypes.string),
  distance: PropTypes.shape({ Min: PropTypes.oneOfType([PropTypes.number, PropTypes.string]), Max: PropTypes.oneOfType([PropTypes.number, PropTypes.string]) }),
  open: PropTypes.bool,
  onClose: PropTypes.func,
};

export default Graph;
