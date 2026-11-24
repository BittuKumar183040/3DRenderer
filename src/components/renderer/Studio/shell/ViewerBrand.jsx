import PropTypes from "prop-types";
import { ArrowLeft, Box } from "lucide-react";

/**
 * Logo + document chip shown in the top-left corner of every viewer.
 * Clicking the logo leaves the viewer and returns to the studio home page
 * instead of reloading the app.
 */
export default function ViewerBrand({ title, extension, onExit }) {
  return (
    <div className="studio-brand-group">
      <button
        type="button"
        className="studio-brand"
        onClick={onExit}
        title="Back to studio home"
        aria-label="Back to studio home"
      >
        <span className="studio-brand-mark">
          <Box size={16} />
        </span>
        <span className="studio-brand-name">
          Bexyzo<span>.</span>
        </span>
        <ArrowLeft size={13} className="studio-brand-arrow" />
      </button>
      {title && (
        <span className="studio-doc" title={title}>
          <strong>{title}</strong>
          {extension && <small>{extension.toUpperCase()}</small>}
        </span>
      )}
    </div>
  );
}

ViewerBrand.propTypes = {
  title: PropTypes.string,
  extension: PropTypes.string,
  onExit: PropTypes.func.isRequired,
};
