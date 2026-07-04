# 重构蓝图 · REFACTOR

> 完全重构方案，2026-07-04 定稿（星图版）。
> 核心决策：数据以 canon.csv 为唯一权威结构源；展示形式为「纸上星图 · 大问题天球」；明亮古典天文图集视觉；localStorage 阅读进度（点亮星星）。
> 灵感参考：Histography（点阵时间轴即界面）、History of Philosophy Summarized & Visualized（思想间的呼应/反驳连线）、Open Syllabus Galaxy（语义缩放地图）、全历史（AB 路径）。

## 一、重构目标

1. **单一权威数据** — 手工/策展数据只有三份：`canon.csv`（结构）、`thinkers/*.md`（文章）、`dialogues.csv`（思想对话关系）。其余一切结构化数据（索引、聚合、星图布局）由构建脚本生成。删除手工维护的 `_index.json`。
2. **展示形式换骨** — 从「wiki 式数据库浏览器」改为「纸上星图」：11 个大问题是 11 个星座，418 位思想家是星，思想之间的呼应与反驳是弧线。语义缩放提供纵深，对话弧线提供内容，点亮机制提供玩下去的理由。
3. **视觉换肤** — 古典天文图集美学：米白纸面、墨色星点、烫金星座线、衬线标注。明亮、书卷气、独一无二。
4. **个人化** — localStorage 阅读进度：读过的思想家在天球上点亮成金星。

## 二、数据层重构

### 2.1 canon.csv schema 升级（一次性迁移脚本 `scripts/migrate-canon.mjs`）

| 改动 | 说明 |
|------|------|
| 新增 `thinker_slug` | 全项目唯一主键。旧 `_index.json` 反推 55 个 + 拼音/英文名规则生成其余，人工抽查 |
| 新增 `birth_year_num` / `death_year_num` | 数字年份，公元前为负。字符串格式仅 4 种（`N` `约N` `前N` `约前N`），全自动解析。原字符串保留作展示 |
| 新增 `is_anonymous` | 「集体作品」「作者不确定」标记为匿名实体；同名不同国籍者各给独立 slug（如 `anonymous-china`） |
| 缺年份的 7 位处理 | 老子 → 约前 571；匿名实体 → 按作品成书年代估算；4 位现代作者 → 补查真实年份 |
| `是/否` → `true/false` | 消除中文布尔值 |

**已验证的数据事实**（构建校验的依据）：
- 919 行，418 位唯一思想家，20 位跨多个大问题（庄子/孔子/老子跨 Q0+Q10，休谟/罗素跨 Q1+Q10 等）→ 星图中的「双星」
- 除匿名实体外，同名思想家的元数据全部一致
- 仅 7 位缺出生年

### 2.2 思想家文章与对话数据

- 55 篇 `thinkers/*.md` 保留，每篇加 frontmatter `slug`（必须存在于 canon.csv），`_index.json` 删除
- **新增 `data/dialogues.csv`**：思想对话关系，字段 `from_slug, to_slug, type, note`
  - `type`：`extends`（呼应/延伸，绿弧）| `refutes`（反驳/对立，红弧）
  - `note`：一句话说明（如「用自然选择反驳目的论」）
  - 首批由 AI 内容管线生成 + 人工抽查（与思想家文章同一套方法），每个星座 10~20 条即可撑起效果，后续持续扩充
- `_prompt.md` 保留为写作模板

### 2.3 构建期数据管线 `scripts/build-data.mjs`

`npm run dev` / `build` 前置执行：

```
data/canon.csv + data/thinkers/*.md + data/dialogues.csv
        │
        ▼  校验（失败即构建失败，并指出行号）：
        │   slug 全局唯一；md/dialogues 的 slug 必须存在于 CSV；
        │   同 slug 元数据一致；年份可解析；dialogue 双方不得同一人
        ▼
src/data/generated/           （gitignore）
  ├── questions.json          11 星座 → 章节 → 学科层级 + 统计
  ├── thinkers.json           418 位去重实体：著作、所属星座、hasEssay、对话关系
  ├── atlas.json              星图布局预计算：L0 天球（星座中心/星位/座形连线/避让）
  │                           + L1 各星座时间轴布局 + 对话弧线几何
  └── meta.json               全站统计
public/thinkers/{slug}.md     文章按需 fetch 的静态拷贝（gitignore）
```

前端直接 import 生成的 JSON，删除整个运行时数据层（parser/aggregator/hooks 约 450 行）。

### 2.4 目录结构

```
the-big-questions/
├── data/                        # 唯一数据目录（从 public/ 移出）
│   ├── canon.csv                # 结构权威源
│   ├── dialogues.csv            # 思想对话关系
│   └── thinkers/
│       ├── _prompt.md
│       └── {slug}.md            # frontmatter: slug
├── scripts/
│   ├── migrate-canon.mjs        # 一次性迁移（保留作 provenance）
│   └── build-data.mjs           # 校验 + 生成
├── src/
│   ├── data/generated/          # 构建产物（gitignore）
│   └── ...
```

## 三、展示形式：纸上星图

### 3.1 信息架构

