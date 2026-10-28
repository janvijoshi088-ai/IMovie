import { Link, Navigate, useLocation } from 'react-router-dom'
import useAuth from '../../context/useAuth'
import Button from '../ui/Button'

function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, loading, isAuthenticated, isAdmin } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-zinc-400">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold-400 border-t-transparent" />
          <p className="text-xs">Verifying session...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 text-red-400">
          <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        <h1 className="mt-4 font-display text-3xl font-bold text-white">
          Administrator Access Required
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          You are currently signed in as <strong className="text-white">{user?.name}</strong> with the <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs font-semibold text-zinc-300">Customer</span> role. Access to the administrative portal is strictly restricted to administrator accounts.
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button to="/">Back to Home</Button>
          <Link
            to="/login"
            className="inline-flex items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-zinc-200 hover:border-gold-400 hover:text-gold-400"
          >
            Switch to Admin Account
          </Link>
        </div>
      </div>
    )
  }

  return children
}

export default ProtectedRoute
