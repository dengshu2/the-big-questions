# 大问题 · 纸上星图

**The Big Questions — A Paper Star Atlas**

一份可以点亮的经典阅读星图：11 个大问题是 11 个星座，420 位思想家是星，920 部经典是他们留下的光。思想之间的呼应与反驳化作星与星之间的弧线，你读过的书会把星星点亮成金色。

灵感来自 [Histography](https://histography.io/)、[History of Philosophy Visualized](https://www.denizcemonduygu.com/philo/)、[Open Syllabus Galaxy](https://galaxy.opensyllabus.org/) 与古典天文图集。

## 数据

书单数据整理自[《聪明的阅读者》](https://book.douban.com/subject/36359767/)。手工维护的数据只有三份，其余一切由构建脚本生成：

| 文件 | 内容 |
|------|------|
| `data/canon.csv` | 919 条著作记录：11 大问题 → 章节 → 学科 → 思想家 → 著作（含 slug 主键、数字年份） |
| `data/dialogues.csv` | 思想对话关系：谁呼应了谁、谁反驳了谁（星座页的绿弧与红弧） |
| `data/thinkers/*.md` | 思想家星志（深度介绍），frontmatter 以 slug 关联 |

`npm run dev / build` 会先执行 `scripts/build-data.mjs`：校验三份数据的完整性（slug 唯一、关联存在、年份可解析），再生成聚合 JSON 与星图布局（星座座形、星位避让、时间轴泳道、弧线几何）。**任何数据错误都会让构建失败并指出行号。**

## 页面

| 路由 | 说明 |
|------|------|
| `/` | 天球总图：可缩放巡天，拉近浮现星名，双星带朱砂环 |
| `/constellation/:id` | 星座页：时间横轴上的思想家 + 呼应/反驳对话弧线 |
| `/thinker/:slug` | 恒星页：著作、思想对话、星志；可点亮（读过）或标记想读 |
| `/minimum` | 一等星表：47 位必读思想家与点亮进度 |
| `/library` | 观测手册：全量检索 + 观测记录（阅读进度）导入导出 |

阅读进度保存在 localStorage，纯前端，无账号。

## 技术栈

- **Vite 7** + **React 19** + **TypeScript**，Vanilla CSS 设计系统（明亮纸面图集主题）
- 星图渲染为原生 SVG，布局全部在构建期预计算，运行时零布局开销
- **Docker** + **Nginx** 生产部署

## 本地开发

```bash
npm install
npm run dev     # 会先运行数据管线
npm run data    # 仅运行数据管线
```

## Docker 部署

```bash
docker compose up -d --build
```

容器加入 `proxy-network`，由 Caddy 统一转发（upstream `the-big-questions:80`）。

## License

MIT
