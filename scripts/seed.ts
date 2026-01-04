/**
 * @file seed.ts
 * @description Database seed script for development.
 * Seeds the local D1 database with sample game data for testing.
 *
 * Usage:
 *   bun run db:seed
 *
 * Prerequisites:
 *   - Local D1 database initialized: wrangler d1 create just-play-db --local
 *   - Migrations applied: bun run db:migrate:local
 *
 * @author Claude Code
 * @date 2025-01-26
 */

import { execSync } from "child_process";

// --- Sample Data ---

const sampleGames = [
  {
    storyType: "东方玄幻",
    writingStyle:
      "你是一位模仿金庸风格的作家，用古典武侠的笔触描绘一个充满仙侠元素的世界。",
    author: "金庸风",
    title: "九天玄帝录",
    storyMap: {
      nodes: [
        {
          id: "start",
          label: "凡人修仙",
          details: "你是一个普通的山村少年，偶然间发现了一本古老的修仙秘籍...",
        },
        {
          id: "choice_1",
          label: "拜入仙门",
          details: "你决定前往传说中的青云门，寻求仙道...",
        },
        {
          id: "choice_2",
          label: "独自修炼",
          details: "你选择在深山中独自修炼，与天地为伴...",
        },
        {
          id: "end_good",
          label: "飞升成仙",
          details: "经过百年苦修，你终于突破最后一道天劫，飞升成仙！",
        },
        {
          id: "end_bad",
          label: "走火入魔",
          details: "贪功冒进导致你走火入魔，神魂俱灭...",
        },
      ],
      edges: [
        { from: "start", to: "choice_1", label: "前往青云门" },
        { from: "start", to: "choice_2", label: "留在山中" },
        { from: "choice_1", to: "end_good", label: "勤修苦练" },
        { from: "choice_1", to: "end_bad", label: "急于求成" },
        { from: "choice_2", to: "end_good", label: "顿悟天道" },
        { from: "choice_2", to: "end_bad", label: "误入歧途" },
      ],
    },
    storyHistory: [
      {
        role: "assistant",
        content:
          "清晨的阳光透过茅草屋的缝隙，照在你年轻的脸上。你是山村里一个普通的少年，每日的生活不过是砍柴、挑水、放羊。\n\n然而，今天注定不平凡。\n\n当你如往常一样在后山砍柴时，一道金光从天而降，砸在你面前的巨石上。金光散去，一本泛黄的古籍静静地躺在碎石之中。\n\n你小心翼翼地捡起这本书，封面上龙飞凤舞地写着四个大字——**《太上感应》**。\n\n翻开第一页，上面写道：得此书者，可修长生...",
      },
    ],
    currentSceneJson: {
      current_node_id: "start",
      content:
        "清晨的阳光透过茅草屋的缝隙，照在你年轻的脸上。你是山村里一个普通的少年，每日的生活不过是砍柴、挑水、放羊。\n\n然而，今天注定不平凡...",
      choices: [
        { id: 1, text: "立刻翻阅秘籍，尝试修炼" },
        { id: 2, text: "将秘籍藏好，先打听消息" },
        { id: 3, text: "把秘籍交给村里的老者" },
      ],
    },
    currentNodeId: "start",
  },
  {
    storyType: "赛博朋克",
    writingStyle:
      "你是一位赛博朋克小说家，用冷峻的笔触描绘霓虹灯下的黑暗都市。",
    author: "威廉吉布森",
    title: "神经漫游者2077",
    storyMap: {
      nodes: [
        {
          id: "start",
          label: "觉醒",
          details:
            "你在一个废弃的实验室里醒来，发现自己的大脑被植入了未知芯片...",
        },
        {
          id: "corp",
          label: "企业线",
          details: "你决定找到植入芯片的企业，寻求答案...",
        },
        {
          id: "rebel",
          label: "反抗军",
          details: "你加入了地下反抗组织，对抗企业的控制...",
        },
        {
          id: "end_good",
          label: "自由",
          details: "你成功破解了芯片的秘密，获得了真正的自由。",
        },
        {
          id: "end_bad",
          label: "被控制",
          details: "芯片最终接管了你的意识，你成为了企业的傀儡。",
        },
      ],
      edges: [
        { from: "start", to: "corp", label: "追查企业" },
        { from: "start", to: "rebel", label: "加入反抗军" },
        { from: "corp", to: "end_good", label: "内部瓦解" },
        { from: "corp", to: "end_bad", label: "深陷阴谋" },
        { from: "rebel", to: "end_good", label: "革命成功" },
        { from: "rebel", to: "end_bad", label: "被出卖" },
      ],
    },
    storyHistory: [
      {
        role: "assistant",
        content:
          "**2077年，夜之城。**\n\n你在一片刺眼的白光中醒来。周围是破败的实验设备，空气中弥漫着焦糊的气味。\n\n你的后脑勺传来阵阵刺痛——有什么东西被植入了你的大脑。\n\n当你挣扎着站起来时，视野中突然弹出一行霓虹色的文字：\n\n**芯片同步率：47%。建议：寻找制造商获取完整激活码。**\n\n你不知道自己是谁，也不知道发生了什么。但你知道，答案就在这座霓虹闪烁的城市里...",
      },
    ],
    currentSceneJson: {
      current_node_id: "start",
      content:
        "**2077年，夜之城。**\n\n你在一片刺眼的白光中醒来。周围是破败的实验设备，空气中弥漫着焦糊的气味...",
      choices: [
        { id: 1, text: "黑入附近的终端，搜索芯片信息" },
        { id: 2, text: "在废墟中搜寻线索" },
        { id: 3, text: "逃离这里，找个安全的地方" },
      ],
    },
    currentNodeId: "start",
  },
];

// --- Helper Functions ---

function escapeSQL(str: string): string {
  return str.replace(/'/g, "''");
}

// --- Main ---

async function seed() {
  console.log("🌱 Seeding database...\n");

  for (const game of sampleGames) {
    const storyMapJson = escapeSQL(JSON.stringify(game.storyMap));
    const storyHistoryJson = escapeSQL(JSON.stringify(game.storyHistory));
    const currentSceneJson = escapeSQL(JSON.stringify(game.currentSceneJson));

    const sql = `
      INSERT INTO games (
        story_type,
        writing_style,
        author,
        title,
        story_map,
        story_history,
        current_scene_json,
        current_node_id,
        created_at,
        updated_at
      ) VALUES (
        '${escapeSQL(game.storyType)}',
        '${escapeSQL(game.writingStyle)}',
        '${escapeSQL(game.author)}',
        '${escapeSQL(game.title)}',
        '${storyMapJson}',
        '${storyHistoryJson}',
        '${currentSceneJson}',
        '${game.currentNodeId}',
        unixepoch(),
        unixepoch()
      );
    `.trim();

    try {
      // Execute SQL via wrangler d1 execute
      const command = `wrangler d1 execute just-play-db --local --command "${sql.replace(/\n/g, " ").replace(/"/g, '\\"')}"`;
      execSync(command, { stdio: "inherit" });
      console.log(`✅ Seeded: ${game.title}`);
    } catch (error) {
      console.error(`❌ Failed to seed: ${game.title}`);
      console.error(error);
    }
  }

  console.log("\n🎉 Seeding complete!");
  console.log("\nTo verify, run:");
  console.log(
    '  wrangler d1 execute just-play-db --local --command "SELECT id, title, story_type FROM games;"',
  );
}

seed().catch(console.error);
