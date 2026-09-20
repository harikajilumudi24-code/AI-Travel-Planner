import { useState, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { MapPin, Star, Navigation, Map as MapIcon, List, Filter, SlidersHorizontal } from 'lucide-react';
import { Button, Card, Badge, SearchBar, SkeletonCard, EmptyState } from '@/components/ui';
import { PlaceCard } from '@/components/PlaceCard';
import { MapView } from '@/components/MapView';
import { useToast } from '@/context/ToastContext';
import { api } from '@/services/api';
import { useDebounce } from '@/hooks';

const categories = ['All', 'Tourist Attraction', 'Museum', 'Park', 'Beach', 'Historical', 'Entertainment', 'Shopping', 'Nature'];

export default function ExplorePlaces() {
  const location = useLocation();
  const toast = useToast();
  const [query, setQuery] = useState(location.state?.q || '');
  const [debouncedQuery] = useDebounce(query, 600);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState('All');
  const [minRating, setMinRating] = useState(0);
  const [maxDistance, setMaxDistance] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [savedIds, setSavedIds] = useState(new Set());

  useEffect(() => {
    const loadSaved = async () => {
      try {
        const saved = await api.listSavedPlaces();
        setSavedIds(new Set(saved.map((s) => s.place_id || s.name)));
      } catch { /* ignore */ }
    };
    loadSaved();
  }, []);

  const search = useCallback(async (q) => {
    if (!q || q.length < 2) { setPlaces([]); return; }
    setLoading(true);
    try {
      const res = await api.searchPlaces({ q, category: category !== 'All' ? category : undefined, limit: 30 });
      setPlaces(res.results || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load places');
      setPlaces([]);
    } finally { setLoading(false); }
  }, [category, toast]);

  useEffect(() => { search(debouncedQuery); }, [debouncedQuery, search]);

  const filtered = places.filter((p) => {
    if (minRating > 0 && (p.rating == null || p.rating < minRating)) return false;
    if (maxDistance != null && (p.distance == null || p.distance > maxDistance)) return false;
    return true;
  });

  const handleSave = async (place) => {
    try {
      await api.savePlace({
        place_id: place.id,
        name: place.name,
        address: place.address,
        lat: place.lat,
        lng: place.lng,
        category: place.category,
        rating: place.rating,
        source: place.source,
        image: place.image,
        website: place.website,
      });
      setSavedIds((s) => new Set([...s, place.id || place.name]));
      toast.success(`Saved "${place.name}"`);
    } catch (err) { toast.error('Failed to save place'); }
  };

  const handleDirections = (place) => {
    if (place.lat && place.lng) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`, '_blank');
    }
  };

  const mapMarkers = filtered.map((p) => ({
    lat: p.lat, lng: p.lng, type: 'attraction',
    popup: { title: p.name, subtitle: p.category, rating: p.rating },
  }));

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-950/30 py-8">
      <div className="container-app">
        <div className="mb-6">
          <Badge variant="primary" className="mb-2"><MapPin className="w-3.5 h-3.5" /> Explore Places</Badge>
          <h1 className="font-display text-3xl font-extrabold mb-2">Discover real places & attractions</h1>
          <p className="text-gray-500 text-sm">Search any destination to find real attractions from Geoapify with ratings, hours, and locations</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <SearchBar
            value={query}
            onChange={setQuery}
            onSearch={(v) => search(v)}
            placeholder="Search a destination, e.g. 'Paris' or 'Goa Beaches'…"
            className="flex-1"
            size="md"
          />
          <div className="flex gap-2">
            <Button variant={showMap ? 'primary' : 'secondary'} onClick={() => setShowMap((v) => !v)} leftIcon={<MapIcon className="w-4 h-4" />}>
              {showMap ? 'Map view' : 'List view'}
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-500">
              <SlidersHorizontal className="w-4 h-4" /> Filters:
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                    category === cat ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs text-gray-400">Min rating:</span>
              {[0, 3, 4, 4.5].map((r) => (
                <button
                  key={r}
                  onClick={() => setMinRating(r)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                    minRating === r ? 'bg-secondary-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {r === 0 ? 'Any' : `${r}+`}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={MapPin}
            title={query ? 'No places found' : 'Start your search'}
            description={query ? 'Try a different destination or adjust your filters' : 'Enter a destination above to discover real attractions'}
          />
        ) : showMap ? (
          <div className="space-y-4">
            <MapView markers={mapMarkers} height="500px" />
            <p className="text-xs text-gray-400 text-center">{filtered.length} places on map</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-4">{filtered.length} places found</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((place, i) => (
                <div key={i} className="animate-fade-in-up" style={{ animationDelay: `${i * 40}ms` }}>
                  <PlaceCard
                    place={place}
                    onSave={handleSave}
                    saved={savedIds.has(place.id || place.name)}
                    onDirections={handleDirections}
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
