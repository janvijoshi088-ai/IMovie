import assert from 'node:assert/strict'
import test from 'node:test'
import { initCinemaStore } from '../src/db/cinemaStore.js'
import { initDatabase } from '../src/db/userStore.js'
import app from '../src/index.js'

let server
let baseUrl

test.before(async () => {
  await initDatabase()
  await initCinemaStore()

  server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s))
  })
  const port = server.address().port
  baseUrl = `http://127.0.0.1:${port}`
})

test.after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve))
  }
})

test('Final Comprehensive Verification: Complete User & Admin Flow', async (t) => {
  let customerToken = ''
  let customerUser = null
  let selectedMovie = null
  let selectedShow = null
  let bookingId = ''
  let bookingRef = ''
  let adminToken = ''

  // 1. Health & Server Startup Check
  await t.test('Step 1: Backend startup & health check responds', async () => {
    const res = await fetch(`${baseUrl}/api/health`)
    assert.equal(res.status, 200)
    const data = await res.json()
    assert.equal(data.status, 'ok')
    assert.match(data.message, /running/i)
  })

  // 2. Browse and Search Movies
  await t.test('Step 2: Browse catalogue, search movies, and filter by genre', async () => {
    // Catalogue list
    const listRes = await fetch(`${baseUrl}/api/movies`)
    assert.equal(listRes.status, 200)
    const listData = await listRes.json()
    assert.ok(Array.isArray(listData.movies))
    assert.ok(listData.movies.length >= 10, 'Catalogue must have seeded movies')

    // Search by title
    const searchRes = await fetch(`${baseUrl}/api/movies?q=Oppenheimer`)
    assert.equal(searchRes.status, 200)
    const searchData = await searchRes.json()
    assert.ok(searchData.movies.some((m) => m.title.toLowerCase().includes('oppenheimer')))

    // Filter by genre
    const genreRes = await fetch(`${baseUrl}/api/movies?genre=Sci-Fi`)
    assert.equal(genreRes.status, 200)
    const genreData = await genreRes.json()
    assert.ok(genreData.movies.every((m) => m.genres.includes('Sci-Fi')))
  })

  // 3. Open Movie Details
  await t.test('Step 3: Retrieve complete movie details', async () => {
    const res = await fetch(`${baseUrl}/api/movies/oppenheimer`)
    assert.equal(res.status, 200)
    const data = await res.json()
    assert.equal(data.movie.id, 'oppenheimer')
    assert.equal(data.movie.title, 'Oppenheimer')
    assert.ok(data.movie.synopsis)
    assert.ok(data.movie.director)
    assert.ok(Array.isArray(data.movie.cast))
    assert.ok(data.movie.rating)
    assert.ok(data.movie.poster)
    selectedMovie = data.movie
  })

  // 4. Select Showtime
  await t.test('Step 4: Retrieve showtimes associated with movie with theatre info', async () => {
    const res = await fetch(`${baseUrl}/api/shows/movie/${selectedMovie.id}`)
    assert.equal(res.status, 200)
    const shows = await res.json()
    assert.ok(Array.isArray(shows))
    assert.ok(shows.length > 0, 'Movie must have available showtimes')
    selectedShow = shows[0]
    assert.ok(selectedShow.theatre, 'Show must be enriched with theatre information')
    assert.ok(selectedShow.price > 0, 'Show must have ticket price')
    assert.ok(selectedShow.time, 'Show must have time')
    assert.ok(selectedShow.date, 'Show must have date')
  })

  // 5. Select Available Seats & Validation
  let seatsToBook = []
  await t.test('Step 5: Inspect seating layout and validate seat selection', async () => {
    const res = await fetch(`${baseUrl}/api/shows/${selectedShow.id}`)
    assert.equal(res.status, 200)
    const showDetails = await res.json()
    assert.ok(Array.isArray(showDetails.seatRows))
    assert.ok(typeof showDetails.seatsPerRow === 'number')

    const booked = new Set(showDetails.bookedSeats || [])
    for (const r of showDetails.seatRows) {
      for (let n = 1; n <= showDetails.seatsPerRow; n++) {
        const seatId = `${r}${n}`
        if (!booked.has(seatId)) {
          seatsToBook.push(seatId)
          if (seatsToBook.length === 2) break
        }
      }
      if (seatsToBook.length === 2) break
    }
    assert.equal(seatsToBook.length, 2, 'Show should have at least 2 available seats')

    // Validate choosing seats
    const valRes = await fetch(`${baseUrl}/api/shows/${selectedShow.id}/validate-seats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seats: seatsToBook }),
    })
    assert.equal(valRes.status, 200)
    const valData = await valRes.json()
    assert.equal(valData.valid, true)
    assert.equal(valData.seats.length, 2)
    assert.equal(valData.baseAmount, selectedShow.price * 2)
    assert.equal(valData.totalAmount, selectedShow.price * 2 + 30) // 30 convenience fee
  })

  // 6. Register & Log In
  await t.test('Step 6: Customer registration and JWT authentication', async () => {
    const email = `final_customer_${Date.now()}@example.com`
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Final Verification User',
        email,
        password: 'UserPass@123',
        phone: '9876543210',
      }),
    })
    assert.equal(regRes.status, 201)
    const regData = await regRes.json()
    assert.ok(regData.token)
    assert.equal(regData.user.role, 'customer')
    customerToken = regData.token
    customerUser = regData.user

    // Verify session
    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    })
    assert.equal(meRes.status, 200)
    const meData = await meRes.json()
    assert.equal(meData.user.email, email)
  })

  // 7. Complete Booking with Demo Simulator
  await t.test('Step 7: Complete booking through server atomic reservation & demo simulator', async () => {
    const bookRes = await fetch(`${baseUrl}/api/shows/${selectedShow.id}/book`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        seats: seatsToBook,
        movieId: selectedMovie.id,
        theatreId: selectedShow.theatreId,
        movieTitle: selectedMovie.title,
        paymentMethod: 'demo_simulator',
      }),
    })
    assert.equal(bookRes.status, 201)
    const bookData = await bookRes.json()
    assert.equal(bookData.booking.status, 'confirmed')
    assert.equal(bookData.booking.paymentStatus, 'paid_demo')
    assert.deepEqual(bookData.booking.seats, seatsToBook)
    assert.ok(bookData.booking.id)
    bookingId = bookData.booking.id
    bookingRef = bookData.booking.id
  })

  // 8. View Booking Confirmation
  await t.test('Step 8: Retrieve persistent booking confirmation from backend', async () => {
    const res = await fetch(`${baseUrl}/api/bookings/${bookingId}`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    })
    assert.equal(res.status, 200)
    const data = await res.json()
    assert.equal(data.status, 'success')
    assert.equal(data.booking.id, bookingId)
    assert.equal(data.booking.movieTitle, selectedMovie.title)
    assert.deepEqual(data.booking.seats, seatsToBook)
    assert.equal(data.booking.status, 'confirmed')
  })

  // 9. View My Bookings
  await t.test('Step 9: Customer retrieves personal booking history', async () => {
    const res = await fetch(`${baseUrl}/api/bookings`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    })
    assert.equal(res.status, 200)
    const data = await res.json()
    assert.ok(Array.isArray(data.bookings))
    const found = data.bookings.find((b) => b.id === bookingId)
    assert.ok(found, 'Created booking must be present in My Bookings')
    assert.equal(found.status, 'confirmed')
  })

  // 10. Cancel Booking & Seat Release
  await t.test('Step 10: Cancel booking and confirm seat release', async () => {
    const cancelRes = await fetch(`${baseUrl}/api/bookings/${bookingId}/cancel`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` },
    })
    assert.equal(cancelRes.status, 200)
    const cancelData = await cancelRes.json()
    assert.equal(cancelData.booking.status, 'cancelled')

    // Verify booked seats are no longer in bookedSeats of the show
    const showRes = await fetch(`${baseUrl}/api/shows/${selectedShow.id}`)
    const showData = await showRes.json()
    for (const s of seatsToBook) {
      assert.ok(!showData.bookedSeats.includes(s))
    }
  })

  // 11. Log Out (Client token discarded)
  await t.test('Step 11: Unauthenticated request rejected after token discarded', async () => {
    const res = await fetch(`${baseUrl}/api/bookings`, {
      headers: { Authorization: 'Bearer invalid_or_expired_token' },
    })
    assert.equal(res.status, 401)
  })

  // 12. Log in as Authorized Administrator
  await t.test('Step 12: Admin login with seeded credentials and token acquisition', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@imovies.com',
        password: 'Admin@123456',
      }),
    })
    assert.equal(res.status, 200)
    const data = await res.json()
    assert.equal(data.user.role, 'admin')
    assert.ok(data.token)
    adminToken = data.token
  })

  // 13. Admin Management: Movies, Theatres, Shows
  await t.test('Step 13: Admin manages movies, theatres, and shows', async () => {
    // Create Movie
    const createMovieRes = await fetch(`${baseUrl}/api/movies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: 'Final Test Blockbuster',
        year: 2026,
        rating: 9.0,
        genres: ['Action', 'Sci-Fi'],
        poster: '/posters/interstellar.jpg',
      }),
    })
    assert.equal(createMovieRes.status, 201)
    const movieData = await createMovieRes.json()
    const testMovieId = movieData.movie.id

    // Create Theatre
    const createTheatreRes = await fetch(`${baseUrl}/api/theatres`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Final Test Multiplex',
        city: 'Mumbai',
        screens: ['Screen 1', 'Screen 2'],
      }),
    })
    assert.equal(createTheatreRes.status, 201)
    const theatreData = await createTheatreRes.json()
    const testTheatreId = theatreData.theatre.id

    // Create Show
    const createShowRes = await fetch(`${baseUrl}/api/shows`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        movieId: testMovieId,
        theatreId: testTheatreId,
        screen: 'Screen 1',
        date: '2026-11-25',
        time: '6:00 PM',
        price: 300,
      }),
    })
    assert.equal(createShowRes.status, 201)
    const showData = await createShowRes.json()
    const testShowId = showData.show.id

    // Unsafe Deletion Prevention: Attempt deleting theatre while show is active
    const failDelTheatre = await fetch(`${baseUrl}/api/theatres/${testTheatreId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    })
    assert.equal(failDelTheatre.status, 400, 'Must block theatre deletion when active shows exist')

    // Clean up in proper order
    await fetch(`${baseUrl}/api/shows/${testShowId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    })
    await fetch(`${baseUrl}/api/theatres/${testTheatreId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    })
    await fetch(`${baseUrl}/api/movies/${testMovieId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    })
  })

  // 14. Admin Dashboard Metrics Verification
  await t.test('Step 14: Admin dashboard metrics check with database audit', async () => {
    const res = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    })
    assert.equal(res.status, 200)
    const data = await res.json()
    assert.equal(data.status, 'success')
    assert.equal(data.accessLevel, 'admin')
    assert.ok(data.metrics.moviesCount > 0)
    assert.ok(data.metrics.theatresCount > 0)
    assert.ok(data.metrics.showsCount > 0)
    assert.equal(data.metrics.isDemoRevenue, true)
    assert.ok(Array.isArray(data.metrics.recentBookings))
  })
})
