import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plane, Plus, MapPin, Calendar, Users, Trash2, ArrowRight, Sparkles } from 'lucide-react';
import { Button, Card, Badge, Skeleton, EmptyState, Modal } from '@/components/ui';
import { useToast } from '@/context/ToastContext';
import { api } from '@/services/api';
import { formatDate, formatCurrency, daysBetween } from '@/utils/format';

export default function SavedTrips() {
  const navigate = useNavigate();
  const toast = useToast();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.listTrips();
      setTrips(data);
    } catch { toast.error('Failed to load trips'); }
    finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.deleteTrip(deleteTarget);
      setTrips((t) => t.filter((trip) => trip.id !== deleteTarget));
      toast.success('Trip deleted');
    } catch { toast.error('Failed to delete trip'); }
    finally { setDeleteTarget(null); }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-950/30 py-8">
      <div className="container-app">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Badge variant="primary" className="mb-2"><Plane className="w-3.5 h-3.5" /> My Trips</Badge>
            <h1 className="font-display text-3xl font-extrabold">Saved trips</h1>
            <p className="text-gray-500 text-sm mt-1">{trips.length} {trips.length === 1 ? 'trip' : 'trips'} saved</p>
          </div>
          <Button onClick={() => navigate('/plan')} leftIcon={<Plus className="w-4 h-4" />}>New Trip</Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-56" />)}
          </div>
        ) : trips.length === 0 ? (
          <EmptyState
            icon={Plane}
            title="No trips yet"
            description="Plan your first AI-powered trip and it will appear here"
            action={<Button onClick={() => navigate('/plan')} leftIcon={<Sparkles className="w-4 h-4" />}>Plan a Trip</Button>}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip, i) => (
              <Card key={trip.id} hover className="overflow-hidden cursor-pointer group animate-fade-in-up" style={{ animationDelay: `${i * 60}ms` }} onClick={() => navigate(`/trips/${trip.id}`)}>
                <div className="relative h-32 bg-gradient-to-br from-primary-500 to-accent-500 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-950/60 to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                    <div>
                      <h3 className="font-bold text-white text-lg">{trip.destination}</h3>
                      <p className="text-white/70 text-xs flex items-center gap-1"><MapPin className="w-3 h-3" /> {trip.travel_style}</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteTarget(trip.id); }}
                      className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center text-white hover:bg-error-500 transition opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-3">
                    {trip.start_date && (
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(trip.start_date)}</span>
                    )}
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {trip.duration || (trip.start_date && trip.end_date ? daysBetween(trip.start_date, trip.end_date) : '?')} days</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {trip.travelers}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-primary-600">{formatCurrency(trip.budget, trip.currency)}</span>
                    <span className="text-xs text-gray-400 group-hover:text-primary-600 transition flex items-center gap-1">
                      View <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete trip?" size="sm"
          footer={
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
              <Button variant="danger" onClick={handleDelete} leftIcon={<Trash2 className="w-4 h-4" />}>Delete</Button>
            </div>
          }
        >
          <p className="text-sm text-gray-500">This will permanently delete your trip and all itinerary data. This cannot be undone.</p>
        </Modal>
      </div>
    </div>
  );
}
