import { Link } from 'react-router-dom'

const variants = {
  primary:
    'bg-gold-400 text-zinc-950 hover:bg-gold-500 focus-visible:outline-gold-400',
  secondary:
    'border border-zinc-600 bg-zinc-900 text-zinc-100 hover:border-gold-400 hover:text-gold-400',
  ghost: 'text-zinc-200 hover:bg-zinc-800 hover:text-white',
}

function Button({
  children,
  to,
  variant = 'primary',
  className = '',
  type = 'button',
  ...props
}) {
  const classes = `inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {children}
      </Link>
    )
  }

  return (
    <button type={type} className={classes} {...props}>
      {children}
    </button>
  )
}

export default Button
