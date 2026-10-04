"use client";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  ArrowRight,
  BookOpen,
  Flame,
  List,
  LockKeyhole,
  Map,
  Sparkles,
  Star,
  Wrench,
} from "lucide-react";
import {
  type GameCampaign,
  gameTotals,
  getStreak,
  isLevelUnlocked,
  levelStars,
  awardKey,
  MAP_PANELS,
  MAP_CAPACITY,
} from "@codematica/core/game";
import { webGameStore } from "@/lib/game/store";
import { GameDistrictArt } from "./GameDistrictArt";
import { GameScene } from "./GameScene";
export function GameMap({ campaign }: { campaign: GameCampaign }) {
  const [store] = useState(() => webGameStore(campaign));
  const storageStatus = useSyncExternalStore(
    store.subscribe,
    store.getStatus,
    store.getStatus,
  );
  const progress = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
  );
  const [loaded, setLoaded] = useState(false),
    [list, setList] = useState(false);
  const active = useRef<HTMLAnchorElement>(null);

  const totals = gameTotals(progress),
    current =
      campaign.levels.find(
        (l) => !progress.awards[awardKey(campaign.id, l.id, "main")],
      ) ?? campaign.levels.at(-1)!;
  useEffect(() => {
    void store.load().finally(() => setLoaded(true));
  }, [store]);
  useEffect(() => {
    if (!loaded || list) return;
    try {
      const saved = sessionStorage.getItem("game-map-scroll.v2");
      if (saved !== null) {
        window.scrollTo(0, Number(saved));
        return;
      }
    } catch {
      // Scroll memory is optional when browser storage is unavailable.
    }
    active.current?.scrollIntoView({ block: "center" });
  }, [loaded, list]);
  const leave = () => {
    if (list) return;
    try {
      sessionStorage.setItem("game-map-scroll.v2", String(window.scrollY));
    } catch {
      // Navigation remains available without scroll persistence.
    }
  };
  return (
    <main className="game-home" data-testid="game-map">
      {storageStatus ? <p role="status">{storageStatus}</p> : null}
      <div className="game-masthead">
        <div>
          <span className="game-eyebrow">CODEMATICA · CHAPTER ONE</span>
          <h1>
            Restore the signal<span>.</span>
          </h1>
          <p>A city gone quiet. A little robot with a big repair list.</p>
        </div>
        <Link href="/learn" className="game-link">
          <BookOpen size={18} />
          Explore lessons <ArrowRight size={16} />
        </Link>
      </div>
      <div className="game-status" role="group" aria-label="Campaign progress">
        <span>
          <Star size={18} />
          {totals.stars}/36 stars
        </span>
        <span>
          <Sparkles size={18} />
          {totals.xp} XP
        </span>
        <span>
          <Flame size={18} />
          {getStreak(progress)} day streak
        </span>
        <button
          onClick={() => {
            if (!list) leave();
            setList(!list);
          }}
          data-testid="game-map-view"
        >
          {list ? <Map size={17} /> : <List size={17} />}{" "}
          {list ? "Map" : "Level list"}
        </button>
      </div>
      <div className="game-introduction">
        <GameScene cosmetic={progress.cosmetic} />
        <div>
          <span className="game-eyebrow">MEET PATCH, YOUR REPAIR PARTNER</span>
          <h2>Small fixes. A brighter city.</h2>
          <p>
            Write a query. Connect a system. Watch your solution work. Every
            signal brings us a little closer.
          </p>
          <Link
            onClick={leave}
            href={`/play/${campaign.id}/${current.id}`}
            className="game-button"
            data-testid="game-continue"
          >
            {totals.stars ? "Continue the story" : "Let’s get to work"}{" "}
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
      <div
        className="game-world"
        data-testid="game-map-landscape"
        data-capacity={MAP_CAPACITY}
        data-view={list ? "list" : "map"}
      >
        {!list &&
          MAP_PANELS.filter((panel) => !("district" in panel)).map(
            (panel, i) => (
              <section
                key={panel.id}
                className="game-district game-frontier"
                data-testid={`game-map-panel-${panel.id}`}
                aria-label={`${panel.name}, future scenery`}
              >
                <GameDistrictArt
                  district="tower"
                  panel={panel.id}
                  restored={false}
                  details={0}
                />
                {i % 3 === 0 && (
                  <div className="game-district-heading game-frontier-heading">
                    <span>BEYOND THE SIGNAL · SCENERY PREVIEW</span>
                    <h2>
                      {i === 0
                        ? "The quiet summit"
                        : i === 3
                          ? "Lantern woods"
                          : "Glasshouse heights"}
                    </h2>
                    <p>
                      Trail space for levels{" "}
                      {i === 0 ? "37–50" : i === 3 ? "25–36" : "13–24"}
                    </p>
                    <button
                      className="game-link"
                      onClick={() =>
                        active.current?.scrollIntoView({
                          block: "center",
                          behavior: matchMedia(
                            "(prefers-reduced-motion: reduce)",
                          ).matches
                            ? "instant"
                            : "smooth",
                        })
                      }
                    >
                      Return to current level <ArrowRight size={16} />
                    </button>
                  </div>
                )}
              </section>
            ),
          )}
        {(list
          ? ["garden", "canal", "tower"]
          : ["tower", "canal", "garden"]
        ).map((district, index) => {
          const levels = campaign.levels
            .filter((l) => l.district === district)
            .slice();
          if (!list) levels.reverse();
          const panel = MAP_PANELS.find(
            (p) => "district" in p && p.district === district,
          )!;
          const landmark = levels.find((l) => l.restoration.landmark)!;
          const restored = Boolean(
            progress.awards[awardKey(campaign.id, landmark.id, "main")],
          );
          return (
            <section
              key={district}
              className={`game-district ${district} ${restored ? "restored" : ""}`}
              aria-label={`${district} district`}
              data-testid={`game-map-panel-${panel.id}`}
            >
              <GameDistrictArt
                district={district}
                panel={panel.id}
                restored={restored}
                details={
                  levels.filter(
                    (l) => progress.awards[awardKey(campaign.id, l.id, "main")],
                  ).length
                }
              />
              <div className="game-district-heading">
                <span>
                  0{list ? index + 1 : 3 - index} /{" "}
                  {restored ? "RESTORED" : "AWAITING A SIGNAL"}
                </span>
                <h2>
                  {district === "garden"
                    ? "The garden outpost"
                    : district === "canal"
                      ? "The canal works"
                      : "The signal tower"}
                </h2>
              </div>
              <div className="game-route">
                {levels.map((level, i) => {
                  const unlocked =
                      loaded && isLevelUnlocked(campaign, level.id, progress),
                    stars = levelStars(progress, campaign.id, level.id);
                  return (
                    <div
                      key={level.id}
                      className={`game-stop stop-${i % 3} ${stars ? "complete" : ""}`}
                    >
                      <span className="game-stop-line" />
                      {unlocked ? (
                        <Link
                          ref={level.id === current.id ? active : undefined}
                          onClick={leave}
                          href={`/play/${campaign.id}/${level.id}`}
                          data-testid={`game-level-${level.order}`}
                          aria-label={`Level ${level.order}: ${level.title}, ${stars} stars`}
                          className="game-node"
                        >
                          {level.order}
                        </Link>
                      ) : (
                        <button
                          className="game-node locked"
                          aria-label={`Level ${level.order}: ${level.title}. Complete the preceding level to unlock.`}
                          data-testid={`game-level-${level.order}`}
                          disabled
                        >
                          <LockKeyhole size={20} />
                        </button>
                      )}
                      <div className="game-stop-label">
                        <div
                          className="game-stars"
                          role="img"
                          aria-label={`${stars} stars`}
                        >
                          {[0, 1, 2].map((n) => (
                            <Star
                              key={n}
                              size={15}
                              fill={n < stars ? "currentColor" : "none"}
                            />
                          ))}
                        </div>
                        <strong>{level.title}</strong>
                        <small>
                          {level.kind === "grid"
                            ? "CSS GRID"
                            : level.kind === "sql"
                              ? "SQL TARGETING"
                              : level.kind === "pipes"
                                ? "DATA FLOW"
                                : "SYSTEM DESIGN"}
                          {level.mode === "defense" ? " · LIVE DEFENSE" : ""}
                        </small>
                      </div>
                    </div>
                  );
                })}
              </div>
              {restored ? (
                <div className="game-restored">
                  <Wrench size={17} /> Patch restored this district
                </div>
              ) : null}
            </section>
          );
        })}
      </div>
      <section className="game-wardrobe">
        <h2>Patch’s workshop</h2>
        <p>
          Earn attachments at 6, 18, and 30 stars. Every tool tells part of your
          story.
        </p>
        {totals.cosmetics.map((c) => (
          <button
            key={c}
            aria-pressed={progress.cosmetic === c}
            className="game-button secondary"
            onClick={() =>
              void store.save({
                ...progress,
                cosmetic: c as typeof progress.cosmetic,
                updatedAt: new Date().toISOString(),
              })
            }
          >
            {c}
          </button>
        ))}
      </section>
    </main>
  );
}
