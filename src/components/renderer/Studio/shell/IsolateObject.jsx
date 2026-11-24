import { useEffect } from "react";
import PropTypes from "prop-types";

/**
 * Temporarily hides every mesh that is not the selection (or one of its
 * ancestors/descendants), restoring the author-set visibility afterwards.
 */
export default function IsolateObject({ enabled, root, selected }) {
  useEffect(() => {
    if (!root) return;
    const keep = new Set();
    if (enabled && selected) {
      for (let node = selected; node; node = node.parent) keep.add(node);
      selected.traverse?.((node) => keep.add(node));
    }
    root.traverse?.((node) => {
      if (!node.isMesh && !node.isPoints && !node.isLine) return;
      if (node.userData.studioVisible === undefined) {
        node.userData.studioVisible = node.visible;
      }
      node.visible =
        enabled && selected ? keep.has(node) : node.userData.studioVisible;
    });
  }, [enabled, root, selected]);

  return null;
}

IsolateObject.propTypes = {
  enabled: PropTypes.bool,
  root: PropTypes.object,
  selected: PropTypes.object,
};
