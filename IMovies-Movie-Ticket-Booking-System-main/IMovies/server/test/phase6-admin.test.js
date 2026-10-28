import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { initCinemaStore } from '../src/db/cinemaStore.js'
import { initDatabase } from '../src/db/userStore.js'
import app from '../src/index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dataDir = path.resolve(__dirname, '../data')

let server
let baseUrl
let adminToken = ''
let customerToken = ''
let customerUser = null

test.before(async () => {
  await initDatabase()
  await initCinemaStore()

  server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s))
  })
  const port = server.address().port
  baseUrl = `http://127.0.0.1:${port}`

  // Log in as seeded administrator
  const adminRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@imovies.com',
      password: 'Admin@123456',
    }),
  })
  const adminData = await adminRes.json()
  adminToken = adminData.token
  assert.ok(adminToken, 'Admin token must be acquired')
  assert.equal(adminData.user.role, 'admin')

  // Register a regular customer
  const custRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Phase 6 Test Customer',
      email: `p6_customer_${Date.now()}@test.com`,
      password: 'CustomerPass123!',
      phone: '9876543210',
    }),
  })
  const custData = await custRes.json()
  customerToken = custData.token
  customerUser = custData.user
  assert.ok(customerToken, 'Customer token must be acquired')
  assert.equal(custData.user.role, 'customer')
})

test.after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve))
  }
})

