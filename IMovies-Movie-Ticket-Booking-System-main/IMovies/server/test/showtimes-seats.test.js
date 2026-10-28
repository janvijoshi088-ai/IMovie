import assert from 'node:assert/strict'
import test from 'node:test'
import app from '../src/index.js'
import { initCinemaStore } from '../src/db/cinemaStore.js'
import { initDatabase } from '../src/db/userStore.js'

let server
let baseUrl
let customerToken1 = ''
let customerToken2 = ''

test.before(async () => {
  await initDatabase()
  await initCinemaStore()

  server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s))
  })
  const port = server.address().port
  baseUrl = `http://127.0.0.1:${port}`

  // Register two distinct customers for concurrency testing
  const u1Res = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Concurrent User 1',
      email: `concurrent1_${Date.now()}@example.com`,
      password: 'UserPass123!',
    }),
  })
  const u1Data = await u1Res.json()
  customerToken1 = u1Data.token

  const u2Res = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Concurrent User 2',
      email: `concurrent2_${Date.now()}@example.com`,
      password: 'UserPass123!',
    }),
  })
  const u2Data = await u2Res.json()
  customerToken2 = u2Data.token
})

test.after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve))
  }
})

test('Phase 4: Showtime and Seat Selection Flow', async (t) => {
  const targetMovieId = 'oppenheimer'
  let targetShowId = ''

  await t.test('1. Showtimes - Retrieve shows associated with movie', async () => {
    const res = await fetch(`${baseUrl}/api/shows/movie/${targetMovieId}`)
    assert.equal(res.status, 200, 'Should return 200 OK')
    const shows = await res.json()
    assert.ok(Array.isArray(shows), 'Shows must be an array')
    assert.ok(shows.length > 0, 'Should have at least one show for Oppenheimer')

    const firstShow = shows[0]
    assert.equal(firstShow.movieId, targetMovieId)
    assert.ok(firstShow.theatre, 'Show must be enriched with theatre information')
    assert.ok(firstShow.theatre.name, 'Theatre must have a name')
    assert.ok(firstShow.date, 'Show must have date')
    assert.ok(firstShow.time, 'Show must have time')
    assert.ok(firstShow.price > 0, 'Show must have a valid ticket price')
    assert.ok(Array.isArray(firstShow.bookedSeats), 'Show must have bookedSeats array')

    targetShowId = firstShow.id
  })

  await t.test('2. Showtimes - Retrieve single show details with live booked seats', async () => {
    const res = await fetch(`${baseUrl}/api/shows/${targetShowId}`)
    assert.equal(res.status, 200)
    const show = await res.json()
    assert.equal(show.id, targetShowId)
    assert.equal(show.expired, false)
    assert.ok(Array.isArray(show.bookedSeats))
  })

  await t.test('3. Showtimes - Reject non-existent show ID', async () => {
    const res = await fetch(`${baseUrl}/api/shows/non-existent-show-id-999`)
    assert.equal(res.status, 404, 'Must return 404 for unknown show')
  })

  await t.test('4. Showtimes - Prevent selecting expired show', async () => {
    const res = await fetch(`${baseUrl}/api/shows/show-expired-1`)
    assert.equal(res.status, 400, 'Expired show must return 400 Bad Request')
    const data = await res.json()
    assert.equal(data.expired, true)
    assert.match(data.message, /expired/i)
  })

  await t.test('5. Seat Validation - Rejects invalid seat row or number', async () => {
    const invalidRowRes = await fetch(`${baseUrl}/api/shows/${targetShowId}/validate-seats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seats: ['Z1'] }), // Row Z does not exist
    })
    assert.equal(invalidRowRes.status, 400, 'Invalid row must return 400')

    const invalidNumRes = await fetch(`${baseUrl}/api/shows/${targetShowId}/validate-seats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seats: ['A0'] }), // Seat 0 does not exist
    })
    assert.equal(invalidNumRes.status, 400, 'Invalid seat number 0 must return 400')

    const invalidNumRes2 = await fetch(`${baseUrl}/api/shows/${targetShowId}/validate-seats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seats: ['A99'] }), // Seat 99 exceeds seatsPerRow 12
    })
    assert.equal(invalidNumRes2.status, 400, 'Seat exceeding row capacity must return 400')
  })

  await t.test('6. Seat Validation - Rejects exceeding max seat limit (> 6 seats)', async () => {
    const res = await fetch(`${baseUrl}/api/shows/${targetShowId}/validate-seats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seats: ['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7'] }), // 7 seats
    })
    assert.equal(res.status, 400, 'Selecting more than 6 seats must return 400')
    const data = await res.json()
    assert.match(data.message, /more than 6 seats/i)
  })

  await t.test('7. Seat Validation - Rejects already unavailable seats', async () => {
    // Show show-opp-1 has bookedSeats: ['A4', 'A5', ...]
    const res = await fetch(`${baseUrl}/api/shows/${targetShowId}/validate-seats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seats: ['A4'] }),
    })
    assert.equal(res.status, 409, 'Unavailable seat must return 409 Conflict')
    const data = await res.json()
    assert.ok(data.conflicts.includes('A4'))
  })

  await t.test('8. Seat Booking - Successfully book available seats', async () => {
    // Dynamically retrieve show to find available seats
    const showRes = await fetch(`${baseUrl}/api/shows/${targetShowId}`)
    const currentShow = await showRes.json()
    const booked = new Set(currentShow.bookedSeats || [])
    const available = []
    for (const r of currentShow.seatRows) {
      for (let n = 1; n <= currentShow.seatsPerRow; n++) {
        const id = `${r}${n}`
        if (!booked.has(id)) available.push(id)
      }
    }
    assert.ok(available.length >= 2, 'Must have at least 2 available seats to book')
    const seatsToBook = [available[0], available[1]]

    const res = await fetch(`${baseUrl}/api/shows/${targetShowId}/book`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken1}`,
      },
      body: JSON.stringify({
        seats: seatsToBook,
        movieTitle: 'Oppenheimer',
      }),
    })

    assert.equal(res.status, 201, 'Booking must return 201 Created')
    const data = await res.json()
    assert.ok(data.booking, 'Response must include booking')
    assert.ok(data.booking.id, 'Booking must have reference ID')
    assert.deepEqual(data.booking.seats, seatsToBook)
    assert.equal(data.booking.status, 'confirmed')

    // Verify show's live bookedSeats now includes newly booked seats
    assert.ok(data.show.bookedSeats.includes(seatsToBook[0]))
    assert.ok(data.show.bookedSeats.includes(seatsToBook[1]))
  })

  await t.test('9. Concurrency & Double Booking Prevention - Concurrent requests for exact same seat', async () => {
    // Dynamically find an unbooked seat to contest
    const showRes = await fetch(`${baseUrl}/api/shows/${targetShowId}`)
    const currentShow = await showRes.json()
    const booked = new Set(currentShow.bookedSeats || [])
    let candidateSeat = ''
    for (const r of currentShow.seatRows) {
      for (let n = 1; n <= currentShow.seatsPerRow; n++) {
        const id = `${r}${n}`
        if (!booked.has(id)) {
          candidateSeat = id
          break
        }
      }
      if (candidateSeat) break
    }
    assert.ok(candidateSeat, 'Must find an available seat to contest')
    const targetContestedSeat = [candidateSeat]

    // Execute two simultaneous concurrent booking requests
    const [res1, res2] = await Promise.all([
      fetch(`${baseUrl}/api/shows/${targetShowId}/book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerToken1}`,
        },
        body: JSON.stringify({ seats: targetContestedSeat, movieTitle: 'Oppenheimer' }),
      }),
      fetch(`${baseUrl}/api/shows/${targetShowId}/book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerToken2}`,
        },
        body: JSON.stringify({ seats: targetContestedSeat, movieTitle: 'Oppenheimer' }),
      }),
    ])

    const statuses = [res1.status, res2.status].sort()
    assert.deepEqual(
      statuses,
      [201, 409],
      'Exactly one concurrent request must succeed (201) and the other must fail (409 Conflict)',
    )

    // Verify in database that the seat was booked exactly once
    const showCheck = await fetch(`${baseUrl}/api/shows/${targetShowId}`)
    const showData = await showCheck.json()
    const count = showData.bookedSeats.filter((s) => s === candidateSeat).length
    assert.equal(count, 1, `Seat ${candidateSeat} must appear in bookedSeats exactly once without duplicates`)
  })

  await t.test('10. User Bookings - Verified in booking history', async () => {
    const res = await fetch(`${baseUrl}/api/bookings/my-bookings`, {
      headers: { Authorization: `Bearer ${customerToken1}` },
    })
    assert.equal(res.status, 200)
    const bookings = await res.json()
    assert.ok(Array.isArray(bookings))
    assert.ok(bookings.length >= 1, 'Customer 1 must have at least 1 confirmed booking')
  })
})
