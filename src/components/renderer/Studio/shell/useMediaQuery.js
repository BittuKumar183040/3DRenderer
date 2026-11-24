import { useEffect, useState } from "react";

/**
 * Subscribes to a CSS media query so viewer chrome can switch between the
 * docked desktop panels and the compact mobile sheets.
 */
export default function useMediaQuery(query) {
  const [matches, setMatches] = useState(
    () => typeof window !== "undefined" && window.matchMedia(query).matches
  );

  useEffect(() => {
    const list = window.matchMedia(query);
    const update = () => setMatches(list.matches);
    update();
    if (list.addEventListener) list.addEventListener("change", update);
    else list.addListener(update);
    return () => {
      if (list.removeEventListener) list.removeEventListener("change", update);
      else list.removeListener(update);
    };
  }, [query]);

  return matches;
}
