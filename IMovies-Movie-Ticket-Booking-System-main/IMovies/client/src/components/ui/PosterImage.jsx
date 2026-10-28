import { useState } from 'react'

function PosterImage({ src, alt, className = '' }) {
  const [failed, setFailed] = useState(false)

  if (!src || failed) {
    return (
      <div
        className={`flex items-center justify-center bg-linear-to-br from-zinc-800 to-cinema-950 text-center ${className}`}
      >
        <span className="px-3 text-sm font-medium text-zinc-400">{alt}</span>
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`object-cover ${className}`}
      onError={() => setFailed(true)}
    />
  )
}

export default PosterImage
