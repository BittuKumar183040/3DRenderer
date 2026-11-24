import { Suspense, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Bounds, Loader } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { ChevronLeft, Layers3 } from 'lucide-react';

import Graph from './components/Graph';
import GUI from './components/GUI';
import Info from './components/extras/Info';
import MinMax from './components/extras/MinMax';
import CameraManipulation from './components/extras/CameraManipulation';
import CameraGUI from './components/extras/CameraGUI';
import ColorPalette from './components/extras/ColorPalette';
import { MemorizedModel } from './components/major/Model';
import ViewerBrand from '../shell/ViewerBrand';
import useMediaQuery from '../shell/useMediaQuery';
import './vtk-workspace.css';

const VIEW_MODES = {
  surface: { surface: true, points: [false, 1], wireframe: false, surface_edge: false },
  wireframe: { surface: false, points: [false, 1], wireframe: true, surface_edge: false },
  points: { surface: false, points: [true, 0], wireframe: false, surface_edge: false },
  surface_with_edges: { surface: false, points: [false, 1], wireframe: false, surface_edge: true },
};

const VtkRendering = ({ vtkData, onExit }) => {
  const compact = useMediaQuery('(max-width: 760px)');
  const [rotate, setRotate] = useState([0, 0, 0]);
  const [metaData, setMetaData] = useState(vtkData);
  const [colorOption, setColorOption] = useState('displacement');
  const [distance, setDistance] = useState(null);
  const [limitVisible] = useState(0.1);
  const [sidebarOpen, setSidebarOpen] = useState(!compact);
  const [legendOpen, setLegendOpen] = useState(!compact);

  const [viewOption, setViewOption] = useState(VIEW_MODES.surface);

  useEffect(() => {
    setSidebarOpen(!compact);
    setLegendOpen(!compact);
  }, [compact]);

  const toggleSidebar = () => {
    const next = !sidebarOpen;
    setSidebarOpen(next);
    if (next && compact) setLegendOpen(false);
  };

  const toggleLegend = (next) => {
    setLegendOpen(next);
    if (next && compact) setSidebarOpen(false);
  };

  const changesMade = (event) => {
    switch (event[0]) {
      case 'solid_color':
        setColorOption('solid_color');
        break;
      case 'displacement':
        setColorOption('displacement');
        break;
      case 'surface':
      case 'wireframe':
      case 'surface_with_edges':
        setViewOption(VIEW_MODES[event[0]]);
        break;
      case 'points':
        setViewOption({
          surface: false,
          points: [true, event[1] ? parseFloat(event[1]) : 0],
          wireframe: false,
          surface_edge: false,
        });
        break;
      default:
        console.log(event[0], 'Menu Not Designed Yet!');
    }
  };

  const MinMaxChange = (event) => {
    if (event[0] === 'min_max') {
      setDistance({ ...distance, minDis: event[1].minDis, maxDis: event[1].maxDis });
    }
  };

  const sendBack = (event) => {
    setMetaData({
      ...vtkData,
      Cells: event.Cells,
      Points: event.Points,
      Min: event.Min,
      Max: event.Max,
      scalerType: event.scalerType,
      is3D: event.is3D,
    });
  };

  const [colorPalette, setColorPalette] = useState(['#00f', '#fff', '#f00']);
  const [deltaBack] = useState({ x: 0, y: 0, z: 0 });

  return (
    <div className="renderer-workspace vtk-workspace studio-shell">
      <div className="studio-canvas">
        <Canvas dpr={[1, 2]} camera={{ near: 0.000001 }}>
          <CameraManipulation dimension={metaData.is3D} />
          <Bounds clip fit margin={0.25}>
            <ambientLight intensity={1} />
            <Suspense fallback={<p>Loading...</p>}>
              <MemorizedModel
                rawData={vtkData}
                deltaBack={deltaBack}
                colorPalette={colorPalette}
                rotate={rotate}
                color={colorOption}
                customDistance={distance}
                options={viewOption}
                limitVisible={limitVisible}
                sendBack={sendBack}
              />
            </Suspense>
          </Bounds>
          <Loader />
        </Canvas>
      </div>

      <div className="studio-topbar">
        <div className="studio-topbar-left">
          <ViewerBrand
            title={metaData.Name || 'Scientific dataset'}
            extension="vtk"
            onExit={onExit}
          />
          <div className="studio-panel-toggles" role="group" aria-label="Panels">
            <button
              type="button"
              className={`studio-toggle${sidebarOpen ? ' is-active' : ''}`}
              aria-pressed={sidebarOpen}
              aria-label="Toggle scene graph"
              title="Toggle scene graph"
              onClick={toggleSidebar}
            >
              <Layers3 size={15} />
              <span>Scene</span>
            </button>
            <button
              type="button"
              className={`studio-toggle${legendOpen ? ' is-active' : ''}`}
              aria-pressed={legendOpen}
              aria-label="Toggle color map"
              title="Toggle color map"
              onClick={() => toggleLegend(!legendOpen)}
            >
              <i className="studio-toggle-swatch" aria-hidden="true" />
              <span>Color map</span>
            </button>
          </div>
        </div>

        <div className="studio-topbar-right">
          <div className="vtk-toolbar studio-toolbar">
            {metaData.Min === null ? null : (
              <MinMax MinMaxChange={MinMaxChange} metaData={{ Min: metaData.Min, Max: metaData.Max }} />
            )}
            <CameraGUI changeRotate={(value) => setRotate(value)} />
            <ColorPalette changePalettes={(value) => setColorPalette(value)} />
            <div className="vtk-dimension-chip">
              <span className="vtk-dimension-dot" />
              <p>{metaData.is3D ? '3D' : '2D'} VIEW</p>
            </div>
          </div>
          <Info />
        </div>
      </div>

      <aside className={`vtk-sidebar studio-panel studio-panel-left${sidebarOpen ? '' : ' is-hidden'}`}>
        <header className="panel-head">
          <div className="panel-head-copy">
            <span className="panel-kicker">Workspace</span>
            <h2 className="panel-title">
              <Layers3 size={14} /> Scene graph
            </h2>
          </div>
          <button
            type="button"
            className="panel-close"
            onClick={() => setSidebarOpen(false)}
            title="Hide scene graph"
            aria-label="Hide scene graph"
          >
            <ChevronLeft size={15} />
          </button>
        </header>
        <div className="panel-body">
          <div className="vtk-tree-row">
            <i />
            <span className="vtk-tree-icon">◈</span>
            <span className="vtk-tree-name">{metaData.Name || 'VTK dataset'}</span>
          </div>
          <div className="vtk-tree-row child">
            <i />
            <span className="vtk-tree-icon">▧</span>
            <span className="vtk-tree-name">{metaData.Type || 'Unstructured Grid'}</span>
          </div>
          <div className="vtk-sidebar-section">
            <GUI changesMade={changesMade} metaData={metaData} />
          </div>
          <div className="vtk-sidebar-metrics">
            <span>
              <b>{metaData.Points || '—'}</b>
              <small>POINTS</small>
            </span>
            <span>
              <b>{metaData.Cells || '—'}</b>
              <small>CELLS</small>
            </span>
            {metaData.Min !== null && (
              <span className="vtk-range-metric">
                <small>SCALAR RANGE</small>
                <b>
                  {Number(metaData.Min).toPrecision(3)} — {Number(metaData.Max).toPrecision(3)}
                </b>
              </span>
            )}
          </div>
        </div>
      </aside>

      {metaData.Min !== null && (
        <Graph
          colorPalette={colorPalette}
          distance={{ Min: metaData.Min, Max: metaData.Max }}
          open={legendOpen}
          onClose={() => toggleLegend(false)}
        />
      )}
    </div>
  );
};

VtkRendering.propTypes = {
  vtkData: PropTypes.object.isRequired,
  onExit: PropTypes.func.isRequired,
};

export default VtkRendering;
