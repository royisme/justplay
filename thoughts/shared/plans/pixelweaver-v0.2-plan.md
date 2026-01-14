# PixelWeaver v0.2 - Implementation Plan

## Overview

AI 交互式小说游戏产品，核心特性:

- 强制登录，访客只能看 Landing Page
- Trinity Slots: 每用户最多 3 个活跃游戏
- 生命周期: ACTIVE (游戏) -> COMPLETED (故事书) / ABANDONED (放弃)
- 多 Agent 自动化: DM, Writer, Scribe, Renderer
- PixiJS 像素风格渲染

> [!IMPORTANT]
> **Architecture Adjustment (Jan 2026)**
> The implementation of the **Narrative Engine** has shifted to a **Hybrid Model**:
>
> - **Core Logic**: Ink Engine (`inkjs`)
> - **Prose Generation**: AI Agents (Writer/DM)
>
> Please refer to `server/runtime/ink-runner.ts` for the actual runtime implementation.

---

## 1. Database Schema

### 1.1 games (游戏表)

| Column          | Type      | Description                    |
| --------------- | --------- | ------------------------------ |
| id              | TEXT PK   | UUID                           |
| user_id         | TEXT FK   | 用户ID                         |
| scenario_id     | TEXT FK   | 世界设定ID                     |
| title           | TEXT      | 游戏标题                       |
| status          | TEXT      | active / completed / abandoned |
| slot_index      | INTEGER   | 1-3 (active时必填)             |
| current_chapter | INTEGER   | 当前章节 (1-100)               |
| current_volume  | INTEGER   | 当前卷 (1-5)                   |
| story_metadata  | JSON      | Agent维护的后台数据            |
| book_metadata   | JSON      | 故事书元数据 (完结后)          |
| created_at      | TIMESTAMP | 创建时间                       |
| completed_at    | TIMESTAMP | 完结时间                       |

**story_metadata 结构:**

```json
{
  "outline": "故事大纲...",
  "characters": [
    {
      "id": "char_01",
      "name": "艾琳",
      "role": "protagonist",
      "traits": ["勇敢", "善良"]
    }
  ],
  "relationships": [{ "from": "char_01", "to": "char_02", "type": "ally" }],
  "inventory": { "revolver": 1, "keycard": 1 },
  "plotSummary": ["第一章: 主角醒来...", "第二章: 遇到仿生人..."]
}
```

**book_metadata 结构:**

```json
{
  "coverImage": "https://...",
  "wordCount": 50000,
  "endingType": "Heroic"
}
```

### 1.2 messages (消息表 - 树形)

| Column         | Type      | Description                         |
| -------------- | --------- | ----------------------------------- |
| id             | TEXT PK   | 格式: {game_id}--{role}-{timestamp} |
| game_id        | TEXT FK   | 所属游戏                            |
| parent_id      | TEXT      | 父消息ID (树形结构)                 |
| role           | TEXT      | system / user / assistant           |
| content        | TEXT      | 消息内容                            |
| depth          | INTEGER   | 树深度 (0=root)                     |
| slot_id        | INTEGER   | 分支编号 (默认0)                    |
| is_active_path | BOOLEAN   | 当前活跃路径                        |
| chapter_number | INTEGER   | 所属章节                            |
| render_data    | JSON      | PixiJS 渲染指令                     |
| created_at     | TIMESTAMP | 创建时间                            |

**Indexes:**

- `game_path_idx`: (game_id, is_active_path) - 快速获取活跃路径
- `parent_idx`: (parent_id) - 树遍历

### 1.3 game_scenarios (世界设定表 - Admin Only)

