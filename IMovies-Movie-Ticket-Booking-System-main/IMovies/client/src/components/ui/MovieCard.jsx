import { Link } from 'react-router-dom'
import PosterImage from './PosterImage'

function MovieCard({ movie }) {
  return (
    <Link
      to={`/movies/${movie.id}`}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-800/80 bg-cinema-900 shadow-xl shadow-black/40 transition-all duration-300 hover:-translate-y-1.5 hover:border-gold-400/50 hover:shadow-gold-400/10"
    >
      <div className="relative aspect-2/3 overflow-hidden bg-zinc-950">
        <PosterImage
          src={movie.poster}
          alt={`${movie.title} poster`}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Certificate Badge */}
        {movie.certificate ? (
          <span className="absolute top-3 left-3 rounded-md bg-black/70 px-2 py-0.5 text-[11px] font-bold tracking-wider text-zinc-300 backdrop-blur-xs border border-white/10">
            {movie.certificate}
          </span>
        ) : null}

        {/* Rating Badge */}
        <span className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-black/80 px-2.5 py-0.5 text-xs font-bold text-gold-400 backdrop-blur-xs border border-gold-400/30">
          <svg className="h-3 w-3 fill-gold-400" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          {movie.rating}
        </span>

        {/* Hover Quick Action */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 backdrop-blur-xs transition-opacity duration-300 group-hover:opacity-100">
          <span className="rounded-full bg-gold-400 px-4 py-2 text-xs font-bold tracking-wide text-zinc-950 shadow-lg">
            View Details & Shows
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-1 text-base font-semibold text-white transition-colors group-hover:text-gold-400">
          {movie.title}
        </h3>
        <p className="mt-1 text-xs text-zinc-400">
          {movie.year} · {movie.language} · {movie.duration}
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {movie.genres.slice(0, 2).map((genre) => (
            <span
              key={genre}
              className="rounded-md bg-zinc-800/80 px-2 py-0.5 text-[11px] font-medium text-zinc-300"
            >
              {genre}
            </span>
          ))}
          {movie.genres.length > 2 ? (
            <span className="text-[11px] text-zinc-500">+{movie.genres.length - 2}</span>
          ) : null}
        </div>
      </div>
    </Link>
  )
}

export default MovieCard
