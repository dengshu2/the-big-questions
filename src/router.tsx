import { createBrowserRouter, Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import App from './App'
import QuestionPage from './pages/QuestionPage'
import MinimumListPage from './pages/MinimumListPage'
import ThinkerPage from './pages/ThinkerPage'
import ThinkerListPage from './pages/ThinkerListPage'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return <Outlet />
}

export const router = createBrowserRouter([
  {
    element: <ScrollToTop />,
    children: [
      {
        path: '/',
        element: <App />,
      },
      {
        path: '/question/:id',
        element: <QuestionPage />,
      },
      {
        path: '/minimum',
        element: <MinimumListPage />,
      },
      {
        path: '/thinkers',
        element: <ThinkerListPage />,
      },
      {
        path: '/thinker/:slug',
        element: <ThinkerPage />,
      },
    ],
  },
])
