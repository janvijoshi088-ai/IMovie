import assert from 'node:assert/strict'
import test from 'node:test'
import app from '../src/index.js'
import { findUserByEmail, initDatabase } from '../src/db/userStore.js'

let server
let baseUrl

test.before(async () => {
  await initDatabase()
  server = await new Promise((resolve) => {
    // Listen on random port to avoid conflicts
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

test('Auth API Test Suite', async (t) => {
  const uniqueSuffix = Date.now()
  const testCustomerEmail = `alice_${uniqueSuffix}@example.com`
  const testCustomerPassword = 'SecurePassword123!'
  let customerToken = ''
  let adminToken = ''

  await t.test('1. Registration - Successfully register new user', async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Alice Johnson',
        email: testCustomerEmail,
        password: testCustomerPassword,
        phone: '+91 91234 56789',
      }),
    })

    assert.equal(res.status, 201, 'Should return 201 Created')
    const data = await res.json()
    assert.ok(data.token, 'Response must include JWT token')
    assert.ok(data.user, 'Response must include user object')
    assert.equal(data.user.email, testCustomerEmail)
    assert.equal(data.user.name, 'Alice Johnson')
    assert.equal(data.user.role, 'customer')

    // Password or hash must NEVER be returned
    assert.equal(data.user.password, undefined, 'Password must not be in user response')
    assert.equal(data.password, undefined, 'Password must not be in root response')

    customerToken = data.token
  })

  await t.test('2. Password Security - Password must be securely hashed in storage', async () => {
    const storedUser = await findUserByEmail(testCustomerEmail)
    assert.ok(storedUser, 'User must exist in database store')
    assert.notEqual(storedUser.password, testCustomerPassword, 'Stored password must not be plaintext')
    assert.match(
      storedUser.password,
      /^\$2[aby]\$\d{2}\$/,
      'Stored password must be a valid bcrypt hash format',
    )
  })

  await t.test('3. Role Tampering - Client cannot elevate role during registration', async () => {
    const maliciousEmail = `hacker_${uniqueSuffix}@example.com`
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Eve Malicious',
        email: maliciousEmail,
        password: 'Password999!',
        role: 'admin', // Attempted role escalation
      }),
    })

    assert.equal(res.status, 201)
    const data = await res.json()
    assert.equal(data.user.role, 'customer', 'Role must remain customer, ignoring client request')
  })

  await t.test('4. Duplicate Account - Cannot register twice with same email', async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Alice Duplicate',
        email: testCustomerEmail,
        password: 'AnotherPassword123!',
      }),
    })

    assert.equal(res.status, 409, 'Should return 409 Conflict on duplicate email')
    const data = await res.json()
    assert.match(data.message, /already exists/i)
  })

  await t.test('5. Input Validation - Rejects short passwords and invalid emails', async () => {
    const invalidRes1 = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Bob',
        email: 'invalid-email-format',
        password: 'ValidPassword123!',
      }),
    })
    assert.equal(invalidRes1.status, 400, 'Should reject invalid email')

    const invalidRes2 = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Bob',
        email: `bob_${uniqueSuffix}@example.com`,
        password: '123', // Too short
      }),
    })
    assert.equal(invalidRes2.status, 400, 'Should reject short password')
  })

  await t.test('6. Login - Valid login returns JWT token and sanitized user', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testCustomerEmail,
        password: testCustomerPassword,
      }),
    })

    assert.equal(res.status, 200, 'Should return 200 OK on valid credentials')
    const data = await res.json()
    assert.ok(data.token, 'Should return token')
    assert.equal(data.user.email, testCustomerEmail)
    assert.equal(data.user.password, undefined, 'Password must not be returned')
  })

  await t.test('7. Login - Rejects invalid password', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testCustomerEmail,
        password: 'WrongPassword!',
      }),
    })

    assert.equal(res.status, 401, 'Should return 401 Unauthorized')
  })

  await t.test('8. Login - Rejects non-existent email', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'nonexistent_user@example.com',
        password: 'SomePassword123!',
      }),
    })

    assert.equal(res.status, 401, 'Should return 401 Unauthorized')
  })

  await t.test('9. Protected API - Access /api/auth/me without token is rejected', async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`)
    assert.equal(res.status, 401, 'Unauthenticated request must return 401')
  })

  await t.test('10. Protected API - Access /api/auth/me with customer token succeeds', async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    })

    assert.equal(res.status, 200)
    const data = await res.json()
    assert.equal(data.user.email, testCustomerEmail)
    assert.equal(data.user.password, undefined)
  })

  await t.test('11. Authorization - Customer access to Admin API is forbidden', async () => {
    const res = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    })

    assert.equal(res.status, 403, 'Customer must receive 403 Forbidden on admin endpoint')
    const data = await res.json()
    assert.match(data.message, /privileges/i)
  })

  await t.test('12. Authorization - Administrator login and access to Admin API succeeds', async () => {
    // Login as seeded admin
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@imovies.com',
        password: 'Admin@123456',
      }),
    })

    assert.equal(loginRes.status, 200, 'Admin login should succeed')
    const loginData = await loginRes.json()
    adminToken = loginData.token
    assert.equal(loginData.user.role, 'admin')

    // Access admin metrics
    const adminRes = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    })

    assert.equal(adminRes.status, 200, 'Admin request should succeed')
    const adminData = await adminRes.json()
    assert.equal(adminData.status, 'success')
    assert.equal(adminData.accessLevel, 'admin')
  })
})
