import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import useAuth from '../context/useAuth'
import DemoBanner from '../components/ui/DemoBanner'
import PageHeader from '../components/ui/PageHeader'

function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { login, isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const destination = location.state?.from?.pathname || '/'

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!email.trim() || !password) {
      setError('Please provide both email and password.')
      return
    }

    setLoading(true)
    try {
      await login(email, password)
      navigate(destination, { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function fillAdminDemo() {
    setEmail('admin@imovies.com')
    setPassword('Admin@123456')
    setError('')
  }

  function fillCustomerDemo() {
    setEmail('customer@imovies.com')
    setPassword('Customer@123')
    setError('')
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
      <PageHeader
        eyebrow="Account Access"
        title="Sign In to IMovies"
        description="Authenticate securely with your email and password. Protected sessions use JSON Web Tokens (JWT)."
      />

      <div className="mt-6">
        <DemoBanner>
          Phase 3 Active: Connected to the real backend authentication API. Passwords are verified against bcrypt hashes and issued secure JWT tokens.
        </DemoBanner>
      </div>

      {isAuthenticated ? (
        <div className="mt-8 rounded-3xl border border-zinc-800 bg-cinema-900/90 p-8 shadow-2xl text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gold-400 text-cinema-950 font-bold text-lg">
            ✓
          </div>
          <h2 className="text-xl font-bold text-white">Currently Signed In</h2>
          <p className="text-sm text-zinc-300">
            You are logged in as <strong className="text-gold-400">{user?.name}</strong> ({user?.email}) with role <span className="font-semibold uppercase tracking-wider text-xs px-2 py-0.5 rounded bg-zinc-800">{user?.role}</span>.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={() => navigate('/')}
              className="rounded-full bg-gold-400 px-6 py-2.5 text-xs font-bold text-cinema-950 hover:bg-gold-500"
            >
              Go to Home
            </button>
            <button
              onClick={logout}
              className="rounded-full border border-zinc-700 px-6 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800"
            >
              Sign Out
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-8 rounded-3xl border border-zinc-800 bg-cinema-900/90 p-8 shadow-2xl">
          {/* Quick Credential Helpers */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-zinc-800 text-xs">
            <span className="font-bold uppercase tracking-wider text-zinc-400">
              Quick Test Accounts:
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={fillAdminDemo}
                className="rounded-md bg-zinc-800 px-2.5 py-1 text-[11px] font-semibold text-gold-400 hover:bg-zinc-700 transition"
              >
                Fill Admin
              </button>
              <button
                type="button"
                onClick={fillCustomerDemo}
                className="rounded-md bg-zinc-800 px-2.5 py-1 text-[11px] font-semibold text-zinc-200 hover:bg-zinc-700 transition"
              >
                Fill Customer
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="e.g. user@example.com"
                className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-gold-400"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                Password
              </label>
              <div className="relative mt-2">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 pr-12 text-sm text-white placeholder-zinc-500 outline-none focus:border-gold-400"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-xs text-zinc-400 hover:text-white"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {error ? (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs leading-relaxed text-red-200 flex items-center gap-2">
                <span className="font-bold">Error:</span>
                <span>{error}</span>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-gold-400 py-3.5 text-sm font-bold text-cinema-950 shadow-md transition hover:bg-gold-500 disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-zinc-800 text-center text-xs text-zinc-400">
            Do not have an account yet?{' '}
            <Link to="/register" className="font-semibold text-gold-400 hover:underline">
              Register Here
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

export default LoginPage
