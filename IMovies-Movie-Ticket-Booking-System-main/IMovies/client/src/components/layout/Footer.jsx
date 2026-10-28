import { Link } from 'react-router-dom'

function Footer() {
  return (
    <footer className="mt-auto border-t border-zinc-800/80 bg-cinema-900/95">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-4">
        {/* Brand Col */}
        <div className="md:col-span-1">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-400 text-cinema-950 font-bold">
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z" />
              </svg>
            </div>
            <span className="font-display text-xl font-bold text-white">
              I<span className="text-gold-400">Movies</span>
            </span>
          </Link>
          <p className="mt-3 text-xs leading-5 text-zinc-400">
            A premium cinematic ticket booking interface built for a college project demonstration.
          </p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-[11px] font-medium text-zinc-300">React 19</span>
            <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-[11px] font-medium text-zinc-300">Tailwind CSS</span>
            <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-[11px] font-medium text-zinc-300">Vite</span>
          </div>
        </div>

        {/* Explore Links */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-200">Explore</p>
          <div className="mt-3 flex flex-col gap-2 text-sm text-zinc-400">
            <Link to="/" className="transition hover:text-gold-400">Home Showcase</Link>
            <Link to="/movies" className="transition hover:text-gold-400">Movie Catalogue</Link>
            <Link to="/movies?genre=Sci-Fi" className="transition hover:text-gold-400">Sci-Fi Blockbusters</Link>
            <Link to="/movies?genre=Action" className="transition hover:text-gold-400">Action Movies</Link>
          </div>
        </div>

        {/* User & Admin */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-200">User & Admin</p>
          <div className="mt-3 flex flex-col gap-2 text-sm text-zinc-400">
            <Link to="/bookings" className="transition hover:text-gold-400">My Bookings History</Link>
            <Link to="/login" className="transition hover:text-gold-400">User Login (Demo)</Link>
            <Link to="/register" className="transition hover:text-gold-400">User Registration</Link>
            <Link to="/admin" className="transition hover:text-gold-400">Admin Dashboard Demo</Link>
            <Link to="/admin/theatres" className="transition hover:text-gold-400">Theatres & Shows</Link>
          </div>
        </div>

        {/* Demo Notice */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-gold-400">Demonstration Scope</p>
          <p className="mt-3 text-xs leading-5 text-zinc-400">
            All movies, theatres, showtimes, and seat reservations run on client sample data. No real payments are processed, no personal passwords or credit cards are collected, and no database writes occur.
          </p>
        </div>
      </div>

      <div className="border-t border-zinc-800/60 bg-cinema-950 py-5">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 text-xs text-zinc-500 sm:flex-row sm:px-6">
          <p>© 2026 IMovies — College Project Demo. All rights reserved.</p>
          <p className="flex items-center gap-3">
            <span>Client: React + Vite</span>
            <span>•</span>
            <span>Server: Express /api/health</span>
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
