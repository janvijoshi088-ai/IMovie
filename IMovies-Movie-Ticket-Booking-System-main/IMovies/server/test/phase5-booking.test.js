import assert from 'node:assert/strict'
import test from 'node:test'
import app from '../src/index.js'
import { initCinemaStore } from '../src/db/cinemaStore.js'
import { initDatabase } from '../src/db/userStore.js'

let server
let baseUrl
let customerToken1 = ''
let customerToken2 = ''
let customer1Id = ''
let customer2Id = ''
let adminToken = ''

test.before(async () => {
  await initDatabase()
  await initCinemaStore()

  server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s))
  })
  const port = server.address().port
  baseUrl = `http://127.0.0.1:${port}`

  // Customer 1 registration
  const email1 = `p5_customer1_${Date.now()}@example.com`
  const u1Res = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Phase 5 Customer One',
      email: email1,
      password: 'UserPass123!',
    }),
  })
  const u1Data = await u1Res.json()
  customerToken1 = u1Data.token
  customer1Id = u1Data.user.id

  // Customer 2 registration
  const email2 = `p5_customer2_${Date.now()}@example.com`
  const u2Res = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Phase 5 Customer Two',
      email: email2,
      password: 'UserPass123!',
    }),
  })
  const u2Data = await u2Res.json()
  customerToken2 = u2Data.token
  customer2Id = u2Data.user.id

  // Admin login
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
})

test.after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve))
  }
})

// Helper to inspect live available seats for a show
async function getAvailableSeats(showId, count = 2) {
  const res = await fetch(`${baseUrl}/api/shows/${showId}`)
  assert.equal(res.status, 200)
  const show = await res.json()
  const booked = new Set(show.bookedSeats || [])
  const available = []
  for (const r of show.seatRows || ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']) {
    for (let n = 1; n <= (show.seatsPerRow || 12); n++) {
      const seat = `${r}${n}`
      if (!booked.has(seat)) {
        available.push(seat)
        if (available.length >= count) {
          return { show, seats: available }
        }
      }
    }
  }
  return { show, seats: available }
}

