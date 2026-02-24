import { createBrowserRouter } from 'react-router-dom'
import App from './App'
import QuestionPage from './pages/QuestionPage'
import MinimumListPage from './pages/MinimumListPage'

export const router = createBrowserRouter([
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
])
