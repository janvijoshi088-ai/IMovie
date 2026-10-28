import jwt from 'jsonwebtoken'
import { findUserById } from '../db/userStore.js'

export function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Access denied: Authentication token required',
    })
  }

  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Access denied: Invalid token format. Expected "Bearer <token>"',
    })
  }

  const token = parts[1]
  const secret = process.env.JWT_SECRET || 'imovies_super_secure_jwt_secret_key_2026_cinema_token'

  try {
    const decoded = jwt.verify(token, secret)
    req.user = decoded
    next()
  } catch (err) {
    return res.status(401).json({
      error: 'Unauthorized',
      message:
        err.name === 'TokenExpiredError'
          ? 'Authentication token has expired. Please log in again.'
          : 'Invalid or expired authentication token',
    })
  }
}

// Ensure the authenticated user has one of the allowed roles
export function requireRole(...allowedRoles) {
  return async (req, res, next) => {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      })
    }

    // Always re-verify user role from the database to prevent trusting forged client claims
    const user = await findUserById(req.user.id)
    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User account not found or removed',
      })
    }

    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Forbidden: Access requires [${allowedRoles.join(' or ')}] privileges`,
      })
    }

    req.user.role = user.role
    next()
  }
}

export const requireAdmin = requireRole('admin')
