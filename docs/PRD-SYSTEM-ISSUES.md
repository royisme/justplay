# PRD: 系统问题与功能缺失修复

**文档版本**: 1.1
**创建日期**: 2026-01-13
**更新日期**: 2026-01-14
**状态**: ✅ Resolved
**优先级**: P0 (Critical)

---

## 0. 修复总结 (2026-01-14)

> ⚠️ **注意**: 本文档创建时描述的大部分问题在代码审计后发现**已经被实现**。文档与代码不同步。

### 已确认实现的功能

| 问题 | 状态 | 实现位置 |
|------|------|----------|
| P0-2.1 AI 响应系统 | ✅ 已实现 | `GameService.advanceGame()` 调用 `DMAgent.generateResponse()` |
| P0-2.2 游戏开场白 | ✅ 已实现 | `GameService.createGame()` 调用 `DMAgent.generateOpening()` |
| P0-2.3 动态标题 | ✅ 已实现 | `GameService.createGame()` 调用 `DMAgent.generateTitle()` |
| P0-2.4 场景渲染区 | ✅ 已实现 | `game.$id.tsx` 显示标题、章节、元数据统计 |
| P0-2.5 故事元数据 | ✅ 已实现 | `GameService.updateStoryMetadata()` 后台更新 |
| P1-3.1 Sidebar 用户信息 | ✅ 已实现 | 完整传递链 layout→SidebarLayout→Sidebar→SidebarFooter |
| P1-3.2 登出功能 | ✅ 已实现 | `/auth/logout` action 存在 |
| P1-3.3 路由重定向 | ✅ 已修复 | 统一为 `/login` |
| P2-4.1 设置页面 | ✅ 已实现 | 主题切换、字体大小调节功能完整 |
| P2-4.2 Dashboard i18n | ✅ 已实现 | 使用 `useTranslation()` |
| P2-4.3 游戏输入框 i18n | ✅ 已实现 | 使用 `t("game.input_placeholder")` |

### 本次修复的代码更改

1. `auth.logout.ts` - 统一重定向到 `/login`
2. `game.new.tsx` - 添加 i18n 支持
3. `settings.tsx` - 添加 i18n 支持
4. `public/locales/*/common.json` - 添加 new_game, settings 翻译键
5. `app/locales/*/new_game.ts` - 新建翻译模块
6. `app/locales/*/settings.ts` - 扩展翻译键
7. `app/types/i18next.d.ts` - 添加 new_game 类型

### Agent 文件审计结果

| Agent | 状态 |
|-------|------|
| `dm.agent.ts` | ✅ 完整实现并被使用 |
| `writer.agent.ts` | ⚠️ Stub 实现，未使用 |
| `scribe.agent.ts` | ⚠️ Stub 实现，功能已在 DMAgent 中 |
| `renderer.agent.ts` | ⚠️ Stub 实现，未使用 |

---

## 1. 概述

### 1.1 背景

PixelWeaver (JustPlay) 是一个 AI 互动小说生成器，目标是让用户通过与 AI Dungeon Master 对话来创造独特的故事体验。当前系统存在严重的功能缺失和架构问题，导致核心游戏功能完全无法使用。

### 1.2 问题总览

| 类别 | 问题数量 | 严重程度 |
|------|----------|----------|
| 核心游戏功能缺失 | 5 | P0 Critical |
| 数据流断裂 | 3 | P1 High |
| UI/UX 功能缺失 | 4 | P2 Medium |
| 代码质量问题 | 3 | P3 Low |

---

## 2. P0 Critical: 核心游戏功能完全不可用

### 2.1 AI 响应系统未集成

**问题描述**:
`GameService.advanceGame()` 方法返回硬编码的占位符文本，而非真实的 AI 生成内容。

**当前行为** (`server/services/game.server.ts:247-260`):
```typescript
// For now, return a placeholder - AI integration will come later
const assistantContent = `你选择了: "${userInput}"\n\n故事继续发展中...（AI 响应占位符）\n\n你接下来想做什么？`;
```

**预期行为**:
- 调用 `DMAgent.generateResponse()` 获取真实 AI 响应
- 基于剧本设定、角色状态、历史对话生成沉浸式叙事
- 支持流式输出以提升用户体验

**影响**:
- 用户无论输入什么都只能看到固定的占位符文本
- 游戏完全没有互动性和可玩性
- 这是产品的核心价值主张，当前为零

