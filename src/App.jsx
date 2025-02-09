import { useState } from 'react'
import './App.css'
import SearchForm from './components/SearchForm'
import FlightResults from './components/FlightResults'
import FlightMap from './components/FlightMap'

function App() {
  const [flights, setFlights] = useState({ outbound: [], return: [] })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedFlight, setSelectedFlight] = useState(null)

  const handleFlightSelect = (flight) => {
    setSelectedFlight(flight)
  }
  const currentFlights = flights.outbound.length > 0 ? flights.outbound : flights.return

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Flight Search</h1>
      </header>
      <main className="main-content">
        <SearchForm 
          setFlights={setFlights}
          setLoading={setLoading}
          setError={setError}
        />
        {loading && <div className="loading">Searching for flights...</div>}
        {error && <div className="error">{error}</div>}
        
        <div className="map-section">
          <FlightMap 
            flights={currentFlights}
            selectedFlight={selectedFlight}
          />
        </div>

        {(flights.outbound.length > 0 || flights.return.length > 0) && (
          <div className="all-flights">
            {flights.outbound.length > 0 && (
              <div className="flight-section">
                <h2>Outbound Flights</h2>
                <FlightResults 
                  flights={flights.outbound}
                  onFlightSelect={handleFlightSelect}
                />
              </div>
            )}
            {flights.return.length > 0 && (
              <div className="flight-section">
                <h2>Return Flights</h2>
                <FlightResults 
                  flights={flights.return}
                  onFlightSelect={handleFlightSelect}
                />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

export default App