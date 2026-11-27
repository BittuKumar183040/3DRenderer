import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Box, X } from "lucide-react";
import ParamFields from "./ParamFields";
import {
  PRIMITIVE_FIELDS,
  defaultPrimitiveParams,
  normalizeParams,
} from "./primitives";

/**
 * Modal shown when a basic mesh is picked from the Resource Manager. It asks
 * for the shape's real dimensions (and segment counts) before the mesh is
 * created, mirroring the Cursor/Object/View popovers rather than inserting a
 * fixed-size blob.
 */
export default function PrimitiveDialog({ item, onCancel, onCreate }) {
  const [values, setValues] = useState(() => defaultPrimitiveParams(item.key));

  useEffect(() => {
    if (!item) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [item, onCancel]);

  const fields = PRIMITIVE_FIELDS[item.key] || PRIMITIVE_FIELDS.cube;

  return (
    <div className="studio-dialog-veil" role="presentation" onMouseDown={onCancel}>
      <form
        className="studio-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={`Add ${item.label}`}
        onMouseDown={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault();
          onCreate(normalizeParams(item.key, values));
        }}
      >
        <header className="studio-dialog-head">
          <span className="studio-dialog-icon">
            <Box size={15} />
          </span>
          <div>
            <span className="panel-kicker">Add mesh</span>
            <h2>{item.label}</h2>
          </div>
          <button
            type="button"
            className="panel-close"
            onClick={onCancel}
            aria-label="Close add mesh dialog"
          >
            <X size={15} />
          </button>
        </header>

        <ParamFields
          fields={fields}
          values={values}
          onChange={(key, value) =>
            setValues((current) => ({ ...current, [key]: value }))
          }
        />

        <footer className="studio-dialog-actions">
          <button type="button" className="st-btn" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="st-btn is-primary">
            Add {item.label}
          </button>
        </footer>
      </form>
    </div>
  );
}

PrimitiveDialog.propTypes = {
  item: PropTypes.shape({
    key: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
  }).isRequired,
  onCancel: PropTypes.func.isRequired,
  onCreate: PropTypes.func.isRequired,
};
