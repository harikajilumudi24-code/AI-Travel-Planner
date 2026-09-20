import { MapPin, Star, Clock, Navigation, ExternalLink, Sun, Cloud, CloudRain } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export function ItineraryCard({ item, index }) {
  return (
    <Card className="overflow-hidden hover:shadow-card-hover transition-all duration-300">
      <div className="flex">
        <div className="bg-gradient-to-b from-primary-500 to-accent-500 text-white p-4 flex flex-col items-center justify-center min-w-[80px]">
          <span className="text-2xl font-extrabold">{index + 1}</span>
        </div>
        <div className="p-4 flex-1">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="min-w-0">
              <h4 className="font-bold text-sm leading-snug">{item.name}</h4>
              {item.time_slot && <p className="text-xs text-primary-600 dark:text-primary-400 font-semibold mt-0.5">{item.time_slot}</p>}
            </div>
            <div className="flex gap-1.5 shrink-0">
              {item.category && <Badge variant="primary" size="xs">{item.category}</Badge>}
            </div>
          </div>

          {item.address && (
            <p className="text-xs text-gray-500 flex items-start gap-1.5 mb-2">
              <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span className="line-clamp-2">{item.address}</span>
            </p>
          )}

          <div className="flex flex-wrap gap-3 text-xs text-gray-400 mb-3">
            {item.rating != null && (
              <span className="flex items-center gap-1 text-secondary-600 dark:text-secondary-400 font-semibold">
                <Star className="w-3 h-3 fill-current" /> {item.rating.toFixed(1)}
              </span>
            )}
            {item.duration && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {item.duration}</span>}
            {item.source && <Badge variant="default" size="xs">Source: {item.source}</Badge>}
          </div>

          <div className="flex gap-2">
            {item.website && (
              <a href={item.website} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1">
                <ExternalLink className="w-3 h-3" /> Website
              </a>
            )}
            {item.lat && item.lng && (
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${item.lat},${item.lng}`}
                target="_blank" rel="noopener noreferrer"
                className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
              >
                <Navigation className="w-3 h-3" /> Directions
              </a>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

export function ItineraryDay({ day, dayIndex, weather }) {
  return (
    <div className="animate-fade-in-up">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-950/40 flex items-center justify-center font-bold text-primary-600 dark:text-primary-400">
            {dayIndex + 1}
          </div>
          <div>
            <h3 className="font-bold text-lg">Day {dayIndex + 1}</h3>
            {day.date && <p className="text-xs text-gray-500">{day.date}</p>}
          </div>
        </div>
        {weather && (
          <div className="flex items-center gap-2 text-sm">
            {weather.rain_prob > 40 ? <CloudRain className="w-5 h-5 text-accent-500" /> : <Sun className="w-5 h-5 text-secondary-500" />}
            <span className="font-semibold">{Math.round(weather.temp_max)}° / {Math.round(weather.temp_min)}°</span>
          </div>
        )}
      </div>
      <div className="space-y-3">
        {day.items?.map((item, i) => <ItineraryCard key={i} item={item} index={i} />)}
      </div>
    </div>
  );
}

export default ItineraryCard;
