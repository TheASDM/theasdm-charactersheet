import fs from "fs";
import path from "path";

export function assertFileExists(filePath: string, hint?: string): void {
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    const message = [`Required data file not found: ${resolved}`];
    if (hint) {
      message.push(hint);
    }
    throw new Error(message.join("\n"));
  }
}

export function loadJsonFile<T>(filePath: string): T {
  assertFileExists(filePath);
  const rawContent = fs.readFileSync(path.resolve(filePath), "utf-8");
  return JSON.parse(rawContent) as T;
}
