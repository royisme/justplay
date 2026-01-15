import { mkdir, writeFile } from "node:fs/promises";
import { GENRE_CONTRACT, type GenreId } from "./genres";
import { zGameBible } from "./schema";
import { generateObject } from "./llm";

function todayId(n: number) {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}_${String(n).padStart(3, "0")}`;
}

function arg(name: string, def?: string) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : def;
}

async function main() {
  const genre = arg("genre", "mystery") as GenreId;
  const n = Number(arg("n", "1"));
  const seed = Number(arg("seed", String(Date.now() % 100000)));
  const modelKey = arg("model"); // 可选：bible, scene, dialogue 等

  const contract = GENRE_CONTRACT[genre];
  for (let k = 1; k <= n; k++) {
    const id = todayId(k);
    const outDir = `stories/bibles/${genre}/${id}`;
    await mkdir(outDir, { recursive: true });

    const prompt = [
      "Fill a GameBible with the following constraints:",
      `- v = 1`,
      `- id = ${id}`,
      `- genre = ${genre}`,
      `- seed = ${seed + k}`,
      `- requiredVariables: ${JSON.stringify(contract.requiredVariables)}`,
      `- macro contract: ${JSON.stringify(contract.macro)}`,
      "",
      "Requirements:",
      "- variables must include requiredVariables (same name/kind/initial), you may add at most 2 more.",
      "- cast must include protagonist and antagonist.",
      "- title/logline/setting should match genre tone.",
      "- meta.model should be the model name you are using.",
      `- meta.createdAt should be the current ISO timestamp: ${new Date().toISOString()}`,
    ].join("\n");

    console.log(`🎲 Generating GameBible for ${genre}/${id}...`);

    const parsed = await generateObject(prompt, zGameBible, 0.8, modelKey);

    await writeFile(
      `${outDir}/bible.json`,
      JSON.stringify(parsed, null, 2),
      "utf-8"
    );

    console.log(`✅ Generated: ${outDir}/bible.json`);
  }
  console.log("OK: bibles generated");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
