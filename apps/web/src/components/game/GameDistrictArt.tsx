"use client";
import { useEffect, useRef, useState } from "react";
import { parallaxOffset } from "@codematica/core/game";
export function GameDistrictArt({
  district,
  panel,
  restored,
  details,
}: {
  district: string;
  panel?: string;
  restored: boolean;
  details: number;
}) {
  const host = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const tile =
    panel ?? `city-${district === "tower" ? 0 : district === "canal" ? 1 : 2}`;
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: "1200px" },
    );
    observer.observe(host.current!);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!visible) return;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    const update = () => {
      frame = 0;
      const element = host.current!;
      const rect = element.getBoundingClientRect();
      if (rect.top + rect.height < 0 || rect.top > window.innerHeight) return;
      for (const [name, speed] of [
        ["mist", 0.025],
        ["motes", -0.045],
        ["foliage", -0.085],
      ] as const) {
        element.style.setProperty(
          `--${name}-offset`,
          `${parallaxOffset(window.scrollY, rect.top + window.scrollY, rect.height, speed, motion.matches)}px`,
        );
      }
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    motion.addEventListener?.("change", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      motion.removeEventListener?.("change", schedule);
    };
  }, [visible]);
  return (
    <div
      ref={host}
      className="game-district-scenery"
      aria-hidden="true"
      data-testid={`game-scenery-${tile}`}
    >
      {visible && (
        <>
          <div
            className="game-continuous-terrain"
            style={{ backgroundImage: `url(/game/map/${tile}.webp)` }}
          />
          {(["mist", "motes", "foliage"] as const).map((layer) => (
            <div
              key={layer}
              data-testid={`game-parallax-${tile}-${layer}`}
              className={`game-map-overlay game-map-${layer}`}
              style={{
                backgroundImage: `url(/game/map/${layer === "foliage" ? `foliage-${tile.at(-1)}` : layer}.webp)`,
                ...(layer === "motes"
                  ? { opacity: restored ? 1 : 0.3 + details * 0.12 }
                  : {}),
              }}
            />
          ))}
        </>
      )}
    </div>
  );
}