| Column               | Type      | Description               |
| -------------------- | --------- | ------------------------- |
| id                   | TEXT PK   | UUID                      |
| name                 | TEXT      | "赛博朋克 2077 风格"      |
| description          | TEXT      | 描述                      |
| story_type           | TEXT      | 东方玄幻 / 赛博朋克 / ... |
| dm_system_prompt     | TEXT      | DM Agent 提示词           |
| writer_system_prompt | TEXT      | Writer Agent 提示词       |
| visual_style_prompt  | TEXT      | "pixel art, neon colors"  |
| model_config         | JSON      | 模型路由配置              |
| is_active            | BOOLEAN   | 是否启用                  |
| created_at           | TIMESTAMP | 创建时间                  |

**model_config 结构:**

```json
{
  "dmModel": "claude-3-opus",
  "writerModel": "claude-3-sonnet",
  "summaryModel": "claude-3-haiku"
}
```

### 1.4 保留的 Better Auth 表

- user (增加字段无需修改)
- session
- account
- verification

### 1.5 删除/替换的表

- 旧 games 表 -> 新设计
- providers -> 保留 (用于 Admin)
- promptTemplates/promptVersions -> 合并到 game_scenarios

---

## 2. Route Structure

```
/                           # Landing Page (公开)
/login                      # 登录页 (公开)

# === 用户应用 (需登录) ===
/_app/layout.tsx            # 用户布局 (Sidebar + Main)
  /dashboard                # 仪表盘 (3槽位 + 藏书阁入口)
  /game/new                 # 新建游戏向导
  /game/:id                 # 游戏页面 (ACTIVE)
  /library                  # 藏书阁列表
  /library/:id              # 阅读模式 (COMPLETED)
  /settings                 # 用户设置

# === 管理员 (需 admin 角色) ===
/admin/layout.tsx           # 管理员布局
  /admin                    # 仪表盘
  /admin/scenarios          # 世界构建器
  /admin/providers          # AI Provider 配置
  /admin/users              # 用户管理
  /admin/audit              # 内容审计

# === API ===
/api/auth/*                 # Better Auth
/api/game/stream            # 故事流式输出
```

---

## 3. UI Components

### 3.1 Layout Components

```
app/components/layout/
├── SidebarContext.tsx      # 折叠状态管理
├── SidebarLayout.tsx       # Sidebar + Main 容器
├── Sidebar.tsx             # 侧边栏 (Framer Motion)
├── SidebarHeader.tsx       # Logo + 折叠按钮
├── SidebarNav.tsx          # 导航列表容器
├── SidebarNavItem.tsx      # 单个导航项 (NavLink)
├── SidebarNavGroup.tsx     # 可折叠导航组
├── SidebarFooter.tsx       # 用户信息 + 登出
├── UserSidebar.tsx         # 用户菜单组装
└── AdminSidebar.tsx        # 管理员菜单组装
```

### 3.2 User Sidebar Structure

```
┌─────────────────────────┐
│ [Logo] PixelWeaver  [<] │  <- 折叠按钮
├─────────────────────────┤
│ 我的冒险           [v]  │  <- 默认展开
│  ├─ ⚔️ 黑暗森林 (V2-C3) │  <- 槽位1 (点击进入游戏)
│  ├─ 🚀 星际迷航 (开始)  │  <- 槽位2
│  └─ [+] 新游戏          │  <- 槽位3 (空/新建)
├─────────────────────────┤
│ 藏书阁             [>]  │  <- 可折叠
│  ├─ 📖 龙之谷 (2025-01) │
│  └─ 💀 废土日记 (BAD)   │
├─────────────────────────┤
│ ⚙️ 设置                 │
├─────────────────────────┤
│ [Avatar] user@email     │
│ 登出                    │
└─────────────────────────┘
```

### 3.3 Admin Sidebar Structure

```
┌─────────────────────────┐
│ [Logo] PixelWeaver      │
│ [Admin Badge]       [<] │
├─────────────────────────┤
│ 📊 仪表盘               │
├─────────────────────────┤
│ 🌍 世界构建器      [v]  │
│  ├─ 预设剧本库          │
│  └─ 全局配置            │
├─────────────────────────┤
│ 🤖 AI 配置         [>]  │
│  ├─ Providers           │
│  └─ 模型路由            │
├─────────────────────────┤
│ 👥 用户管理             │
│ 🔍 内容审计             │
├─────────────────────────┤
│ [Avatar] admin@email    │
│ 登出                    │
└─────────────────────────┘
```

