import initSqlJs from "sql.js";
import {
  validateSql,
  compareTargetIds,
} from "../../packages/core/src/game/sandbox";
import type { SqlScenario } from "../../packages/core/src/game/schema";
declare const GAME_SQL_WASM: string;
const context = self as unknown as {
  onmessage:
    | ((event: { data: { scenario: SqlScenario; source: string } }) => void)
    | null;
  postMessage: (result: unknown) => void;
};
context.onmessage = async ({ data: { scenario, source } }) => {
  try {
    const validation = validateSql(source);
    if (!validation.ok) throw new Error(validation.error);
    const SQL = await initSqlJs({
      wasmBinary: Uint8Array.from(atob(GAME_SQL_WASM), (c) => c.charCodeAt(0)),
    });
    const db = new SQL.Database();
    try {
      db.run(
        "CREATE TABLE zombies(id INTEGER, kind TEXT, zone TEXT, threat INTEGER, shield INTEGER); CREATE TABLE zones(name TEXT, evacuated INTEGER);",
      );
      for (const row of scenario.zombies)
        db.run("INSERT INTO zombies VALUES(?,?,?,?,?)", [
          row.id,
          row.kind,
          row.zone,
          row.threat,
          row.shield,
        ]);
      for (const row of scenario.zones)
        db.run("INSERT INTO zones VALUES(?,?)", [row.name, row.evacuated]);
      db.run("PRAGMA query_only = ON");
      const statement = db.prepare(source);
      const rows: unknown[][] = [];
      try {
        while (statement.step()) {
          if (rows.length >= 256) throw new Error("Result exceeds 256 rows.");
          rows.push(statement.get());
        }
        context.postMessage({
          ...compareTargetIds(
            scenario.expectedIds,
            rows,
            statement.getColumnNames(),
          ),
          rows,
          columns: statement.getColumnNames(),
        });
      } finally {
        statement.free();
      }
    } finally {
      db.close();
    }
  } catch (error) {
    context.postMessage({
      passed: false,
      reasons: [error instanceof Error ? error.message : String(error)],
      events: [],
    });
  }
};
