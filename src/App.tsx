import React, { useState, useEffect } from "react";
import "./App.css";

// OpenWeatherMap API key
const API_KEY = "d93b6e9e77fd1e5a83d594d0b1cc7bec";

// Predefined list of selectable cities
const AVAILABLE_CITIES = [
  "Los Angeles, CA, US",
  "San Francisco, CA, US",
  "Austin, TX, US",
  "Lisbon, PT",
  "Auckland, NZ",
  "Columbus, Ohio",
] as const;

// Type definitions for weather data
interface Weather {
  temp: number;
  description: string;
  icon: string;
}

interface CityWeather {
  name: string;
  weather: Weather;
}

const App: React.FC = () => {
  // State with TypeScript types
  const [selectedCities, setSelectedCities] = useState<CityWeather[]>([]);
  const [currentLocationWeather, setCurrentLocationWeather] =
    useState<CityWeather | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load data on component mount
  useEffect(() => {
    // Load selected cities from localStorage
    const loadSelectedCities = () => {
      const savedCities = localStorage.getItem("selectedCities");
      if (savedCities) {
        const cities: string[] = JSON.parse(savedCities);
        fetchWeatherForCities(cities);
      } else {
        setLoading(false); // No saved cities, stop loading
      }
    };

    // Fetch weather for current location
    const getCurrentLocationWeather = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position: GeolocationPosition) => {
            const { latitude, longitude } = position.coords;
            fetchWeatherByCoordinates(latitude, longitude);
          },
          (err: GeolocationPositionError) => {
            setError("Unable to access your location.");
            setLoading(false);
          }
        );
      } else {
        setError("Geolocation is not supported by your browser.");
        setLoading(false);
      }
    };

    loadSelectedCities();
    getCurrentLocationWeather();
  }, []);

  // Save selected cities to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(
      "selectedCities",
      JSON.stringify(selectedCities.map((city) => city.name))
    );
  }, [selectedCities]);

  // Fetch weather data by coordinates (for current location)
  const fetchWeatherByCoordinates = async (lat: number, lon: number) => {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
      );
      const data = await response.json();
      if (data.cod === 200) {
        setCurrentLocationWeather({
          name: data.name,
          weather: {
            temp: Math.round(data.main.temp),
            description: data.weather[0].description,
            icon: data.weather[0].icon,
          },
        });
      } else {
        setError("Failed to fetch weather for your location.");
      }
    } catch (err) {
      setError("Error fetching weather data.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch weather data for a list of cities
  const fetchWeatherForCities = async (cities: string[]) => {
    setLoading(true);
    try {
      const promises = cities.map((city) =>
        fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${API_KEY}`
        )
          .then((res) => res.json())
          .then((data): CityWeather => {
            if (data.cod === 200) {
              return {
                name: city,
                weather: {
                  temp: Math.round(data.main.temp),
                  description: data.weather[0].description,
                  icon: data.weather[0].icon,
                },
              };
            }
            throw new Error(`Failed to fetch weather for ${city}`);
          })
      );
      const weatherData = await Promise.all(promises);
      setSelectedCities(weatherData);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Add a city to the selected list
  const addCity = async (city: string) => {
    if (!selectedCities.some((c) => c.name === city)) {
      setLoading(true);
      try {
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${API_KEY}`
        );
        const data = await response.json();
        if (data.cod === 200) {
          const newCityWeather: CityWeather = {
            name: city,
            weather: {
              temp: Math.round(data.main.temp),
              description: data.weather[0].description,
              icon: data.weather[0].icon,
            },
          };
          setSelectedCities([...selectedCities, newCityWeather]);
        } else {
          setError(`Failed to add ${city}.`);
        }
      } catch (err) {
        setError("Error adding city.");
      } finally {
        setLoading(false);
      }
    }
  };

  // Remove a city from the selected list
  const removeCity = (cityName: string) => {
    setSelectedCities(selectedCities.filter((city) => city.name !== cityName));
  };

  // Filter available cities to exclude already selected ones
  const availableToAdd = AVAILABLE_CITIES.filter(
    (city) => !selectedCities.some((c) => c.name === city)
  );

  return (
    <div className="app">
      <h1>Weather Dashboard</h1>

      {/* Loading and Error Messages */}
      {loading && <p className="loading">Loading...</p>}
      {error && <p className="error">{error}</p>}

      {/* Current Location Weather */}
      {currentLocationWeather && (
        <div className="weather-card">
          <h2>{currentLocationWeather.name}</h2>
          <p>Temperature: {currentLocationWeather.weather.temp}°C</p>
          <p>{currentLocationWeather.weather.description}</p>
          <img
            src={`http://openweathermap.org/img/wn/${currentLocationWeather.weather.icon}@2x.png`}
            alt="Weather icon"
          />
        </div>
      )}

      {/* Selected Cities */}
      <div className="selected-cities">
        <h2>Your Cities</h2>
        {selectedCities.length === 0 && !loading && (
          <p>No cities selected yet.</p>
        )}
        <div className="city-list">
          {selectedCities.map((city) => (
            <div key={city.name} className="weather-card">
              <h3>{city.name}</h3>
              <p>Temperature: {city.weather.temp}°C</p>
              <p>{city.weather.description}</p>
              <img
                src={`http://openweathermap.org/img/wn/${city.weather.icon}@2x.png`}
                alt="Weather icon"
              />
              <div className="remove-button">
                <button onClick={() => removeCity(city.name)}>Remove</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add City Section */}
      <div className="add-city">
        <h2>Add a City</h2>
        {availableToAdd.length === 0 ? (
          <p>All available cities are selected.</p>
        ) : (
          <div className="city-buttons">
            {availableToAdd.map((city) => (
              <button key={city} onClick={() => addCity(city)}>
                {city}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
