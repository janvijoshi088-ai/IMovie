import Button from '../components/ui/Button'

function NotFoundPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <p className="text-xs uppercase tracking-[0.3em] text-gold-400">404</p>
      <h1 className="mt-3 font-display text-4xl">Page not found</h1>
      <p className="mt-3 text-zinc-400">
        That route is not part of the IMovies demo yet.
      </p>
      <Button to="/" className="mt-6">
        Go home
      </Button>
    </div>
  )
}

export default NotFoundPage
