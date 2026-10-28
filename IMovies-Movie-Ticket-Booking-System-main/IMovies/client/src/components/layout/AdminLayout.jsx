import { NavLink, Outlet } from 'react-router-dom'
import Footer from './Footer'
import Navbar from './Navbar'

const adminLinks = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/movies', label: 'Movies' },
  { to: '/admin/theatres', label: 'Theatres & shows' },
]

function AdminLayout() {
  return (
    <div className="flex min-h-svh flex-col bg-cinema-950 text-zinc-100">
      <Navbar />
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row">
        <aside className="w-full shrink-0 rounded-2xl border border-zinc-800 bg-cinema-900 p-4 lg:w-56">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-400">
            Admin demo
          </p>
          <nav className="mt-4 flex flex-col gap-1 text-sm">
            {adminLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `rounded-xl px-3 py-2 ${
                    isActive
                      ? 'bg-zinc-800 text-gold-400'
                      : 'text-zinc-300 hover:bg-zinc-900'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <div className="min-w-0 flex-1">
          <Outlet />
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default AdminLayout
