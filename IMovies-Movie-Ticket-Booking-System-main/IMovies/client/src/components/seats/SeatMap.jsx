function seatClass(status) {
  if (status === 'selected') {
    return 'bg-gold-400 text-zinc-950 font-bold border-gold-400 shadow-md shadow-gold-400/30 scale-105'
  }
  if (status === 'unavailable') {
    return 'cursor-not-allowed bg-zinc-800 text-zinc-600 border-zinc-800/80'
  }
  return 'bg-zinc-950/90 text-zinc-300 border-zinc-700/80 hover:border-gold-400 hover:text-gold-400 hover:scale-105 transition-all'
}

function SeatMap({
  rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
  seatsPerRow = 12,
  bookedSeats,
  unavailableSeats,
  selectedSeats = [],
  onToggle,
  onSeatClick,
}) {
  const effectiveBooked = Array.isArray(bookedSeats)
    ? bookedSeats
    : Array.isArray(unavailableSeats)
      ? unavailableSeats
      : []
  const effectiveSelected = Array.isArray(selectedSeats) ? selectedSeats : []
  const handleToggle = onToggle || onSeatClick || (() => {})
  const effectiveRows = Array.isArray(rows) && rows.length > 0 ? rows : ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
  const effectiveSeatsPerRow = Number(seatsPerRow) || 12

  return (
    <div className="overflow-x-auto py-2">
      <div className="mx-auto min-w-[560px] max-w-2xl space-y-5">
        {/* Cinema Curved Screen with Ambient Glow */}
        <div className="relative mb-10 flex flex-col items-center">
          <div className="h-2.5 w-3/4 rounded-t-full bg-linear-to-r from-zinc-700 via-gold-400/90 to-zinc-700 screen-glow" />
          <div className="h-10 w-full bg-linear-to-b from-gold-400/10 via-transparent to-transparent blur-md pointer-events-none" />
          <p className="mt-1 text-[11px] font-bold tracking-[0.4em] uppercase text-zinc-500">
            Cinema Screen This Way
          </p>
        </div>

        {/* Seat Grid */}
        <div className="space-y-2.5">
          {effectiveRows.map((row, rIdx) => {
            // Optional tier indicator
            const isRecliner = row === 'G' || row === 'H'

            return (
              <div key={row}>
                {rIdx === 0 ? (
                  <div className="mb-2 text-center text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                    Standard — ₹180 - ₹220
                  </div>
                ) : null}
                {rIdx === 2 ? (
                  <div className="my-3 text-center text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                    Executive — ₹220 - ₹260
                  </div>
                ) : null}
                {rIdx === 6 ? (
                  <div className="my-3 text-center text-[10px] font-semibold uppercase tracking-widest text-amber-400">
                    ★ Premium Recliner — ₹320 - ₹360
                  </div>
                ) : null}

                <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                  {/* Left Row Label */}
                  <span className="w-5 text-center text-xs font-bold text-zinc-500">
                    {row}
                  </span>

                  {/* Seat Buttons */}
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    {Array.from({ length: effectiveSeatsPerRow }, (_, index) => {
                      const number = index + 1
                      const id = `${row}${number}`
                      const unavailable = effectiveBooked.includes(id)
                      const selected = effectiveSelected.includes(id)
                      const status = unavailable
                        ? 'unavailable'
                        : selected
                          ? 'selected'
                          : 'available'

                      // Add a walking aisle gap after seat 3 and seat 9
                      const hasAisle = number === 3 || number === 9

                      return (
                        <div key={id} className="flex items-center">
                          <button
                            type="button"
                            disabled={unavailable}
                            onClick={() => handleToggle(id)}
                            aria-label={`Seat ${id} ${status}`}
                            className={`h-8 w-7 sm:w-8 rounded-t-lg rounded-b-sm border text-[10px] sm:text-[11px] font-semibold transition-all ${seatClass(
                              status,
                            )} ${isRecliner ? 'border-amber-500/30' : ''}`}
                          >
                            {number}
                          </button>
                          {hasAisle ? <div className="w-3 sm:w-5" /> : null}
                        </div>
                      )
                    })}
                  </div>

                  {/* Right Row Label */}
                  <span className="w-5 text-center text-xs font-bold text-zinc-500">
                    {row}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-6 pt-6 border-t border-zinc-800 text-xs text-zinc-400">
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 rounded-t border border-zinc-700 bg-zinc-950" />
            Available
          </span>
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 rounded-t border border-gold-400 bg-gold-400 shadow-sm" />
            Selected ({effectiveSelected.length})
          </span>
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 rounded-t border border-zinc-800 bg-zinc-800" />
            Unavailable / Booked
          </span>
        </div>
      </div>
    </div>
  )
}

export default SeatMap
