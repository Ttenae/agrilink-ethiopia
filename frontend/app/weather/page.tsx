'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { api } from '../../lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Cloud, CloudRain, Sun, Wind, Droplets, Thermometer,
  MapPin, Loader2, RefreshCw, Navigation
} from 'lucide-react';

interface WeatherData {
  region?: string;
  current: any;
  forecast: any[];
  alerts: any[];
  advisory: string[];
}

// ✅ Removed parentheses to prevent URL encoding errors
const CITIES = [
  'Addis Ababa', 'Adama', 'Jimma', 'Hawassa', 'Bahir Dar',
  'Gondar', 'Mekelle', 'Dire Dawa', 'Harar', 'Arba Minch',
  'Bishoftu', 'Nekemte', 'Asosa', 'Gambela', 'Semera'
];

export default function WeatherPage() {
  const { user } = useAuth();
  const [selectedLocation, setSelectedLocation] = useState('Adama');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);

  const fetchWeather = async (locName: string) => {
    setLoading(true);
    try {
      const response = await api.get(`/weather/region/${encodeURIComponent(locName)}`);
      setWeather(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch weather');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // ✅ Don't re-fetch if GPS was used
    if (selectedLocation !== 'My Current Location') {
      fetchWeather(selectedLocation);
    }
  }, [selectedLocation]);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await api.get(`/weather/full?lat=${latitude}&lon=${longitude}`);
          setWeather({
            ...response.data,
            region: 'My Current Location'
          });
          setSelectedLocation('My Current Location');
          toast.success('Location found!');
        } catch (error) {
          toast.error('Failed to fetch weather for your location');
        } finally {
          setLocating(false);
        }
      },
      (error) => {
        setLocating(false);
        toast.error('Could not get your location. Please allow location access.');
      }
    );
  };

  const getWeatherIcon = (condition: string) => {
    if (condition?.toLowerCase().includes('rain')) return <CloudRain className="h-8 w-8 text-blue-500" />;
    if (condition?.toLowerCase().includes('cloud')) return <Cloud className="h-8 w-8 text-gray-500" />;
    return <Sun className="h-8 w-8 text-yellow-500" />;
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
            <div>
              <h1 className="text-3xl font-bold">Weather Advisory</h1>
              <p className="text-gray-600">Localized forecasts for your farm</p>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Button 
                onClick={handleUseMyLocation} 
                disabled={locating}
                className="flex-1 md:flex-none bg-green-600 hover:bg-green-700 text-white"
              >
                {locating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Navigation className="h-4 w-4 mr-2" />}
                My Location
              </Button>
              <Button onClick={() => fetchWeather(selectedLocation)} disabled={loading} variant="outline">
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          <Card className="mb-6">
            <CardContent className="p-4">
              <label className="text-sm font-medium mb-2 flex items-center gap-2 text-gray-700">
                <MapPin className="h-4 w-4" />
                Select Nearest Town
              </label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full p-3 border rounded-lg bg-white shadow-sm"
              >
                {CITIES.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
                {selectedLocation === 'My Current Location' && (
                   <option value="My Current Location">My Current Location</option>
                )}
              </select>
            </CardContent>
          </Card>

          {loading && (
            <div className="text-center py-12">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-green-600" />
              <p className="mt-4 text-gray-600">Loading weather...</p>
            </div>
          )}

          {weather && !loading && (
            <>
              <Card className="mb-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg opacity-90 flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        {weather.region || selectedLocation}
                      </p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-6xl font-bold">{Math.round(weather.current.temperature)}°C</span>
                        <span className="text-xl opacity-90">{weather.current.condition}</span>
                      </div>
                      <p className="text-sm opacity-80 capitalize mt-1">{weather.current.description}</p>
                    </div>
                    {getWeatherIcon(weather.current.condition)}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 border-t border-white/20 pt-6">
                    <div className="flex items-center gap-2">
                      <Droplets className="h-5 w-5 opacity-80" />
                      <div>
                        <p className="text-xs opacity-80">Humidity</p>
                        <p className="font-semibold">{weather.current.humidity}%</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Wind className="h-5 w-5 opacity-80" />
                      <div>
                        <p className="text-xs opacity-80">Wind</p>
                        <p className="font-semibold">{weather.current.windSpeed} km/h</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Thermometer className="h-5 w-5 opacity-80" />
                      <div>
                        <p className="text-xs opacity-80">Feels Like</p>
                        <p className="font-semibold">{Math.round(weather.current.feelsLike)}°C</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Sun className="h-5 w-5 opacity-80" />
                      <div>
                        <p className="text-xs opacity-80">UV Index</p>
                        <p className="font-semibold">{Math.round(weather.current.uvIndex)}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {weather.advisory && weather.advisory.length > 0 && (
                <Card className="mb-6 border-yellow-200 bg-yellow-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-yellow-800 text-lg">🌾 Crop Advisory</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {weather.advisory.map((advice: string, i: number) => (
                        <li key={i} className="text-yellow-800 flex items-start gap-2">
                          <span className="mt-1">•</span>
                          <span>{advice}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>7-Day Forecast</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {weather.forecast.map((day: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-4">
                          <span className="font-medium w-24">
                            {i === 0 ? 'Today' : new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          </span>
                          {getWeatherIcon(day.condition)}
                          <span className="text-sm capitalize text-gray-600 hidden sm:block">{day.description}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-blue-600 font-medium">💧 {Math.round(day.rainChance * 100)}%</span>
                          <span className="font-semibold w-16 text-right">{Math.round(day.tempMin)}° / {Math.round(day.tempMax)}°</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}