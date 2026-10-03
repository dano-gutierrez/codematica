import * as css from "css-tree";
// @ts-expect-error sqlite-parser ships no declarations; its AST is validated below.
import rawParseSql from "sqlite-parser";
const parseSql = rawParseSql as (source: string) => Record<string, unknown>;
export type Validation = { ok: true } | { ok: false; error: string };
export function validateCss(source: string): Validation {
  if (source.length > 4096)
    return { ok: false, error: "Keep the CSS below 4096 characters." };
  try {
    let count = 0,
      nodes = 0;
    const ast = css.parse(source, { context: "declarationList" });
    css.walk(ast, (node) => {
      if (++nodes > 256) throw new Error("Use a smaller grid declaration.");
      if (node.type === "Number" && Math.abs(Number(node.value)) > 16)
        throw new Error("Grid line and repeat counts must be at most 16.");
      if (node.type === "Dimension" && Math.abs(Number(node.value)) > 1200)
        throw new Error("Grid dimensions must be at most 1200 units.");
      if (node.type === "Declaration") {
        count++;
        if (
          ![
            "grid-column",
            "grid-row",
            "grid-area",
            "grid-column-start",
            "grid-column-end",
            "grid-row-start",
            "grid-row-end",
            "grid-template-columns",
          ].includes(node.property) ||
          node.important
        )
          throw new Error("Use only the supported grid declarations.");
        if (css.lexer.matchProperty(node.property, node.value).error)
          throw new Error(`Invalid ${node.property} value.`);
      }
      if (["Url", "Atrule", "Raw", "Rule"].includes(node.type))
        throw new Error("External resources and rules are not allowed.");
      if (
        node.type === "Function" &&
        !["repeat", "minmax", "calc"].includes(node.name)
      )
        throw new Error("Unsupported grid function.");
    });
    if (!count) throw new Error("Enter at least one grid declaration.");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Invalid CSS.",
    };
  }
}
export function validateSql(source: string): Validation {
  if (source.length > 4096)
    return { ok: false, error: "Keep the query below 4096 characters." };
  try {
    const ast = parseSql(source);
    const statements = ast.statement as Record<string, unknown>[];
    if (statements?.length !== 1 || statements[0].variant !== "select")
      throw new Error("Run one SELECT statement.");
    let nodes = 0;
    const visit = (value: unknown, depth = 0) => {
      if (++nodes > 1200 || depth > 40)
        throw new Error("Query is too complex.");
      if (!value || typeof value !== "object") return;
      const n = value as Record<string, unknown>;
      if (
        n.type === "function" ||
        n.variant === "function" ||
        n.type === "with" ||
        n.with
      )
        throw new Error(
          "Functions and CTEs are outside this chapter's SELECT subset.",
        );
      if (
        n.type === "identifier" &&
        n.variant === "table" &&
        !["zombies", "zones"].includes(String(n.name))
      )
        throw new Error("Query only zombies and zones.");
      if (
        n.type === "statement" &&
        !["list", "select"].includes(String(n.variant))
      )
        throw new Error("Only SELECT is supported.");
      Object.values(n).forEach((child) => {
        if (Array.isArray(child)) child.forEach((c) => visit(c, depth + 1));
        else if (child && typeof child === "object") visit(child, depth + 1);
      });
    };
    visit(ast);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Invalid SQL.",
    };
  }
}
export function compareTargetIds(
  expected: number[],
  rows: unknown[][],
  columns: string[],
) {
  const index = columns.indexOf("id");
  if (index < 0)
    return {
      passed: false,
      reasons: ["Return a column named id."],
      events: [],
    };
  const ids = rows.map((row) => row[index]);
  const actual = new Set(ids),
    wanted = new Set(expected);
  const missing = expected.filter((id) => !actual.has(id)),
    extra = [...actual].filter((id) => !wanted.has(id as number));
  return {
    passed: missing.length === 0 && extra.length === 0,
    reasons: [
      ...(missing.length ? [`Missed zombies: ${missing.join(", ")}.`] : []),
      ...(extra.length ? [`Unintended targets: ${extra.join(", ")}.`] : []),
    ],
    events: [`${actual.size} unique zombies selected.`],
  };
}
