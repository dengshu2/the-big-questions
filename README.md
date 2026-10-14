# 大问题 · 经典书单

**The Big Questions — a reading list organized by questions**

一份按问题组织的经典书单：十一个大问题（元典、知识、世界、历史、时代、社会、组织、家庭、人性、身体、信仰），419 位思想家，893 本书。每个问题分五节，每节标出一本「先读这本」，47 本连起来是最短的阅读路径。可以给每本书标记想读、在读、读完。

书单整理自阳志平《聪明的阅读者》。思想家与书的介绍由 AI 撰写，生卒年等事实对照 Wikidata 核对过。

## 数据

所有数据都在 `data/`，手工维护，构建时校验：

| 文件 | 内容 |
|------|------|
| `about.md` | 首页的书单说明，空行分段 |
| `questions.csv` | 11 个问题：名称、一句话、导语 |
| `sections.csv` | 51 节：所属问题、名称、一句话说明、为什么先读这一节的首选（why） |
| `thinkers.csv` | 思想家：中英文名、生卒年、国籍、Wikidata、维基百科、一句话定位、简介 |
| `books.csv` | 书：书名、原名、作者（多位用 `\|` 分隔）、一句话、归属说明（作者其实是编者或研究对象时）、合著说明（书单外的合著者、编者） |
| `placements.csv` | 书在书单中的位置：章节、学科、是否首选。文件顺序就是页面顺序 |

`npm run data` 运行 `scripts/build-data.mjs`：检查主键唯一、引用存在、字数范围、每节最多一本首选等，生成 `src/data/catalog.json`。出错时会指出文件和行号，构建失败。

`scripts/migrate/` 是 2026-10 从 v2 总表（`canon-v2.csv`）一次性迁移的脚本和 Wikidata 快照，仅作来源记录，不要再运行。

## 页面

| 路由 | 内容 |
|------|------|
| `/` | 书单说明、「从这里开始」三步、十一个问题的卡片 |
| `/q/:id/:section` | 问题页：桌面左侧是各节目录，右侧一次显示一节——这一节讲什么、「先读这本」、按学科分组的延伸阅读、下一节 |
| `/picks` | 47 本「先读这本」，最短路径 |
| `/search` | 搜索书名和思想家（思想家直接带出他的书） |
| `/shelf` | 我的书架，可导出、导入 |

书和思想家没有单独页面：点一本书在原地展开（介绍、作者、阅读状态），展开的书记在 `?b=` 上，可以直接分享。`/b/:id` 跳到这本书所在的节并展开，`/t/:slug` 跳到搜索。旧版链接（`/constellation/:id`、`/thinker/:slug`、`/minimum`、`/library`）也会跳转。阅读状态保存在浏览器 localStorage（`tbq-shelf`），没有账号。

## 技术栈

React 19 + Vite 8 + TypeScript，界面用 [Quiet UI](../quiet-ui) 的宽屏布局（`src/quiet.css` 是复制进来的，应用样式在 `src/app.css`）。生产环境是 Nginx 静态站。

```bash
npm install
npm run dev     # 先生成数据，再启动开发服务器
npm test        # 数据校验测试 + 前端测试
npm run build
```

## 部署

```bash
docker compose up -d --build
```

容器加入 `proxy-network`，由 Caddy 转发（upstream `the-big-questions:80`）。

## License

MIT
