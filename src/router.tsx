import { createBrowserRouter } from 'react-router-dom'
import App from './App'
import QuestionPage from './pages/QuestionPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
  },
  {
    path: '/question/:id',
    element: <QuestionPage />,
  },
])
