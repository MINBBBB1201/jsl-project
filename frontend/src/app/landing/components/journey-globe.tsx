"use client";

import { useEffect, useRef } from "react";
import createGlobe from "cobe";

/** Decorative globe. Pause off screen and respect reduced motion; no business data. */
export default function JourneyGlobe() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let frame = 0;
    let visible = true;
    let phi = 4.3;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    let globe: ReturnType<typeof createGlobe> | undefined;
    try {
      globe = createGlobe(canvas, {
        width: 1000,
        height: 1000,
        devicePixelRatio: 1,
        phi,
        theta: 0.2,
        dark: 1,
        diffuse: 1.5,
        mapSamples: 18000,
        mapBrightness: 5,
        baseColor: [0.07, 0.08, 0.13],
        markerColor: [1, 0.37, 0.08],
        glowColor: [0.03, 0.08, 0.65],
        scale: 1,
        markers: [
          { location: [37.5665, 126.978], size: 0.055 },
          { location: [31.2304, 121.4737], size: 0.04 },
          { location: [37.5128, 122.1201], size: 0.035 },
          { location: [23.1291, 113.2644], size: 0.04 },
          { location: [21.0278, 105.8342], size: 0.04 },
        ],
        arcs: [
          { from: [37.5665, 126.978], to: [31.2304, 121.4737] },
          { from: [23.1291, 113.2644], to: [21.0278, 105.8342] },
        ],
        arcColor: [1, 0.37, 0.08],
        arcWidth: 0.5,
        arcHeight: 0.15,
      });
    } catch {
      return;
    }
    let previous = 0;
    const draw = (time: number) => {
      if (
        visible &&
        !document.hidden &&
        !motion.matches &&
        time - previous > 32
      ) {
        phi += 0.003;
        globe?.update({ phi });
        previous = time;
      }
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    observer.observe(canvas);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      globe?.destroy();
    };
  }, []);
  return (
    <canvas ref={ref} aria-hidden="true" className="journey-globe-canvas" />
  );
}