test('Phase 6: Admin Dashboard & Management Comprehensive Integration Suite', async (t) => {
  let createdMovieId = ''
  let createdTheatreId = ''
  let createdShowId = ''

  // ==========================================
  // 1. ADMIN AUTHORIZATION & PERMISSION ENFORCEMENT
  // ==========================================
  await t.test('1.1. Registration blocks privilege escalation (cannot register as admin)', async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Hacker Attempt',
        email: `hacker_${Date.now()}@malicious.com`,
        password: 'HackerPass123!',
        role: 'admin', // Attempting to escalate role
      }),
    })
    assert.equal(res.status, 201)
    const data = await res.json()
    // Role must be forced to customer
    assert.equal(data.user.role, 'customer', 'Public registration must never assign admin role')
  })

  await t.test('1.2. Unauthenticated requests to protected endpoints return 401', async () => {
    const moviePost = await fetch(`${baseUrl}/api/movies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Ghost Film' }),
    })
    assert.equal(moviePost.status, 401)

    const theatrePost = await fetch(`${baseUrl}/api/theatres`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Ghost Theatre' }),
    })
    assert.equal(theatrePost.status, 401)

    const showPost = await fetch(`${baseUrl}/api/shows`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ movieId: 'oppenheimer', theatreId: 'pvr-phoenix' }),
    })
    assert.equal(showPost.status, 401)

    const metricsGet = await fetch(`${baseUrl}/api/admin/metrics`)
    assert.equal(metricsGet.status, 401)
  })

  await t.test('1.3. Regular customer requests to protected endpoints return 403 Forbidden', async () => {
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${customerToken}`,
    }

    const moviePost = await fetch(`${baseUrl}/api/movies`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ title: 'Customer Movie' }),
    })
    assert.equal(moviePost.status, 403)

    const theatrePost = await fetch(`${baseUrl}/api/theatres`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: 'Customer Theatre' }),
    })
    assert.equal(theatrePost.status, 403)

    const showPost = await fetch(`${baseUrl}/api/shows`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ movieId: 'oppenheimer', theatreId: 'pvr-phoenix' }),
    })
    assert.equal(showPost.status, 403)

    const metricsGet = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    })
    assert.equal(metricsGet.status, 403)
  })

  // ==========================================
  // 2. MOVIE MANAGEMENT & VALIDATIONS
  // ==========================================
  await t.test('2.1. Movie creation validation - rejects missing title, invalid year, invalid rating', async () => {
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    }

    // Missing title
    const resNoTitle = await fetch(`${baseUrl}/api/movies`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ year: 2026, rating: 8.0 }),
    })
    assert.equal(resNoTitle.status, 400)
    const errTitle = await resNoTitle.json()
    assert.match(errTitle.message, /title/i)

    // Year < 1888
    const resBadYear = await fetch(`${baseUrl}/api/movies`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ title: 'Too Old', year: 1800 }),
    })
    assert.equal(resBadYear.status, 400)
    const errYear = await resBadYear.json()
    assert.match(errYear.message, /year/i)

    // Rating > 10
    const resBadRating = await fetch(`${baseUrl}/api/movies`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ title: 'Too High', rating: 12.5 }),
    })
    assert.equal(resBadRating.status, 400)
    const errRat = await resBadRating.json()
    assert.match(errRat.message, /rating/i)
  })

  await t.test('2.2. Movie creation - Admin creates valid movie with poster asset', async () => {
    const res = await fetch(`${baseUrl}/api/movies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: 'Avatar: Fire and Ash',
        year: 2025,
        rating: 8.6,
        duration: '3h 10m',
        genres: ['Sci-Fi', 'Action', 'Adventure'],
        language: 'English',
        certificate: 'UA',
        director: 'James Cameron',
        cast: ['Sam Worthington', 'Zoe Saldana', 'Sigourney Weaver'],
        synopsis: 'The journey of Jake Sully continues with the ash people of Pandora.',
        poster: '/posters/interstellar.jpg',
        backdrop: '/posters/interstellar.jpg',
      }),
    })
    assert.equal(res.status, 201)
    const data = await res.json()
    assert.equal(data.status, 'success')
    assert.equal(data.movie.title, 'Avatar: Fire and Ash')
    assert.equal(data.movie.year, 2025)
    assert.equal(data.movie.rating, 8.6)
    assert.ok(data.movie.id)
    createdMovieId = data.movie.id

    // Confirm movie is retrievable via public GET
    const getRes = await fetch(`${baseUrl}/api/movies/${createdMovieId}`)
    assert.equal(getRes.status, 200)
    const getData = await getRes.json()
    assert.equal(getData.movie.title, 'Avatar: Fire and Ash')
  })

  await t.test('2.3. Movie update - Admin updates title, rating, and synopsis', async () => {
    const res = await fetch(`${baseUrl}/api/movies/${createdMovieId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        rating: 9.1,
        synopsis: 'Updated synopsis with enhanced high frame rate 3D release notes.',
      }),
    })
    assert.equal(res.status, 200)
    const data = await res.json()
    assert.equal(data.status, 'success')
    assert.equal(data.movie.rating, 9.1)
    assert.equal(data.movie.synopsis, 'Updated synopsis with enhanced high frame rate 3D release notes.')
  })

  // ==========================================
  // 3. THEATRE MANAGEMENT & VALIDATIONS
  // ==========================================
  await t.test('3.1. Theatre creation validation - rejects missing name or city', async () => {
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    }

    const noNameRes = await fetch(`${baseUrl}/api/theatres`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ city: 'Mumbai' }),
    })
    assert.equal(noNameRes.status, 400)

    const noCityRes = await fetch(`${baseUrl}/api/theatres`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: 'Cineplex Plaza' }),
    })
    assert.equal(noCityRes.status, 400)

    // Seating capacity validation (must be > 0)
    const badCapRes = await fetch(`${baseUrl}/api/theatres`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: 'Invalid Cap Multiplex', city: 'Delhi', seatingCapacity: -50 }),
    })
    assert.equal(badCapRes.status, 400)
    const errCap = await badCapRes.json()
    assert.match(errCap.message, /capacity/i)
  })

  await t.test('3.2. Theatre creation & listing - Admin creates theatre', async () => {
    const res = await fetch(`${baseUrl}/api/theatres`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'PVR Inox Superplex Mall',
        city: 'Bengaluru',
        address: 'Outer Ring Road, Bellandur',
        screens: ['Screen 1', 'IMAX Laser', '4DX Arena', 'Gold Class'],
        amenities: ['Dolby Atmos', '4K Laser Projection', 'Recliner Lounge'],
      }),
    })
    assert.equal(res.status, 201)
    const data = await res.json()
    assert.equal(data.theatre.name, 'PVR Inox Superplex Mall')
    assert.equal(data.theatre.city, 'Bengaluru')
    assert.ok(data.theatre.id)
    createdTheatreId = data.theatre.id

    // Check list
    const listRes = await fetch(`${baseUrl}/api/theatres`)
    const theatres = await listRes.json()
    assert.ok(theatres.some((t) => t.id === createdTheatreId))
  })

  await t.test('3.3. Theatre update - Admin updates screens and address', async () => {
    const res = await fetch(`${baseUrl}/api/theatres/${createdTheatreId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        address: 'New Tech Zone, Outer Ring Road, Bellandur',
        screens: ['Screen 1', 'IMAX Laser Pro', '4DX Arena', 'Gold Class Luxe'],
      }),
    })
    assert.equal(res.status, 200)
    const data = await res.json()
    assert.equal(data.theatre.address, 'New Tech Zone, Outer Ring Road, Bellandur')
  })

  // ==========================================
  // 4. SHOW MANAGEMENT, CONFLICT DETECTION & SAFE DELETION
  // ==========================================
  await t.test('4.1. Show validation - Rejects invalid movie/theatre, non-positive price, past dates', async () => {
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    }

    // Invalid movie
    const badMovieRes = await fetch(`${baseUrl}/api/shows`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        movieId: 'non-existent-movie-id-1234',
        theatreId: createdTheatreId,
        date: '2026-11-15',
        price: 250,
      }),
    })
    assert.equal(badMovieRes.status, 400)
    const errMovie = await badMovieRes.json()
    assert.match(errMovie.message, /movie/i)

    // Invalid theatre
    const badTheatreRes = await fetch(`${baseUrl}/api/shows`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        movieId: createdMovieId,
        theatreId: 'non-existent-theatre-id-1234',
        date: '2026-11-15',
        price: 250,
      }),
    })
    assert.equal(badTheatreRes.status, 400)
    const errTheatre = await badTheatreRes.json()
    assert.match(errTheatre.message, /theatre/i)

    // Price <= 0
    const badPriceRes = await fetch(`${baseUrl}/api/shows`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        movieId: createdMovieId,
        theatreId: createdTheatreId,
        date: '2026-11-15',
        price: 0,
      }),
    })
    assert.equal(badPriceRes.status, 400)
    const errPrice = await badPriceRes.json()
    assert.match(errPrice.message, /price/i)

    // Past date
    const pastDateRes = await fetch(`${baseUrl}/api/shows`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        movieId: createdMovieId,
        theatreId: createdTheatreId,
        date: '2020-01-01',
        price: 300,
      }),
    })
    assert.equal(pastDateRes.status, 400)
    const errDate = await pastDateRes.json()
    assert.match(errDate.message, /past/i)

    // Seating configuration validation (seatsPerRow > 30)
    const badSeatConfigRes = await fetch(`${baseUrl}/api/shows`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        movieId: createdMovieId,
        theatreId: createdTheatreId,
        date: '2026-11-15',
        price: 250,
        seatsPerRow: 100, // exceeds max limit of 30
      }),
    })
    assert.equal(badSeatConfigRes.status, 400)
    const errSeatConfig = await badSeatConfigRes.json()
    assert.match(errSeatConfig.message, /seats per row/i)
  })

  await t.test('4.2. Show creation - Admin creates valid showtime', async () => {
    const res = await fetch(`${baseUrl}/api/shows`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        movieId: createdMovieId,
        theatreId: createdTheatreId,
        screen: 'IMAX Laser Pro',
        date: '2026-11-20',
        time: '7:30 PM',
        price: 450,
        format: 'IMAX 3D',
      }),
    })
    assert.equal(res.status, 201)
    const data = await res.json()
    assert.equal(data.status, 'success')
    assert.equal(data.show.screen, 'IMAX Laser Pro')
    assert.equal(data.show.price, 450)
    createdShowId = data.show.id
  })

  await t.test('4.3. Schedule Conflict Prevention - Rejects conflicting screening on same theatre, screen, date & time (409)', async () => {
    const res = await fetch(`${baseUrl}/api/shows`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        movieId: 'oppenheimer', // Different movie
        theatreId: createdTheatreId, // Same theatre
        screen: 'IMAX Laser Pro', // Same screen
        date: '2026-11-20', // Same date
        time: '7:30 PM', // Same time
        price: 350,
      }),
    })
    assert.equal(res.status, 409, 'Must return 409 Conflict for overlapping schedules')
    const data = await res.json()
    assert.match(data.message, /conflict/i)
  })

  await t.test('4.4. Show update - Admin updates price and format', async () => {
    const res = await fetch(`${baseUrl}/api/shows/${createdShowId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        price: 480,
        format: 'IMAX 3D HFR',
      }),
    })
    assert.equal(res.status, 200)
    const data = await res.json()
    assert.equal(data.show.price, 480)
    assert.equal(data.show.format, 'IMAX 3D HFR')
  })

  await t.test('4.5. Unsafe Theatre Deletion Prevention - Cannot delete theatre with active scheduled shows (400)', async () => {
    const res = await fetch(`${baseUrl}/api/theatres/${createdTheatreId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    })
    assert.equal(res.status, 400, 'Must block theatre deletion when active showtimes exist')
    const data = await res.json()
    assert.match(data.message, /active scheduled showtime/i)
  })

  await t.test('4.6. Unsafe Movie Deletion Prevention - Cannot delete movie with active scheduled shows (400)', async () => {
    const res = await fetch(`${baseUrl}/api/movies/${createdMovieId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    })
    assert.equal(res.status, 400, 'Must block movie deletion when active showtimes exist')
    const data = await res.json()
    assert.match(data.message, /active scheduled showtime/i)
  })

  await t.test('4.7. Customer books seat, then show deletion is blocked due to active booking', async () => {
    // Customer books a seat on this show
    const bookRes = await fetch(`${baseUrl}/api/shows/${createdShowId}/book`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        seats: ['A1', 'A2'],
        movieId: createdMovieId,
        theatreId: createdTheatreId,
        movieTitle: 'Avatar: Fire and Ash',
        paymentMethod: 'demo_simulator',
      }),
    })
    assert.equal(bookRes.status, 201)
    const bookData = await bookRes.json()
    const bookingId = bookData.booking.id

    // Admin attempts to delete show that has reserved seats/bookings
    const delShowRes = await fetch(`${baseUrl}/api/shows/${createdShowId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    })
    assert.equal(delShowRes.status, 400, 'Must block show deletion when reserved seats exist')
    const delErr = await delShowRes.json()
    assert.match(delErr.message, /reserved seat/i)

    // Customer cancels booking to unreserve seats
    const cancelRes = await fetch(`${baseUrl}/api/bookings/${bookingId}/cancel`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` },
    })
    assert.equal(cancelRes.status, 200)

    // Now admin can safely delete the show
    const delShowSuccess = await fetch(`${baseUrl}/api/shows/${createdShowId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    })
    assert.equal(delShowSuccess.status, 200)
  })

  // ==========================================
  // 5. DASHBOARD METRICS WITH DATABASE AUDIT
  // ==========================================
  await t.test('5.1. Admin metrics returns live database statistics, revenue & demo disclaimer', async () => {
    const res = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    })
    assert.equal(res.status, 200)
    const data = await res.json()
    assert.equal(data.status, 'success')
    assert.equal(data.accessLevel, 'admin')

    const { metrics } = data
    assert.ok(typeof metrics.moviesCount === 'number' && metrics.moviesCount > 0)
    assert.ok(typeof metrics.theatresCount === 'number' && metrics.theatresCount > 0)
    assert.ok(typeof metrics.showsCount === 'number')
    assert.ok(typeof metrics.bookingsCount === 'number')
    assert.ok(typeof metrics.cancelledBookingsCount === 'number')
    assert.ok(typeof metrics.totalRevenue === 'number')
    assert.equal(metrics.isDemoRevenue, true, 'isDemoRevenue flag must be explicitly declared for demo metrics')
    assert.ok(Array.isArray(metrics.recentBookings), 'recentBookings must be an array')
  })

  // ==========================================
  // 6. SAFE CLEANUP & PERSISTENCE VERIFICATION
  // ==========================================
  await t.test('6.1. Safe cleanup - Admin deletes theatre and movie after shows are cleared', async () => {
    const delTheatreRes = await fetch(`${baseUrl}/api/theatres/${createdTheatreId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    })
    assert.equal(delTheatreRes.status, 200)

    const delMovieRes = await fetch(`${baseUrl}/api/movies/${createdMovieId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    })
    assert.equal(delMovieRes.status, 200)

    // Confirm movie is deleted
    const verifyMovie = await fetch(`${baseUrl}/api/movies/${createdMovieId}`)
    assert.equal(verifyMovie.status, 404)
  })

  await t.test('6.2. Persistence verification - Data store persists across reload/re-init', async () => {
    // Create a persistent movie
    const createRes = await fetch(`${baseUrl}/api/movies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: 'Interstellar Part II',
        year: 2028,
        rating: 9.3,
        duration: '2h 50m',
        genres: ['Sci-Fi', 'Drama'],
      }),
    })
    assert.equal(createRes.status, 201)
    const createData = await createRes.json()
    const persistentId = createData.movie.id

    // Check disk storage directly
    const moviesOnDisk = JSON.parse(fs.readFileSync(path.join(dataDir, 'movies.json'), 'utf-8'))
    const diskFound = moviesOnDisk.find((m) => m.id === persistentId)
    assert.ok(diskFound, 'Newly created movie must be written to disk in movies.json')
    assert.equal(diskFound.title, 'Interstellar Part II')

    // Simulate store re-initialization (server restart simulation)
    await initCinemaStore()

    // Confirm movie remains available after re-init
    const afterInitRes = await fetch(`${baseUrl}/api/movies/${persistentId}`)
    assert.equal(afterInitRes.status, 200)
    const afterInitData = await afterInitRes.json()
    assert.equal(afterInitData.movie.title, 'Interstellar Part II')

    // Clean up
    await fetch(`${baseUrl}/api/movies/${persistentId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    })
  })
})
