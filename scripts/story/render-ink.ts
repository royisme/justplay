import { readFile, mkdir, writeFile } from "node:fs/promises";
import { zGameBible, type GameBible } from "./schema";

function arg(name: string) {
  const i = process.argv.indexOf(`--${name}`);
  if (i < 0) throw new Error(`Missing --${name}`);
  return process.argv[i + 1];
}

function renderInk(b: GameBible): string {
  const vars = b.variables
    .map((v) => {
      const val =
        typeof v.initial === "boolean"
          ? v.initial
            ? "true"
            : "false"
          : String(v.initial);
      return `VAR ${v.name} = ${val}`;
    })
    .join("\n");

  // Demo：每个 scene 2 choices；文本短，占位，真实文本可运行时再由 AI 生成/润色
  const scene = (
    id: "intro" | "scene1" | "scene2" | "finale",
    knot: string
  ) => `=== ${knot} ===
#scene:${id}
{${id}_line()}
${choiceBlock(id)}
`;

  const choiceBlock = (id: "intro" | "scene1" | "scene2" | "finale") => {
    const keys = b.macro[id].allowedChoiceKeys;
    // intro/finale 也保留两选项，便于 demo 互动；你也可以 intro 只保留 continue
    const lines = keys
      .slice(0, 2)
      .map((ck, idx) => `+ [${ck}] -> ${nextKnot(id)}`)
      .join("\n");
    return lines;
  };

  const nextKnot = (id: string) => {
    if (id === "intro") return "scene1";
    if (id === "scene1") return "scene2";
    if (id === "scene2") return "finale";
    return "END";
  };

  // Ink function：把短文本抽出来，后续你可以用 tags + 前端/服务端 AI 文案覆盖它
  const lineFns = `
=== function intro_line ===
~ return "${b.title}。${b.logline}"

=== function scene1_line ===
~ return "${b.macro.scene1.objective}"

=== function scene2_line ===
~ return "${b.macro.scene2.objective}"

=== function finale_line ===
~ return "${b.macro.finale.objective}"
`;

  return `// Auto-generated from GameBible ${b.id}
${vars}

-> intro

${scene("intro", "intro")}
${scene("scene1", "scene1")}
${scene("scene2", "scene2")}
${scene("finale", "finale")}
${lineFns}
`;
}

async function main() {
  const genre = arg("genre");
  const id = arg("id");
  const biblePath = `stories/bibles/${genre}/${id}/bible.json`;
  const bibleRaw = JSON.parse(await readFile(biblePath, "utf-8"));
  const bible = zGameBible.parse(bibleRaw);

  const outDir = `stories/compiled/${genre}/${id}`;
  await mkdir(outDir, { recursive: true });
  await writeFile(
    `${outDir}/bible.json`,
    JSON.stringify(bible, null, 2),
    "utf-8"
  );
  await writeFile(`${outDir}/game.ink`, renderInk(bible), "utf-8");
  await writeFile(
    `${outDir}/manifest.json`,
    JSON.stringify(
      {
        v: 1,
        genre,
        id,
        ink: "game.ink",
        story: "story.json",
      },
      null,
      2
    ),
    "utf-8"
  );

  console.log("OK: rendered", outDir);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
