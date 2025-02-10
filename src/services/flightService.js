const API_KEY = import.meta.env.VITE_RAPIDAPI_KEY
const BASE_URL = 'https://sky-scrapper.p.rapidapi.com/api'

// Debug log for API key
console.log('API Key loaded:', API_KEY ? 'Yes' : 'No')

const headers = {
  'X-RapidAPI-Key': API_KEY,
  'X-RapidAPI-Host': 'sky-scrapper.p.rapidapi.com',
  'Content-Type': 'application/json'
}

const getCityAirports = async (cityCode) => {
  try {
    const airports = await searchAirports(cityCode)
    return airports.filter(airport => 
      airport.type === 'AIRPORT' || 
      airport.navigation?.entityType === 'AIRPORT'
    ).map(airport => ({
      skyId: airport.iata,
      entityId: airport.navigation.entityId,
      name: airport.name
    }))
  } catch (error) {
    console.error(`Error getting airports for city ${cityCode}:`, error)
    return []
  }
}

const searchRoute = async (originAirport, destinationAirport, date) => {
  const url = `${BASE_URL}/v1/flights/searchFlights?originSkyId=${originAirport.skyId}&destinationSkyId=${destinationAirport.skyId}&originEntityId=${originAirport.entityId}&destinationEntityId=${destinationAirport.entityId}&date=${date}&adults=1&currency=USD&market=en-US&countryCode=US&cabinClass=economy`
  console.log(`Searching flights for route: ${originAirport.name} -> ${destinationAirport.name}`)

  try {
    const response = await fetch(url, { method: 'GET', headers })
    const data = await response.json()

    if (!response.ok || !data.status) {
      console.log(`No flights found for route: ${originAirport.name} -> ${destinationAirport.name}`)
      return { flights: [], sessionId: null }
    }

    return {
      flights: data.data?.itineraries || [],
      sessionId: data.sessionId
    }
  } catch (error) {
    console.error(`Error searching route ${originAirport.name} -> ${destinationAirport.name}:`, error)
    return { flights: [], sessionId: null }
  }
}

