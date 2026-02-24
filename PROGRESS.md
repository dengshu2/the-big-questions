# 项目进度 · PROGRESS

> **给下一个 AI 或协作者的交接文档**
> 最后更新：2026-02-24（P0 数据层完成）

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

## 项目结构

```
the-big-questions/
├── public/database/canon.csv    # 原始数据（919 条记录）
├── src/
│   ├── data/                    # 数据层
│   │   ├── types.ts             # 类型定义（CanonRow, BigQuestion, Book 等）
│   │   ├── parser.ts            # CSV fetch + 解析
│   │   ├── aggregator.ts        # 扁平数据 → 层级结构聚合
│   │   ├── hooks.ts             # React hooks（useCanonData, useBigQuestions 等）
│   │   └── index.ts             # 统一导出
│   ├── index.css                # 设计系统（CSS 变量、Reset、动画）
│   ├── App.css                  # 首页样式
│   ├── App.tsx                  # 首页组件（Hero + 卡片网格，真实数据驱动）
│   └── main.tsx                 # 入口
├── index.html                   # HTML 入口（含 SEO、字体）
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

## 下一步 🚧

按优先级排序，每次会话做一个模块：

### P0 — 路由与导航
- [ ] 安装 React Router
- [ ] 路由配置：首页 `/`、大问题详情页 `/question/:id`
- [ ] 卡片点击跳转

### P1 — 大问题详情页
- [ ] 章节 → 学科 → 思想家 → 书籍的层级展开
- [ ] 面包屑导航

### P1 — 思想家卡片
- [ ] 思想家信息卡（姓名中英文、生卒年、国籍、著作列表）
- [ ] 思想家列表与筛选

### P2 — 时间线
- [ ] 按年代展示思想家和著作的交互式时间轴

### P2 — 搜索与过滤
- [ ] 全局搜索（按书名、作者名、学科）
- [ ] 多维筛选（国籍、年代范围、学科、是否最小书单）

### P3 — 打磨
- [ ] 最小书单视图（`is_minimum_list = 是`）
- [ ] 页面转场动画
- [ ] 卡片悬停微交互
- [ ] 性能优化（虚拟列表等）

---

*每次完成一个模块后，请更新本文件的 checklist。*
