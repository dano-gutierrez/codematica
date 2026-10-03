import { spawn } from "node:child_process";
import { homedir } from "node:os";
import { isAbsolute, join } from "node:path";
import { fileURLToPath } from "node:url";

/** The stdlib helper holds the same OS lock as the Python knowledge service. */
export async function withInferenceLock<T>(run: () => Promise<T>, path = process.env.CODEMATICA_INFERENCE_LOCK || join(homedir(), ".local/share/codematica/inference.lock")): Promise<T> {
  if (!isAbsolute(path)) throw new Error("The inference lock path must be absolute");
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => ["PATH", "HOME", "TMPDIR", "LANG", "LC_ALL"].includes(key)));
  const child = spawn("python3", [fileURLToPath(new URL("./inference-lock.py", import.meta.url)), path], { env, stdio: ["pipe", "pipe", "pipe"] });
  // A spawn failure or timeout can close stdin before finally releases the helper.
  child.stdin.on("error", () => undefined);
  const closed = new Promise<void>(resolve => child.once("close", () => resolve()));
  try {
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => { child.kill(); reject(new Error("Local inference queue timed out")); }, 900_000);
      let output = "";
      child.stdout.on("data", chunk => { output += chunk.toString(); if (output.includes("ready\n")) { clearTimeout(timer); resolve(); } });
      child.once("error", () => { clearTimeout(timer); reject(new Error("Unable to start the local inference lock helper")); });
      child.once("exit", () => { clearTimeout(timer); reject(new Error("Local inference lock helper exited")); });
    });
    return await run();
  } finally {
    child.stdin.end();
    await closed;
  }
}
