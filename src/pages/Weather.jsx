import { useState, useCallback } from 'react';
import { Cloud, MapPin, Search } from 'lucide-react';
import { Button, Card, Badge, SearchBar, Skeleton, EmptyState } from '@/components/ui';
import { WeatherCard, ForecastCard } from '@/components/WeatherCard';
import { useToast } from '@/context/ToastContext';
import { api } from '@/services/api';
import { useDebounce } from '@/hooks';

export default function Weather() {
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [debouncedQuery] = useDebounce(query, 500);
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const fetchWeather = useCallback(async (q) => {
    if (!q || q.length < 2) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await api.getWeather({ q });
      setWeather(res.current);
      setForecast(res.forecast || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load weather');
      setWeather(null);
      setForecast([]);
    } finally { setLoading(false); }
  }, [toast]);

  const handleSubmit = () => fetchWeather(query);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-950/30 py-8">
      <div className="container-app max-w-5xl">
        <div className="mb-6">
          <Badge variant="accent" className="mb-2"><Cloud className="w-3.5 h-3.5" /> Live Weather</Badge>
          <h1 className="font-display text-3xl font-extrabold mb-2">Check live weather anywhere</h1>
          <p className="text-gray-500 text-sm">Real-time conditions and multi-day forecasts powered by OpenWeather — no invented data</p>
        </div>

        <div className="flex gap-3 mb-8">
          <SearchBar
            value={query}
            onChange={setQuery}
            onSearch={handleSubmit}
            placeholder="Search a city, e.g. 'London', 'Tokyo', 'Goa'…"
            className="flex-1"
            autoFocus
          />
          <Button onClick={handleSubmit} leftIcon={<Search className="w-4 h-4" />}>Search</Button>
        </div>

        {loading ? (
          <div className="space-y-6">
            <Skeleton className="h-64 w-full" />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
              {Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-36" />)}
            </div>
          </div>
        ) : weather ? (
          <div className="space-y-6 animate-fade-in-up">
            <WeatherCard weather={weather} />
            {forecast.length > 0 && (
              <div>
                <h2 className="font-bold text-lg mb-4">7-Day Forecast</h2>
                <ForecastCard forecast={forecast} />
              </div>
            )}
          </div>
        ) : searched ? (
          <EmptyState
            icon={Cloud}
            title="Weather unavailable"
            description="Unable to retrieve weather data for this location. Please try a different city name."
          />
        ) : (
          <EmptyState
            icon={MapPin}
            title="Search for a city"
            description="Enter a city name above to see current conditions and a 7-day forecast"
          />
        )}
      </div>
    </div>
  );
}