export const searchFlights = async ({ origin, destination, date, returnDate = null }) => {
  if (!API_KEY) {
    throw new Error('API key is not configured. Please check your environment variables.')
  }

  try {
    const originAirports = await getCityAirports(origin)
    const destinationAirports = await getCityAirports(destination)

    if (originAirports.length === 0 || destinationAirports.length === 0) {
      throw new Error('No airports found for the selected cities')
    }

    console.log('Found airports:', {
      origin: originAirports.map(a => a.name),
      destination: destinationAirports.map(a => a.name)
    })

    let allOutboundFlights = []
    let outboundSessionId = null

    for (const originAirport of originAirports) {
      for (const destinationAirport of destinationAirports) {
        const { flights, sessionId } = await searchRoute(originAirport, destinationAirport, date)
        if (flights.length > 0) {
          allOutboundFlights = [...allOutboundFlights, ...flights]
          outboundSessionId = sessionId 
        }
      }
    }

    const processedOutboundFlights = allOutboundFlights.map(itinerary => {
      const leg = itinerary.legs[0]
      const segment = leg.segments[0]

      const getCoordinates = (locationData) => {
        if (locationData.coordinates?.lat && locationData.coordinates?.lon) {
          return {
            latitude: locationData.coordinates.lat,
            longitude: locationData.coordinates.lon
          }
        }
        if (locationData.location?.latitude && locationData.location?.longitude) {
          return {
            latitude: locationData.location.latitude,
            longitude: locationData.location.longitude
          }
        }
        if (locationData.position?.latitude && locationData.position?.longitude) {
          return {
            latitude: locationData.position.latitude,
            longitude: locationData.position.longitude
          }
        }
        const airportCoordinates = {
          'LHR': { latitude: 51.4700, longitude: -0.4543 },
          'ESB': { latitude: 40.1281, longitude: 32.9951 },
          'IST': { latitude: 41.2818, longitude: 28.7388 },
          'SAW': { latitude: 40.8985, longitude: 29.3092 },
          'ADB': { latitude: 38.2924, longitude: 27.1570 }
        }
        return airportCoordinates[locationData.displayCode] || null
      }

      const departureCoords = getCoordinates(leg.origin)
      const arrivalCoords = getCoordinates(leg.destination)

      return {
        id: itinerary.id,
        sessionId: outboundSessionId,
        airline: {
          name: leg.carriers.marketing[0]?.name || 'Unknown Airline',
          logoUrl: leg.carriers.marketing[0]?.logoUrl
        },
        price: {
          total: itinerary.price.formatted,
          raw: itinerary.price.raw,
          currency: 'USD'
        },
        departure: {
          airport: leg.origin.name,
          code: leg.origin.displayCode,
          city: leg.origin.city,
          time: new Date(leg.departure).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          date: new Date(leg.departure).toLocaleDateString(),
          ...departureCoords
        },
        arrival: {
          airport: leg.destination.name,
          code: leg.destination.displayCode,
          city: leg.destination.city,
          time: new Date(leg.arrival).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          date: new Date(leg.arrival).toLocaleDateString(),
          ...arrivalCoords
        },
        duration: `${Math.floor(leg.durationInMinutes / 60)}h ${leg.durationInMinutes % 60}m`,
        stops: leg.stopCount,
        flightNumber: segment.flightNumber,
        tags: itinerary.tags || []
      }
    })

    if (!returnDate) {
      return {
        outbound: processedOutboundFlights,
        return: []
      }
    }

    let allReturnFlights = []
    let returnSessionId = null

    for (const originAirport of destinationAirports) {
      for (const destinationAirport of originAirports) {
        const { flights, sessionId } = await searchRoute(originAirport, destinationAirport, returnDate)
        if (flights.length > 0) {
          allReturnFlights = [...allReturnFlights, ...flights]
          returnSessionId = sessionId 
        }
      }
    }

    const processedReturnFlights = allReturnFlights.map(itinerary => {
      const leg = itinerary.legs[0]
      const segment = leg.segments[0]

      const getCoordinates = (locationData) => {
        if (locationData.coordinates?.lat && locationData.coordinates?.lon) {
          return {
            latitude: locationData.coordinates.lat,
            longitude: locationData.coordinates.lon
          }
        }
        if (locationData.location?.latitude && locationData.location?.longitude) {
          return {
            latitude: locationData.location.latitude,
            longitude: locationData.location.longitude
          }
        }
        if (locationData.position?.latitude && locationData.position?.longitude) {
          return {
            latitude: locationData.position.latitude,
            longitude: locationData.position.longitude
          }
        }
        const airportCoordinates = {
          'LHR': { latitude: 51.4700, longitude: -0.4543 },
          'ESB': { latitude: 40.1281, longitude: 32.9951 },
          'IST': { latitude: 41.2818, longitude: 28.7388 },
          'SAW': { latitude: 40.8985, longitude: 29.3092 },
          'ADB': { latitude: 38.2924, longitude: 27.1570 }
        }
        return airportCoordinates[locationData.displayCode] || null
      }

      const departureCoords = getCoordinates(leg.origin)
      const arrivalCoords = getCoordinates(leg.destination)

      return {
        id: itinerary.id,
        sessionId: returnSessionId,
        airline: {
          name: leg.carriers.marketing[0]?.name || 'Unknown Airline',
          logoUrl: leg.carriers.marketing[0]?.logoUrl
        },
        price: {
          total: itinerary.price.formatted,
          raw: itinerary.price.raw,
          currency: 'USD'
        },
        departure: {
          airport: leg.origin.name,
          code: leg.origin.displayCode,
          city: leg.origin.city,
          time: new Date(leg.departure).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          date: new Date(leg.departure).toLocaleDateString(),
          ...departureCoords
        },
        arrival: {
          airport: leg.destination.name,
          code: leg.destination.displayCode,
          city: leg.destination.city,
          time: new Date(leg.arrival).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          date: new Date(leg.arrival).toLocaleDateString(),
          ...arrivalCoords
        },
        duration: `${Math.floor(leg.durationInMinutes / 60)}h ${leg.durationInMinutes % 60}m`,
        stops: leg.stopCount,
        flightNumber: segment.flightNumber,
        tags: itinerary.tags || []
      }
    })

    return {
      outbound: processedOutboundFlights,
      return: processedReturnFlights
    }
  } catch (error) {
    console.error('Error fetching flights:', error)
    throw error
  }
}

