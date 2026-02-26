import { Suspense, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useCanonData } from '../data'
import type { CanonData } from '../data/types'
import { SiteNav } from '../components/SiteNav'
import './ThinkerListPage.css'

// ==================== 数据处理 ====================

interface ThinkerSummary {
    nameZh: string
    nameEn: string
    birthYear: string
    deathYear: string
    nationality: string
    wikipediaUrl: string
    bookCount: number
    minBookCount: number
    questions: { id: number; name: string }[]
    disciplines: string[]
    /** 用于排序的数字年份，公元前为负数 */
    sortYear: number
}

function parseYearNum(y: string): number {
    if (!y) return 9999
    const cleaned = y.replace(/[约~？?]/g, '')
    const match = cleaned.match(/前?(\d+)/)
    if (!match) return 9999
    const num = parseInt(match[1], 10)
    return cleaned.startsWith('前') ? -num : num
}

function buildThinkerSummaries(data: CanonData): ThinkerSummary[] {
    const map = new Map<string, ThinkerSummary>()

    for (const row of data.rawRows) {
        const key = row.thinker_name_zh
        if (!map.has(key)) {
            map.set(key, {
                nameZh: row.thinker_name_zh,
                nameEn: row.thinker_name_en,
                birthYear: row.birth_year,
                deathYear: row.death_year,
                nationality: row.nationality,
                wikipediaUrl: row.wikipedia_url,
                bookCount: 0,
                minBookCount: 0,
                questions: [],
                disciplines: [],
                sortYear: parseYearNum(row.birth_year),
            })
        }
        const t = map.get(key)!
        t.bookCount++
        if (row.is_minimum_list) t.minBookCount++

        // 去重添加大问题
        if (!t.questions.some((q) => q.id === row.big_question_id)) {
            t.questions.push({ id: row.big_question_id, name: row.big_question_name })
        }
        // 去重添加学科
        if (!t.disciplines.includes(row.discipline)) {
            t.disciplines.push(row.discipline)
        }
    }

    return Array.from(map.values())
}

// ==================== 页面组件 ====================

type SortKey = 'era' | 'books' | 'name'
type FilterKey = 'all' | 'core' | string // string = question id like "q0"

