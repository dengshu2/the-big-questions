import { Navigate, useParams } from 'react-router-dom'
import { formatYears, getBook, getThinker } from '../data/catalog'
import { BookRow, Icon, ICONS, ShelfPill, Top } from '../components/ui'

export default function Thinker() {
  const { slug } = useParams()
  const t = getThinker(slug)
  if (!t) return <Navigate to="/" replace />

  const first = getBook(t.books[0])
  const meta = [t.nameEn, formatYears(t), t.nationality].filter(Boolean).join(' · ')
  return (
    <>
      <Top title={t.name} sub={`${t.books.length} 本书`} back={first ? `/b/${first.id}` : '/'} right={<ShelfPill />} />
      <main className="q-page q-enter">
        <div className="q-page-head">
          <h1>{t.name}</h1>
          <p>{meta}</p>
        </div>
        <p className="q-lead">{t.line}</p>
        <p className="prose-p">{t.brief}</p>

        <section className="q-sec">
          <h3>书单中的书</h3>
          <ul className="q-rows">
            {t.books.map((id) => (
              <BookRow key={id} id={id} must={getBook(id)?.places.some((p) => p.must)} showAuthor={getBook(id)!.authors.length > 1} />
            ))}
          </ul>
        </section>

        {t.wikipedia && (
          <a className="q-link ext-link" href={t.wikipedia} target="_blank" rel="noreferrer">
            维基百科 <Icon d={ICONS.out} sm />
          </a>
        )}
      </main>
    </>
  )
}
