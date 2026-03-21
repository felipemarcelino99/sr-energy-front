import { MapPin, ExternalLink, Hotel, Car } from 'lucide-react'

interface Props {
  city: string
  state: string
}

export function JobRouteSuggestions({ city, state }: Props) {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${city}, ${state}, Brasil`)}`

  return (
    <div className="card bg-base-200 border border-base-300 p-4">
      <h2 className="font-bold text-base mb-3 flex items-center gap-2">
        <MapPin size={15} />
        Roteiro pós-trabalho — {city}/{state}
      </h2>

      <div className="flex flex-col gap-3 text-sm">
        {/* Map link */}
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Google Maps"
          className="btn btn-outline btn-sm gap-2 w-fit"
        >
          <ExternalLink size={13} />
          Google Maps
        </a>

        {/* Suggestions */}
        <div className="divider my-1" />
        <p className="text-xs font-semibold text-base-content/40 uppercase tracking-wider">
          Sugestões de roteiro
        </p>

        <ul className="flex flex-col gap-2 text-base-content/80">
          <li className="flex items-start gap-2">
            <Hotel size={14} className="mt-0.5 shrink-0 text-primary" />
            <span>
              <span className="font-medium">Hospedagem:</span> Busque hotéis próximos ao endereço do trabalho em{' '}
              <a
                href={`https://www.google.com/maps/search/?api=1&query=hoteis+em+${encodeURIComponent(`${city}, ${state}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="link link-primary"
              >
                {city}
              </a>
              .
            </span>
          </li>
          <li className="flex items-start gap-2">
            <Car size={14} className="mt-0.5 shrink-0 text-secondary" />
            <span>
              <span className="font-medium">Transporte:</span> Verifique rotas de retorno e postos de gasolina pelo Google Maps antes de partir.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <MapPin size={14} className="mt-0.5 shrink-0 text-accent" />
            <span>
              <span className="font-medium">Pontos de interesse:</span> Consulte restaurantes e serviços próximos ao local de {city}/{state}.
            </span>
          </li>
        </ul>
      </div>
    </div>
  )
}
