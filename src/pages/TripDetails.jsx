import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Calendar, Users, Wallet, Sparkles, Trash2, RefreshCw,
  Map as MapIcon, Cloud, CloudRain, Sun, Star, Navigation, ExternalLink, List,
} from 'lucide-react';
import { Button, Card, Badge, Skeleton, Modal, Tabs, EmptyState, LoadingSpinner } from '@/components/ui';
import { ItineraryDay, ItineraryCard } from '@/components/ItineraryCard';
import { MapView } from '@/components/MapView';
import { WeatherCard } from '@/components/WeatherCard';
import { useToast } from '@/context/ToastContext';
import { api } from '@/services/api';
import { formatDate, formatCurrency, classNames } from '@/utils/format';

export default function TripDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [view, setView] = useState('itinerary');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getTrip(id);
      setTrip(data);
    } catch (err) {
      toast.error('Failed to load trip');
      navigate('/trips');
    } finally { setLoading(false); }
  }, [id, navigate, toast]);

  useEffect(() => { load(); }, [load]);

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const data = await api.regenerateItinerary(id);
      setTrip(data);
      toast.success('Itinerary regenerated with fresh data!');
    } catch (err) {
      toast.error(err.message || 'Failed to regenerate');
    } finally { setRegenerating(false); }
  };

  const handleDelete = async () => {
    try {
      await api.deleteTrip(id);
      toast.success('Trip deleted');
      navigate('/trips');
    } catch { toast.error('Failed to delete trip'); }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-950/30 py-8">
        <div className="container-app max-w-4xl space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!trip) return null;

  const allItems = trip.days?.flatMap((d) => d.items || []) || [];
  const mapMarkers = [
    ...(trip.destination_lat && trip.destination_lng ? [{ lat: trip.destination_lat, lng: trip.destination_lng, type: 'destination', popup: { title: trip.destination, subtitle: 'Destination' } }] : []),
    ...allItems.filter((i) => i.lat && i.lng).map((i) => ({
      lat: i.lat, lng: i.lng, type: i.category?.toLowerCase().includes('restaurant') ? 'restaurant' : 'attraction',
      popup: { title: i.name, subtitle: i.category, rating: i.rating },
    })),
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-950/30 py-8">
      <div className="container-app max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => navigate('/trips')} leftIcon={<ArrowLeft className="w-4 h-4" />}>My Trips</Button>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={handleRegenerate} loading={regenerating} leftIcon={!regenerating && <RefreshCw className="w-4 h-4" />}>
              Regenerate
            </Button>
            <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)} leftIcon={<Trash2 className="w-4 h-4" />}>Delete</Button>
          </div>
        </div>

        {/* Trip Header */}
        <Card className="overflow-hidden mb-6 animate-fade-in-up">
          <div className="bg-gradient-to-br from-primary-600 via-accent-600 to-primary-700 p-6 text-white relative overflow-hidden">
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-white/10 rounded-full" />
            <div className="relative">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="font-display text-2xl sm:text-3xl font-extrabold mb-2">{trip.destination}</h1>
                  <div className="flex flex-wrap gap-3 text-sm text-white/80">
                    {trip.start_date && <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {formatDate(trip.start_date)} → {formatDate(trip.end_date)}</span>}
                    <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {trip.travelers} travelers</span>
                    <span className="flex items-center gap-1"><Wallet className="w-4 h-4" /> {formatCurrency(trip.budget, trip.currency)}</span>
                  </div>
                </div>
                <Badge className="bg-white/20 text-white border-white/20">{trip.travel_style}</Badge>
              </div>
              {trip.interests && trip.interests.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {trip.interests.map((int) => (
                    <span key={int} className="px-2.5 py-1 text-xs font-semibold bg-white/15 rounded-full">{int}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* View Toggle */}
        <div className="flex gap-2 mb-6">
          <Button variant={view === 'itinerary' ? 'primary' : 'secondary'} size="sm" onClick={() => setView('itinerary')} leftIcon={<List className="w-4 h-4" />}>Itinerary</Button>
          <Button variant={view === 'map' ? 'primary' : 'secondary'} size="sm" onClick={() => setView('map')} leftIcon={<MapIcon className="w-4 h-4" />}>Map</Button>
          <Button variant={view === 'budget' ? 'primary' : 'secondary'} size="sm" onClick={() => setView('budget')} leftIcon={<Wallet className="w-4 h-4" />}>Budget</Button>
        </div>

        {view === 'itinerary' && (
          <div className="space-y-8">
            {trip.days && trip.days.length > 0 ? (
              trip.days.map((day, i) => (
                <ItineraryDay key={i} day={day} dayIndex={i} weather={day.weather} />
              ))
            ) : (
              <EmptyState
                icon={Sparkles}
                title="No itinerary yet"
                description="Generate an AI itinerary with real places for this trip"
                action={<Button onClick={handleRegenerate} loading={regenerating} leftIcon={<RefreshCw className="w-4 h-4" />}>Generate Itinerary</Button>}
              />
            )}
          </div>
        )}

        {view === 'map' && (
          <Card className="p-2 overflow-hidden">
            {mapMarkers.length > 0 ? (
              <MapView markers={mapMarkers} height="500px" />
            ) : (
              <EmptyState icon={MapIcon} title="No locations available" description="No place coordinates found in this itinerary" />
            )}
          </Card>
        )}

        {view === 'budget' && (
          <BudgetBreakdown trip={trip} />
        )}

        <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete trip?" size="sm"
          footer={
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setDeleteOpen(false)}>Cancel</Button>
              <Button variant="danger" onClick={handleDelete} leftIcon={<Trash2 className="w-4 h-4" />}>Delete</Button>
            </div>
          }
        >
          <p className="text-sm text-gray-500">This will permanently delete your trip to {trip.destination} and all its itinerary data. This cannot be undone.</p>
        </Modal>
      </div>
    </div>
  );
}

