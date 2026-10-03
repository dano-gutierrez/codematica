"use client";
import { useEffect, useRef, useState } from "react";
import {
  miniatureFrames,
  miniatureScene,
  type AnimationState,
} from "@codematica/core/game";

export function GameScene({
  district = "garden",
  state = "idle",
  cosmetic = "none",
  paused = false,
}: {
  district?: string;
  state?: AnimationState;
  cosmetic?: string;
  paused?: boolean;
}) {
  const host = useRef<HTMLDivElement>(null);
  const props = useRef({ state, cosmetic, paused });
  const wake = useRef(() => {});
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    props.current = { state, cosmetic, paused };
    wake.current();
  }, [state, cosmetic, paused]);
  useEffect(() => {
    let stopped = false;
    let cleanup = () => {};
    void (async () => {
      const { Application, Assets, Sprite } = await import("pixi.js");
      const app = new Application();
      const resources: {
        observer?: IntersectionObserver;
        resize?: ResizeObserver;
        destroyed: boolean;
        visibility?: () => void;
        media?: () => void;
      } = { destroyed: false };
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
      cleanup = () => {
        resources.observer?.disconnect();
        resources.resize?.disconnect();
        if (resources.visibility)
          document.removeEventListener(
            "visibilitychange",
            resources.visibility,
          );
        if (resources.media)
          reduced.removeEventListener("change", resources.media);
        wake.current = () => {};
        if (app.renderer && !resources.destroyed) {
          resources.destroyed = true;
          app.destroy(true, { children: true });
        }
      };
      await app.init({
        resizeTo: host.current!,
        backgroundAlpha: 0,
        antialias: true,
        resolution: Math.min(window.devicePixelRatio, 2),
        autoDensity: true,
      });
      if (stopped) {
        cleanup();
        return;
      }
      host.current?.appendChild(app.canvas);
      app.canvas.setAttribute("aria-hidden", "true");
      const sheet = await Assets.load("/game/actors.json");
      if (stopped) {
        cleanup();
        return;
      }
      const sprites = miniatureFrames(props.current.state).map((name) => {
        const sprite = new Sprite(sheet.textures[name]);
        app.stage.addChild(sprite);
        return sprite;
      });
      let visible = true;
      let time = 0;
      let previousState = props.current.state;
      const draw = (renderNow = true) => {
        if (previousState !== props.current.state) {
          time = 0;
          previousState = props.current.state;
        }
        const width = host.current?.clientWidth || app.screen.width;
        const height = host.current?.clientHeight || app.screen.height;
        const scene = miniatureScene(
          width,
          height,
          props.current.state,
          time,
          props.current.cosmetic,
          reduced.matches,
        );
        const frames = miniatureFrames(props.current.state);
        scene.layers.forEach((layer, i) => {
          const sprite = sprites[i];
          sprite.texture = sheet.textures[frames[i]];
          sprite.x = layer.tx;
          sprite.y = layer.ty;
          sprite.scale.set(Math.hypot(layer.scos, layer.ssin));
          sprite.rotation = Math.atan2(layer.ssin, layer.scos);
          sprite.alpha = layer.alpha;
        });
        host.current?.setAttribute("data-render-width", String(width));
        if (renderNow) app.render();
      };
      wake.current = () => {
        draw();
        if (
          visible &&
          !document.hidden &&
          !props.current.paused &&
          !reduced.matches
        )
          app.start();
        else app.stop();
      };
      resources.observer = new IntersectionObserver((entries) => {
        visible = entries[0]?.isIntersecting ?? false;
        wake.current();
      });
      resources.observer.observe(host.current!);
      resources.resize = new ResizeObserver(() => {
        const node = host.current;
        if (!node?.clientWidth || !node.clientHeight) return;
        app.renderer.resize(node.clientWidth, node.clientHeight);
        draw();
      });
      resources.resize.observe(host.current!);
      resources.visibility = () => wake.current();
      resources.media = () => wake.current();
      document.addEventListener("visibilitychange", resources.visibility);
      reduced.addEventListener("change", resources.media);
      app.ticker.add((ticker) => {
        if (
          !visible ||
          document.hidden ||
          props.current.paused ||
          reduced.matches
        )
          return;
        time += ticker.deltaMS;
        draw(false);
      });
      // Initial placement and prop/resize changes must render even when animation is stopped.
      wake.current();
      host.current?.setAttribute("data-ready", "true");
    })().catch(() => {
      cleanup();
      if (!stopped) setFailed(true);
    });
    return () => {
      stopped = true;
      cleanup();
    };
  }, []);
  return (
    <div
      className={`game-scene game-scene-${district}`}
      ref={host}
      data-testid="game-scene"
      role="img"
      aria-label={`Patch and three miniature zombies in the ${district} district`}
    >
      {failed ? (
        <p>
          Patch is ready. The challenge works with textual results while
          animation is unavailable.
        </p>
      ) : null}
    </div>
  );
}
