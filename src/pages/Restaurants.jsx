import { useState, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { UtensilsCrossed, Star, Map as MapIcon, SlidersHorizontal } from 'lucide-react';
import { Button, Card, Badge, SearchBar, SkeletonCard, EmptyState } from '@/components/ui';
import { RestaurantCard } from '@/components/RestaurantCard';
import { MapView } from '@/components/MapView';
import { useToast } from '@/context/ToastContext';
import { api } from '@/services/api';
import { useDebounce } from '@/hooks';

export default function Restaurants() {
  const location = useLocation();
  const toast = useToast();
  const [query, setQuery] = useState(location.state?.q || '');
  const [debouncedQuery] = useDebounce(query, 600);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cuisine, setCuisine] = useState('All');
  const [minRating, setMinRating] = useState(0);
  const [priceFilter, setPriceFilter] = useState(null);
  const [openNow, setOpenNow] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [savedIds, setSavedIds] = useState(new Set());

  useEffect(() => {
    const loadSaved = async () => {
      try {
        const saved = await api.listSavedRestaurants();
        setSavedIds(new Set(saved.map((s) => s.place_id || s.name)));
      } catch { /* ignore */ }
    };
    loadSaved();
  }, []);

  const search = useCallback(async (q) => {
    if (!q || q.length < 2) { setRestaurants([]); return; }
    setLoading(true);
    try {
      const res = await api.searchRestaurants({ q, limit: 30 });
      setRestaurants(res.results || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load restaurants');
      setRestaurants([]);
    } finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { search(debouncedQuery); }, [debouncedQuery, search]);

  const cuisines = ['All', ...new Set(restaurants.map((r) => r.cuisine).filter(Boolean))];

  const filtered = restaurants.filter((r) => {
    if (cuisine !== 'All' && r.cuisine !== cuisine) return false;
    if (minRating > 0 && (r.rating == null || r.rating < minRating)) return false;
    if (priceFilter != null && r.price_level !== priceFilter) return false;
    if (openNow && r.open_now !== true) return false;
    return true;
  });

  const handleSave = async (restaurant) => {
    try {
      await api.saveRestaurant({
        place_id: restaurant.id,
        name: restaurant.name,
        address: restaurant.address,
        lat: restaurant.lat,
        lng: restaurant.lng,
        cuisine: restaurant.cuisine,
        rating: restaurant.rating,
        price_level: restaurant.price_level,
        source: restaurant.source,
      });
      setSavedIds((s) => new Set([...s, restaurant.id || restaurant.name]));
      toast.success(`Saved "${restaurant.name}"`);
    } catch { toast.error('Failed to save restaurant'); }
  };

  const handleDirections = (r) => {
    if (r.lat && r.lng) window.open(`https://www.google.com/maps/dir/?api=1&destination=${r.lat},${r.lng}`, '_blank');
  };

  const mapMarkers = filtered.map((r) => ({
    lat: r.lat, lng: r.lng, type: 'restaurant',
    popup: { title: r.name, subtitle: r.cuisine, rating: r.rating },
  }));

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-950/30 py-8">
      <div className="container-app">
        <div className="mb-6">
          <Badge variant="warning" className="mb-2"><UtensilsCrossed className="w-3.5 h-3.5" /> Restaurants</Badge>
          <h1 className="font-display text-3xl font-extrabold mb-2">Find real restaurants</h1>
          <p className="text-gray-500 text-sm">Search any destination to discover real restaurants from Geoapify with cuisine, ratings, and hours</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <SearchBar
            value={query}
            onChange={setQuery}
            onSearch={(v) => search(v)}
            placeholder="Search restaurants near… e.g. 'Baga Beach' or 'Paris center'…"
            className="flex-1"
          />
          <Button variant={showMap ? 'primary' : 'secondary'} onClick={() => setShowMap((v) => !v)} leftIcon={<MapIcon className="w-4 h-4" />}>
            {showMap ? 'Map view' : 'List view'}
          </Button>
        </div>

        <Card className="p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-500">
              <SlidersHorizontal className="w-4 h-4" /> Filters:
            </div>
            {cuisines.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {cuisines.slice(0, 8).map((c) => (
                  <button key={c} onClick={() => setCuisine(c)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${cuisine === c ? 'bg-secondary-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 hover:bg-gray-200'}`}>
                    {c}
                  </button>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs text-gray-400">Rating:</span>
              {[0, 3, 4, 4.5].map((r) => (
                <button key={r} onClick={() => setMinRating(r)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg ${minRating === r ? 'bg-secondary-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200'}`}>
                  {r === 0 ? 'Any' : `${r}+`}
                </button>
              ))}
              <button onClick={() => setOpenNow((v) => !v)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${openNow ? 'bg-success-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200'}`}>
                Open now
              </button>
            </div>
          </div>
        </Card>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={UtensilsCrossed}
            title={query ? 'No restaurants found' : 'Start your search'}
            description={query ? 'Try a different location or adjust your filters' : 'Enter a location above to discover real restaurants'}
          />
        ) : showMap ? (
          <div className="space-y-4">
            <MapView markers={mapMarkers} height="500px" />
            <p className="text-xs text-gray-400 text-center">{filtered.length} restaurants on map</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-4">{filtered.length} restaurants found</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((r, i) => (
                <div key={i} className="animate-fade-in-up" style={{ animationDelay: `${i * 40}ms` }}>
                  <RestaurantCard restaurant={r} onSave={handleSave} saved={savedIds.has(r.id || r.name)} onDirections={handleDirections} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
