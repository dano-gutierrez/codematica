import { promises as fs } from "node:fs";
import path from "node:path";

export async function walkFiles(rootDir: string, extensions: string[]) {
  const normalizedExtensions = new Set(extensions.map((extension) => extension.toLowerCase()));
  const files: string[] = [];

  async function walk(currentDir: string) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        await walk(fullPath);
        continue;
      }

      if (entry.isFile() && normalizedExtensions.has(path.extname(entry.name).toLowerCase())) {
        files.push(fullPath);
      }
    }
  }

  try {
    await walk(rootDir);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }

    throw error;
  }

  return files.sort((left, right) => left.localeCompare(right));
}

export function toPosixPath(value: string) {
  return value.split(path.sep).join("/");
}