export const searchAirports = async (query) => {
  try {
    const url = `${BASE_URL}/v1/flights/searchAirport?query=${encodeURIComponent(query)}&locale=en-US`
    console.log('Airport Search URL:', url) // Debug log

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': API_KEY,
        'X-RapidAPI-Host': 'sky-scrapper.p.rapidapi.com'
      }
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Airport Search Error:', errorData) 
      throw new Error(errorData || 'Failed to fetch airports')
    }

    const data = await response.text()
    console.log('Airport Search Response:', data) 
    const parsedData = JSON.parse(data)
    if (!parsedData.data || !Array.isArray(parsedData.data)) {
      return []
    }

    return parsedData.data.map(item => ({
      iata: item.skyId,
      name: item.presentation.title,
      city: item.presentation.title,
      subtitle: item.presentation.subtitle,
      type: item.navigation.entityType,
      fullName: item.presentation.suggestionTitle,
      navigation: {
        entityId: item.navigation.entityId,
        entityType: item.navigation.entityType,
        relevantFlightParams: item.navigation.relevantFlightParams
      }
    }))
  } catch (error) {
    console.error('Error fetching airports:', error)
    throw error
  }
}

export const getFlightDetails = async (flightId, sessionId) => {
  try {
    console.log('Getting flight details for:', { flightId, sessionId }) 

    const legs = {
      itineraryId: flightId,
      source: "GDS"
    }

    const url = `${BASE_URL}/v1/flights/getFlightDetails?legs=${encodeURIComponent(JSON.stringify([legs]))}&sessionId=${encodeURIComponent(sessionId)}&adults=1&currency=USD&locale=en-US&market=en-US&cabinClass=economy&countryCode=US`
    console.log('Flight Details URL:', url) 

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        ...headers,
        'accept': 'application/json'
      }
    })

    const responseText = await response.text()
    console.log('Raw response:', responseText) 

    if (!response.ok) {
      console.error('Response not OK:', response.status, responseText)
      throw new Error(responseText || 'Failed to fetch flight details')
    }

    let parsedData
    try {
      parsedData = JSON.parse(responseText)
      console.log('Parsed response:', parsedData) 
    } catch (e) {
      console.error('Failed to parse response:', e)
      throw new Error('Invalid response format')
    }

    if (!parsedData.status || !parsedData.data?.itinerary) {
      console.error('Invalid data structure:', parsedData)
      throw new Error(parsedData.message || 'No flight details available')
    }

    const itinerary = parsedData.data.itinerary
    const leg = itinerary.legs[0]
    const segments = leg.segments || []

    const details = {
      id: flightId,
      sessionId: sessionId,
      airline: {
        name: leg.carriers.marketing[0]?.name || 'Unknown Airline',
        code: leg.carriers.marketing[0]?.code,
        logo: leg.carriers.marketing[0]?.logoUrl
      },
      departure: {
        airport: leg.origin.name,
        code: leg.origin.displayCode,
        city: leg.origin.city,
        terminal: leg.origin.terminal,
        time: new Date(leg.departure).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        date: new Date(leg.departure).toLocaleDateString()
      },
      arrival: {
        airport: leg.destination.name,
        code: leg.destination.displayCode,
        city: leg.destination.city,
        terminal: leg.destination.terminal,
        time: new Date(leg.arrival).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        date: new Date(leg.arrival).toLocaleDateString()
      },
      duration: `${Math.floor(leg.durationInMinutes / 60)}h ${leg.durationInMinutes % 60}m`,
      stops: leg.stopCount,
      segments: segments.map(segment => ({
        id: segment.id,
        flightNumber: segment.flightNumber,
        aircraft: {
          name: segment.aircraft?.name,
          code: segment.aircraft?.code
        },
        departure: {
          airport: segment.origin.name,
          code: segment.origin.displayCode,
          terminal: segment.origin.terminal,
          time: new Date(segment.departure).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          date: new Date(segment.departure).toLocaleDateString()
        },
        arrival: {
          airport: segment.destination.name,
          code: segment.destination.displayCode,
          terminal: segment.destination.terminal,
          time: new Date(segment.arrival).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          date: new Date(segment.arrival).toLocaleDateString()
        },
        duration: `${Math.floor(segment.durationInMinutes / 60)}h ${segment.durationInMinutes % 60}m`,
        carrier: {
          name: segment.marketingCarrier?.name,
          code: segment.marketingCarrier?.code,
          logo: segment.marketingCarrier?.logoUrl
        }
      })),
      price: itinerary.price ? {
        total: itinerary.price.formatted,
        raw: itinerary.price.raw,
        currency: 'USD'
      } : null,
      baggage: {
        cabin: leg.baggageTypes?.cabin,
        checked: leg.baggageTypes?.checked
      },
      amenities: leg.amenities || [],
      tags: itinerary.tags || []
    }

    console.log('Returning flight details:', details) 
    return details
  } catch (error) {
    console.error('Error in getFlightDetails:', error)
    throw new Error(error.message || 'Failed to get flight details. Please try again later.')
  }
} 