**修复方案**:
```typescript
async advanceGame(gameId: string, userId: string, userInput: string) {
  // ... existing validation ...

  // Get scenario for DM configuration
  const scenario = await db.query.gameScenarios.findFirst({
    where: eq(gameScenarios.id, game.scenarioId),
  });

  // Initialize DM Agent
  const dmAgent = new DMAgent({
    game,
    scenario,
    history: activeMessages,
    providerConfig: {
      baseUrl: this.env.CUSTOM_BASE_URL,
      apiKey: this.env.CUSTOM_API_KEY,
    },
  });

  // Generate real AI response
  const aiResponse = await dmAgent.generateResponse(userInput);

  // Save and return
  await db.insert(messages).values({
    id: assistantMessageId,
    gameId,
    parentId: userMessageId,
    role: "assistant",
    content: aiResponse,
    // ...
  });
}
```

---

### 2.2 游戏创建后无初始内容

**问题描述**:
`GameService.createGame()` 只创建系统消息（DM Prompt），不生成任何用户可见的开场内容。

**当前行为** (`server/services/game.server.ts:83-106`):
```typescript
// Root system message (DM Prompt) - 用户看不到
await db.insert(messages).values({
  id: `${gameId}--system-${Date.now()}`,
  role: "system",  // 系统消息在 UI 中被过滤掉
  content: scenario.dmSystemPrompt,
  // ...
});

return gameId;  // 没有生成开场白
```

**预期行为**:
1. 创建游戏后，立即生成 DM 的开场白（欢迎词/场景描述/角色创建提示）
2. 用户进入游戏页面时能看到第一段叙事内容
3. 开场白应基于剧本的 `openingPrompt` 或由 AI 生成

**影响**:
- 用户创建游戏后看到空白聊天界面
- 不知道如何开始，体验断裂
- 无法理解游戏玩法

**修复方案**:
```typescript
async createGame(userId: string, scenarioId: string): Promise<string> {
  // ... existing code ...

  // Generate opening message from DM
  const dmAgent = new DMAgent({
    game: newGame,
    scenario,
    history: [],
    providerConfig: { ... },
  });

  const openingNarrative = await dmAgent.generateOpening();

  await db.insert(messages).values({
    id: `${gameId}--dm-opening`,
    gameId,
    role: "assistant",
    content: openingNarrative,
    depth: 1,
    isActivePath: true,
    chapterNumber: 1,
  });

  return gameId;
}
```

---

### 2.3 游戏标题静态不变

**问题描述**:
所有新游戏的标题都是硬编码的 "New Adventure"。

**当前行为** (`server/services/game.server.ts:62`):
```typescript
title: "New Adventure", // Temporary title
```

**预期行为**:
- 基于用户角色创建或剧本生成动态标题
- 或者在角色创建阶段后由 AI 生成
- 标题应反映玩家的选择和故事走向

---

### 2.4 场景渲染区域无内容

**问题描述**:
游戏页面左侧的场景渲染区域只显示占位符文本。

**当前行为** (`app/routes/_app/game.$id.tsx:114-120`):
```tsx
<div className="text-zinc-500 font-mono text-sm text-center">
  [PixelWeaver Renderer Placeholder]
  <br/>
  Scene: {game.title}
  // ...
</div>
```

**预期行为**（MVP 版本）:
- 即使没有 PixiJS 渲染，也应显示：
  - 当前场景的文字描述
  - 角色状态面板（HP、物品、关系等）
  - 环境氛围图或 AI 生成的场景图

---

### 2.5 故事元数据始终为空

**问题描述**:
`storyMetadata` 初始化后从未被更新。

**当前行为** (`server/services/game.server.ts:67-73`):
```typescript
storyMetadata: {
  outline: "",
  characters: [],
  relationships: [],
  inventory: {},
  plotSummary: []
},
```

**预期行为**:
- 随着游戏进行，AI 应提取并更新：
  - `characters`: 出现的角色及其属性
  - `relationships`: 角色之间的关系
  - `inventory`: 玩家获得的物品
  - `plotSummary`: 关键剧情点
- 这些数据应显示在 StoryMap 组件中

---

## 3. P1 High: 数据流与架构问题

### 3.1 Sidebar 用户信息断裂

