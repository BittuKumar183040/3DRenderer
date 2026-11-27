import PropTypes from "prop-types";
import {
  ChevronRight,
  Combine,
  Copy,
  Download,
  Layers3,
  Minus,
  Move,
  Plus,
  Split,
  Trash2,
  X,
} from "lucide-react";
import ExportMenu from "./ExportMenu";

const nameOf = (object) => object.name || object.type || "Object";

/**
 * Inspector shown instead of the single-object panel once shift-click adds a
 * second object. The first object is the primary target (boolean base, group
 * name, gizmo target); everything else is secondary.
 */
export default function MultiSelectionPanel({
  open,
  objects,
  onClose,
  onRemove,
  onDelete,
  onGroup,
  onUngroup,
  onBoolean,
  onDuplicate,
  onMoveToCursor,
  onAlign,
  onDropToGround,
  onResetTransform,
  onNotice,
}) {
  const primary = objects[0];
  const canUngroup = Boolean(primary?.isGroup && primary.children?.length);
  const meshCount = objects.reduce((total, object) => {
    let count = 0;
    object.traverse?.((node) => {
      if (node.isMesh && !node.userData?.studioHelper) count += 1;
    });
    return total + count;
  }, 0);

  return (
    <aside
      className={`studio-panel studio-panel-right studio-inspector studio-multi${open ? "" : " is-hidden"}`}
      aria-label="Multiple selection inspector"
      aria-hidden={!open}
    >
      <header className="panel-head">
        <div className="panel-head-copy">
          <span className="panel-kicker">Multiple selection</span>
          <h2 className="panel-title inspector-name">
            {objects.length} objects
          </h2>
        </div>
        <div className="panel-head-actions">
          <b className="panel-count">{meshCount}</b>
          <button
            type="button"
            className="panel-close"
            onClick={onClose}
            title="Hide inspector — keeps the selection"
            aria-label="Hide inspector"
          >
            <X size={15} />
          </button>
        </div>
      </header>

      <div className="panel-body inspector-scroll">
        <div className="inspector-crumbs">
          <Layers3 size={13} />
          <span>Primary</span>
          <ChevronRight size={11} />
          <span>{nameOf(primary)}</span>
          <ChevronRight size={11} />
          <span>{objects.length - 1} secondary</span>
        </div>

        <section className="inspector-section">
          <h3>Selected objects</h3>
          <div className="studio-multi-list">
            {objects.map((object, index) => (
              <div className="studio-multi-row" key={object.uuid}>
                <span
                  className={`studio-multi-badge${index === 0 ? " is-primary" : ""}`}
                  title={index === 0 ? "Primary selection" : "Secondary selection"}
                >
                  {index + 1}
                </span>
                <span className="studio-multi-name" title={nameOf(object)}>
                  {nameOf(object)}
                </span>
                <small>{index === 0 ? "primary" : "secondary"}</small>
                <button
                  type="button"
                  className="studio-multi-remove"
                  title="Remove from selection"
                  aria-label={`Remove ${nameOf(object)} from selection`}
                  onClick={() => onRemove(object)}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
          <p className="inspector-hint">
            Shift-click in the viewport or the tree to add or remove objects.
          </p>
        </section>

        <section className="inspector-section">
          <h3>Arrange</h3>
          <div className="inspector-actions">
            <button type="button" onClick={onGroup} title="Group into one object">
              <Layers3 size={13} /> Group
            </button>
            <button
              type="button"
              onClick={onUngroup}
              disabled={!canUngroup}
              title={canUngroup ? "Split the group into objects" : "Select a group first"}
            >
              <Split size={13} /> Ungroup
            </button>
            <button type="button" onClick={onDuplicate} title="Duplicate every selected object (D)">
              <Copy size={13} /> Duplicate
            </button>
            <button
              type="button"
              className="inspector-delete"
              onClick={onDelete}
              title="Delete the selection (Delete)"
            >
              <Trash2 size={13} /> Delete
            </button>
          </div>
        </section>

        <section className="inspector-section">
          <h3>Boolean</h3>
          <div className="inspector-actions">
            <button
              type="button"
              disabled={meshCount < 2}
              onClick={() => onBoolean("union")}
              title="Merge every selected mesh into one"
            >
              <Combine size={13} /> Union
            </button>
            <button
              type="button"
              disabled={meshCount < 2}
              onClick={() => onBoolean("subtract")}
              title="Cut the secondary objects out of the primary"
            >
              <Minus size={13} /> Subtract
            </button>
            <button
              type="button"
              disabled={meshCount < 2}
              onClick={() => onBoolean("intersect")}
              title="Keep only the shared volume"
            >
              <Plus size={13} /> Intersect
            </button>
          </div>
          <p className="inspector-hint">
            Union merges all meshes · Subtract removes the secondary meshes from
            the primary one · Intersect keeps the overlap.
          </p>
        </section>

        <section className="inspector-section">
          <h3>Transform</h3>
          <div className="inspector-actions">
            <button type="button" onClick={onMoveToCursor} title="Move the selection to the 3D cursor">
              <Move size={13} /> To cursor
            </button>
            <button type="button" onClick={onAlign} title="Align every object on the primary's X/Z">
              <Combine size={13} /> Align
            </button>
            <button type="button" onClick={onDropToGround} title="Rest every object on the grid">
              <Download size={13} /> Drop
            </button>
            <button type="button" onClick={onResetTransform} title="Clear rotation and scale">
              <X size={13} /> Reset
            </button>
          </div>
        </section>

        <div className="inspector-hint">
          <Copy size={13} /> G move · R rotate · S scale · D duplicate · B union · X delete
        </div>
      </div>

      <footer className="inspector-foot">
        <ExportMenu
          objects={objects}
          name={`${objects.length}-objects`}
          label="Export selections"
          scope="Selection"
          placement="up"
          onNotice={onNotice}
          includeCapture
        />
      </footer>
    </aside>
  );
}

MultiSelectionPanel.propTypes = {
  open: PropTypes.bool,
  objects: PropTypes.arrayOf(PropTypes.object).isRequired,
  onClose: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onGroup: PropTypes.func.isRequired,
  onUngroup: PropTypes.func.isRequired,
  onBoolean: PropTypes.func.isRequired,
  onDuplicate: PropTypes.func.isRequired,
  onMoveToCursor: PropTypes.func.isRequired,
  onAlign: PropTypes.func.isRequired,
  onDropToGround: PropTypes.func.isRequired,
  onResetTransform: PropTypes.func.isRequired,
  onNotice: PropTypes.func,
};
