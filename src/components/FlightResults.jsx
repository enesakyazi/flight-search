import { useState } from 'react'
import { getFlightDetails } from '../services/flightService'

const FlightResults = ({ flights, onFlightSelect }) => {
  const [selectedFlight, setSelectedFlight] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [sortBy, setSortBy] = useState('none')
  const [filterByStops, setFilterByStops] = useState('all')

  const handleFlightClick = async (flight) => {
    console.log('Clicked flight:', flight)
    
    if (!flight.id || !flight.sessionId) {
      console.log('Missing flight data:', { id: flight.id, sessionId: flight.sessionId })
      setError('Flight details not available')
      return
    }

    if (selectedFlight?.id === flight.id) {
      console.log('Collapsing flight details')
      setSelectedFlight(null)
      onFlightSelect(null)
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      console.log('Fetching details for flight:', { id: flight.id, sessionId: flight.sessionId }) 
      const details = await getFlightDetails(flight.id, flight.sessionId)
      console.log('Received flight details:', details) 
      
      if (!details) {
        throw new Error('No flight details received')
      }
      setSelectedFlight(details)
      onFlightSelect(flight)
    } catch (err) {
      console.error('Error fetching flight details:', err) 
      setError(err.message || 'Failed to load flight details')
      setSelectedFlight(null)
      onFlightSelect(null)
    } finally {
      setLoading(false)
    }
  }

  const getFilteredAndSortedFlights = () => {
    let filteredFlights = [...flights]

    if (filterByStops !== 'all') {
      const stops = parseInt(filterByStops)
      filteredFlights = filteredFlights.filter(flight => flight.stops === stops)
    }

    if (sortBy !== 'none') {
      filteredFlights.sort((a, b) => {
        if (sortBy === 'price-asc') {
          return a.price.raw - b.price.raw
        } else if (sortBy === 'price-desc') {
          return b.price.raw - a.price.raw
        }
        return 0
      })
    }

    return filteredFlights
  }

  console.log('Current state:', { selectedFlight, loading, error })

  if (!Array.isArray(flights) || flights.length === 0) {
    return (
      <div className="no-flights">
        <p>No flights available. Please try a different search.</p>
      </div>
    )
  }

  const filteredFlights = getFilteredAndSortedFlights()

  return (
    <div className="flight-results-container">
      <div className="filters">
        <div className="filter-group">
          <label htmlFor="sort-by">Fiyata Göre Sırala:</label>
          <select 
            id="sort-by" 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="filter-select"
          >
            <option value="none">Varsayılan</option>
            <option value="price-asc">En Düşük Fiyat</option>
            <option value="price-desc">En Yüksek Fiyat</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="filter-stops">Aktarma Sayısı:</label>
          <select 
            id="filter-stops" 
            value={filterByStops} 
            onChange={(e) => setFilterByStops(e.target.value)}
            className="filter-select"
          >
            <option value="all">Tümü</option>
            <option value="0">Direkt Uçuş</option>
            <option value="1">1 Aktarma</option>
            <option value="2">2 Aktarma</option>
          </select>
        </div>
      </div>

      <div className="flight-results">
        {filteredFlights.map((flight, index) => (
          <div 
            key={`${flight.id || index}`}
            className={`flight-card ${selectedFlight?.id === flight.id ? 'selected' : ''}`}
            onClick={() => handleFlightClick(flight)}
          >
            <div className="flight-header">
              <div className="airline-info">
                {flight.airline?.logoUrl && (
                  <img 
                    src={flight.airline.logoUrl} 
                    alt={flight.airline.name}
                    className="airline-logo"
                  />
                )}
                <span className="airline">{flight.airline?.name || 'Unknown Airline'}</span>
              </div>
              <span className="price">{flight.price?.total || 'Price not available'}</span>
            </div>
            
            <div className="flight-details">
              <div className="flight-time">
                <div className="departure">
                  <span className="time">{flight.departure?.time || '--:--'}</span>
                  <span className="airport">{flight.departure?.airport || 'Unknown'}</span>
                </div>
                <div className="duration">
                  <span>{flight.duration || 'Duration not available'}</span>
                  <div className="flight-line">
                    <div className="flight-stops">
                      {Array(flight.stops + 1).fill('●').map((dot, i) => (
                        <span key={i} className="stop-dot">{dot}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="arrival">
                  <span className="time">{flight.arrival?.time || '--:--'}</span>
                  <span className="airport">{flight.arrival?.airport || 'Unknown'}</span>
                </div>
              </div>
              
              <div className="flight-info">
                <span className="flight-number">
                  Flight {flight.flightNumber || 'number not available'}
                </span>
                <span className="stops">
                  {flight.stops === 0 ? 'Direct' : `${flight.stops} stop(s)`}
                </span>
              </div>

              {selectedFlight?.id === flight.id && (
                <div className="flight-extended-details">
                  {loading ? (
                    <div className="loading">Loading details...</div>
                  ) : error ? (
                    <div className="error">{error}</div>
                  ) : selectedFlight ? (
                    <>
                      {selectedFlight.segments.map((segment, idx) => (
                        <div key={idx} className="segment">
                          <div className="segment-header">
                            <h4>Flight Segment {idx + 1}</h4>
                            <span className="segment-flight-number">
                              {segment.carrier.name} {segment.flightNumber}
                            </span>
                          </div>
                          
                          <div className="segment-details">
                            <div className="segment-departure">
                              <div className="time-location">
                                <span className="time">{segment.departure.time}</span>
                                <span className="date">{segment.departure.date}</span>
                                <span className="airport">{segment.departure.airport} ({segment.departure.code})</span>
                                {segment.departure.terminal && (
                                  <span className="terminal">Terminal {segment.departure.terminal}</span>
                                )}
                              </div>
                            </div>
                            
                            <div className="segment-duration">
                              <span>{segment.duration}</span>
                              <div className="flight-line">
                                <div className="plane-icon">✈</div>
                              </div>
                            </div>

                            <div className="segment-arrival">
                              <div className="time-location">
                                <span className="time">{segment.arrival.time}</span>
                                <span className="date">{segment.arrival.date}</span>
                                <span className="airport">{segment.arrival.airport} ({segment.arrival.code})</span>
                                {segment.arrival.terminal && (
                                  <span className="terminal">Terminal {segment.arrival.terminal}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {segment.aircraft?.name && (
                            <div className="aircraft-info">
                              <span>Aircraft: {segment.aircraft.name}</span>
                            </div>
                          )}
                        </div>
                      ))}

                      {selectedFlight.baggage && (
                        <div className="baggage-info">
                          <h4>Baggage Information</h4>
                          {selectedFlight.baggage.cabin && (
                            <div className="cabin-baggage">
                              <h5>Cabin Baggage:</h5>
                              <p>{selectedFlight.baggage.cabin}</p>
                            </div>
                          )}
                          {selectedFlight.baggage.checked && (
                            <div className="checked-baggage">
                              <h5>Checked Baggage:</h5>
                              <p>{selectedFlight.baggage.checked}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {selectedFlight.amenities && selectedFlight.amenities.length > 0 && (
                        <div className="amenities">
                          <h4>Flight Amenities</h4>
                          <ul>
                            {selectedFlight.amenities.map((amenity, idx) => (
                              <li key={idx}>{amenity}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default FlightResults 