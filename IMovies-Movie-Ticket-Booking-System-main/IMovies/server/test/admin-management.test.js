import assert from 'node:assert/strict'
import test from 'node:test'
import { initCinemaStore } from '../src/db/cinemaStore.js'
import { initDatabase } from '../src/db/userStore.js'
import app from '../src/index.js'

let server
let baseUrl
let adminToken = ''
let customerToken = ''

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
  assert.ok(adminToken, 'Admin token should be acquired')

  // Register and login a regular customer
  const custRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Regular Customer',
      email: `customer_${Date.now()}@test.com`,
      password: 'CustomerPass123!',
    }),
  })
  const custData = await custRes.json()
  customerToken = custData.token
  assert.ok(customerToken, 'Customer token should be acquired')
})

test.after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve))
  }
})

test('Admin Management & Movie Catalogue Integration Suite', async (t) => {
  let createdMovieId = ''
  let createdTheatreId = ''
  let createdShowId = ''

  await t.test('1. Movies API - Public listing retrieves movies', async () => {
    const res = await fetch(`${baseUrl}/api/movies`)
    assert.equal(res.status, 200)
    const data = await res.json()
    assert.equal(data.status, 'success')
    assert.ok(Array.isArray(data.movies))
    assert.ok(data.movies.length >= 10, 'Should return catalogue movies')
  })

  await t.test('2. Movies API - Public single movie retrieval', async () => {
    const res = await fetch(`${baseUrl}/api/movies/oppenheimer`)
    assert.equal(res.status, 200)
    const data = await res.json()
    assert.equal(data.movie.id, 'oppenheimer')
    assert.equal(data.movie.title, 'Oppenheimer')
  })

  await t.test('3. Movies API - 404 for non-existent movie', async () => {
    const res = await fetch(`${baseUrl}/api/movies/non-existent-movie-999`)
    assert.equal(res.status, 404)
  })

  await t.test('4. Authorization - Unauthenticated movie creation rejected (401)', async () => {
    const res = await fetch(`${baseUrl}/api/movies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Unauthorized Film' }),
    })
    assert.equal(res.status, 401)
  })

  await t.test('5. Authorization - Regular customer rejected from movie creation (403)', async () => {
    const res = await fetch(`${baseUrl}/api/movies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({ title: 'Forbidden Customer Film' }),
    })
    assert.equal(res.status, 403)
  })

  await t.test('6. Admin Movie Creation - Successful creation with admin token (201)', async () => {
    const res = await fetch(`${baseUrl}/api/movies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: 'Gladiator II',
        year: 2026,
        rating: 8.4,
        duration: '2h 28m',
        genres: ['Action', 'Drama'],
        language: 'English',
        director: 'Ridley Scott',
        synopsis: 'A grand return to the Colosseum.',
      }),
    })
    assert.equal(res.status, 201)
    const data = await res.json()
    assert.equal(data.movie.title, 'Gladiator II')
    assert.ok(data.movie.id)
    createdMovieId = data.movie.id
  })

  await t.test('7. Admin Movie Update - Update created movie (200)', async () => {
    const res = await fetch(`${baseUrl}/api/movies/${createdMovieId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        rating: 8.9,
      }),
    })
    assert.equal(res.status, 200)
    const data = await res.json()
    assert.equal(data.movie.rating, 8.9)
  })

  await t.test('8. Admin Theatre Management - Create and delete theatre', async () => {
    // Attempt customer creation (should fail 403)
    const failRes = await fetch(`${baseUrl}/api/theatres`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({ name: 'Hacker Cinema' }),
    })
    assert.equal(failRes.status, 403)

    // Admin creation (should succeed 201)
    const res = await fetch(`${baseUrl}/api/theatres`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Grand IMAX Arena',
        city: 'Pune',
        address: 'High Street, Baner',
        screens: 'Audi 1, IMAX laser, Audi 3',
      }),
    })
    assert.equal(res.status, 201)
    const data = await res.json()
    assert.equal(data.theatre.name, 'Grand IMAX Arena')
    createdTheatreId = data.theatre.id

    // Verify it is listed
    const listRes = await fetch(`${baseUrl}/api/theatres`)
    const theatres = await listRes.json()
    assert.ok(theatres.some((t) => t.id === createdTheatreId))
  })

  await t.test('9. Admin Showtime Management - Schedule and delete showtime', async () => {
    // Schedule a show with admin token
    const res = await fetch(`${baseUrl}/api/shows`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        movieId: createdMovieId,
        theatreId: createdTheatreId,
        screen: 'IMAX laser',
        date: '2026-11-01',
        time: '8:00 PM',
        price: 350,
        format: 'IMAX',
      }),
    })
    assert.equal(res.status, 201)
    const data = await res.json()
    assert.equal(data.show.screen, 'IMAX laser')
    createdShowId = data.show.id

    // Remove the show with admin token
    const delShowRes = await fetch(`${baseUrl}/api/shows/${createdShowId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    })
    assert.equal(delShowRes.status, 200)
  })

  await t.test('10. Admin Metrics - Live metrics retrieval with admin token', async () => {
    // Customer attempt (403)
    const failRes = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    })
    assert.equal(failRes.status, 403)

    // Admin attempt (200)
    const res = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    })
    assert.equal(res.status, 200)
    const data = await res.json()
    assert.ok(data.metrics.moviesCount > 0)
    assert.ok(data.metrics.theatresCount > 0)
    assert.ok(data.metrics.showsCount > 0)
    assert.equal(typeof data.metrics.bookingsCount, 'number')
  })

  await t.test('11. Cleanup - Admin deletes created theatre and movie', async () => {
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

    // Verify movie is no longer found
    const verifyRes = await fetch(`${baseUrl}/api/movies/${createdMovieId}`)
    assert.equal(verifyRes.status, 404)
  })
})
