import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, Navigate, Outlet, RouterProvider, ScrollRestoration, useParams } from 'react-router-dom'
import Home from './pages/Home'
import Question from './pages/Question'
import { bookHref, getThinker } from './data/catalog'
import Picks from './pages/Picks'
import Search from './pages/Search'
import Shelf from './pages/Shelf'
import './quiet.css'
import './app.css'

function Layout() {
  return (
    <div className="q-app q-app--wide">
      <Outlet />
      {/* 按地址记滚动位置：直接打开的页面都用同一个 key，按 key 会把上一页的位置带过来 */}
      <ScrollRestoration getKey={(loc) => loc.pathname} />
    </div>
  )
}

/** 问题页没写节时进第一节；旧版 /constellation/:id、/question/:id 也走这里 */
function ToQuestion() {
  const { id } = useParams()
  return <Navigate to={`/q/${id}/_`} replace />
}

/** 书和思想家不再有单独页面：书跳到它所在的节并展开，思想家跳到搜索 */
function ToBook() {
  const { id } = useParams()
  return <Navigate to={bookHref(id ?? '')} replace />
}
function ToThinker() {
  const { id } = useParams()
  const t = getThinker(id)
  return <Navigate to={t ? `/search?q=${encodeURIComponent(t.name)}` : '/search'} replace />
}

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/q/:id', element: <ToQuestion /> },
      { path: '/q/:id/:sec', element: <Question /> },
      { path: '/b/:id', element: <ToBook /> },
      { path: '/t/:id', element: <ToThinker /> },
      { path: '/picks', element: <Picks /> },
      { path: '/search', element: <Search /> },
      { path: '/shelf', element: <Shelf /> },
      { path: '/constellation/:id', element: <ToQuestion /> },
      { path: '/question/:id', element: <ToQuestion /> },
      { path: '/thinker/:id', element: <ToThinker /> },
      { path: '/minimum', element: <Navigate to="/picks" replace /> },
      { path: '/library', element: <Navigate to="/search" replace /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
