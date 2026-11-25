import PropTypes from "prop-types";
import { LuMove3D, LuRotate3D, LuScale3D } from "react-icons/lu";

const MODES = [
  { key: "translate", label: "Move", keycap: "G", Icon: LuMove3D },
  { key: "rotate", label: "Rotate", keycap: "R", Icon: LuRotate3D },
  { key: "scale", label: "Scale", keycap: "S", Icon: LuScale3D },
];

/** Segmented Move / Rotate / Scale switch for the viewport gizmo. */
export default function TransformBar({ mode, onChange }) {
  return (
    <div className="studio-transform-bar" role="group" aria-label="Transform tools">
      {MODES.map(({ key, label, keycap, Icon }) => (
        <button
          key={key}
          type="button"
          className={`transform-mode${mode === key ? " is-active" : ""}`}
          aria-pressed={mode === key}
          title={`${label} selection (${keycap})`}
          aria-label={`${label} selection`}
          onClick={() => onChange(key)}
        >
          <Icon size={13} />
        </button>
      ))}
    </div>
  );
}

TransformBar.propTypes = {
  mode: PropTypes.oneOf(["translate", "rotate", "scale"]).isRequired,
  onChange: PropTypes.func.isRequired,
};
