import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Pause, Play, RotateCcw } from "lucide-react";

const SPEEDS = [0.25, 0.5, 1, 1.5, 2];

/** 0:04.2 — short and stable so the timeline label never jumps around. */
function formatTime(seconds) {
  const total = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  const minutes = Math.floor(total / 60);
  const rest = total - minutes * 60;
  return `${minutes}:${rest.toFixed(1).padStart(4, "0")}`;
}

/**
 * Advances every mixer that belongs to the loaded scene. It lives inside the
 * canvas so playback runs on the render loop instead of a separate timer.
 */
export function AnimationTicker({ mixers }) {
  useFrame((_, delta) => {
    mixers.forEach((mixer) => mixer?.update(delta));
  });
  return null;
}

AnimationTicker.propTypes = {
  mixers: PropTypes.arrayOf(PropTypes.object),
};

AnimationTicker.defaultProps = {
  mixers: [],
};

/**
 * Clip player shared by the studio inspector and the format viewers. It drives
 * an AnimationMixer that the canvas ticks, so the same controls work for GLB,
 * GLTF and animated FBX files.
 */
export default function AnimationPanel({
  mixer,
  clips,
  inline = false,
  autoPlay = true,
}) {
  const list = clips || [];
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(autoPlay);
  const [speed, setSpeed] = useState(1);
  const [time, setTime] = useState(0);
  const actionRef = useRef(null);

  const clip = list[Math.min(index, Math.max(0, list.length - 1))] || null;
  const duration = clip?.duration || 0;

  // A new clip starts from the top with looping playback.
  useEffect(() => {
    if (!mixer || !clip) return undefined;
    mixer.stopAllAction();
    const action = mixer.clipAction(clip);
    action.reset();
    action.setLoop(THREE.LoopRepeat, Infinity);
    action.clampWhenFinished = false;
    action.enabled = true;
    action.setEffectiveWeight(1);
    action.play();
    actionRef.current = action;
    setTime(0);
    return () => {
      action.stop();
      actionRef.current = null;
    };
  }, [mixer, clip]);

  useEffect(() => {
    if (actionRef.current) actionRef.current.paused = !playing;
  }, [playing, mixer, clip]);

  useEffect(() => {
    if (actionRef.current) actionRef.current.setEffectiveTimeScale(speed);
  }, [speed, mixer, clip]);

  // The mixer is ticked elsewhere; this loop only mirrors its clock into the
  // timeline so the panel does not need to re-render every frame from state.
  useEffect(() => {
    if (!playing || !mixer) return undefined;
    let frame = 0;
    const tick = () => {
      if (actionRef.current) setTime(actionRef.current.time);
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [playing, mixer, clip]);

  useEffect(() => {
    setIndex(0);
    setPlaying(autoPlay);
  }, [clips, autoPlay]);

  const seek = (value) => {
    const action = actionRef.current;
    if (!action) return;
    action.time = Math.min(Math.max(0, value), duration || value);
    mixer?.update(0);
    setTime(action.time);
  };

  if (!clip) return null;

  return (
    <div className={`studio-anim${inline ? " is-inline" : " is-floating"}`}>
      <header>
        <span className="studio-anim-kicker">
          <Play size={11} /> Animation
        </span>
        <b>
          {list.length} clip{list.length > 1 ? "s" : ""}
        </b>
      </header>

      <div className="studio-anim-row">
        <button
          type="button"
          className="studio-anim-play"
          aria-label={playing ? "Pause animation" : "Play animation"}
          title={playing ? "Pause" : "Play"}
          onClick={() => setPlaying((value) => !value)}
        >
          {playing ? <Pause size={13} /> : <Play size={13} />}
        </button>
        <button
          type="button"
          className="studio-anim-btn"
          aria-label="Restart animation"
          title="Restart"
          onClick={() => {
            seek(0);
            setPlaying(true);
          }}
        >
          <RotateCcw size={12} />
        </button>

        {list.length > 1 && (
          <select
            aria-label="Animation clip"
            value={index}
            onChange={(event) => setIndex(Number(event.target.value))}
          >
            {list.map((item, position) => (
              <option key={`${item.name || "clip"}-${position}`} value={position}>
                {item.name || `Clip ${position + 1}`}
              </option>
            ))}
          </select>
        )}

        <select
          aria-label="Playback speed"
          className="studio-anim-speed"
          value={speed}
          onChange={(event) => setSpeed(Number(event.target.value))}
        >
          {SPEEDS.map((value) => (
            <option key={value} value={value}>
              {value}×
            </option>
          ))}
        </select>
      </div>

      <label className="studio-anim-track">
        <input
          type="range"
          min={0}
          max={Math.max(duration, 0.001)}
          step={0.01}
          value={Math.min(time, duration)}
          aria-label="Animation timeline"
          onChange={(event) => seek(Number(event.target.value))}
        />
        <span>
          {formatTime(time)} / {formatTime(duration)}
        </span>
      </label>
    </div>
  );
}

AnimationPanel.propTypes = {
  mixer: PropTypes.object,
  clips: PropTypes.arrayOf(PropTypes.object),
  inline: PropTypes.bool,
  autoPlay: PropTypes.bool,
};

AnimationPanel.defaultProps = {
  mixer: null,
  clips: [],
};