function BudgetBreakdown({ trip }) {
  const breakdown = trip.budget_breakdown || {};
  const categories = [
    { key: 'accommodation', label: 'Accommodation', icon: '🏨', color: 'bg-primary-500' },
    { key: 'food', label: 'Food & Dining', icon: '🍽️', color: 'bg-secondary-500' },
    { key: 'attractions', label: 'Attractions', icon: '🎭', color: 'bg-accent-500' },
    { key: 'transportation', label: 'Transportation', icon: '🚗', color: 'bg-success-500' },
    { key: 'other', label: 'Other', icon: '📋', color: 'bg-gray-400' },
  ];
  const total = Object.values(breakdown).reduce((a, b) => a + (b || 0), 0) || trip.budget;

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <h2 className="font-bold text-lg mb-1">Budget Breakdown</h2>
        <p className="text-xs text-gray-400 mb-6">Estimated allocation based on your travel style and destination</p>

        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-semibold">Total Budget</span>
            <span className="text-lg font-extrabold text-primary-600">{formatCurrency(trip.budget, trip.currency)}</span>
          </div>
          <div className="h-3 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden flex">
            {categories.map((cat) => {
              const val = breakdown[cat.key] || 0;
              const pct = total > 0 ? (val / total) * 100 : 0;
              return val > 0 && <div key={cat.key} className={cat.color} style={{ width: `${pct}%` }} />;
            })}
          </div>
        </div>

        <div className="space-y-3">
          {categories.map((cat) => {
            const val = breakdown[cat.key] || 0;
            const pct = total > 0 ? Math.round((val / total) * 100) : 0;
            return (
              <div key={cat.key} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-900">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{cat.icon}</span>
                  <div>
                    <p className="text-sm font-semibold">{cat.label}</p>
                    <p className="text-xs text-gray-400">{pct}% of total</p>
                  </div>
                </div>
                <span className="text-sm font-bold">{formatCurrency(val, trip.currency)}</span>
              </div>
            );
          })}
        </div>

        <div className="mt-6 p-3 rounded-xl bg-secondary-50 dark:bg-secondary-950/20 border border-secondary-200 dark:border-secondary-900">
          <p className="text-xs text-secondary-700 dark:text-secondary-400">
            <strong>AI Estimate:</strong> These figures are AI-generated estimates based on typical costs for {trip.travel_style?.toLowerCase()} travel.
            Actual prices may vary. Only prices retrieved from external APIs are labeled as verified.
          </p>
        </div>
      </Card>
    </div>
  );
}
