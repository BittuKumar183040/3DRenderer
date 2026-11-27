import { useState } from "react";
import PropTypes from "prop-types";
import { Lightbulb, Sun } from "lucide-react";
import { LIGHT_RANGES } from "./lights";

const typeLabel = (light) => {
  if (light.isAmbientLight) return "Ambient";
  if (light.isDirectionalLight) return "Sun";
  if (light.isSpotLight) return "Spot";
  if (light.isPointLight) return "Point";
  return light.type;
};

const rangeFor = (light) => {
  if (light.isAmbientLight) return LIGHT_RANGES.ambient;
  if (light.isDirectionalLight) return LIGHT_RANGES.sun;
  if (light.isSpotLight) return LIGHT_RANGES.spot;
  return LIGHT_RANGES.point;
};

const nameOf = (light) =>
  light.parent?.name || `${typeLabel(light)} light`;

/**
 * Real light controls: colour, intensity, shadow casting and the falloff
 * options that belong to each lamp type. It also lists every light in the
 * scene so intensities can be raised together.
 */
export default function LightSection({ object, root }) {
  const [, tick] = useState(0);
  const update = () => tick((value) => value + 1);

  let active = null;
  object?.traverse?.((node) => {
    if (!active && node.isLight) active = node;
  });
  if (!active) return null;

  const range = rangeFor(active);
  const hex = `#${active.color.getHexString()}`;

  // Only lamps that belong to an inserted object; the studio's own key and
  // fill lights follow the brightness control instead.
  const belongsToStudio = (node) => {
    for (let current = node; current; current = current.parent) {
      if (current.userData?.studioModelId) return true;
    }
    return false;
  };
  const lights = [];
  root?.traverse?.((node) => {
    if (node.isLight && belongsToStudio(node)) lights.push(node);
  });

  return (
    <section className="inspector-section">
      <div className="inspector-section-head">
        <h3>
          <Lightbulb size={13} /> Light
        </h3>
        <small className="inspector-light-type">{typeLabel(active)}</small>
      </div>

      <div className="inspector-material">
        <input
          type="color"
          aria-label="Light colour"
          value={hex}
          onChange={(event) => {
            active.color.set(event.target.value);
            update();
          }}
        />
        <div>
          <b>{nameOf(active)}</b>
          <small>{typeLabel(active)} · colour and intensity</small>
        </div>
      </div>

      <label className="inspector-slider">
        <span>Intensity</span>
        <input
          type="range"
          min={0}
          max={range.max}
          step={range.step}
          value={active.intensity}
          onChange={(event) => {
            active.intensity = Number(event.target.value);
            update();
          }}
        />
        <b>{Number(active.intensity).toFixed(range.step < 1 ? 2 : 0)}</b>
      </label>

      {(active.isPointLight || active.isSpotLight) && (
        <>
          <label className="inspector-slider">
            <span>Distance</span>
            <input
              type="range"
              min={0}
              max={60}
              step={0.5}
              value={active.distance}
              onChange={(event) => {
                active.distance = Number(event.target.value);
                update();
              }}
            />
            <b>{Number(active.distance).toFixed(1)}</b>
          </label>
          <label className="inspector-slider">
            <span>Decay</span>
            <input
              type="range"
              min={0}
              max={4}
              step={0.1}
              value={active.decay}
              onChange={(event) => {
                active.decay = Number(event.target.value);
                update();
              }}
            />
            <b>{Number(active.decay).toFixed(1)}</b>
          </label>
        </>
      )}

      {active.isSpotLight && (
        <>
          <label className="inspector-slider">
            <span>Angle</span>
            <input
              type="range"
              min={1}
              max={80}
              step={1}
              value={Math.round((active.angle * 180) / Math.PI)}
              onChange={(event) => {
                active.angle = (Number(event.target.value) * Math.PI) / 180;
                update();
              }}
            />
            <b>{Math.round((active.angle * 180) / Math.PI)}°</b>
          </label>
          <label className="inspector-slider">
            <span>Penumbra</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.02}
              value={active.penumbra}
              onChange={(event) => {
                active.penumbra = Number(event.target.value);
                update();
              }}
            />
            <b>{Number(active.penumbra).toFixed(2)}</b>
          </label>
        </>
      )}

      {!active.isAmbientLight && (
        <div className="inspector-toggles">
          <label className="inspector-check">
            <span>Cast shadows</span>
            <input
              type="checkbox"
              checked={Boolean(active.castShadow)}
              onChange={(event) => {
                active.castShadow = event.target.checked;
                update();
              }}
            />
          </label>
        </div>
      )}

      {lights.length > 1 && (
        <>
          <div className="inspector-section-head is-sub">
            <h4>
              <Sun size={12} /> All lights ({lights.length})
            </h4>
          </div>
          {lights.map((light, index) => {
            const limits = rangeFor(light);
            return (
              <label className="inspector-slider is-light" key={light.uuid}>
                <span>
                  <i
                    aria-hidden="true"
                    className="inspector-light-swatch"
                    style={{ background: `#${light.color.getHexString()}` }}
                  />
                  {nameOf(light) || `Light ${index + 1}`}
                </span>
                <input
                  type="range"
                  min={0}
                  max={limits.max}
                  step={limits.step}
                  value={light.intensity}
                  onChange={(event) => {
                    light.intensity = Number(event.target.value);
                    update();
                  }}
                />
                <b>{Number(light.intensity).toFixed(limits.step < 1 ? 2 : 0)}</b>
              </label>
            );
          })}
        </>
      )}
    </section>
  );
}

LightSection.propTypes = {
  object: PropTypes.object.isRequired,
  root: PropTypes.object,
};
