export type GenreId =
  | "xuanhuan"
  | "western_fantasy"
  | "urban"
  | "romance"
  | "mystery";

export type MacroSceneId = "intro" | "scene1" | "scene2" | "finale";

export const GENRE_CONTRACT: Record<
  GenreId,
  {
    label: string;
    requiredVariables: Array<{
      name: string;
      kind: "int" | "float" | "bool";
      initial: number | boolean;
    }>;
    // Demo 统一 4 场景骨架；后续可扩展为 10-20 章 skeleton
    macro: Record<
      MacroSceneId,
      {
        objective: string;
        allowedChoiceKeys: string[]; // 固定 choiceKey，AI 只能填文案
        mustReference: string[]; // 角色/事实引用的 key（demo 先空）
      }
    >;
  }
> = {
  xuanhuan: {
    label: "东方玄幻",
    requiredVariables: [
      { name: "qi", kind: "int", initial: 10 },
      { name: "injury", kind: "int", initial: 0 },
    ],
    macro: {
      intro: {
        objective: "立世界观与主角动机",
        allowedChoiceKeys: ["seek_master", "leave_village"],
        mustReference: [],
      },
      scene1: {
        objective: "首次历险与代价选择",
        allowedChoiceKeys: ["fight", "negotiate"],
        mustReference: [],
      },
      scene2: {
        objective: "功法/线索推进",
        allowedChoiceKeys: ["train", "investigate"],
        mustReference: [],
      },
      finale: {
        objective: "对抗与结局收束",
        allowedChoiceKeys: ["sacrifice", "outsmart"],
        mustReference: [],
      },
    },
  },
  western_fantasy: {
    label: "西方奇幻",
    requiredVariables: [
      { name: "hp", kind: "int", initial: 30 },
      { name: "mana", kind: "int", initial: 10 },
    ],
    macro: {
      intro: {
        objective: "任务召唤与队友引入",
        allowedChoiceKeys: ["accept_quest", "refuse"],
        mustReference: [],
      },
      scene1: {
        objective: "遭遇与战术选择",
        allowedChoiceKeys: ["charge", "sneak"],
        mustReference: [],
      },
      scene2: {
        objective: "古迹/谜题推进",
        allowedChoiceKeys: ["solve", "force"],
        mustReference: [],
      },
      finale: {
        objective: "Boss/代价结局",
        allowedChoiceKeys: ["heal_world", "take_power"],
        mustReference: [],
      },
    },
  },
  urban: {
    label: "现代都市",
    requiredVariables: [
      { name: "money", kind: "int", initial: 200 },
      { name: "stress", kind: "int", initial: 20 },
    ],
    macro: {
      intro: {
        objective: "日常困境与目标",
        allowedChoiceKeys: ["work", "social"],
        mustReference: [],
      },
      scene1: {
        objective: "冲突升级",
        allowedChoiceKeys: ["compromise", "push_back"],
        mustReference: [],
      },
      scene2: {
        objective: "转机/选择",
        allowedChoiceKeys: ["invest", "save"],
        mustReference: [],
      },
      finale: {
        objective: "阶段性结果",
        allowedChoiceKeys: ["reset", "commit"],
        mustReference: [],
      },
    },
  },
  romance: {
    label: "言情",
    requiredVariables: [
      { name: "affection", kind: "int", initial: 20 },
      { name: "trust", kind: "int", initial: 20 },
    ],
    macro: {
      intro: {
        objective: "相遇与张力",
        allowedChoiceKeys: ["approach", "avoid"],
        mustReference: [],
      },
      scene1: {
        objective: "误会/试探",
        allowedChoiceKeys: ["explain", "withdraw"],
        mustReference: [],
      },
      scene2: {
        objective: "并肩或裂痕",
        allowedChoiceKeys: ["support", "doubt"],
        mustReference: [],
      },
      finale: {
        objective: "告白/放手",
        allowedChoiceKeys: ["confess", "let_go"],
        mustReference: [],
      },
    },
  },
  mystery: {
    label: "悬疑推理",
    requiredVariables: [
      { name: "sanity", kind: "int", initial: 80 },
      { name: "clues", kind: "int", initial: 0 },
    ],
    macro: {
      intro: {
        objective: "案件引子与目标",
        allowedChoiceKeys: ["inspect", "ask"],
        mustReference: [],
      },
      scene1: {
        objective: "第一条线索",
        allowedChoiceKeys: ["follow", "stakeout"],
        mustReference: [],
      },
      scene2: {
        objective: "反转/误导",
        allowedChoiceKeys: ["confront", "reconstruct"],
        mustReference: [],
      },
      finale: {
        objective: "真相揭示",
        allowedChoiceKeys: ["accuse", "expose"],
        mustReference: [],
      },
    },
  },
};
