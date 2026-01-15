import { mkdir, writeFile } from "node:fs/promises";
import { GENRE_CONTRACT, type GenreId } from "./genres";
import { zGameBible } from "./schema";
import { chatJSON } from "./llm";

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
  const model = process.env.OPENROUTER_MODEL || "openai/gpt-4o";
  const apiKey = process.env.OPENROUTER_API_KEY;
  const baseUrl =
    process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1";
  if (!apiKey) throw new Error("Missing OPENROUTER_API_KEY");

  const contract = GENRE_CONTRACT[genre];
  for (let k = 1; k <= n; k++) {
    const id = todayId(k);
    const outDir = `stories/bibles/${genre}/${id}`;
    await mkdir(outDir, { recursive: true });

    const system = [
      "You generate a GameBible JSON only. No markdown.",
      "Follow schema strictly. Do not add extra fields.",
      `Genre: ${genre} (${contract.label}).`,
      "Macro scenes must be exactly: intro, scene1, scene2, finale.",
      "IDs must be short snake_case. Keep secrets concise.",
    ].join("\n");

    const user = [
      "Fill a GameBible with the following constraints:",
      `- v = 1`,
      `- id = ${id}`,
      `- seed = ${seed + k}`,
      `- requiredVariables: ${JSON.stringify(contract.requiredVariables)}`,
      `- macro contract: ${JSON.stringify(contract.macro)}`,
      "Requirements:",
      "- variables must include requiredVariables (same name/kind/initial), you may add at most 2 more.",
      "- cast must include protagonist and antagonist.",
      "- title/logline/setting should match genre tone.",
      "Return JSON only.",
    ].join("\n");

    const raw = await chatJSON({ apiKey, baseUrl, model, system, user });

    // hard validation
    const parsed = zGameBible.parse(raw);

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
