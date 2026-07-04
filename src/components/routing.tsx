import { Navigate, Outlet, useLocation, useParams } from 'react-router-dom'
import { useEffect } from 'react'

export function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return <Outlet />
}

/** 旧站路由兼容：/question/:id → /constellation/:id */
export function QuestionRedirect() {
  const { id } = useParams()
  return <Navigate to={`/constellation/${id}`} replace />
}