function ThinkerListContent() {
    const data = useCanonData()
    const allThinkers = useMemo(() => buildThinkerSummaries(data), [data])

    const [sort, setSort] = useState<SortKey>('era')
    const [filter, setFilter] = useState<FilterKey>('all')
    const [search, setSearch] = useState('')

    // 加载思想家介绍索引
    const [slugMap, setSlugMap] = useState<Map<string, string>>(new Map())
    useMemo(() => {
        fetch('/database/thinkers/_index.json')
            .then((r) => r.json())
            .then((idx: { thinkers: Record<string, { nameZh: string }> }) => {
                const map = new Map<string, string>()
                for (const [slug, meta] of Object.entries(idx.thinkers)) {
                    map.set(meta.nameZh, slug)
                }
                setSlugMap(map)
            })
            .catch(() => { })
    }, [])

    // 大问题列表（用于筛选标签）
    const questions = useMemo(() => {
        const qMap = new Map<number, string>()
        for (const t of allThinkers) {
            for (const q of t.questions) {
                qMap.set(q.id, q.name)
            }
        }
        return Array.from(qMap.entries())
            .sort((a, b) => a[0] - b[0])
            .map(([id, name]) => ({ id, name }))
    }, [allThinkers])

    // 筛选
    const filtered = useMemo(() => {
        let list = allThinkers

        // 搜索
        if (search.trim()) {
            const q = search.trim().toLowerCase()
            list = list.filter(
                (t) =>
                    t.nameZh.includes(q) ||
                    t.nameEn.toLowerCase().includes(q) ||
                    t.nationality.includes(q)
            )
        }

        // 分类筛选
        if (filter === 'core') {
            list = list.filter((t) => t.minBookCount > 0)
        } else if (filter.startsWith('q')) {
            const qId = parseInt(filter.slice(1), 10)
            list = list.filter((t) => t.questions.some((q) => q.id === qId))
        }

        return list
    }, [allThinkers, search, filter])

    // 排序
    const sorted = useMemo(() => {
        const arr = [...filtered]
        switch (sort) {
            case 'era':
                arr.sort((a, b) => a.sortYear - b.sortYear)
                break
            case 'books':
                arr.sort((a, b) => b.bookCount - a.bookCount)
                break
            case 'name':
                arr.sort((a, b) => a.nameZh.localeCompare(b.nameZh, 'zh-Hans'))
                break
        }
        return arr
    }, [filtered, sort])

    // 核心思想家数量
    const coreCount = useMemo(
        () => allThinkers.filter((t) => t.minBookCount > 0).length,
        [allThinkers]
    )

    return (
        <div className="thinker-list-page page-enter">
            <nav className="breadcrumb">
                <Link to="/">首页</Link>
                <span className="breadcrumb-sep">/</span>
                <span className="breadcrumb-current">思想家总览</span>
            </nav>

            <header className="tl-header">
                <h1 className="tl-title">思想家总览</h1>
                <p className="tl-subtitle">
                    {allThinkers.length} 位思想家 · {coreCount} 位核心 ·
                    跨越约 2500 年
                </p>
            </header>

            {/* 搜索栏 */}
            <div className="tl-search-bar">
                <input
                    type="text"
                    className="tl-search-input"
                    placeholder="搜索思想家姓名、英文名或国籍…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                    <button className="tl-search-clear" onClick={() => setSearch('')}>
                        ✕
                    </button>
                )}
            </div>

            {/* 筛选标签 */}
            <div className="tl-filters">
                <button
                    className={`tl-filter-tag ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => setFilter('all')}
                >
                    全部 <span className="tl-filter-count">{allThinkers.length}</span>
                </button>
                <button
                    className={`tl-filter-tag core ${filter === 'core' ? 'active' : ''}`}
                    onClick={() => setFilter('core')}
                >
                    ★ 核心 <span className="tl-filter-count">{coreCount}</span>
                </button>
                <span className="tl-filter-divider" />
                {questions.map((q) => (
                    <button
                        key={q.id}
                        className={`tl-filter-tag ${filter === `q${q.id}` ? 'active' : ''}`}
                        onClick={() => setFilter(`q${q.id}`)}
                    >
                        Q{q.id} {q.name}
                    </button>
                ))}
            </div>

            {/* 排序控制 + 结果数 */}
            <div className="tl-toolbar">
                <span className="tl-result-count">
                    {sorted.length} 位思想家
                </span>
                <div className="tl-sort-group">
                    <span className="tl-sort-label">排序</span>
                    <button
                        className={`tl-sort-btn ${sort === 'era' ? 'active' : ''}`}
                        onClick={() => setSort('era')}
                    >
                        年代
                    </button>
                    <button
                        className={`tl-sort-btn ${sort === 'books' ? 'active' : ''}`}
                        onClick={() => setSort('books')}
                    >
                        著作数
                    </button>
                    <button
                        className={`tl-sort-btn ${sort === 'name' ? 'active' : ''}`}
                        onClick={() => setSort('name')}
                    >
                        姓名
                    </button>
                </div>
            </div>

            {/* 思想家列表 */}
            <div className="tl-list">
                {sorted.map((t) => (
                    <ThinkerRow key={t.nameZh} thinker={t} slugMap={slugMap} />
                ))}
                {sorted.length === 0 && (
                    <div className="tl-empty">未找到匹配的思想家</div>
                )}
            </div>
        </div>
    )
}

// ==================== 思想家行 ====================

function ThinkerRow({
    thinker: t,
    slugMap,
}: {
    thinker: ThinkerSummary
    slugMap: Map<string, string>
}) {
    const isCore = t.minBookCount > 0
    const slug = slugMap.get(t.nameZh)
    const lifespan = formatLifespan(t.birthYear, t.deathYear)

    return (
        <div className={`tl-row ${isCore ? 'is-core' : ''}`}>
            <div className="tl-row-main">
                <div className="tl-row-name-group">
                    {isCore && <span className="tl-star" title="核心思想家（有必读书目）">★</span>}
                    <span className="tl-row-name">{t.nameZh}</span>
                    {slug && (
                        <Link
                            to={`/thinker/${slug}`}
                            className="tl-row-intro"
                            title="查看详细介绍"
                        >
                            📖
                        </Link>
                    )}
                    {t.wikipediaUrl && (
                        <a
                            href={t.wikipediaUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="tl-row-wiki"
                            title="维基百科"
                        >
                            <WikiIcon />
                        </a>
                    )}
                    {t.nameEn && <span className="tl-row-name-en">{t.nameEn}</span>}
                </div>
                <div className="tl-row-meta">
                    {lifespan && <span className="tl-row-lifespan">{lifespan}</span>}
                    <span className="tl-row-nationality">{t.nationality}</span>
                    <span className="tl-row-books">
                        {t.bookCount} 部
                        {t.minBookCount > 0 && (
                            <span className="tl-row-min-badge">{t.minBookCount} 必读</span>
                        )}
                    </span>
                </div>
            </div>
            <div className="tl-row-tags">
                {t.questions.map((q) => (
                    <Link
                        key={q.id}
                        to={`/question/${q.id}`}
                        className="tl-row-qtag"
                        title={q.name}
                    >
                        Q{q.id}
                    </Link>
                ))}
            </div>
        </div>
    )
}

// ==================== 工具 ====================

function WikiIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.06 14.54L8.41 9.4h1.52l1.58 4.56 1.56-4.56h.7l1.56 4.56L16.91 9.4h1.52l-2.53 7.14h-.7L13.6 12l-1.58 4.54h-.7z" />
        </svg>
    )
}

function formatLifespan(birth: string, death: string): string {
    if (!birth && !death) return ''
    if (birth && !death) return birth
    if (!birth && death) return `?–${death}`
    return `${birth}–${death}`
}

function LoadingFallback() {
    return (
        <div className="loading">
            <div className="loading-spinner" />
            <span>加载中...</span>
        </div>
    )
}

export default function ThinkerListPage() {
    return (
        <>
            <SiteNav />
            <Suspense fallback={<LoadingFallback />}>
                <ThinkerListContent />
            </Suspense>
        </>
    )
}
