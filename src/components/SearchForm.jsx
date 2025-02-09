import { useState } from "react";
import { searchFlights, searchAirports } from "../services/flightService";

const SearchForm = ({ setFlights, setLoading, setError }) => {
  const [searchData, setSearchData] = useState({
    origin: "",
    destination: "",
    departureDate: "",
    returnDate: "",
    isRoundTrip: true,
  });

  const [suggestions, setSuggestions] = useState({
    origin: [],
    destination: [],
  });

  const [typingTimeout, setTypingTimeout] = useState(null);

  const handleSearch = async (field, value) => {
    if (value.length < 2) {
      setSuggestions((prev) => ({ ...prev, [field]: [] }));
      return;
    }

    try {
      const results = await searchAirports(value);
      setSuggestions((prev) => ({
        ...prev,
        [field]: results.map((airport) => ({
          code: airport.iata,
          name: `${airport.name} (${airport.iata})`,
        })),
      }));
    } catch (error) {
      console.error(`Error searching ${field} airports:`, error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSearchData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "origin" || name === "destination") {
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
      setTypingTimeout(
        setTimeout(() => {
          handleSearch(name, value);
        }, 300)
      );
    }
  };

  const handleSuggestionClick = (field, suggestion) => {
    setSearchData((prev) => ({
      ...prev,
      [field]: suggestion.code,
    }));
    setSuggestions((prev) => ({ ...prev, [field]: [] }));
  };

  const handleTripTypeChange = () => {
    setSearchData((prev) => ({
      ...prev,
      isRoundTrip: !prev.isRoundTrip,
      returnDate: !prev.isRoundTrip ? "" : prev.returnDate,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const results = await searchFlights({
        origin: searchData.origin,
        destination: searchData.destination,
        date: searchData.departureDate,
        returnDate: searchData.isRoundTrip ? searchData.returnDate : null,
      });
      setFlights(results);
    } catch (err) {
      setError(err.message);
      setFlights({ outbound: [], return: [] });
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <form onSubmit={handleSubmit} className="search-form">
      <div className="trip-type-toggle">
        <label className="radio-label">
          <input
            type="radio"
            name="tripType"
            checked={searchData.isRoundTrip}
            onChange={handleTripTypeChange}
          />
          Round Trip
        </label>
        <label className="radio-label">
          <input
            type="radio"
            name="tripType"
            checked={!searchData.isRoundTrip}
            onChange={handleTripTypeChange}
          />
          One Way
        </label>
      </div>
      <div className="form-wrapper">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="origin">Origin</label>
            <div className="input-container">
              <input
                type="text"
                id="origin"
                name="origin"
                value={searchData.origin}
                onChange={handleChange}
                placeholder="Enter origin city or airport"
                required
              />
              {suggestions.origin.length > 0 && (
                <ul className="suggestions-list">
                  {suggestions.origin.map((suggestion, index) => (
                    <li
                      key={index}
                      onClick={() =>
                        handleSuggestionClick("origin", suggestion)
                      }
                    >
                      {suggestion.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="destination">Destination</label>
            <div className="input-container">
              <input
                type="text"
                id="destination"
                name="destination"
                value={searchData.destination}
                onChange={handleChange}
                placeholder="Enter destination city or airport"
                required
              />
              {suggestions.destination.length > 0 && (
                <ul className="suggestions-list">
                  {suggestions.destination.map((suggestion, index) => (
                    <li
                      key={index}
                      onClick={() =>
                        handleSuggestionClick("destination", suggestion)
                      }
                    >
                      {suggestion.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <div className="form-row dates">
          <div className="form-group">
            <label htmlFor="departureDate">Departure</label>
            <input
              type="date"
              id="departureDate"
              name="departureDate"
              value={searchData.departureDate}
              onChange={handleChange}
              min={today}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="returnDate">Return</label>
            <input
              type="date"
              id="returnDate"
              name="returnDate"
              value={searchData.returnDate}
              onChange={handleChange}
              min={searchData.departureDate || today}
              disabled={!searchData.isRoundTrip}
              required={searchData.isRoundTrip}
            />
          </div>
        </div>
      </div>
      <button type="submit" className="search-button">
        Search Flights
      </button>
    </form>
  );
};

export default SearchForm;
