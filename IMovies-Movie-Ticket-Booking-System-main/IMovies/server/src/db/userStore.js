import bcrypt from 'bcryptjs'
import fs from 'fs'
import mongoose from 'mongoose'
import path from 'path'
import { fileURLToPath } from 'url'
import User from '../models/User.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dataDir = path.resolve(__dirname, '../../data')
const dataFilePath = path.join(dataDir, 'users.json')

let isMongoConnected = false

// Try connecting to MongoDB with a short timeout so we don't hang if mongod is offline
export async function initDatabase() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/imovies'
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000,
    })
    isMongoConnected = true
    console.log(`[Database] Successfully connected to MongoDB: ${uri}`)
  } catch (err) {
    isMongoConnected = false
    console.log(
      `[Database] Local MongoDB is not running (${err.message}). Using secure JSON persistence fallback.`,
    )
  }

  // Ensure initial seed accounts exist
  await seedInitialUsers()
}

// Local File Store Helpers
function getLocalUsers() {
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }
    if (!fs.existsSync(dataFilePath)) {
      fs.writeFileSync(dataFilePath, JSON.stringify([], null, 2))
      return []
    }
    const raw = fs.readFileSync(dataFilePath, 'utf-8')
    return JSON.parse(raw || '[]')
  } catch (e) {
    console.error('[Database] Error reading users.json:', e)
    return []
  }
}

function saveLocalUsers(users) {
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }
    fs.writeFileSync(dataFilePath, JSON.stringify(users, null, 2))
  } catch (e) {
    console.error('[Database] Error writing users.json:', e)
  }
}

// Seed admin and customer accounts if empty
async function seedInitialUsers() {
  const adminEmail = 'admin@imovies.com'
  const customerEmail = 'customer@imovies.com'

  const existingAdmin = await findUserByEmail(adminEmail)
  if (!existingAdmin) {
    const hashedAdminPassword = await bcrypt.hash('Admin@123456', 10)
    await createUser({
      name: 'System Administrator',
      email: adminEmail,
      password: hashedAdminPassword,
      phone: '+91 99999 00000',
      role: 'admin',
    }, true)
  }

  const existingCustomer = await findUserByEmail(customerEmail)
  if (!existingCustomer) {
    const hashedCustomerPassword = await bcrypt.hash('Customer@123', 10)
    await createUser({
      name: 'Demo Customer',
      email: customerEmail,
      password: hashedCustomerPassword,
      phone: '+91 98888 11111',
      role: 'customer',
    }, true)
  }
}

// Repository Methods
export async function findUserByEmail(email) {
  const cleanEmail = email.trim().toLowerCase()

  if (isMongoConnected) {
    try {
      const user = await User.findOne({ email: cleanEmail })
      return user ? user.toObject() : null
    } catch {
      // Fallback to local
    }
  }

  const users = getLocalUsers()
  const found = users.find((u) => u.email.toLowerCase() === cleanEmail)
  return found ? { ...found } : null
}

export async function findUserById(id) {
  if (isMongoConnected) {
    try {
      const user = await User.findById(id)
      return user ? user.toObject() : null
    } catch {
      // Fallback to local
    }
  }

  const users = getLocalUsers()
  const found = users.find((u) => u.id === id || u._id === id)
  return found ? { ...found } : null
}

export async function createUser(userData, isPreHashed = false) {
  const cleanEmail = userData.email.trim().toLowerCase()
  const passwordHash = isPreHashed
    ? userData.password
    : await bcrypt.hash(userData.password, 10)

  const newUserPayload = {
    name: userData.name.trim(),
    email: cleanEmail,
    password: passwordHash,
    phone: (userData.phone || '').trim(),
    role: userData.role || 'customer',
    createdAt: new Date().toISOString(),
  }

  if (isMongoConnected) {
    try {
      const created = await User.create(newUserPayload)
      const obj = created.toObject()
      return obj
    } catch {
      // Fallback
    }
  }

  const users = getLocalUsers()
  const id = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
  const record = {
    id,
    _id: id,
    ...newUserPayload,
  }

  users.push(record)
  saveLocalUsers(users)
  return { ...record }
}

export function sanitizeUser(user) {
  if (!user) return null
  const { password: _p, ...cleanUser } = user
  return {
    id: user.id || user._id,
    name: cleanUser.name,
    email: cleanUser.email,
    phone: cleanUser.phone,
    role: cleanUser.role,
    createdAt: cleanUser.createdAt,
  }
}
