import express from 'express'
import { getAdminMetrics } from '../db/cinemaStore.js'
import { authenticateToken, requireAdmin } from '../middleware/auth.js'

const router = express.Router()

// GET /api/admin/metrics (Administrator ONLY)
router.get('/metrics', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const metrics = await getAdminMetrics()
    return res.json({
      status: 'success',
      accessLevel: 'admin',
      message: 'Authorized administrative metrics accessed successfully',
      metrics,
    })
  } catch (err) {
    return res.status(500).json({
      error: 'Internal Server Error',
      message: err.message,
    })
  }
})

export default router