test('Phase 5: End-to-End Ticket Booking Suite', async (t) => {
  const targetShowId = 'show-opp-1'
  let confirmedBookingId = ''
  let bookedSeatsList = []

  // 1. Unauthenticated Booking Rejected
  await t.test('1. Unauthenticated customer booking is rejected (401)', async () => {
    const res = await fetch(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        showId: targetShowId,
        seats: ['A1'],
      }),
    })
    assert.equal(res.status, 401, 'Must reject unauthenticated booking with 401')
  })

  // 2. Invalid Requests - Missing Show or Empty Seats
  await t.test('2. Invalid booking request rejected for missing fields (400)', async () => {
    const res1 = await fetch(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken1}`,
      },
      body: JSON.stringify({ seats: ['A1'] }),
    })
    assert.equal(res1.status, 400, 'Must return 400 when showId is missing')

    const res2 = await fetch(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken1}`,
      },
      body: JSON.stringify({ showId: targetShowId, seats: [] }),
    })
    assert.equal(res2.status, 400, 'Must return 400 when seats array is empty')
  })

  // 3. Validation - Expired Show Rejected
  await t.test('3. Booking attempt on expired show is rejected (400)', async () => {
    const res = await fetch(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken1}`,
      },
      body: JSON.stringify({
        showId: 'show-expired-1',
        seats: ['B1'],
      }),
    })
    assert.equal(res.status, 400, 'Must return 400 for expired show')
    const data = await res.json()
    assert.match(data.message, /expired/i)
  })

  // 4. Validation - Invalid Seat Identifiers Rejected
  await t.test('4. Booking with invalid seat format is rejected (400)', async () => {
    const res = await fetch(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken1}`,
      },
      body: JSON.stringify({
        showId: targetShowId,
        seats: ['Z99'], // Invalid row Z and out-of-bounds seat 99
      }),
    })
    assert.equal(res.status, 400, 'Must return 400 for non-existent seat identifier')
  })

  // 5. Successful Booking Creation & Server Price Calculation
  await t.test('5. Authenticated customer creates booking with server-calculated price (201)', async () => {
    const { show, seats } = await getAvailableSeats(targetShowId, 2)
    assert.ok(seats.length >= 2, 'Must have at least 2 available seats')
    bookedSeatsList = seats

    // Tampered price payload from client: attempts to pay 10 instead of 350*2+30
    const res = await fetch(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken1}`,
      },
      body: JSON.stringify({
        showId: targetShowId,
        seats: bookedSeatsList,
        movieId: show.movieId,
        theatreId: show.theatreId,
        movieTitle: 'Oppenheimer',
        amount: 10, // Attempted tampering
        price: 5,
        paymentMethod: 'demo_simulator',
      }),
    })

    assert.equal(res.status, 201, 'Must return 201 Created')
    const data = await res.json()
    assert.equal(data.status, 'success')
    assert.ok(data.booking, 'Response must include booking')

    const b = data.booking
    confirmedBookingId = b.id
    assert.match(b.id, /^IMV-/, 'Booking reference must follow IMV- format')
    assert.equal(b.userId, customer1Id, 'Must associate with customer')
    assert.equal(b.showId, targetShowId, 'Must associate with show')
    assert.deepEqual(b.seats, bookedSeatsList, 'Must store selected seats')
    assert.equal(b.status, 'confirmed', 'Status must be confirmed')
    assert.equal(b.paymentMethod, 'demo_simulator')
    assert.equal(b.paymentStatus, 'paid_demo')

    // Verify server-side price calculation ignored client tampering
    const expectedBase = bookedSeatsList.length * show.price
    const expectedConvenience = 30
    const expectedTotal = expectedBase + expectedConvenience
    assert.equal(b.baseAmount, expectedBase, 'Base amount must be calculated on backend')
    assert.equal(b.convenienceFee, expectedConvenience, 'Convenience fee must be calculated on backend')
    assert.equal(b.amount, expectedTotal, 'Total amount must match backend calculation')

    // Verify seats are now marked reserved in live show
    const liveShowRes = await fetch(`${baseUrl}/api/shows/${targetShowId}`)
    const liveShow = await liveShowRes.json()
    for (const seat of bookedSeatsList) {
      assert.ok(liveShow.bookedSeats.includes(seat), `Seat ${seat} must now be marked booked`)
    }
  })

  // 6. Conflicting Seat Reservation Rejection
  await t.test('6. Attempt to book already reserved seats is rejected with conflict (409)', async () => {
    const res = await fetch(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken2}`,
      },
      body: JSON.stringify({
        showId: targetShowId,
        seats: bookedSeatsList, // Seats just booked by customer 1
      }),
    })

    assert.equal(res.status, 409, 'Must return 409 Conflict')
    const data = await res.json()
    assert.match(data.message, /already booked/i)
    assert.ok(Array.isArray(data.conflicts))
  })

  // 7. Booking Confirmation Retrieval by Owner
  await t.test('7. Customer retrieves verified booking confirmation from backend (200)', async () => {
    const res = await fetch(`${baseUrl}/api/bookings/${confirmedBookingId}`, {
      headers: {
        Authorization: `Bearer ${customerToken1}`,
      },
    })

    assert.equal(res.status, 200, 'Owner must be able to view booking')
    const data = await res.json()
    assert.equal(data.status, 'success')
    assert.equal(data.booking.id, confirmedBookingId)
    assert.equal(data.booking.userId, customer1Id)
    assert.ok(data.movie, 'Enriched movie details must be provided')
    assert.ok(data.theatre, 'Enriched theatre details must be provided')
    assert.ok(data.show, 'Enriched show details must be provided')
    assert.ok(data.show.time, 'Show must contain showtime')
  })

  // 8. Access Control - Non-owner Customer Forbidden
  await t.test('8. Customer cannot view another user\'s booking confirmation (403)', async () => {
    const res = await fetch(`${baseUrl}/api/bookings/${confirmedBookingId}`, {
      headers: {
        Authorization: `Bearer ${customerToken2}`, // Customer 2 trying to inspect Customer 1's booking
      },
    })

    assert.equal(res.status, 403, 'Must return 403 Forbidden for unauthorized user')
    const data = await res.json()
    assert.match(data.message, /permission|denied|forbidden/i)
  })

  // 9. Admin Allowed to Inspect Any Booking
  await t.test('9. Admin can retrieve any booking confirmation (200)', async () => {
    const res = await fetch(`${baseUrl}/api/bookings/${confirmedBookingId}`, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    })

    assert.equal(res.status, 200, 'Admin can view any booking')
    const data = await res.json()
    assert.equal(data.booking.id, confirmedBookingId)
  })

  // 10. Customer Booking History
  await t.test('10. Customer retrieves personal booking history (200)', async () => {
    const res = await fetch(`${baseUrl}/api/bookings/my-bookings`, {
      headers: {
        Authorization: `Bearer ${customerToken1}`,
      },
    })

    assert.equal(res.status, 200)
    const bookings = await res.json()
    assert.ok(Array.isArray(bookings))
    const found = bookings.find((b) => b.id === confirmedBookingId)
    assert.ok(found, 'Customer 1 must see confirmed booking in history')
    assert.equal(typeof found.isUpcoming, 'boolean')
    assert.equal(typeof found.isPast, 'boolean')

    // Customer 2 should have 0 bookings
    const res2 = await fetch(`${baseUrl}/api/bookings/my-bookings`, {
      headers: {
        Authorization: `Bearer ${customerToken2}`,
      },
    })
    const bookings2 = await res2.json()
    assert.ok(Array.isArray(bookings2))
    assert.equal(bookings2.some((b) => b.id === confirmedBookingId), false)
  })

  // 11. Cancellation - Non-owner Forbidden
  await t.test('11. Customer cannot cancel another user\'s booking (403)', async () => {
    const res = await fetch(`${baseUrl}/api/bookings/${confirmedBookingId}/cancel`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${customerToken2}`,
      },
    })

    assert.equal(res.status, 403, 'Must return 403 Forbidden')
  })

  // 12. Cancellation - Sensible Cancellation Rules & Atomic Seat Release
  await t.test('12. Owner cancels upcoming booking, releasing seats safely (200)', async () => {
    const res = await fetch(`${baseUrl}/api/bookings/${confirmedBookingId}/cancel`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${customerToken1}`,
      },
    })

    assert.equal(res.status, 200, 'Cancellation must succeed')
    const data = await res.json()
    assert.equal(data.status, 'success')
    assert.equal(data.booking.status, 'cancelled')
    assert.ok(data.booking.cancelledAt, 'cancelledAt timestamp must be recorded')

    // Verify seats have been removed from show.bookedSeats
    const liveShowRes = await fetch(`${baseUrl}/api/shows/${targetShowId}`)
    const liveShow = await liveShowRes.json()
    for (const seat of bookedSeatsList) {
      assert.equal(
        liveShow.bookedSeats.includes(seat),
        false,
        `Seat ${seat} must be safely released back to available pool`,
      )
    }

    // Verify released seats can now be booked by Customer 2
    const rebookRes = await fetch(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken2}`,
      },
      body: JSON.stringify({
        showId: targetShowId,
        seats: [bookedSeatsList[0]],
      }),
    })
    assert.equal(rebookRes.status, 201, 'Customer 2 can immediately re-book the released seat')
  })

  // 13. Cancellation - Cannot Cancel Already Cancelled Booking
  await t.test('13. Re-cancelling an already cancelled booking is rejected (400)', async () => {
    const res = await fetch(`${baseUrl}/api/bookings/${confirmedBookingId}/cancel`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${customerToken1}`,
      },
    })

    assert.equal(res.status, 400, 'Must return 400 for already cancelled booking')
    const data = await res.json()
    assert.match(data.message, /already been cancelled/i)
  })

  // 14. Concurrency & Mutex - Simultaneous Booking Race Condition
  await t.test('14. Concurrent simultaneous bookings for same seat: exactly 1 succeeds, 1 rejected (409)', async () => {
    const { seats } = await getAvailableSeats(targetShowId, 1)
    assert.ok(seats.length >= 1, 'Must have at least 1 available seat')
    const raceSeat = seats[0]

    // Fire two parallel requests at the exact same millisecond
    const [raceRes1, raceRes2] = await Promise.all([
      fetch(`${baseUrl}/api/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerToken1}`,
        },
        body: JSON.stringify({
          showId: targetShowId,
          seats: [raceSeat],
        }),
      }),
      fetch(`${baseUrl}/api/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerToken2}`,
        },
        body: JSON.stringify({
          showId: targetShowId,
          seats: [raceSeat],
        }),
      }),
    ])

    const statuses = [raceRes1.status, raceRes2.status].sort()
    assert.deepEqual(
      statuses,
      [201, 409],
      'Under concurrent execution, exactly one booking must succeed (201) and the duplicate must be rejected (409)',
    )
  })
})