| 路由 | 页面 | 说明 |
|------|------|------|
| `/` | **天球总图 L0** | 全屏可拖拽/缩放的星图。11 星座烫金座形线；星大小 = 星等（必读为一等星）；双星带标识环；拉近浮现星名；点击星座平滑进入 L1。已读的星点亮为金色 |
| `/constellation/:id` | **星座页 L1** | 单个大问题：时间从左到右展开（桌面横轴/移动纵轴），星按年代排布，**对话弧线**浮现——绿弧呼应/延伸、红弧反驳/对立，弧上一句话注解。章节/学科作为星区标注。页尾完整书架 |
| `/thinker/:slug` | **恒星页 L2** | 418 人全开放：有文章渲染文章，无文章展示档案；著作如行星列出；显示该星的全部对话关系（谁呼应他/他反驳谁）；读过/想读标记；星座内上一颗/下一颗导航 |
| `/minimum` | **一等星表** | 47 位必读思想家按年代的精选路线 + 进度统计（已点亮 n/47） |
| `/library` | **观测手册** | 全量思想家/书籍的搜索、筛选、排序表（旧 wiki 形式降级为工具页） |

### 3.2 关键设计决策

- **语义缩放，务实实现**：L0 内自由 pan/zoom（星名标签随缩放浮现）；跨层级（L0→L1）用路由跳转 + 过渡动画，不做无级连续缩放——工程量减半，体验损失很小
- **移动端不做自由缩放画布**：L0 给精绘静态总图（星座可点击），L1 转纵向时间轴，弧线画在侧边——像翻一本星图册
- **渲染用 SVG**：418 + 920 个点远够不上 WebGL 门槛（Galaxy 是 110 万点才用 regl）；SVG 保住可访问性与锚点。星座布局、避让、弧线几何全部在构建期预计算，运行时零布局
- **双星**：跨问题思想家在 L0 有唯一星位（归主星座），带双星环标识，两个星座的座形线都连到它
- **AB 连线彩蛋**：任选两颗星，沿对话关系图找路径并高亮（BFS，纯前端）
- **年份不精确不装精确**：`约前369` 展示原字符串，点位用数字年份，UI 不承诺刻度外精度

### 3.3 阅读进度（localStorage）

- 数据：`{ version: 1, stars: { [slug]: { status: 'read' | 'want', at: ISO日期 } } }`
- 触点：恒星页标记；L0 天球点亮金星；一等星表/星座页进度条
- 纯前端；提供导出/导入 JSON

## 四、视觉系统：古典天文图集

- **底色**：米白纸面（`#FAF6EE` 一族），全站明亮
- **星与线**：墨色星点（近黑暖灰）、烫金座形线与点亮态（金）、朱砂红作双星环与反驳弧、青绿作呼应弧
- **11 星座色**：每星座一个纸面兼容的中饱和标识色（用于星区、标签、library 筛选），构建进设计 token
- **字体**：Noto Serif SC（星名/标题/正文中的引文）+ Inter（数据/UI）
- **CSS 变量设计系统重写**：`src/index.css` 推倒，纸面主题 token 化
- 图集感细节：细经纬弧线做背景肌理（纯线条，无渐变噪点）、星等图例、图幅编号排版

## 五、技术栈

保留 **Vite + React 19 + TypeScript + Vanilla CSS**。pan/zoom 手写（wheel + pointer events，约百行）或 d3-zoom 二选一，以实现顺滑度定。构建脚本新增 devDependency：`pinyin-pro`（slug 生成）。react-markdown 沿用。

## 六、实施阶段

| 阶段 | 内容 | 产出/验收 |
|------|------|-----------|
| **P1 数据迁移** | migrate 脚本升级 canon.csv（slug/数字年份/匿名标记/缺年补全）；55 篇 md 加 frontmatter；数据移入 `data/`；删 `_index.json` | 新 CSV 通过全部校验 |
| **P2 构建管线** | `build-data.mjs`：校验 + 生成 4 份 JSON（含 L0/L1 布局与弧线几何预计算）；首批 dialogues.csv | 数据错误即构建失败；生成物类型完备 |
| **P3 设计系统** | 纸面图集 token（index.css 重写）、星座色板、基础组件 | 静态样式验收 |
| **P4 页面重写** | 天球 L0 → 星座 L1 → 恒星页 → 一等星表 → 观测手册，删旧数据层与旧页面 | 全路由可用，移动端可用 |
| **P5 进度与收尾** | localStorage 点亮 + AB 连线彩蛋；删遗留 dist/；README/PROGRESS 重写；构建部署验证 | `npm run build` 通过，容器验证 |

每阶段独立提交、可回退。

## 七、清理清单

- [x] 删 `public/database/`（数据移至 `data/`）
- [x] 删 `_index.json`（由构建生成替代）
- [x] 删 `src/data/parser.ts` / `aggregator.ts` / `hooks.ts`
- [x] 删遗留的 `dist/`（未被 git 跟踪的旧构建产物）
- [x] PROGRESS.md 归档为 `docs/PROGRESS-v1.md`，本文件接替其交接职能

---

*P1–P5 已于 2026-07-04 全部完成并分阶段提交。同日完成三层内容体系：星志 54 篇（一等星 47 人全覆盖）+ 简志 125 篇（二等星，`data/blurbs.json` 的 brief 字段）+ 星签 420 条全覆盖（line 字段）。后续扩展方向：对话关系扩充（91 条起步）、AB 连线彩蛋（数据已就绪，前端未实现）、三四等星按需补简志。*
