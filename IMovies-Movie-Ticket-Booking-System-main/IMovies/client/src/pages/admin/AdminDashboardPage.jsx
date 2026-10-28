import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/client'
import DemoBanner from '../../components/ui/DemoBanner'
import PageHeader from '../../components/ui/PageHeader'
import { formatShowDate } from '../../data/sampleData'

function formatUptime(seconds) {
  if (!seconds || seconds <= 0) return '0s'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${m}m ${s}s`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

function AdminDashboardPage() {
  const [metrics, setMetrics] = useState({
    moviesCount: 0,
    theatresCount: 0,
    showsCount: 0,
    activeShowsCount: 0,
    bookingsCount: 0,
    cancelledBookingsCount: 0,
    totalRevenue: 0,
    isDemoRevenue: true,
    recentBookings: [],
    serverUptimeSeconds: 0,
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [lastUpdated, setLastUpdated] = useState(null)

  async function refreshMetrics() {
    try {
      setRefreshing(true)
      setError('')

      const res = await api.get('/admin/metrics')
      if (res.data?.metrics) {
        setMetrics(res.data.metrics)
        setLastUpdated(new Date().toLocaleTimeString())
      }
    } catch (err) {
      console.error('Failed to fetch admin metrics from database:', err)
      const msg = err.response?.data?.message || err.message || 'Could not connect to backend database'
      setError(`Failed to fetch database metrics: ${msg}`)
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    let isMounted = true

    async function loadInitialMetrics() {
      try {
        const res = await api.get('/admin/metrics')
        if (isMounted && res.data?.metrics) {
          setMetrics(res.data.metrics)
          setLastUpdated(new Date().toLocaleTimeString())
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to fetch admin metrics:', err)
          const msg = err.response?.data?.message || err.message || 'Could not connect to backend database'
          setError(`Failed to fetch database metrics: ${msg}`)
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadInitialMetrics()
    return () => {
      isMounted = false
    }
  }, [])

  const stats = [
    {
      label: 'Movies in Catalogue',
      value: metrics.moviesCount,
      to: '/admin/movies',
      icon: '🎬',
      description: 'Persistent database titles',
      subtext: 'Manage catalogue',
    },
    {
      label: 'Partner Theatres',
      value: metrics.theatresCount,
      to: '/admin/theatres',
      icon: '🏛️',
      description: 'Active cinema locations',
      subtext: 'Manage venues & screens',
    },
    {
      label: 'Scheduled Screenings',
      value: metrics.showsCount,
      to: '/admin/theatres',
      icon: '🕒',
      description: `${metrics.activeShowsCount || 0} active upcoming shows`,
      subtext: 'Manage showtimes',
    },
    {
      label: 'Confirmed Bookings',
      value: metrics.bookingsCount,
      to: '/bookings',
      icon: '🎟️',
      description: `${metrics.cancelledBookingsCount || 0} cancelled reservations`,
      subtext: 'Customer reservations',
    },
    {
      label: 'Gross Ticket Revenue',
      value: `₹${(metrics.totalRevenue || 0).toLocaleString('en-IN')}`,
      to: '/admin',
      icon: '💰',
      description: 'Calculated simulation sum',
      subtext: 'Demo Simulator Metric',
      isRevenue: true,
    },
  ]

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Admin Suite"
        title="Admin Control Center"
        description="Monitor system metrics, manage movie listings and cinema schedules, and audit customer reservations with real database records."
        actions={
          <button
            onClick={refreshMetrics}
            disabled={loading || refreshing}
            className="flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-semibold text-zinc-200 shadow hover:border-gold-400 hover:text-gold-400 transition cursor-pointer disabled:opacity-50"
          >
            <span className={refreshing ? 'animate-spin inline-block' : ''}>🔄</span>
            {refreshing ? 'Refreshing...' : 'Refresh Metrics'}
          </button>
        }
      />

      <DemoBanner>
        Administrator Authorization Active: All dashboard metrics and operations query the live backend database in real time.
        {metrics.isDemoRevenue
          ? ' Note: Gross revenue and transaction sums are calculated metrics generated through the educational Demo Payment Simulator and do not represent actual financial transactions.'
          : ''}
      </DemoBanner>

      {error ? (
        <div className="flex items-center justify-between rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-300">
          <span>⚠️ {error}</span>
          <button
            onClick={() => setError('')}
            className="font-bold text-zinc-400 hover:text-white cursor-pointer ml-3"
          >
            ✕
          </button>
        </div>
      ) : null}

      {/* Real-time Connection Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-cinema-900/60 px-5 py-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
          <span className="font-semibold text-zinc-300">Live Database Connected</span>
          <span className="text-zinc-600">|</span>
          <span className="text-zinc-400">Server Uptime: <strong className="text-zinc-200">{formatUptime(metrics.serverUptimeSeconds)}</strong></span>
        </div>
        {lastUpdated ? (
          <span className="text-zinc-500 text-[11px]">Last synced: {lastUpdated}</span>
        ) : null}
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            to={stat.to}
            className={`group rounded-3xl border p-5 shadow-lg transition hover:-translate-y-1 ${
              stat.isRevenue
                ? 'border-gold-400/50 bg-cinema-900/95 hover:border-gold-400'
                : 'border-zinc-800 bg-cinema-900/90 hover:border-gold-400/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-2xl">{stat.icon}</span>
              <span className="text-xs font-semibold text-gold-400 opacity-0 transition group-hover:opacity-100">
                View →
              </span>
            </div>
            <p
              className={`mt-4 font-display font-bold ${
                stat.isRevenue ? 'text-3xl text-gold-400' : 'text-4xl text-white'
              }`}
            >
              {loading ? (
                <span className="inline-block h-8 w-16 animate-pulse rounded bg-zinc-800" />
              ) : (
                stat.value
              )}
            </p>
            <p className="mt-1 text-sm font-semibold text-zinc-300">{stat.label}</p>
            <p className="mt-1 text-xs text-zinc-500">{stat.description}</p>
            {stat.subtext ? (
              <span className="mt-2 inline-block rounded bg-zinc-800/80 px-2 py-0.5 text-[10px] font-medium text-gold-400/90">
                {stat.subtext}
              </span>
            ) : null}
          </Link>
        ))}
      </div>

      {/* Recent Reservations Audit Table */}
      <div className="rounded-3xl border border-zinc-800 bg-cinema-900/90 p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="text-lg font-bold text-white">Recent Database Reservations</h3>
            <p className="text-xs text-zinc-400">
              Live audit stream of customer booking activity queried directly from backend storage.
            </p>
          </div>
          <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-400 self-start sm:self-auto">
            ● Real Database Records
          </span>
        </div>

        {loading ? (
          <div className="space-y-2 py-6">
            <div className="h-10 animate-pulse rounded-xl bg-zinc-800" />
            <div className="h-10 animate-pulse rounded-xl bg-zinc-800" />
            <div className="h-10 animate-pulse rounded-xl bg-zinc-800" />
          </div>
        ) : metrics.recentBookings && metrics.recentBookings.length > 0 ? (
          <div className="overflow-x-auto rounded-2xl border border-zinc-800">
            <table className="min-w-full text-left text-xs">
              <thead className="border-b border-zinc-800 bg-cinema-950 text-zinc-400 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 font-bold">Reference</th>
                  <th className="px-4 py-3 font-bold">Customer ID</th>
                  <th className="px-4 py-3 font-bold">Movie</th>
                  <th className="px-4 py-3 font-bold">Screening</th>
                  <th className="px-4 py-3 font-bold">Seats</th>
                  <th className="px-4 py-3 font-bold">Amount</th>
                  <th className="px-4 py-3 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/70">
                {metrics.recentBookings.map((b) => (
                  <tr key={b.id} className="transition hover:bg-zinc-850/50">
                    <td className="px-4 py-3 font-mono font-bold text-gold-400">{b.id}</td>
                    <td className="px-4 py-3 text-zinc-400 font-mono text-[11px]">{b.userId}</td>
                    <td className="px-4 py-3 font-semibold text-white">{b.movieTitle || b.movieId}</td>
                    <td className="px-4 py-3 text-zinc-400">
                      {b.theatreName || b.theatreId} · {formatShowDate(b.date)} {b.time}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-zinc-200">
                        {Array.isArray(b.seats) ? b.seats.join(', ') : b.seats}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-white">₹{b.amount}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                          b.status === 'confirmed'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {b.status?.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-zinc-800 p-8 text-center text-xs text-zinc-500">
            No customer bookings recorded in database yet. New reservations will appear here in real time.
          </div>
        )}
      </div>

      {/* Quick Actions & System Architecture */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Admin Actions */}
        <div className="rounded-3xl border border-zinc-800 bg-cinema-900/90 p-6 shadow-xl">
          <h3 className="text-lg font-bold text-white">Quick Management Actions</h3>
          <p className="mt-1 text-xs text-zinc-400">
            Direct shortcuts to execute cinema administrative operations.
          </p>

          <div className="mt-5 space-y-3">
            <Link
              to="/admin/movies"
              className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-cinema-950 p-4 transition hover:border-gold-400 hover:bg-zinc-900"
            >
              <div>
                <p className="text-sm font-bold text-white">Movie Management</p>
                <p className="text-xs text-zinc-400">Create, edit, or remove titles from the catalogue</p>
              </div>
              <span className="rounded-lg bg-zinc-800 px-3 py-1 text-xs font-bold text-gold-400">
                Open →
              </span>
            </Link>

            <Link
              to="/admin/theatres"
              className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-cinema-950 p-4 transition hover:border-gold-400 hover:bg-zinc-900"
            >
              <div>
                <p className="text-sm font-bold text-white">Theatres & Showtimes</p>
                <p className="text-xs text-zinc-400">Configure screens, seating capacity, and schedule showtimes</p>
              </div>
              <span className="rounded-lg bg-zinc-800 px-3 py-1 text-xs font-bold text-gold-400">
                Open →
              </span>
            </Link>

            <Link
              to="/movies"
              className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-cinema-950 p-4 transition hover:border-gold-400 hover:bg-zinc-900"
            >
              <div>
                <p className="text-sm font-bold text-white">Public Movie Catalogue</p>
                <p className="text-xs text-zinc-400">Inspect consumer-facing catalogue presentation</p>
              </div>
              <span className="rounded-lg bg-zinc-800 px-3 py-1 text-xs font-bold text-gold-400">
                Open →
              </span>
            </Link>
          </div>
        </div>

        {/* Project Architecture Overview */}
        <div className="rounded-3xl border border-zinc-800 bg-cinema-900/90 p-6 shadow-xl space-y-4">
          <h3 className="text-lg font-bold text-white">Project Architecture Overview</h3>
          <p className="text-xs text-zinc-400">
            Live technical verification of the MERN stack application components.
          </p>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between rounded-xl bg-zinc-950 p-3 border border-zinc-800">
              <span className="text-zinc-300 font-medium">Frontend Client</span>
              <span className="font-bold text-emerald-400">React 19 + Vite (Active)</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-zinc-950 p-3 border border-zinc-800">
              <span className="text-zinc-300 font-medium">Routing & Security</span>
              <span className="font-bold text-emerald-400">React Router v7 + Role Guard (Active)</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-zinc-950 p-3 border border-zinc-800">
              <span className="text-zinc-300 font-medium">Styling & UI Theme</span>
              <span className="font-bold text-emerald-400">Tailwind CSS v4 (Cinematic Dark)</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-zinc-950 p-3 border border-zinc-800">
              <span className="text-zinc-300 font-medium">Backend REST API</span>
              <span className="font-bold text-emerald-400">Express 5 + Role JWT Auth (Running)</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-zinc-950 p-3 border border-zinc-800">
              <span className="text-zinc-300 font-medium">Database Persistence</span>
              <span className="font-bold text-emerald-400">MongoDB + Atomic JSON Fallback (Active)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboardPage
