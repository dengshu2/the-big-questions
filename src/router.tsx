import { createBrowserRouter, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import AtlasPage from './pages/AtlasPage'
import ConstellationPage from './pages/ConstellationPage'
import MinimumPage from './pages/MinimumPage'
import LibraryPage from './pages/LibraryPage'
import { QuestionRedirect, ScrollToTop } from './components/routing'

// 恒星页携带 react-markdown，单独分包按需加载
const ThinkerPage = lazy(() => import('./pages/ThinkerPage'))

export const router = createBrowserRouter([
  {
    element: <ScrollToTop />,
    children: [
      { path: '/', element: <AtlasPage /> },
      { path: '/constellation/:id', element: <ConstellationPage /> },
      {
        path: '/thinker/:slug',
        element: (
          <Suspense fallback={null}>
            <ThinkerPage />
          </Suspense>
        ),
      },
      { path: '/minimum', element: <MinimumPage /> },
      { path: '/library', element: <LibraryPage /> },
      { path: '/question/:id', element: <QuestionRedirect /> },
      { path: '/thinkers', element: <Navigate to="/library" replace /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])
