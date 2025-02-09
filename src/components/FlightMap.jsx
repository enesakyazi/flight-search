import { useEffect, useState } from 'react'
import { GoogleMap, useJsApiLoader, Polyline, Marker } from '@react-google-maps/api'

const libraries = ['places']

const mapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  mapTypeControl: true,
  streetViewControl: false,
  fullscreenControl: true,
  styles: [
    {
      featureType: 'water',
      elementType: 'geometry',
      stylers: [{ color: '#193341' }]
    },
    {
      featureType: 'landscape',
      elementType: 'geometry',
      stylers: [{ color: '#2c5a71' }]
    }
  ]
}

const FlightMap = ({ flights = [], selectedFlight }) => {
  const [map, setMap] = useState(null)

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries
  })

  const mapContainerStyle = {
    width: '100%',
    height: '400px',
    borderRadius: '8px'
  }

  const center = {
    lat: 39.9334,
    lng: 32.8597
  }

  const getFlightPath = (flight) => {
    if (!flight?.departure || !flight?.arrival) {
      console.log('Missing departure or arrival data:', flight)
      return null
    }

    const departureCoords = {
      lat: parseFloat(flight.departure.latitude),
      lng: parseFloat(flight.departure.longitude)
    }

    const arrivalCoords = {
      lat: parseFloat(flight.arrival.latitude),
      lng: parseFloat(flight.arrival.longitude)
    }

    console.log('Flight coordinates:', {
      departure: departureCoords,
      arrival: arrivalCoords,
      flight: flight
    })

    if (isNaN(departureCoords.lat) || isNaN(departureCoords.lng) ||
        isNaN(arrivalCoords.lat) || isNaN(arrivalCoords.lng)) {
      console.log('Invalid coordinates:', { departureCoords, arrivalCoords })
      return null
    }

    return [departureCoords, arrivalCoords]
  }

  useEffect(() => {
    if (map && flights.length > 0) {
      const bounds = new window.google.maps.LatLngBounds()
      let hasValidPath = false

      flights.forEach(flight => {
        const path = getFlightPath(flight)
        if (path) {
          path.forEach(point => {
            bounds.extend(point)
            hasValidPath = true
          })
        }
      })

      if (hasValidPath) {
        map.fitBounds(bounds)
        map.setZoom(map.getZoom() - 0.5)
      }
    }
  }, [map, flights])

  if (!isLoaded) return <div>Harita yükleniyor...</div>

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={center}
      zoom={6}
      onLoad={setMap}
      options={mapOptions}
    >
      {flights.map((flight, index) => {
        const path = getFlightPath(flight)
        if (!path) return null

        const isSelected = selectedFlight?.id === flight.id
        const strokeColor = isSelected ? '#FF0000' : '#2196F3'

        return (
          <div key={flight.id || index}>
            <Polyline
              path={path}
              options={{
                strokeColor,
                strokeWeight: isSelected ? 3 : 2,
                geodesic: true
              }}
            />
            {flight.departure && (
              <Marker
                position={{
                  lat: parseFloat(flight.departure.latitude),
                  lng: parseFloat(flight.departure.longitude)
                }}
                title={`${flight.departure.airport} (${flight.departure.code})`}
                label={{
                  text: flight.departure.code,
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}
                icon={{
                  url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png'
                }}
              />
            )}
            {flight.arrival && (
              <Marker
                position={{
                  lat: parseFloat(flight.arrival.latitude),
                  lng: parseFloat(flight.arrival.longitude)
                }}
                title={`${flight.arrival.airport} (${flight.arrival.code})`}
                label={{
                  text: flight.arrival.code,
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}
                icon={{
                  url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png'
                }}
              />
            )}
          </div>
        )
      })}
    </GoogleMap>
  )
}

export default FlightMap 