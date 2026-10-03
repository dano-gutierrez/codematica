"use client";
import { useEffect, useRef, useState } from "react";
export function GameDistrictArt({
  district,
  restored,
  details,
}: {
  district: string;
  restored: boolean;
  details: number;
}) {
  const host = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: "400px" },
    );
    observer.observe(host.current!);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={host} className="game-district-scenery" aria-hidden="true">
      {visible ? (
        <>
          <div
            className="game-district-art"
            style={{ backgroundImage: `url(/game/${district}.webp)` }}
          />
          <div
            className="game-middle-layer"
            style={{ backgroundImage: `url(/game/${district}-middle.webp)` }}
          />
          <div
            className="game-foreground-layer"
            style={{
              backgroundImage: `url(/game/${district}-foreground.webp)`,
            }}
          />
          <div
            className="game-restored-layer"
            style={{
              backgroundImage: `url(/game/${district}-restored.webp)`,
              opacity: restored ? 1 : details * 0.16,
            }}
          />
        </>
      ) : null}
    </div>
  );
}
