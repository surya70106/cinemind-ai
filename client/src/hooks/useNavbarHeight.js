/**
 * useNavbarHeight — measures the real navbar height via ResizeObserver.
 * Requires the <nav> element to have id="navbar".
 * Returns the height in pixels (number).
 */
import { useState, useLayoutEffect } from 'react';

export function useNavbarHeight(defaultHeight = 72) {
  const [height, setHeight] = useState(defaultHeight);

  useLayoutEffect(() => {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;

    const update = () => setHeight(navbar.getBoundingClientRect().height);
    update();

    const ro = new ResizeObserver(update);
    ro.observe(navbar);
    return () => ro.disconnect();
  }, []);

  return height;
}
