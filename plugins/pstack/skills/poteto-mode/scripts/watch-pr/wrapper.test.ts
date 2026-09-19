import { expect, it } from "bun:test";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

function runHelp(entrypoint: string, caller: string) {
  return spawnSync(process.execPath, ["run", entrypoint, "--help"], {
    cwd: caller,
    encoding: "utf8",
  });
}

it("runs both bundled wrappers from a caller directory", () => {
  const caller = mkdtempSync(join(tmpdir(), "pstack-wrapper-"));
  try {
    const watch = runHelp(join(import.meta.dir, "watch-pr"), caller);
    const ship = runHelp(join(import.meta.dir, "ship-pr"), caller);

    expect(watch.status).toBe(0);
    expect(watch.stdout).toContain("Usage: watch-pr");
    expect(ship.status).toBe(0);
    expect(ship.stdout).toContain("Usage: ship-pr");
  } finally {
    rmSync(caller, { recursive: true, force: true });
  }
});
