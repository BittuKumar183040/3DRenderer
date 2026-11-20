import { useProgress } from '@react-three/drei';
import { Box, LoaderCircle } from 'lucide-react';

export default function ModelLoadingOverlay({ name }) {
  const { active, progress, item } = useProgress();
  if (!active) return null;
  const percent = Math.max(0, Math.min(100, Math.round(progress || 0)));
  const preparing = percent >= 100;
  return <div className="model-loading-overlay" role="status" aria-live="polite">
    <div className="model-loading-card">
      <div className="model-loading-icon">{preparing ? <LoaderCircle className="loading-spin" size={23}/> : <Box size={23}/>}</div>
      <span className="model-loading-label">{preparing ? 'PREPARING SCENE' : 'LOADING MODEL'}</span>
      <h2>{name || '3D model'}</h2>
      <p>{preparing ? 'Building geometry and materials…' : 'Reading model data and textures…'}</p>
      <div className="model-loading-track"><span style={{ width: `${preparing ? 100 : percent}%` }}/></div>
      <div className="model-loading-meta"><span>{preparing ? 'Almost ready' : item?.split(/[\\/]/).pop() || 'Loading asset'}</span><b>{percent}%</b></div>
    </div>
    <style>{`.model-loading-overlay{position:absolute;inset:0;z-index:6;display:grid;place-items:center;background:linear-gradient(145deg,#f2f3f8ed,#e7e9f1ed);backdrop-filter:blur(8px);font-family:Inter,system-ui,sans-serif}.model-loading-card{width:min(340px,calc(100vw - 40px));padding:25px;border:1px solid #ffffff;border-radius:16px;background:#ffffffd9;box-shadow:0 18px 55px #25283b16;color:#313342}.model-loading-icon{width:46px;height:46px;display:grid;place-items:center;border:1px solid #e8e4ff;border-radius:13px;background:#f2efff;color:#7464d6;margin-bottom:20px}.loading-spin{animation:loadspin 1.2s linear infinite}@keyframes loadspin{to{transform:rotate(360deg)}}.model-loading-label{font-size:9px;letter-spacing:1.2px;color:#8173d6;font-weight:750}.model-loading-card h2{font-size:17px;letter-spacing:-.3px;margin:7px 0 4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.model-loading-card p{font-size:11px;color:#858997;margin:0 0 20px}.model-loading-track{height:5px;background:#e9e8f0;border-radius:6px;overflow:hidden}.model-loading-track span{display:block;height:100%;border-radius:6px;background:linear-gradient(90deg,#7767dc,#a69cf4);transition:width .25s ease}.model-loading-meta{display:flex;justify-content:space-between;margin-top:9px;font-size:9px;color:#9295a2}.model-loading-meta span{max-width:250px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.model-loading-meta b{color:#5e53b6;font-variant-numeric:tabular-nums}`}</style>
  </div>;
}
