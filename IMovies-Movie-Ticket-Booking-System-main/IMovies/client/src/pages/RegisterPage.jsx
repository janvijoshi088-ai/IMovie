import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useAuth from '../context/useAuth'
import DemoBanner from '../components/ui/DemoBanner'
import PageHeader from '../components/ui/PageHeader'

function RegisterPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { register } = useAuth()
  const navigate = useNavigate()

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (form.name.trim().length < 2) {
      setError('Please enter your full name (minimum 2 characters).')
      return
    }
    if (!form.email.includes('@')) {
      setError('Please enter a valid email address.')
      return
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
      })
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function fillSampleCustomer() {
    const randomNum = Math.floor(100 + Math.random() * 900)
    setForm({
      name: `Demo User ${randomNum}`,
      email: `user${randomNum}@imovies.com`,
      phone: '+91 98765 00000',
      password: 'UserPass2026!',
      confirmPassword: 'UserPass2026!',
    })
    setError('')
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
      <PageHeader
        eyebrow="Account Creation"
        title="Register New Account"
        description="Create your IMovies account. Passwords are securely hashed with bcrypt and duplicate emails are prevented."
      />

      <div className="mt-6">
        <DemoBanner>
          Phase 3 Active: Submitting this form creates a genuine account in the backend. Passwords are encrypted with salt before saving.
        </DemoBanner>
      </div>

      <div className="mt-8 rounded-3xl border border-zinc-800 bg-cinema-900/90 p-8 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Sign Up Details
          </span>
          <button
            type="button"
            onClick={fillSampleCustomer}
            className="text-xs font-semibold text-gold-400 hover:text-gold-300 hover:underline"
          >
            Generate Unique Test Data
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
              Full Name *
            </label>
            <input
              value={form.name}
              onChange={(event) => update('name', event.target.value)}
              placeholder="e.g. John Doe"
              className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-gold-400"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
              Email Address *
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(event) => update('email', event.target.value)}
              placeholder="e.g. user@example.com"
              className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-gold-400"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
              Phone Number (Optional)
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(event) => update('phone', event.target.value)}
              placeholder="e.g. +91 98765 43210"
              className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-gold-400"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
              Password * (min 6 characters)
            </label>
            <div className="relative mt-2">
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(event) => update('password', event.target.value)}
                placeholder="Choose a strong password"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 pr-12 text-sm text-white placeholder-zinc-500 outline-none focus:border-gold-400"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-xs text-zinc-400 hover:text-white"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
              Confirm Password *
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={form.confirmPassword}
              onChange={(event) => update('confirmPassword', event.target.value)}
              placeholder="Re-enter password"
              className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-gold-400"
              required
            />
          </div>

          {error ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs leading-relaxed text-red-200 flex items-center gap-2">
              <span className="font-bold">Error:</span>
              <span>{error}</span>
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-gold-400 py-3.5 text-sm font-bold text-cinema-950 shadow-md transition hover:bg-gold-500 disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Complete Registration'}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-zinc-800 text-center text-xs text-zinc-400">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-gold-400 hover:underline">
            Sign In to Existing Account
          </Link>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage
