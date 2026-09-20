import { MapPin, Star, Clock, ExternalLink, Navigation, Bookmark, BookmarkCheck } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatDistance, truncate } from '@/utils/format';

export function PlaceCard({ place, onSave, saved = false, onDirections }) {
  const handleSave = (e) => { e.stopPropagation(); onSave?.(place); };
  const handleDirections = (e) => { e.stopPropagation(); onDirections?.(place); };

  return (
    <Card hover className="overflow-hidden flex flex-col h-full group">
      <div className="relative h-44 bg-gradient-to-br from-primary-100 to-accent-100 dark:from-primary-950/40 dark:to-accent-950/40 flex items-center justify-center overflow-hidden">
        {place.image ? (
          <img src={place.image} alt={place.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
        ) : (
          <MapPin className="w-12 h-12 text-primary-400/50" />
        )}
        <div className="absolute top-3 left-3 flex gap-2">
          {place.category && <Badge variant="primary" size="xs">{place.category}</Badge>}
        </div>
        <button
          onClick={handleSave}
          className="absolute top-3 right-3 w-9 h-9 rounded-lg bg-white/90 dark:bg-gray-900/90 backdrop-blur flex items-center justify-center shadow-sm hover:scale-110 transition"
        >
          {saved ? <BookmarkCheck className="w-4 h-4 text-primary-600" /> : <Bookmark className="w-4 h-4 text-gray-600 dark:text-gray-300" />}
        </button>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-bold text-base leading-snug mb-1 line-clamp-1">{place.name}</h3>
        <p className="text-xs text-gray-500 mb-3 flex items-start gap-1.5">
          <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span className="line-clamp-2">{place.address || 'Address not available'}</span>
        </p>

        <div className="flex flex-wrap gap-2 mb-3 text-xs">
          {place.rating != null && (
            <span className="flex items-center gap-1 text-secondary-600 dark:text-secondary-400 font-semibold">
              <Star className="w-3.5 h-3.5 fill-current" /> {place.rating.toFixed(1)}
            </span>
          )}
          {place.distance != null && (
            <span className="text-gray-400">{formatDistance(place.distance)}</span>
          )}
        </div>

        {place.opening_hours && (
          <p className="text-xs text-gray-400 flex items-center gap-1.5 mb-3">
            <Clock className="w-3.5 h-3.5" /> {place.opening_hours}
          </p>
        )}

        <p className="text-xs text-gray-500 mb-4 flex-1">{truncate(place.description, 100)}</p>

        <div className="flex gap-2 mt-auto">
          {place.website && (
            <a href={place.website} target="_blank" rel="noopener noreferrer" className="flex-1">
              <Button variant="secondary" size="sm" fullWidth leftIcon={<ExternalLink className="w-3.5 h-3.5" />}>Website</Button>
            </a>
          )}
          <Button variant="outline" size="sm" fullWidth onClick={handleDirections} leftIcon={<Navigation className="w-3.5 h-3.5" />}>Directions</Button>
        </div>
      </div>
    </Card>
  );
}

export default PlaceCard;
