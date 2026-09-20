import { Droplets, Wind, Eye, Sunrise, Sunset, CloudRain, Thermometer, Gauge } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { weatherIconUrl, capitalize } from '@/utils/format';

export function WeatherCard({ weather }) {
  if (!weather) return null;
  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-br from-primary-500 via-accent-500 to-primary-600 p-6 text-white relative overflow-hidden">
        <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full" />
        <div className="absolute -bottom-12 -left-8 w-48 h-48 bg-white/5 rounded-full" />
        <div className="relative flex items-start justify-between">
          <div>
            <p className="text-sm font-medium opacity-90">{weather.location || 'Current location'}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-5xl font-extrabold">{Math.round(weather.temp)}°</span>
              {weather.icon && <img src={weatherIconUrl(weather.icon)} alt={weather.condition} className="w-16 h-16" />}
            </div>
            <p className="text-lg font-semibold mt-1">{capitalize(weather.condition)}</p>
            <p className="text-sm opacity-80">Feels like {Math.round(weather.feels_like)}°C</p>
          </div>
        </div>
      </div>

      <div className="p-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Metric icon={<Droplets className="w-4 h-4" />} label="Humidity" value={`${weather.humidity}%`} />
          <Metric icon={<Wind className="w-4 h-4" />} label="Wind" value={`${Math.round(weather.wind_speed)} m/s`} />
          <Metric icon={<CloudRain className="w-4 h-4" />} label="Rain" value={`${weather.rain_prob ?? 0}%`} />
          <Metric icon={<Eye className="w-4 h-4" />} label="Visibility" value={`${weather.visibility ?? '—'} m`} />
          <Metric icon={<Sunrise className="w-4 h-4" />} label="Sunrise" value={weather.sunrise || '—'} />
          <Metric icon={<Sunset className="w-4 h-4" />} label="Sunset" value={weather.sunset || '—'} />
        </div>
      </div>
    </Card>
  );
}

function Metric({ icon, label, value }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-gray-400 text-xs">{icon} {label}</div>
      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{value}</span>
    </div>
  );
}

export function ForecastCard({ forecast }) {
  if (!forecast || forecast.length === 0) return null;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
      {forecast.map((day, i) => (
        <Card key={i} className="p-4 text-center hover:shadow-card-hover transition">
          <p className="text-xs font-semibold text-gray-500 mb-2">{day.date}</p>
          {day.icon && <img src={weatherIconUrl(day.icon)} alt={day.condition} className="w-12 h-12 mx-auto" />}
          <p className="text-xs text-gray-400 mt-1">{capitalize(day.condition)}</p>
          <div className="flex justify-center gap-2 mt-2">
            <span className="text-sm font-bold">{Math.round(day.temp_max)}°</span>
            <span className="text-sm text-gray-400">{Math.round(day.temp_min)}°</span>
          </div>
          {day.rain_prob != null && (
            <p className="text-[10px] text-accent-500 mt-1 flex items-center justify-center gap-1">
              <CloudRain className="w-3 h-3" /> {day.rain_prob}%
            </p>
          )}
        </Card>
      ))}
    </div>
  );
}

export default WeatherCard;
