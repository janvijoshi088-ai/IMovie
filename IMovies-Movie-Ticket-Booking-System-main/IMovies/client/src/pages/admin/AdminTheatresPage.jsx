import { useEffect, useMemo, useState } from 'react'
import api from '../../api/client'
import DemoBanner from '../../components/ui/DemoBanner'
import PageHeader from '../../components/ui/PageHeader'
import { formatShowDate } from '../../data/sampleData'

function AdminTheatresPage() {
  const [theatres, setTheatres] = useState([])
  const [shows, setShows] = useState([])
  const [moviesList, setMoviesList] = useState([])
  const [activeTab, setActiveTab] = useState('theatres') // 'theatres' | 'shows'
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState('')
  const [noticeType, setNoticeType] = useState('info') // 'info' | 'error' | 'success'
  const [submitting, setSubmitting] = useState(false)

  // Filters
  const [theatreFilter, setTheatreFilter] = useState('')
  const [showFilter, setShowFilter] = useState('')

  // Add Theatre Form
  const [theatreName, setTheatreName] = useState('')
  const [theatreCity, setTheatreCity] = useState('Pune')
  const [theatreAddress, setTheatreAddress] = useState('')
  const [theatreScreen, setTheatreScreen] = useState('Audi 1, Audi 2, IMAX')
  const [theatreCapacity, setTheatreCapacity] = useState('96')

  // Edit Theatre Modal
  const [editingTheatre, setEditingTheatre] = useState(null)
  const [editTheatreName, setEditTheatreName] = useState('')
  const [editTheatreCity, setEditTheatreCity] = useState('')
  const [editTheatreAddress, setEditTheatreAddress] = useState('')
  const [editTheatreScreen, setEditTheatreScreen] = useState('')
  const [editTheatreCapacity, setEditTheatreCapacity] = useState('96')

  // Add Showtime Form
  const [selectedMovieId, setSelectedMovieId] = useState('')
  const [selectedTheatreId, setSelectedTheatreId] = useState('')
  const [showDate, setShowDate] = useState(() => new Date().toISOString().split('T')[0])
  const [showTime, setShowTime] = useState('7:00 PM')
  const [showScreen, setShowScreen] = useState('Screen 1')
  const [showFormat, setShowFormat] = useState('2D')
  const [showPrice, setShowPrice] = useState('250')
  const [showSeatsPerRow, setShowSeatsPerRow] = useState('12')
  const [showMaxSeats, setShowMaxSeats] = useState('6')

  // Edit Showtime Modal
  const [editingShow, setEditingShow] = useState(null)
  const [editMovieId, setEditMovieId] = useState('')
  const [editTheatreId, setEditTheatreId] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editTime, setEditTime] = useState('')
  const [editScreen, setEditScreen] = useState('')
  const [editFormat, setEditFormat] = useState('')
  const [editPrice, setEditPrice] = useState('')
  const [editSeatsPerRow, setEditSeatsPerRow] = useState('12')
  const [editMaxSeats, setEditMaxSeats] = useState('6')

  // Fetch initial data strictly from backend database
  useEffect(() => {
    let isMounted = true

    async function loadInitialData() {
      try {
        const [theatresRes, showsRes, moviesRes] = await Promise.all([
          api.get('/theatres'),
          api.get('/shows'),
          api.get('/movies'),
        ])

        if (isMounted) {
          const loadedTheatres = Array.isArray(theatresRes.data) ? theatresRes.data : []
          const loadedShows = Array.isArray(showsRes.data) ? showsRes.data : []
          const loadedMovies = Array.isArray(moviesRes.data?.movies)
            ? moviesRes.data.movies
            : Array.isArray(moviesRes.data)
              ? moviesRes.data
              : []

          setTheatres(loadedTheatres)
          setShows(loadedShows)
          setMoviesList(loadedMovies)

          if (loadedMovies.length > 0) setSelectedMovieId(loadedMovies[0].id)
          if (loadedTheatres.length > 0) setSelectedTheatreId(loadedTheatres[0].id)
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to load theatres and shows from backend database:', err)
          const msg = err.response?.data?.message || err.message || 'Database connection error'
          setNotice(`Database Load Error: ${msg}`)
          setNoticeType('error')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadInitialData()
    return () => {
      isMounted = false
    }
  }, [])

  function startEditTheatre(t) {
    setEditingTheatre(t)
    setEditTheatreName(t.name || '')
    setEditTheatreCity(t.city || '')
    setEditTheatreAddress(t.address || '')
    setEditTheatreScreen(Array.isArray(t.screens) ? t.screens.join(', ') : t.screens || '')
    setEditTheatreCapacity(String(t.seatingCapacity || 96))
  }

  function startEditShow(s) {
    setEditingShow(s)
    setEditMovieId(s.movieId || '')
    setEditTheatreId(s.theatreId || '')
    setEditDate(s.date || '')
    setEditTime(s.time || '')
    setEditScreen(s.screen || '')
    setEditFormat(s.format || '2D')
    setEditPrice(String(s.price || 200))
    setEditSeatsPerRow(String(s.seatsPerRow || 12))
    setEditMaxSeats(String(s.maxSeatsPerBooking || 6))
  }

  async function handleAddTheatre(event) {
    event.preventDefault()
    if (!theatreName.trim()) {
      setNotice('Please enter a cinema theatre name.')
      setNoticeType('error')
      return
    }
    if (!theatreCity.trim()) {
      setNotice('Please enter a city for this cinema location.')
      setNoticeType('error')
      return
    }

    const cap = Number(theatreCapacity)
    if (isNaN(cap) || cap <= 0) {
      setNotice('Seating capacity must be a positive integer greater than 0.')
      setNoticeType('error')
      return
    }

    setSubmitting(true)
    const payload = {
      name: theatreName.trim(),
      city: theatreCity.trim(),
      address: theatreAddress.trim() || 'Central Plaza',
      screens: theatreScreen.split(',').map((s) => s.trim()).filter(Boolean),
      seatingCapacity: cap,
      amenities: ['Dolby Atmos', '4K Projection', 'Food Court'],
    }

    try {
      const res = await api.post('/theatres', payload)
      const created = res.data.theatre || payload
      setTheatres((current) => [created, ...current])
      setTheatreName('')
      setTheatreAddress('')
      setTheatreCapacity('96')
      setNotice(`Theatre "${created.name}" created and saved to database!`)
      setNoticeType('success')
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to add theatre'
      setNotice(`Creation Error: ${msg}`)
      setNoticeType('error')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleUpdateTheatre(event) {
    event.preventDefault()
    if (!editingTheatre) return

    if (!editTheatreName.trim()) {
      setNotice('Theatre name cannot be empty.')
      setNoticeType('error')
      return
    }

    const cap = Number(editTheatreCapacity)
    if (isNaN(cap) || cap <= 0) {
      setNotice('Seating capacity must be a positive integer greater than 0.')
      setNoticeType('error')
      return
    }

    setSubmitting(true)
    const payload = {
      name: editTheatreName.trim(),
      city: editTheatreCity.trim(),
      address: editTheatreAddress.trim(),
      screens: editTheatreScreen.split(',').map((s) => s.trim()).filter(Boolean),
      seatingCapacity: cap,
    }

    try {
      const res = await api.put(`/theatres/${editingTheatre.id}`, payload)
      const updated = res.data.theatre

      setTheatres((current) => current.map((t) => (t.id === editingTheatre.id ? updated : t)))
      setEditingTheatre(null)
      setNotice(`Theatre "${updated.name}" updated successfully in database!`)
      setNoticeType('success')
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to update theatre'
      setNotice(`Update Error: ${msg}`)
      setNoticeType('error')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRemoveTheatre(id, name) {
    if (!window.confirm(`Are you sure you want to delete theatre "${name}"?`)) {
      return
    }

    try {
      await api.delete(`/theatres/${id}`)
      setTheatres((current) => current.filter((t) => t.id !== id))
      setNotice(`Removed theatre "${name}" from database.`)
      setNoticeType('info')
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Cannot delete theatre'
      setNotice(`Unsafe Deletion Blocked: ${msg}`)
      setNoticeType('error')
    }
  }

  async function handleAddShow(event) {
    event.preventDefault()

    if (!selectedMovieId) {
      setNotice('Please select a valid movie for this show.')
      setNoticeType('error')
      return
    }

    if (!selectedTheatreId) {
      setNotice('Please select a valid theatre for this show.')
      setNoticeType('error')
      return
    }

    if (!showDate || showDate < todayStr) {
      setNotice('Show date must be today or a future date.')
      setNoticeType('error')
      return
    }

    const priceNum = Number(showPrice)
    if (isNaN(priceNum) || priceNum <= 0) {
      setNotice('Ticket price must be a positive number greater than 0.')
      setNoticeType('error')
      return
    }

    const spr = Number(showSeatsPerRow)
    if (isNaN(spr) || spr <= 0 || spr > 30) {
      setNotice('Seats per row must be between 1 and 30.')
      setNoticeType('error')
      return
    }

    const ms = Number(showMaxSeats)
    if (isNaN(ms) || ms <= 0 || ms > 20) {
      setNotice('Max seats per reservation must be between 1 and 20.')
      setNoticeType('error')
      return
    }

    setSubmitting(true)
    const payload = {
      movieId: selectedMovieId,
      theatreId: selectedTheatreId,
      screen: showScreen.trim() || 'Screen 1',
      date: showDate,
      time: showTime.trim() || '7:00 PM',
      price: priceNum,
      format: showFormat || '2D',
      language: 'English',
      seatsPerRow: spr,
      maxSeatsPerBooking: ms,
      bookedSeats: [],
    }

    try {
      const res = await api.post('/shows', payload)
      const created = res.data.show || payload
      setShows((current) => [created, ...current])

      const movieObj = moviesList.find((m) => m.id === selectedMovieId)
      setNotice(`Show for "${movieObj?.title || selectedMovieId}" on ${created.date} at ${created.time} scheduled and saved!`)
      setNoticeType('success')
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to schedule show'
      setNotice(`Schedule Error: ${msg}`)
      setNoticeType('error')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleUpdateShow(event) {
    event.preventDefault()
    if (!editingShow) return

    const priceNum = Number(editPrice)
    if (isNaN(priceNum) || priceNum <= 0) {
      setNotice('Ticket price must be a positive number.')
      setNoticeType('error')
      return
    }

    const spr = Number(editSeatsPerRow)
    if (isNaN(spr) || spr <= 0 || spr > 30) {
      setNotice('Seats per row must be between 1 and 30.')
      setNoticeType('error')
      return
    }

    setSubmitting(true)
    const payload = {
      movieId: editMovieId,
      theatreId: editTheatreId,
      screen: editScreen.trim(),
      date: editDate,
      time: editTime.trim(),
      format: editFormat,
      price: priceNum,
      seatsPerRow: spr,
      maxSeatsPerBooking: Number(editMaxSeats) || 6,
    }

    try {
      const res = await api.put(`/shows/${editingShow.id}`, payload)
      const updated = res.data.show

      setShows((current) => current.map((s) => (s.id === editingShow.id ? updated : s)))
      setEditingShow(null)
      setNotice(`Showtime updated successfully in database!`)
      setNoticeType('success')
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to update showtime'
      setNotice(`Update Error: ${msg}`)
      setNoticeType('error')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRemoveShow(id) {
    if (!window.confirm('Are you sure you want to delete this showtime?')) {
      return
    }

    try {
      await api.delete(`/shows/${id}`)
      setShows((current) => current.filter((s) => s.id !== id))
      setNotice('Showtime cancelled and deleted from database.')
      setNoticeType('info')
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Cannot delete showtime'
      setNotice(`Unsafe Deletion Blocked: ${msg}`)
      setNoticeType('error')
    }
  }

  const filteredTheatres = useMemo(() => {
    const q = theatreFilter.toLowerCase().trim()
    if (!q) return theatres
    return theatres.filter(
      (t) => t.name.toLowerCase().includes(q) || t.city.toLowerCase().includes(q),
    )
  }, [theatres, theatreFilter])

  const filteredShows = useMemo(() => {
    const q = showFilter.toLowerCase().trim()
    if (!q) return shows
    return shows.filter((s) => {
      const m = moviesList.find((m) => m.id === s.movieId)
      const t = theatres.find((t) => t.id === s.theatreId)
      return (
        s.movieId.toLowerCase().includes(q) ||
        (m && m.title.toLowerCase().includes(q)) ||
        (t && t.name.toLowerCase().includes(q)) ||
        s.screen.toLowerCase().includes(q) ||
        s.date.includes(q)
      )
    })
  }, [shows, showFilter, moviesList, theatres])

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin Suite"
        title="Theatres & Showtimes"
        description="Add cinema locations, configure screens and seating capacity, and schedule showtimes with persistent database storage."
      />

      <DemoBanner>
        Administrator Role Verified: Theatres and scheduled showtimes persist directly in the backend store with schedule conflict prevention, seating capacity validation, and safe deletion guards.
      </DemoBanner>

      {notice ? (
        <div
          className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-xs ${
            noticeType === 'error'
              ? 'border-red-500/30 bg-red-500/10 text-red-200'
              : noticeType === 'success'
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                : 'border-gold-400/30 bg-gold-400/10 text-amber-200'
          }`}
        >
          <span>{notice}</span>
          <button
            onClick={() => setNotice('')}
            className="font-bold text-zinc-400 hover:text-white cursor-pointer ml-3"
          >
            ✕
          </button>
        </div>
      ) : null}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-zinc-800 pb-3">
        <button
          onClick={() => setActiveTab('theatres')}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
            activeTab === 'theatres'
              ? 'bg-gold-400 text-cinema-950 shadow-md'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Manage Theatres ({theatres.length})
        </button>
        <button
          onClick={() => setActiveTab('shows')}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
            activeTab === 'shows'
              ? 'bg-gold-400 text-cinema-950 shadow-md'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Manage Showtimes ({shows.length})
        </button>
      </div>

      {activeTab === 'theatres' ? (
        <div className="space-y-6">
          {/* Add Theatre Form */}
          <form
            onSubmit={handleAddTheatre}
            className="rounded-3xl border border-zinc-800 bg-cinema-900/90 p-6 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <h3 className="font-bold text-white text-sm">Add New Cinema Location to Database</h3>
              <span className="text-xs text-emerald-400 font-semibold">● Database Synced</span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Cinema Name *
                </label>
                <input
                  value={theatreName}
                  onChange={(e) => setTheatreName(e.target.value)}
                  placeholder="e.g. Wave Cinemas"
                  className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-gold-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                  City *
                </label>
                <input
                  value={theatreCity}
                  onChange={(e) => setTheatreCity(e.target.value)}
                  placeholder="e.g. Mumbai, Pune"
                  className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-gold-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Address
                </label>
                <input
                  value={theatreAddress}
                  onChange={(e) => setTheatreAddress(e.target.value)}
                  placeholder="e.g. Grand Mall, Ring Road"
                  className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-gold-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Screens (comma separated)
                </label>
                <input
                  value={theatreScreen}
                  onChange={(e) => setTheatreScreen(e.target.value)}
                  placeholder="Screen 1, IMAX, Audi 2"
                  className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-gold-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Seating Capacity *
                </label>
                <input
                  type="number"
                  min="1"
                  value={theatreCapacity}
                  onChange={(e) => setTheatreCapacity(e.target.value)}
                  placeholder="96"
                  className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-gold-400"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-full bg-gold-400 px-6 py-2.5 text-xs font-bold text-cinema-950 hover:bg-gold-500 shadow-md cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Saving to Database...' : '+ Add Theatre to Database'}
              </button>
            </div>
          </form>

          {/* Theatre Search */}
          <div className="flex items-center justify-between">
            <input
              value={theatreFilter}
              onChange={(e) => setTheatreFilter(e.target.value)}
              placeholder="Search theatres by name or city..."
              className="w-full max-w-sm rounded-xl border border-zinc-700 bg-cinema-900 px-4 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-gold-400"
            />
            <span className="text-xs text-zinc-400">
              {filteredTheatres.length} of {theatres.length} locations in database
            </span>
          </div>

          {/* Theatres List */}
          {loading ? (
            <div className="py-12 text-center text-xs text-zinc-500">Loading theatres from database...</div>
          ) : filteredTheatres.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-800 p-8 text-center text-xs text-zinc-500">
              No cinema theatres found matching your filter.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredTheatres.map((theatre) => (
                <div
                  key={theatre.id}
                  className="group rounded-3xl border border-zinc-800 bg-cinema-900 p-5 shadow-lg transition hover:border-gold-400/40"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-base font-bold text-white group-hover:text-gold-400 transition">
                        {theatre.name}
                      </h4>
                      <p className="mt-1 text-xs text-zinc-400">📍 {theatre.city} · {theatre.address}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEditTheatre(theatre)}
                        className="rounded-lg border border-gold-400/30 px-2 py-0.5 text-xs text-gold-400 hover:bg-gold-400 hover:text-black cursor-pointer transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleRemoveTheatre(theatre.id, theatre.name)}
                        className="rounded-lg border border-red-500/30 px-2 py-0.5 text-xs text-red-400 hover:bg-red-500/20 cursor-pointer transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-zinc-800/60 pt-2 text-[11px] text-zinc-400">
                    <span>
                      Seats: <strong className="text-gold-400">{theatre.seatingCapacity || 96}</strong> seats
                    </span>
                    <span className="text-zinc-500">ID: {theatre.id}</span>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-1">
                    {(Array.isArray(theatre.screens) ? theatre.screens : [theatre.screens]).map((screen) => (
                      <span key={screen} className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-300">
                        {screen}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Schedule Show Form */}
          <form
            onSubmit={handleAddShow}
            className="rounded-3xl border border-zinc-800 bg-cinema-900/90 p-6 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <h3 className="font-bold text-white text-sm">Schedule a New Showtime (Persisted)</h3>
              <span className="text-xs text-emerald-400 font-semibold">● Conflict Detection Active</span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Select Movie *
                </label>
                <select
                  value={selectedMovieId}
                  onChange={(e) => setSelectedMovieId(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-gold-400"
                  required
                >
                  {moviesList.length === 0 ? (
                    <option value="">No movies available</option>
                  ) : (
                    moviesList.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Select Theatre *
                </label>
                <select
                  value={selectedTheatreId}
                  onChange={(e) => setSelectedTheatreId(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-gold-400"
                  required
                >
                  {theatres.length === 0 ? (
                    <option value="">No theatres available</option>
                  ) : (
                    theatres.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.city})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Date *
                </label>
                <input
                  type="date"
                  min={todayStr}
                  value={showDate}
                  onChange={(e) => setShowDate(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-gold-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Show Time *
                </label>
                <input
                  value={showTime}
                  onChange={(e) => setShowTime(e.target.value)}
                  placeholder="e.g. 7:30 PM"
                  className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-gold-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Screen & Format
                </label>
                <div className="flex gap-2 mt-1.5">
                  <input
                    value={showScreen}
                    onChange={(e) => setShowScreen(e.target.value)}
                    placeholder="Screen 1"
                    className="w-1/2 rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-gold-400"
                  />
                  <input
                    value={showFormat}
                    onChange={(e) => setShowFormat(e.target.value)}
                    placeholder="2D / IMAX"
                    className="w-1/2 rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-gold-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Ticket Price (₹) *
                </label>
                <input
                  type="number"
                  min="1"
                  value={showPrice}
                  onChange={(e) => setShowPrice(e.target.value)}
                  placeholder="250"
                  className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-gold-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Seats Per Row
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={showSeatsPerRow}
                  onChange={(e) => setShowSeatsPerRow(e.target.value)}
                  placeholder="12"
                  className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-gold-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Max Seats / Reservation
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={showMaxSeats}
                  onChange={(e) => setShowMaxSeats(e.target.value)}
                  placeholder="6"
                  className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-gold-400"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-full bg-gold-400 px-6 py-2.5 text-xs font-bold text-cinema-950 hover:bg-gold-500 shadow-md cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Scheduling...' : '+ Schedule Showtime (Database)'}
              </button>
            </div>
          </form>

          {/* Showtimes Filter */}
          <div className="flex items-center justify-between">
            <input
              value={showFilter}
              onChange={(e) => setShowFilter(e.target.value)}
              placeholder="Search showtimes by movie, theatre, or screen..."
              className="w-full max-w-sm rounded-xl border border-zinc-700 bg-cinema-900 px-4 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-gold-400"
            />
            <span className="text-xs text-zinc-400">
              {filteredShows.length} of {shows.length} screenings in database
            </span>
          </div>

          {/* Showtimes Table */}
          <div className="overflow-x-auto rounded-3xl border border-zinc-800 bg-cinema-900 shadow-xl">
            <table className="min-w-full text-left text-xs">
              <thead className="border-b border-zinc-800 bg-cinema-950 text-zinc-400 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5 font-bold">Movie</th>
                  <th className="px-5 py-3.5 font-bold">Theatre</th>
                  <th className="px-5 py-3.5 font-bold">When</th>
                  <th className="px-5 py-3.5 font-bold">Screen & Format</th>
                  <th className="px-5 py-3.5 font-bold">Price</th>
                  <th className="px-5 py-3.5 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-5 py-10 text-center text-zinc-500">
                      Loading scheduled showtimes from database...
                    </td>
                  </tr>
                ) : filteredShows.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-5 py-10 text-center text-zinc-500">
                      No showtimes found in database.
                    </td>
                  </tr>
                ) : (
                  filteredShows.map((show) => {
                    const movie = moviesList.find((m) => m.id === show.movieId)
                    const theatre = theatres.find((t) => t.id === show.theatreId)

                    return (
                      <tr key={show.id} className="transition hover:bg-zinc-850/60">
                        <td className="px-5 py-3 font-bold text-white">
                          {movie?.title || show.movieId}
                        </td>
                        <td className="px-5 py-3 text-zinc-300">
                          {theatre?.name || show.theatreId} {theatre?.city ? `(${theatre.city})` : ''}
                        </td>
                        <td className="px-5 py-3 text-zinc-400">
                          {formatShowDate(show.date)} · <span className="font-semibold text-white">{show.time}</span>
                        </td>
                        <td className="px-5 py-3 text-zinc-400">
                          {show.screen}{' '}
                          <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-gold-400">
                            {show.format}
                          </span>
                        </td>
                        <td className="px-5 py-3 font-semibold text-white">₹{show.price}</td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => startEditShow(show)}
                              className="rounded-lg border border-gold-400/40 bg-gold-400/10 px-2.5 py-1 text-xs font-semibold text-gold-400 hover:bg-gold-400 hover:text-black cursor-pointer transition"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveShow(show.id)}
                              className="rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-300 hover:bg-red-500/20 cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Theatre Modal */}
      {editingTheatre ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-zinc-700 bg-cinema-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-display text-xl font-bold text-white">Edit Cinema Location</h3>
              <button
                onClick={() => setEditingTheatre(null)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateTheatre} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Cinema Name *
                </label>
                <input
                  value={editTheatreName}
                  onChange={(e) => setEditTheatreName(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-sm text-white outline-none focus:border-gold-400"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                    City *
                  </label>
                  <input
                    value={editTheatreCity}
                    onChange={(e) => setEditTheatreCity(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-sm text-white outline-none focus:border-gold-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Seating Capacity *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editTheatreCapacity}
                    onChange={(e) => setEditTheatreCapacity(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-sm text-white outline-none focus:border-gold-400"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Address
                </label>
                <input
                  value={editTheatreAddress}
                  onChange={(e) => setEditTheatreAddress(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-sm text-white outline-none focus:border-gold-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Screens (comma separated)
                </label>
                <input
                  value={editTheatreScreen}
                  onChange={(e) => setEditTheatreScreen(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-sm text-white outline-none focus:border-gold-400"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingTheatre(null)}
                  className="rounded-full border border-zinc-700 px-5 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-full bg-gold-400 px-6 py-2 text-xs font-bold text-cinema-950 hover:bg-gold-500 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Edit Showtime Modal */}
      {editingShow ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-zinc-700 bg-cinema-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-display text-xl font-bold text-white">Edit Scheduled Showtime</h3>
              <button
                onClick={() => setEditingShow(null)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateShow} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Movie
                </label>
                <select
                  value={editMovieId}
                  onChange={(e) => setEditMovieId(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-sm text-white outline-none focus:border-gold-400"
                >
                  {moviesList.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Theatre
                </label>
                <select
                  value={editTheatreId}
                  onChange={(e) => setEditTheatreId(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-sm text-white outline-none focus:border-gold-400"
                >
                  {theatres.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.city})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Date
                  </label>
                  <input
                    type="date"
                    min={todayStr}
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-gold-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Time
                  </label>
                  <input
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-gold-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Screen
                  </label>
                  <input
                    value={editScreen}
                    onChange={(e) => setEditScreen(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-gold-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Format
                  </label>
                  <input
                    value={editFormat}
                    onChange={(e) => setEditFormat(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-gold-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-gold-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Seats / Row
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={editSeatsPerRow}
                    onChange={(e) => setEditSeatsPerRow(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-gold-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Max / Order
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={editMaxSeats}
                    onChange={(e) => setEditMaxSeats(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-gold-400"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingShow(null)}
                  className="rounded-full border border-zinc-700 px-5 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-full bg-gold-400 px-6 py-2 text-xs font-bold text-cinema-950 hover:bg-gold-500 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default AdminTheatresPage
