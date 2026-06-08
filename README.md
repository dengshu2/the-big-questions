# 大问题 · The Big Questions

人类文明经典元典导览 — 从十一个大问题出发，探索 300+ 位思想家与 900+ 部经典著作的智慧图谱。

## 数据来源

书单数据整理自[《聪明的阅读者》](https://book.douban.com/subject/36359767/)一书。

`public/database/canon.csv` — 920 条经典著作记录，涵盖：

| 维度 | 数量 |
|------|------|
| 大问题 | 11 |
| 章节 | ~50 |
| 学科/领域 | ~100 |
| 思想家 | 300+ |
| 经典著作 | 920 |
| 时间跨度 | ~2500 年 |

## 技术栈

- **Vite 7** + **React 19** + **TypeScript**
- **Vanilla CSS** 设计系统
- **Docker** + **Nginx** 生产部署

## 本地开发

```bash
npm install
npm run dev
```

## Docker 部署

项目使用多阶段 Docker 构建，适配 Docker Compose + Caddy 的 VPS 部署方案。

```bash
# 构建并启动
docker compose up -d --build

# 查看日志
docker compose logs -f

# 重新部署（代码更新后）
docker compose up -d --build

# 停止
docker compose down
```

### Caddy 反向代理配置

容器会自动加入 `proxy-network`，由 Caddy 统一转发：

| 配置项 | 值 |
|--------|-----|
| Upstream | `the-big-questions:80` |
| SSL | Let's Encrypt |

## License

MIT