**问题描述**:
`SidebarFooter` 显示硬编码的用户信息，而非真实登录用户。

**数据流断裂链**:
```
layout.tsx loader
  ↓ returns { user, activeGames, completedGames }

AppLayout component
  ↓ const { activeGames, completedGames } = useLoaderData()  ❌ user 被丢弃

<UserSidebar activeGames={...} completedGames={...} />
  ↓ 不接收 user prop

<SidebarFooter />
  ↓ 硬编码 "User" / "user@example.com"
```

**受影响文件**:
- `app/routes/_app/layout.tsx:32` - user 返回但未使用
- `app/components/layout/UserSidebar.tsx:19-22` - 缺少 user prop
- `app/components/layout/SidebarFooter.tsx:137-146` - 硬编码

**修复方案**:

1. 修改 `layout.tsx`:
```tsx
export default function AppLayout() {
  const { activeGames, completedGames, user } = useLoaderData<typeof loader>();
  return (
    <SidebarLayout sidebar={
      <UserSidebar
        activeGames={activeGames}
        completedGames={completedGames}
        user={user}  // 传递 user
      />
    }>
      <Outlet />
    </SidebarLayout>
  );
}
```

2. 修改 `UserSidebar.tsx`:
```tsx
interface UserSidebarProps {
  activeGames: GameData[];
  completedGames: GameData[];
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

export function UserSidebar({ activeGames, completedGames, user }: UserSidebarProps) {
  // ... 传递 user 给 SidebarFooter
}
```

---

### 3.2 登出功能未实现

**问题描述**:
`SidebarFooter` 中的登出按钮只是 UI 占位，没有实际功能。

**当前行为** (`app/components/layout/SidebarFooter.tsx:148-155`):
```tsx
<Button variant="ghost" size="icon" className="...">
  <LogOut className="h-4 w-4" />
</Button>
// 没有 onClick 或 Form action
```

**预期行为**:
- 点击后调用 better-auth 的登出 API
- 清除 session
- 重定向到登录页面

---

### 3.3 路由重定向不一致

**问题描述**:
不同路由对未认证用户的重定向目标不一致。

| 路由文件 | 重定向目标 |
|----------|------------|
| `dashboard.tsx` | `/login` |
| `game.new.tsx` | `/auth/login` |
| `game.$id.tsx` | `/login` |
| `settings.tsx` | `/login` |

**修复方案**:
统一使用 `/login` 或创建常量 `AUTH_ROUTES.LOGIN`。

---

## 4. P2 Medium: UI/UX 功能缺失

### 4.1 设置页面无实际功能

**问题描述**:
`settings.tsx` 的所有设置选项都是非功能性 UI。

**缺失功能**:
- 主题切换（深色/浅色/跟随系统）- 无状态管理
- 字体大小调节 - 无持久化
- 通知偏好 - 无后端 API

---

### 4.2 Dashboard 硬编码文本

**问题描述**:
`dashboard.tsx` 中大量中文文本未使用 i18n。

**示例** (`app/routes/_app/dashboard.tsx:53-54`):
```tsx
<h1 className="text-3xl font-bold tracking-tight">我的冒险</h1>
<p className="text-muted-foreground">管理你的活跃游戏和存档...</p>
```

---

### 4.3 游戏输入框缺少引导

**问题描述**:
游戏页面的输入框 placeholder 是英文，与中文界面不协调。

```tsx
<Input
  placeholder="What do you want to do?"  // 应使用 i18n
  // ...
/>
```

---

### 4.4 空状态设计不完整

**问题描述**:
当用户没有任何游戏时，Dashboard 显示的空状态缺乏引导性。

---

## 5. P3 Low: 代码质量问题

### 5.1 DMAgent 未使用

**问题描述**:
`server/agents/dm.agent.ts` 已实现但从未被调用。

```typescript
// dm.agent.ts 已有完整实现
export class DMAgent {
  async generateResponse(userAction: string): Promise<string> { ... }
}

// 但 game.server.ts 没有使用它
const assistantContent = `硬编码占位符...`;
```

---

### 5.2 其他 Agent 文件状态不明

**存在的 Agent 文件**:
- `server/agents/dm.agent.ts` - 已实现，未使用
- `server/agents/writer.agent.ts` - 状态未知
- `server/agents/scribe.agent.ts` - 状态未知
- `server/agents/renderer.agent.ts` - 状态未知

