/**
 * Tracks whether the pointer actually dragged between down and up. A drag that
 * orbits the camera and happens to release over a mesh must not be treated as a
 * click on that mesh, so every viewport selection checks this first.
 */
let pointerDown = null;
let pointerMoved = false;
let installed = false;

function install() {
  if (installed || typeof document === "undefined") return;
  installed = true;
  const onDown = (event) => {
    pointerDown = { x: event.clientX, y: event.clientY };
    pointerMoved = false;
  };
  const onMove = (event) => {
    if (!pointerDown) return;
    if (Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y) > 5) {
      pointerMoved = true;
    }
  };
  const onUp = () => {
    pointerDown = null;
  };
  document.addEventListener("pointerdown", onDown, true);
  document.addEventListener("pointermove", onMove, true);
  document.addEventListener("pointerup", onUp, true);
  document.addEventListener("pointercancel", onUp, true);
}

install();

/** True when the current gesture was a drag; resets the flag as it is read. */
export function consumePointerDrag() {
  const value = pointerMoved;
  pointerMoved = false;
  return value;
}