---

## 4. Implementation Phases

### Phase A: UI Foundation (Priority 1)

| Step | Task                   | Files                           |
| ---- | ---------------------- | ------------------------------- |
| A1   | 创建 Sidebar 组件库    | `app/components/layout/*`       |
| A2   | 创建用户布局           | `app/routes/_app/layout.tsx`    |
| A3   | Dashboard 页面 (3槽位) | `app/routes/_app/dashboard.tsx` |
| A4   | 重构管理员布局         | `app/routes/admin/layout.tsx`   |
| A5   | 更新路由配置           | `app/routes.ts`                 |

### Phase B: Data Model (Priority 2)

| Step | Task               | Files                            |
| ---- | ------------------ | -------------------------------- |
| B1   | 更新 Schema        | `server/db/schema.ts`            |
| B2   | 生成迁移           | `drizzle/`                       |
| B3   | GameService 更新   | `server/services/game.server.ts` |
| B4   | Trinity Slots 逻辑 | 创建/删除/完结游戏               |

### Phase C: Game Flow (Priority 3)

| Step | Task            | Files                             |
| ---- | --------------- | --------------------------------- |
| C1   | 新建游戏向导    | `app/routes/_app/game.new.tsx`    |
| C2   | 游戏页面重构    | `app/routes/_app/game.$id.tsx`    |
| C3   | 藏书阁列表      | `app/routes/_app/library.tsx`     |
| C4   | 阅读模式        | `app/routes/_app/library.$id.tsx` |
| C5   | Flattening 逻辑 | 完结时生成故事书                  |

### Phase D: Admin Features (Priority 4)

| Step | Task       | Files                            |
| ---- | ---------- | -------------------------------- |
| D1   | 世界构建器 | `app/routes/admin/scenarios.tsx` |
| D2   | 用户管理   | `app/routes/admin/users.tsx`     |
| D3   | 内容审计   | `app/routes/admin/audit.tsx`     |

### Phase E: Agent System (Priority 5)

| Step | Task                    | Files                             |
| ---- | ----------------------- | --------------------------------- |
| E1   | DM Agent 集成           | `server/agents/dm.agent.ts`       |
| E2   | Writer Agent            | `server/agents/writer.agent.ts`   |
| E3   | Scribe Agent (数据维护) | `server/agents/scribe.agent.ts`   |
| E4   | Renderer Agent (PixiJS) | `server/agents/renderer.agent.ts` |

### Phase F: PixiJS Enhancement (Priority 6)

| Step | Task           | Files                    |
| ---- | -------------- | ------------------------ |
| F1   | 像素素材库集成 | `app/assets/sprites/`    |
| F2   | 场景渲染引擎   | `app/components/engine/` |
| F3   | 角色动画系统   | AI 驱动的动画选择        |

---

## 5. Validation Checklist

- [ ] `bun run typecheck` 通过
- [ ] `bun run build` 成功
- [ ] 登录流程正常
- [ ] 3槽位限制生效
- [ ] 游戏创建/推进正常
- [ ] 故事书生成正常
- [ ] 管理员功能正常

---

## 6. Dependencies

### 现有

- React Router v7
- Tailwind CSS v4
- Framer Motion
- Drizzle ORM + D1
- Better Auth
- Vercel AI SDK
- PixiJS

### 新增 (可能)

- nanoid (UUID 生成)
- 像素素材库 (待定)

---

## Appendix: Environment Variables

```bash
# Better Auth
BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=http://localhost:5173
ADMIN_EMAIL=admin@example.com

# AI Provider
CUSTOM_API_KEY=...
CUSTOM_BASE_URL=http://127.0.0.1:8486/v1
CUSTOM_MODEL=gemini-3-flash-preview

# Game
NODE_NUM=6
```