**建议**: 审计所有 agent 文件，确定其完成度和用途。

---

### 5.3 类型定义不完整

**问题**:
- `SidebarFooter` 没有接收 user prop 的类型定义
- `GameService` 方法返回类型部分缺失

---

## 6. 修复优先级与依赖关系

```
P0 核心功能 (必须先修复)
├── 2.1 AI 响应系统集成
│   └── 依赖: 2.5 故事元数据更新
├── 2.2 游戏创建开场白
│   └── 依赖: 2.1 AI 响应系统
├── 2.3 动态游戏标题
│   └── 依赖: 2.1 AI 响应系统
└── 2.4 场景渲染区内容
    └── 依赖: 2.5 故事元数据

P1 数据流修复
├── 3.1 Sidebar 用户信息 (独立)
├── 3.2 登出功能 (独立)
└── 3.3 路由统一 (独立)

P2 UI 完善
├── 4.1 设置页面功能
├── 4.2 Dashboard i18n
├── 4.3 游戏输入框 i18n
└── 4.4 空状态设计
```

---

## 7. 建议实施顺序

### Phase 1: 核心游戏循环 (预计工作量: Large)

1. **集成 AI 响应系统**
   - 修改 `GameService.advanceGame()` 调用 `DMAgent`
   - 添加错误处理和重试逻辑
   - 实现流式输出（可选）

2. **添加游戏开场白**
   - 在 `DMAgent` 中添加 `generateOpening()` 方法
   - 修改 `createGame()` 生成初始内容

3. **更新故事元数据**
   - 在每次 AI 响应后提取元数据
   - 考虑使用 Scribe Agent 进行结构化提取

### Phase 2: 数据流修复 (预计工作量: Medium)

4. **修复 Sidebar 数据传递**
   - 修改组件 props 链
   - 传递真实用户信息

5. **实现登出功能**
   - 添加 better-auth 登出 action
   - 更新 SidebarFooter

### Phase 3: UI 完善 (预计工作量: Small)

6. **Dashboard 和游戏页面 i18n**
7. **设置页面功能实现**

---

## 8. 验收标准

### P0 验收标准

- [x] 用户创建游戏后，能看到 AI 生成的开场白
- [x] 用户输入动作后，能收到 AI 生成的故事响应
- [x] 故事响应与用户输入相关，具有叙事连贯性
- [x] 场景区域显示当前状态（至少是文字描述）
- [x] 游戏标题在某个阶段变为动态生成

### P1 验收标准

- [x] Sidebar 显示真实的用户名和邮箱
- [x] 点击登出按钮能成功登出并跳转
- [x] 所有未认证重定向指向同一路由

---

## 9. 附录

### A. 关键文件清单

| 文件 | 问题 | 优先级 | 状态 |
|------|------|--------|------|
| `server/services/game.server.ts` | AI 未集成、开场白缺失、标题硬编码 | P0 | ✅ 已实现 |
| `server/agents/dm.agent.ts` | 已实现但未使用 | P0 | ✅ 已使用 |
| `app/routes/_app/game.$id.tsx` | 场景区占位符 | P0 | ✅ 已实现 |
| `app/routes/_app/layout.tsx` | user 数据未传递 | P1 | ✅ 已实现 |
| `app/components/layout/UserSidebar.tsx` | 缺少 user prop | P1 | ✅ 已实现 |
| `app/components/layout/SidebarFooter.tsx` | 硬编码用户信息、登出缺失 | P1 | ✅ 已实现 |
| `app/routes/_app/dashboard.tsx` | 硬编码中文文本 | P2 | ✅ 已 i18n |
| `app/routes/_app/settings.tsx` | 功能未实现 | P2 | ✅ 已实现 |
| `app/routes/_app/game.new.tsx` | 硬编码中文文本 | P2 | ✅ 已 i18n |

### B. 相关 Agent 文件

```
server/agents/
├── dm.agent.ts      # Dungeon Master - 主叙事 AI (✅ 完整实现并使用)
├── writer.agent.ts  # Writer - (⚠️ Stub 实现)
├── scribe.agent.ts  # Scribe - 元数据提取 (⚠️ Stub，功能在 DMAgent)
└── renderer.agent.ts # Renderer - 场景渲染 (⚠️ Stub 实现)
```
