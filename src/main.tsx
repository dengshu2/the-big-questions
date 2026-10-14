import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, Navigate, Outlet, RouterProvider, ScrollRestoration, useParams } from 'react-router-dom'
import Home from './pages/Home'
import Question from './pages/Question'
import Book from './pages/Book'
import Thinker from './pages/Thinker'
import Picks from './pages/Picks'
import Search from './pages/Search'
import Shelf from './pages/Shelf'
import './quiet.css'
import './app.css'

function Layout() {
  return (
    <div className="q-app">
      <Outlet />
      <ScrollRestoration />
    </div>
  )
}

/** 旧版链接：/constellation/:id、/question/:id、/thinker/:slug */
function Legacy({ to }: { to: 'q' | 't' }) {
  const { id } = useParams()
  return <Navigate to={`/${to}/${id}`} replace />
}

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/q/:id', element: <Question /> },
      { path: '/b/:id', element: <Book /> },
      { path: '/t/:slug', element: <Thinker /> },
      { path: '/picks', element: <Picks /> },
      { path: '/search', element: <Search /> },
      { path: '/shelf', element: <Shelf /> },
      { path: '/constellation/:id', element: <Legacy to="q" /> },
      { path: '/question/:id', element: <Legacy to="q" /> },
      { path: '/thinker/:id', element: <Legacy to="t" /> },
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
