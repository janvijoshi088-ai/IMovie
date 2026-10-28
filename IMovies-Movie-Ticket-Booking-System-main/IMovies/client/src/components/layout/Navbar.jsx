import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import useAuth from '../../context/useAuth'

const links = [
  { to: '/', label: 'Home' },
  { to: '/movies', label: 'Movies' },
  { to: '/bookings', label: 'My Bookings' },
  { to: '/admin', label: 'Admin' },
]

function Navbar() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const { user, isAuthenticated, isAdmin, logout } = useAuth()

  function handleSearch(event) {
    event.preventDefault()
    const params = new URLSearchParams()
    if (query.trim()) {
      params.set('q', query.trim())
    }
    navigate(`/movies?${params.toString()}`)
    setOpen(false)
  }

  function handleLogout() {
    logout()
    navigate('/')
    setOpen(false)
  }

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-cinema-950/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold-400 text-cinema-950 shadow-md shadow-gold-400/20 transition-transform group-hover:scale-105">
            <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
              <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z" />
            </svg>
          </div>
          <span className="font-display text-2xl font-bold tracking-tight text-white">
            I<span className="text-gold-400">Movies</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-6 text-sm font-medium text-zinc-300 md:flex">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/' || link.to === '/admin'}
              className={({ isActive }) =>
                `transition-colors duration-150 ${
                  isActive
                    ? 'font-semibold text-gold-400'
                    : 'text-zinc-300 hover:text-white'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Search Bar (Desktop) */}
        <form
          onSubmit={handleSearch}
          className="relative hidden min-w-0 flex-1 max-w-xs lg:flex"
        >
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
            <svg
              className="h-4 w-4 text-zinc-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search movies, cast, directors..."
            className="w-full rounded-full border border-zinc-800 bg-zinc-900/90 py-2 pr-4 pl-10 text-sm text-white placeholder-zinc-500 transition outline-none focus:border-gold-400 focus:bg-zinc-900 focus:ring-1 focus:ring-gold-400"
          />
        </form>

        {/* Auth / Account State (Desktop) */}
        <div className="hidden items-center gap-3 sm:flex">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs">
                <span className="font-semibold text-white">{user?.name}</span>
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    isAdmin
                      ? 'bg-gold-400 text-cinema-950'
                      : 'bg-zinc-800 text-zinc-300'
                  }`}
                >
                  {user?.role}
                </span>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full border border-zinc-700 px-3.5 py-1.5 text-xs font-semibold text-zinc-300 transition hover:border-zinc-500 hover:text-white"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-full px-4 py-2 text-sm font-semibold text-zinc-300 transition hover:text-white hover:bg-zinc-800/60"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-full bg-gold-400 px-4 py-2 text-sm font-semibold text-cinema-950 shadow-md shadow-gold-400/10 transition hover:bg-gold-500 hover:shadow-gold-400/25"
              >
                Register
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-300 transition hover:border-zinc-700 hover:text-white md:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-label="Toggle navigation menu"
        >
          {open ? (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Menu Drawer */}
      {open ? (
        <div className="border-t border-zinc-800/90 bg-cinema-950 px-4 py-5 space-y-4 md:hidden">
          <form onSubmit={handleSearch} className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
              <svg className="h-4 w-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search movies..."
              className="w-full rounded-full border border-zinc-700 bg-zinc-900 py-2.5 pr-4 pl-10 text-sm text-white outline-none focus:border-gold-400"
            />
          </form>

          <nav className="flex flex-col gap-1 text-sm font-medium">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/' || link.to === '/admin'}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `rounded-xl px-3 py-2.5 transition ${
                    isActive
                      ? 'bg-zinc-800/80 font-semibold text-gold-400'
                      : 'text-zinc-200 hover:bg-zinc-900'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="pt-2 border-t border-zinc-800">
            {isAuthenticated ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between px-2 text-xs">
                  <span className="text-zinc-400">Signed in as <strong className="text-white">{user?.name}</strong></span>
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${isAdmin ? 'bg-gold-400 text-cinema-950' : 'bg-zinc-800 text-zinc-300'}`}>
                    {user?.role}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full rounded-xl border border-zinc-700 py-2.5 text-center text-xs font-semibold text-red-300 hover:bg-zinc-900"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="flex-1 text-center rounded-xl border border-zinc-700 py-2.5 text-sm font-medium text-zinc-200 hover:bg-zinc-900"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setOpen(false)}
                  className="flex-1 text-center rounded-xl bg-gold-400 py-2.5 text-sm font-semibold text-cinema-950 hover:bg-gold-500"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </header>
  )
}

export default Navbar
