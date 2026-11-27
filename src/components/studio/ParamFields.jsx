import PropTypes from "prop-types";

/** Number grid for shape/curve parameters. Values stay raw so typing is easy. */
export default function ParamFields({ fields, values, onChange, columns = 2 }) {
  return (
    <div
      className="studio-param-grid"
      style={{ "--param-columns": columns }}
    >
      {fields.map((field) => (
        <label className="studio-param" key={field.key}>
          <span>{field.label}</span>
          <input
            type="number"
            min={field.min}
            max={field.max}
            step={field.step}
            value={values[field.key] ?? ""}
            onChange={(event) => onChange(field.key, event.target.value)}
          />
        </label>
      ))}
    </div>
  );
}

ParamFields.propTypes = {
  fields: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      min: PropTypes.number,
      max: PropTypes.number,
      step: PropTypes.number,
      value: PropTypes.number,
    })
  ).isRequired,
  values: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  columns: PropTypes.number,
};
