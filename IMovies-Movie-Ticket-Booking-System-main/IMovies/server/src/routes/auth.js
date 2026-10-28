import bcrypt from 'bcryptjs'
import express from 'express'
import jwt from 'jsonwebtoken'
import { createUser, findUserByEmail, findUserById, sanitizeUser } from '../db/userStore.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// Helper to sign JWT token
function generateToken(user) {
  const secret = process.env.JWT_SECRET || 'imovies_super_secure_jwt_secret_key_2026_cinema_token'
  return jwt.sign(
    {
      id: user.id || user._id,
      email: user.email,
      role: user.role,
    },
    secret,
    { expiresIn: '24h' },
  )
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body

    // Validation
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Name is required and must be at least 2 characters long',
      })
    }

    if (!email || typeof email !== 'string') {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'A valid email address is required',
      })
    }

    const emailRegex = /^\S+@\S+\.\S+$/
    const cleanEmail = email.trim().toLowerCase()
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Please provide a valid email format (e.g., user@example.com)',
      })
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Password is required and must be at least 6 characters long',
      })
    }

    // Check for duplicate account
    const existing = await findUserByEmail(cleanEmail)
    if (existing) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'An account with this email address already exists. Please log in instead.',
      })
    }

    // Role MUST NEVER be trusted from client input.
    // Public registration always assigns 'customer'.
    const newUser = await createUser({
      name,
      email: cleanEmail,
      password,
      phone: typeof phone === 'string' ? phone.trim() : '',
      role: 'customer',
    })

    const token = generateToken(newUser)
    const sanitized = sanitizeUser(newUser)

    return res.status(201).json({
      message: 'Account registered successfully',
      token,
      user: sanitized,
    })
  } catch (err) {
    console.error('[Auth] Registration error:', err)
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to process registration. Please try again.',
    })
  }
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Both email and password are required',
      })
    }

    const cleanEmail = String(email).trim().toLowerCase()
    const user = await findUserByEmail(cleanEmail)

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password',
      })
    }

    // Compare with bcrypt
    const isMatch = await bcrypt.compare(String(password), user.password)
    if (!isMatch) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password',
      })
    }

    const token = generateToken(user)
    const sanitized = sanitizeUser(user)

    return res.json({
      message: 'Signed in successfully',
      token,
      user: sanitized,
    })
  } catch (err) {
    console.error('[Auth] Login error:', err)
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to authenticate. Please try again.',
    })
  }
})

// GET /api/auth/me (Protected current user session)
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await findUserById(req.user.id)
    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User profile not found',
      })
    }

    return res.json({
      user: sanitizeUser(user),
    })
  } catch (err) {
    console.error('[Auth] Get current user error:', err)
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Could not fetch user profile',
    })
  }
})

export default router
