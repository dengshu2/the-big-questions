import { Suspense, useState, useEffect, use } from 'react'
import { useParams, Link } from 'react-router-dom'
import Markdown from 'react-markdown'
import { SiteNav } from '../components/SiteNav'
import './ThinkerPage.css'

// ==================== 数据加载 ====================

interface ThinkerIndex {
    prompt_file: string
    thinkers: Record<string, { nameZh: string; nameEn: string; file: string }>
}

const indexPromise = fetch('/database/thinkers/_index.json').then((r) =>
    r.json()
) as Promise<ThinkerIndex>

function fetchMarkdown(file: string): Promise<string> {
    return fetch(`/database/thinkers/${file}`).then((r) => {
        if (!r.ok) throw new Error(`Failed to load ${file}`)
        return r.text()
    })
}

// ==================== 阅读框架面板 ====================

function FrameworkPanel() {
    const [open, setOpen] = useState(false)
    const [content, setContent] = useState<string | null>(null)

    useEffect(() => {
        if (open && !content) {
            fetch('/database/thinkers/_prompt.md')
                .then((r) => r.text())
                .then(setContent)
        }
    }, [open, content])

    return (
        <div className="framework-panel">
            <button
                className="framework-toggle"
                onClick={() => setOpen(!open)}
                aria-expanded={open}
            >
                <span className="framework-icon">🧭</span>
                <span>阅读框架：如何认识一位思想家</span>
                <span className={`framework-chevron ${open ? 'open' : ''}`}>▾</span>
            </button>
            {open && (
                <div className="framework-content">
                    {content ? (
                        <Markdown>{content}</Markdown>
                    ) : (
                        <p className="loading-text">加载中…</p>
                    )}
                </div>
            )}
        </div>
    )
}

// ==================== 思想家内容 ====================

function ThinkerContent() {
    const { slug } = useParams<{ slug: string }>()
    const index = use(indexPromise)

    const thinkerMeta = slug ? index.thinkers[slug] : null

    if (!thinkerMeta) {
        return (
            <div className="thinker-page page-enter">
                <SiteNav />
                <div className="thinker-container">
                    <div className="thinker-not-found">
                        <h1>未找到此思想家</h1>
                        <p>
                            尚未收录此思想家的介绍，或链接有误。
                        </p>
                        <Link to="/" className="back-link">
                            ← 返回首页
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    return <ThinkerArticle meta={thinkerMeta} />
}

function ThinkerArticle({
    meta,
}: {
    meta: { nameZh: string; nameEn: string; file: string }
}) {
    const [markdown, setMarkdown] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchMarkdown(meta.file)
            .then(setMarkdown)
            .catch((e) => setError(e.message))
    }, [meta.file])

    if (error) {
        return (
            <div className="thinker-page page-enter">
                <SiteNav />
                <div className="thinker-container">
                    <div className="thinker-not-found">
                        <h1>加载失败</h1>
                        <p>{error}</p>
                        <Link to="/" className="back-link">
                            ← 返回首页
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="thinker-page page-enter">
            <SiteNav />
            <div className="thinker-container">
                {/* 顶部面包屑 */}
                <nav className="thinker-breadcrumb">
                    <Link to="/">首页</Link>
                    <span className="sep">›</span>
                    <span className="current">{meta.nameZh}</span>
                </nav>

                {/* 阅读框架（可折叠） */}
                <FrameworkPanel />

                {/* 思想家名片头 */}
                <header className="thinker-detail-header">
                    <h1 className="thinker-detail-name-zh">{meta.nameZh}</h1>
                    {meta.nameEn && (
                        <p className="thinker-detail-name-en">{meta.nameEn}</p>
                    )}
                </header>

                {/* 正文 */}
                {markdown ? (
                    <article className="thinker-article">
                        <Markdown
                            components={{
                                h1: ({ children }) => (
                                    <h2 className="thinker-section-title">{children}</h2>
                                ),
                                h2: ({ children }) => (
                                    <h3 className="thinker-subsection-title">{children}</h3>
                                ),
                                strong: ({ children }) => (
                                    <strong className="thinker-emphasis">{children}</strong>
                                ),
                            }}
                        >
                            {markdown}
                        </Markdown>
                    </article>
                ) : (
                    <div className="thinker-loading">
                        <div className="loading-pulse" />
                        <p>正在加载介绍…</p>
                    </div>
                )}

                {/* 底部导航 */}
                <footer className="thinker-footer">
                    <Link to="/" className="back-link">
                        ← 返回首页
                    </Link>
                </footer>
            </div>
        </div>
    )
}

// ==================== 加载状态 ====================

function LoadingFallback() {
    return (
        <div className="thinker-page page-enter">
            <SiteNav />
            <div className="thinker-container">
                <div className="thinker-loading">
                    <div className="loading-pulse" />
                    <p>加载中…</p>
                </div>
            </div>
        </div>
    )
}

// ==================== 导出 ====================

export default function ThinkerPage() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <ThinkerContent />
        </Suspense>
    )
}
