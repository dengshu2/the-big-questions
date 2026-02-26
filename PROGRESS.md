# 项目进度 · PROGRESS

> **给下一个 AI 或协作者的交接文档**
> 最后更新：2026-02-26（P4 思想家介绍系统）

## 项目概述

**大问题 · The Big Questions** — 把 `canon.csv`（人类文明经典元典）以精美前端界面展示出来。

数据涵盖 11 个大问题、300+ 位思想家、920 部经典著作、跨越约 2500 年。

## 技术栈

| 项目 | 选择 | 备注 |
|------|------|------|
| 构建工具 | Vite 7.x | |
| 框架 | React 19 + TypeScript | 组件化开发、类型安全 |
| 样式 | Vanilla CSS | 自定义设计系统，暗色知识主题 |
| 数据源 | `public/database/canon.csv` | 920 行、16 列（含 wikipedia_url） |
| Markdown 渲染 | `react-markdown` | 用于思想家介绍页的 Markdown 内容 |
| 仓库 | [GitHub](https://github.com/dengshu2/the-big-questions) | public |

## 数据结构

`canon.csv` 的 16 个字段：

```
big_question_id, big_question_name, section_id, section_name,
discipline, thinker_name_zh, thinker_name_en,
birth_year, death_year, nationality,
book_title_zh, book_title_en, is_coauthored, book_order, is_minimum_list,
wikipedia_url
```

层级关系：`大问题 (11) → 章节 (~50) → 学科 (~100) → 思想家 (~300) → 书籍 (~920)`

### 思想家介绍数据

独立于 `canon.csv`，存放在 `public/database/thinkers/` 目录下：

| 文件 | 说明 |
|------|------|
| `_index.json` | 思想家索引，映射 slug → `{nameZh, nameEn, file}` |
| `_prompt.md` | 阅读框架/Prompt 模板，前端展示用 |
| `{slug}.md` | 各思想家的 Markdown 介绍文件 |

**Markdown 介绍文件结构**（遵循 `_prompt.md` 模板）：
1. 此人是谁（生平背景）
2. 核心贡献的来源（逻辑链条）
3. 必读著作（最多 3 本）
4. 现代人必须知道的 3 个核心概念（原始含义 + 未解决的问题 + 现代应用）
5. 历史局限与反对者

## 设计决策

1. **暗色主题** — 深蓝调背景，适合知识/文化类内容的沉浸阅读
2. **5 组强调色** — 金、蓝、翠、紫、玫，用于区分不同大问题
3. **字体** — Noto Serif SC（中文衬线）+ Inter（西文无衬线），Google Fonts 加载
4. **CSS 变量系统** — 定义在 `src/index.css`，所有颜色/间距/圆角/阴影/动画统一管理
5. **渐进式构建** — 模块一个个来，不急于一次性完成
6. **数据加载策略** — 运行时 fetch CSV（919 条数据量小，无需构建时预处理）
7. **React 19 模式** — 使用 `use()` hook + Suspense 处理异步数据加载
8. **滚动吸附布局** — 首页 Hero 占满首屏 + scroll-snap，卡片网格为完整第二屏
9. **思想家介绍按需加载** — Markdown 文件用户点到谁才 fetch 谁，索引文件模块级缓存
10. **CSS 命名空间隔离** — ThinkerPage 的类名使用 `thinker-detail-` 前缀，避免与 QuestionPage 的全局 CSS 冲突

## 项目结构

```
the-big-questions/
├── public/database/
│   ├── canon.csv                   # 原始数据（919 条记录，16 列）
│   └── thinkers/                   # 思想家介绍系统
│       ├── _index.json             # 思想家索引（slug → 元数据映射）
│       ├── _prompt.md              # 阅读框架 / Prompt 模板
│       ├── francis-bacon.md        # 弗朗西斯·培根
│       ├── plato.md                # 柏拉图
│       ├── immanuel-kant.md        # 伊曼努尔·康德
│       ├── charles-darwin.md       # 查尔斯·达尔文
│       ├── sima-qian.md            # 司马迁
│       ├── karl-marx.md            # 卡尔·马克思
│       ├── adam-smith.md           # 亚当·斯密
│       ├── michel-foucault.md      # 米歇尔·福柯
│       ├── peter-drucker.md        # 彼得·德鲁克
│       └── jean-piaget.md          # 让·皮亚杰
├── src/
│   ├── components/                 # 共享组件
│   │   ├── ErrorBoundary.tsx       # 错误边界（包裹 RouterProvider）
│   │   ├── SiteNav.tsx             # 顶部固定导航栏
│   │   └── SiteNav.css             # 导航栏样式
│   ├── data/                       # 数据层
│   │   ├── types.ts                # 类型定义（CanonRow, BigQuestion, Book 等）
│   │   ├── parser.ts               # CSV fetch + 解析
│   │   ├── aggregator.ts           # 扁平数据 → 层级结构聚合
│   │   ├── hooks.ts                # React hooks（useCanonData, useBigQuestions 等）
│   │   └── index.ts                # 统一导出
│   ├── pages/                      # 页面组件
│   │   ├── QuestionPage.tsx        # 大问题详情页（含思想家介绍链接 📖）
│   │   ├── QuestionPage.css        # 详情页样式
│   │   ├── MinimumListPage.tsx     # 必读书单页（/minimum）
│   │   ├── MinimumListPage.css     # 必读书单样式
│   │   ├── ThinkerPage.tsx         # 思想家介绍页（/thinker/:slug）
│   │   └── ThinkerPage.css         # 思想家介绍页样式
│   ├── index.css                   # 设计系统（CSS 变量、Reset、动画）
│   ├── App.css                     # 首页样式（Hero 全屏 + 滚动指示 + 卡片网格）
│   ├── App.tsx                     # 首页（Hero + 滚动吸附 + 卡片网格）
│   ├── router.tsx                  # 路由配置（/, /question/:id, /minimum, /thinker/:slug）
│   └── main.tsx                    # 入口（含 ErrorBoundary）
├── index.html                      # HTML 入口（含 SEO、字体）
├── Dockerfile                      # 多阶段构建（node → nginx）
├── docker-compose.yml              # Docker Compose 编排
├── nginx.conf                      # Nginx 配置（SPA 路由 + 缓存）
├── .dockerignore                   # Docker 构建排除
├── package.json
├── vite.config.ts
└── README.md
```

## 已完成 ✅

- [x] 需求评估与方案制定
- [x] Vite + React + TypeScript 项目初始化
- [x] 暗色知识主题设计系统（`src/index.css`）
- [x] 首页占位：Hero 区域 + 11 个大问题卡片网格（`src/App.tsx`）
- [x] GitHub 仓库创建并推送
- [x] **P0 数据层**（2026-02-24）
  - [x] CSV 运行时 fetch + 解析（`src/data/parser.ts`）
  - [x] TypeScript 类型定义（`src/data/types.ts`）
  - [x] 数据聚合函数（`src/data/aggregator.ts`）
  - [x] React hooks：`useCanonData()`、`useBigQuestions()`、`useFilteredBooks()` 等
  - [x] 首页卡片改用真实数据驱动 + Suspense 加载状态
- [x] **P0 路由与导航**（2026-02-24）
  - [x] 安装 React Router（`react-router-dom`）
  - [x] 路由配置（`src/router.tsx`）：`/` 首页、`/question/:id` 详情页
  - [x] 大问题详情页基础组件（`src/pages/QuestionPage.tsx`）
  - [x] 首页卡片点击跳转详情页
- [x] **P1 大问题详情页**（2026-02-24）
  - [x] 章节 → 学科 → 思想家 → 书籍的可折叠层级展开
  - [x] 面包屑导航
  - [x] 平滑展开/折叠动画（Collapsible 组件）
  - [x] 思想家卡片（姓名中英文、生卒年、国籍、著作数量）
  - [x] 书籍列表（含「必读」「合著」标签）

- [x] **P2 必读书单**（2026-02-24）
  - [x] 必读书单独立页面（`/minimum`，按大问题分组展示，含思想家信息）
  - [x] 顶部固定导航栏（全局共享，含「必读书单」入口）
  - [x] 错误边界（`ErrorBoundary`，CSV 加载失败时显示友好提示而非白屏）

- [x] **Docker 部署**（2026-02-24）
  - [x] 多阶段 Dockerfile（node:20-alpine 构建 → nginx:alpine 托管）
  - [x] Nginx 配置（SPA 路由兜底 + 静态资源缓存 + gzip）
  - [x] Docker Compose 编排（连入 `npm-network`，适配 Nginx Proxy Manager）
  - [x] `.dockerignore` 优化构建上下文
  - [x] 构建验证通过，容器运行正常

- [x] **P3 打磨**（2026-02-24）
  - [x] **首页 Hero 全屏 + 滚动吸附**：Hero 占满首屏 100vh，弹跳箭头引导滚动，卡片网格为干净的第二屏
  - [x] **卡片信息增强**：每张卡片展示 4 位代表性思想家名字（如"庄子、孔子、老子、墨子 +9"）
  - [x] **详情页扁平化**：单 Section 问题（如 Q0 元典）跳过 Section 层级，直接展示学科
  - [x] **自动展开**：进入详情页后第一个学科自动展开，无需额外点击
  - [x] **折叠预览**：未展开学科显示思想家名字预览（如"苏格拉底、柏拉图..."）
  - [x] **上下翻页导航**：详情页底部的"← 上一个 / 下一个 →"快捷导航
  - [x] **路由滚动修复**：添加 ScrollToTop 组件，切换页面自动回到顶部
  - [x] **页面进入动画**：所有页面统一 fadeInUp 进入动画
  - [x] **移除搜索功能**：简化首页，移除不必要的搜索栏和热门标签

- [x] **P3.5 维基百科链接**（2026-02-25）
  - [x] `canon.csv` 新增 `wikipedia_url` 列（第 16 列）
  - [x] 数据层更新：`CanonRow` 和 `Thinker` 类型新增 `wikipediaUrl` 字段
  - [x] QuestionPage 思想家卡片支持维基百科外链图标

- [x] **P4 思想家介绍系统**（2026-02-26）
  - [x] **阅读框架模板**：`_prompt.md` —— 5 步评估思想家的标准化提问结构
  - [x] **首批 10 位核心思想家介绍**（覆盖 Q1~Q7）：
    - 培根、柏拉图、康德、达尔文、司马迁、马克思、亚当·斯密、福柯、德鲁克、皮亚杰
  - [x] **索引系统**：`_index.json`（slug → 元数据映射，支持按需加载）
  - [x] **ThinkerPage 详情页**（`/thinker/:slug`）：
    - react-markdown 渲染 Markdown 内容
    - 可折叠「阅读框架」面板（展示 Prompt 模板）
    - 面包屑导航 + 加载状态 + 404 处理
    - 自定义 Markdown 组件（h1→h2 降级、strong 样式强化）
  - [x] **QuestionPage 联动**：有介绍的思想家展示 📖 图标，点击跳转 ThinkerPage
    - 索引数据模块级缓存（`useThinkerSlugMap` hook，一次加载全局复用）
  - [x] **CSS 命名冲突修复**：ThinkerPage 使用 `thinker-detail-` 前缀避免全局样式污染
  - [x] **路由注册**：`/thinker/:slug` 路由已添加到 `router.tsx`

- [x] **P4.5 思想家总览页**（2026-02-26）
  - [x] **总览页面** `/thinkers`：418 位思想家一览
  - [x] **重要性标记**：47 位有「必读」书目的核心思想家标注 ★ 金色标识 + 左侧金线
  - [x] **多维筛选**：按「全部 / ★ 核心 / Q0~Q10 各大问题」标签筛选
  - [x] **三种排序**：年代（默认）、著作数量、姓名
  - [x] **搜索功能**：支持中文名、英文名、国籍模糊搜索
  - [x] **信息展示**：每行显示生卒年、国籍、著作数、必读数、所属大问题标签
  - [x] **跳转联动**：📖 链接到思想家详情页、🌐 链接到维基百科、Qn 标签跳转到大问题页
  - [x] **导航栏更新**：全局导航新增「思想家」入口
  - [x] **响应式设计**：移动端适配

## 下一步 🚧

### P4.6 — 扩展核心思想家介绍
- [ ] 为 47 位核心思想家（有必读书目）逐批生成 Markdown 详情页（已完成 10/47）
- [ ] 考虑添加思想家元数据到介绍页（生卒年、国籍、代表作等，来自 canon.csv ）
- [ ] 思想家页面：上一位 / 下一位导航

### P5 — 进阶功能（待定）
- [ ] 性能优化（虚拟列表等，418 行一次性渲染可能有优化空间）
- [ ] 思想家时间线可视化
- [ ] 侧边栏目录（长详情页快速跳转）

---

*每次完成一个模块后，请更新本文件的 checklist。*
