"use client";
import { useRef } from "react";
import { Network, Database, HardDrive, Server, Users } from "lucide-react";
import {
  boardPosition,
  type GameBoard as Board,
  type SystemScenario,
} from "@codematica/core/game";
export function GameBoard({
  scenario,
  board,
  selected,
  disabled,
  onConnect,
  onMove,
  onPlace,
}: {
  scenario: SystemScenario;
  board: Board;
  selected: string;
  disabled: boolean;
  onConnect: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  onPlace: (id: string) => void;
}) {
  const host = useRef<HTMLDivElement>(null),
    drag = useRef<{ id: string; x: number; y: number; moved: boolean } | null>(
      null,
    );
  const placed = scenario.components.filter((c) => board.nodes.includes(c.id));
  const position = (id: string) =>
    boardPosition(id, board.nodes, board.positions);
  return (
    <div
      ref={host}
      className="game-diagram"
      role="group"
      aria-label="Architecture canvas. Select two components to connect. Arrow keys move a focused component."
      data-testid="game-board"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const id = e.dataTransfer.getData("text/plain");
        if (
          !disabled &&
          scenario.components.some((c) => c.id === id) &&
          !board.nodes.includes(id)
        )
          onPlace(id);
      }}
    >
      <svg viewBox="0 0 600 360" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <marker
            id="route-arrow"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M0 0L10 5L0 10z" fill="#558878" />
          </marker>
        </defs>
        {board.edges.map((e, i) => {
          const a = position(e.from),
            b = position(e.to);
          return (
            <line
              key={i}
              x1={a.x * 600}
              y1={a.y * 360}
              x2={b.x * 600}
              y2={b.y * 360}
              stroke="#558878"
              strokeWidth="3"
              markerEnd="url(#route-arrow)"
            />
          );
        })}
      </svg>
      {placed.map((c) => {
        const p = position(c.id),
          Icon = {
            client: Users,
            proxy: Network,
            api: Server,
            cache: HardDrive,
            database: Database,
          }[c.kind];
        return (
          <button
            key={c.id}
            type="button"
            disabled={disabled}
            className={`game-diagram-node ${selected === c.id ? "selected" : ""}`}
            style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%` }}
            data-testid={`game-connect-${c.id}`}
            aria-label={`${c.label}. Select to connect; arrow keys to move.`}
            aria-pressed={selected === c.id}
            onClick={() => {
              if (!drag.current?.moved) onConnect(c.id);
              drag.current = null;
            }}
            onKeyDown={(e) => {
              const directions: Record<string, [number, number]> = {
                ArrowLeft: [-0.05, 0],
                ArrowRight: [0.05, 0],
                ArrowUp: [0, -0.08],
                ArrowDown: [0, 0.08],
              };
              const d = directions[e.key];
              if (d) {
                e.preventDefault();
                onMove(c.id, p.x + d[0], p.y + d[1]);
              }
            }}
            onPointerDown={(e) => {
              if (disabled) return;
              drag.current = {
                id: c.id,
                x: e.clientX,
                y: e.clientY,
                moved: false,
              };
              e.currentTarget.setPointerCapture(e.pointerId);
            }}
            onPointerMove={(e) => {
              const d = drag.current;
              if (!d || d.id !== c.id) return;
              if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 6)
                d.moved = true;
              if (!d.moved) return;
              const rect = host.current!.getBoundingClientRect();
              onMove(
                c.id,
                (e.clientX - rect.left) / rect.width,
                (e.clientY - rect.top) / rect.height,
              );
            }}
            onPointerCancel={() => {
              drag.current = null;
            }}
          >
            <Icon size={21} />
            <span>{c.label}</span>
            <small>{c.capacity.toLocaleString()}/sec</small>
          </button>
        );
      })}
      {!placed.length ? (
        <p>
          Place components here.
          <br />
          Tap the palette or drag a piece in.
        </p>
      ) : null}
    </div>
  );
}
