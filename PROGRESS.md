# 项目进度 · PROGRESS

> **给下一个 AI 或协作者的交接文档**
> 最后更新：2026-02-24（P3 打磨阶段完成）

## 项目概述

**大问题 · The Big Questions** — 把 `canon.csv`（人类文明经典元典）以精美前端界面展示出来。

数据涵盖 11 个大问题、300+ 位思想家、920 部经典著作、跨越约 2500 年。

## 技术栈

| 项目 | 选择 | 备注 |
|------|------|------|
| 构建工具 | Vite 7.x | |
| 框架 | React 19 + TypeScript | 组件化开发、类型安全 |
| 样式 | Vanilla CSS | 自定义设计系统，暗色知识主题 |
| 数据源 | `public/database/canon.csv` | 920 行、15 列 |
| 仓库 | [GitHub](https://github.com/dengshu2/the-big-questions) | public |

## 数据结构

`canon.csv` 的 15 个字段：

```
big_question_id, big_question_name, section_id, section_name,
discipline, thinker_name_zh, thinker_name_en,
birth_year, death_year, nationality,
book_title_zh, book_title_en, is_coauthored, book_order, is_minimum_list
```

层级关系：`大问题 (11) → 章节 (~50) → 学科 (~100) → 思想家 (~300) → 书籍 (~920)`

## 设计决策

1. **暗色主题** — 深蓝调背景，适合知识/文化类内容的沉浸阅读
2. **5 组强调色** — 金、蓝、翠、紫、玫，用于区分不同大问题
3. **字体** — Noto Serif SC（中文衬线）+ Inter（西文无衬线），Google Fonts 加载
4. **CSS 变量系统** — 定义在 `src/index.css`，所有颜色/间距/圆角/阴影/动画统一管理
5. **渐进式构建** — 模块一个个来，不急于一次性完成
6. **数据加载策略** — 运行时 fetch CSV（919 条数据量小，无需构建时预处理）
7. **React 19 模式** — 使用 `use()` hook + Suspense 处理异步数据加载
8. **滚动吸附布局** — 首页 Hero 占满首屏 + scroll-snap，卡片网格为完整第二屏

## 项目结构

```
the-big-questions/
├── public/database/canon.csv    # 原始数据（919 条记录）
├── src/
│   ├── components/              # 共享组件
│   │   ├── ErrorBoundary.tsx    # 错误边界（包裹 RouterProvider）
│   │   ├── SiteNav.tsx          # 顶部固定导航栏
│   │   └── SiteNav.css          # 导航栏样式
│   ├── data/                    # 数据层
│   │   ├── types.ts             # 类型定义（CanonRow, BigQuestion, Book 等）
│   │   ├── parser.ts            # CSV fetch + 解析
│   │   ├── aggregator.ts        # 扁平数据 → 层级结构聚合
│   │   ├── hooks.ts             # React hooks（useCanonData, useBigQuestions 等）
│   │   └── index.ts             # 统一导出
│   ├── pages/                   # 页面组件
│   │   ├── QuestionPage.tsx     # 大问题详情页（含扁平化、自动展开、上下翻页）
│   │   ├── QuestionPage.css     # 详情页样式
│   │   ├── MinimumListPage.tsx  # 必读书单页（/minimum）
│   │   └── MinimumListPage.css  # 必读书单样式
│   ├── index.css                # 设计系统（CSS 变量、Reset、动画）
│   ├── App.css                  # 首页样式（Hero 全屏 + 滚动指示 + 卡片网格）
│   ├── App.tsx                  # 首页（Hero + 滚动吸附 + 卡片网格）
│   ├── router.tsx               # 路由配置 + ScrollToTop（/, /question/:id, /minimum）
│   └── main.tsx                 # 入口（含 ErrorBoundary）
├── index.html                   # HTML 入口（含 SEO、字体）
├── Dockerfile                   # 多阶段构建（node → nginx）
├── docker-compose.yml           # Docker Compose 编排
├── nginx.conf                   # Nginx 配置（SPA 路由 + 缓存）
├── .dockerignore                # Docker 构建排除
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

## 下一步 🚧

### P4 — 进阶功能（待定）
- [ ] 多维筛选（国籍、年代范围、学科）
- [ ] 性能优化（虚拟列表等）
- [ ] 思想家时间线可视化
- [ ] 侧边栏目录（长详情页快速跳转）

---

*每次完成一个模块后，请更新本文件的 checklist。*
