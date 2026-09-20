import { MapPin, Star, UtensilsCrossed, Clock, ExternalLink, Navigation, Bookmark, BookmarkCheck } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatDistance, truncate } from '@/utils/format';

export function RestaurantCard({ restaurant, onSave, saved = false, onDirections }) {
  const handleSave = (e) => { e.stopPropagation(); onSave?.(restaurant); };
  const handleDirections = (e) => { e.stopPropagation(); onDirections?.(restaurant); };

  return (
    <Card hover className="overflow-hidden flex flex-col h-full group">
      <div className="relative h-40 bg-gradient-to-br from-secondary-100 to-warning-100 dark:from-secondary-950/40 dark:to-warning-950/40 flex items-center justify-center overflow-hidden">
        {restaurant.image ? (
          <img src={restaurant.image} alt={restaurant.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
        ) : (
          <UtensilsCrossed className="w-12 h-12 text-secondary-400/50" />
        )}
        <div className="absolute top-3 left-3 flex gap-2">
          {restaurant.cuisine && <Badge variant="warning" size="xs">{restaurant.cuisine}</Badge>}
          {restaurant.open_now === true && <Badge variant="success" size="xs" dot>Open</Badge>}
          {restaurant.open_now === false && <Badge variant="error" size="xs">Closed</Badge>}
        </div>
        <button
          onClick={handleSave}
          className="absolute top-3 right-3 w-9 h-9 rounded-lg bg-white/90 dark:bg-gray-900/90 backdrop-blur flex items-center justify-center shadow-sm hover:scale-110 transition"
        >
          {saved ? <BookmarkCheck className="w-4 h-4 text-secondary-600" /> : <Bookmark className="w-4 h-4 text-gray-600 dark:text-gray-300" />}
        </button>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-bold text-base leading-snug mb-1 line-clamp-1">{restaurant.name}</h3>
        <p className="text-xs text-gray-500 mb-3 flex items-start gap-1.5">
          <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span className="line-clamp-2">{restaurant.address || 'Address not available'}</span>
        </p>

        <div className="flex flex-wrap gap-2 mb-3 text-xs">
          {restaurant.rating != null && (
            <span className="flex items-center gap-1 text-secondary-600 dark:text-secondary-400 font-semibold">
              <Star className="w-3.5 h-3.5 fill-current" /> {restaurant.rating.toFixed(1)}
            </span>
          )}
          {restaurant.distance != null && <span className="text-gray-400">{formatDistance(restaurant.distance)}</span>}
          {restaurant.price_level && <span className="text-gray-500">{'$'.repeat(restaurant.price_level)}</span>}
        </div>

        {restaurant.opening_hours && (
          <p className="text-xs text-gray-400 flex items-center gap-1.5 mb-3">
            <Clock className="w-3.5 h-3.5" /> {restaurant.opening_hours}
          </p>
        )}

        <p className="text-xs text-gray-500 mb-4 flex-1">{truncate(restaurant.description, 80)}</p>

        <div className="flex gap-2 mt-auto">
          {restaurant.website && (
            <a href={restaurant.website} target="_blank" rel="noopener noreferrer" className="flex-1">
              <Button variant="secondary" size="sm" fullWidth leftIcon={<ExternalLink className="w-3.5 h-3.5" />}>Website</Button>
            </a>
          )}
          <Button variant="outline" size="sm" fullWidth onClick={handleDirections} leftIcon={<Navigation className="w-3.5 h-3.5" />}>Directions</Button>
        </div>
      </div>
    </Card>
  );
}

export default RestaurantCard;
