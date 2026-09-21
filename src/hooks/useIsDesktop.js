import { useEffect, useState } from "react";

/** Width at which the event pages switch to their two-column desktop layout. */
export const DESKTOP_QUERY = "(min-width: 1024px)";

function matches() {
  return typeof window !== "undefined" && Boolean(window.matchMedia?.(DESKTOP_QUERY).matches);
}

/** True on desktop-width screens, and follows the window as it's resized. */
export default function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(matches);

  useEffect(() => {
    const media = window.matchMedia?.(DESKTOP_QUERY);
    if (!media) return undefined;

    const onChange = () => setIsDesktop(media.matches);
    onChange();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return isDesktop;
}
