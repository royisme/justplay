import { existsSync } from "node:fs";
import { writeFile } from "node:fs/promises";

function arg(name: string) {
  const i = process.argv.indexOf(`--${name}`);
  if (i < 0) throw new Error(`Missing --${name}`);
  return process.argv[i + 1];
}

function findInklecateBin(): string {
  const local = "./node_modules/.bin/inklecate";
  if (existsSync(local)) return local;
  // fallback to bunx
  return "bunx";
}

async function main() {
  const genre = arg("genre");
  const id = arg("id");
  const dir = `stories/compiled/${genre}/${id}`;
  const ink = `${dir}/game.ink`;
  const out = `${dir}/story.json`;

  const bin = findInklecateBin();
  const cmd =
    bin === "bunx"
      ? ["bunx", "inklecate", ink, "-o", out]
      : [bin, ink, "-o", out];

  const p = Bun.spawnSync({ cmd, stdout: "pipe", stderr: "pipe" });
  if (p.exitCode !== 0) {
    const err = new TextDecoder().decode(p.stderr);
    throw new Error(`inklecate failed: ${err}`);
  }

  await writeFile(
    `${dir}/compile.log`,
    new TextDecoder().decode(p.stdout),
    "utf-8"
  );
  console.log("OK: compiled", out);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
