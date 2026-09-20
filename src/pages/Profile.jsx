import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Mail, Plane, MapPin, UtensilsCrossed, LogOut, Bookmark,
  Calendar, Edit2, Check, X, Trash2,
} from 'lucide-react';
import { Button, Card, Badge, Input, Tabs, EmptyState, Modal } from '@/components/ui';
import { PlaceCard } from '@/components/PlaceCard';
import { RestaurantCard } from '@/components/RestaurantCard';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { api } from '@/services/api';
import { formatDate } from '@/utils/format';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [savedPlaces, setSavedPlaces] = useState([]);
  const [savedRestaurants, setSavedRestaurants] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [deletePlace, setDeletePlace] = useState(null);
  const [deleteRestaurant, setDeleteRestaurant] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [places, restaurants, userTrips] = await Promise.all([
          api.listSavedPlaces().catch(() => []),
          api.listSavedRestaurants().catch(() => []),
          api.listTrips().catch(() => []),
        ]);
        setSavedPlaces(places);
        setSavedRestaurants(restaurants);
        setTrips(userTrips);
      } finally { setLoading(false); }
    };
    load();
  }, []);

  const handleLogout = () => { logout(); navigate('/'); toast.info('Signed out'); };

  const handleDeletePlace = async () => {
    if (!deletePlace) return;
    try {
      await api.deleteSavedPlace(deletePlace);
      setSavedPlaces((p) => p.filter((x) => x.id !== deletePlace));
      toast.success('Place removed');
    } catch { toast.error('Failed to remove'); }
    finally { setDeletePlace(null); }
  };

  const handleDeleteRestaurant = async () => {
    if (!deleteRestaurant) return;
    try {
      await api.deleteSavedRestaurant(deleteRestaurant);
      setSavedRestaurants((r) => r.filter((x) => x.id !== deleteRestaurant));
      toast.success('Restaurant removed');
    } catch { toast.error('Failed to remove'); }
    finally { setDeleteRestaurant(null); }
  };

  const handleDirections = (item) => {
    if (item.lat && item.lng) window.open(`https://www.google.com/maps/dir/?api=1&destination=${item.lat},${item.lng}`, '_blank');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-950/30 py-8">
      <div className="container-app max-w-4xl">
        {/* Profile Header */}
        <Card className="overflow-hidden mb-6 animate-fade-in-up">
          <div className="h-24 bg-gradient-to-br from-primary-500 via-accent-500 to-primary-600" />
          <div className="p-6">
            <div className="flex items-start gap-4 -mt-12">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-2xl font-extrabold border-4 border-white dark:border-gray-900 shrink-0">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1 pt-8">
                {editing ? (
                  <div className="flex gap-2 items-start">
                    <Input value={name} onChange={(e) => setName(e.target.value)} className="max-w-xs" />
                    <Button size="sm" onClick={() => { setEditing(false); toast.success('Profile updated'); }} leftIcon={<Check className="w-4 h-4" />}>Save</Button>
                    <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setName(user?.name || ''); }} leftIcon={<X className="w-4 h-4" />}>Cancel</Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div>
                      <h1 className="font-display text-2xl font-extrabold">{user?.name}</h1>
                      <p className="text-sm text-gray-500 flex items-center gap-1.5"><Mail className="w-4 h-4" /> {user?.email}</p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => setEditing(true)} leftIcon={<Edit2 className="w-4 h-4" />}>Edit</Button>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-6">
              <Stat icon={Plane} label="Trips" value={trips.length} />
              <Stat icon={MapPin} label="Saved Places" value={savedPlaces.length} />
              <Stat icon={UtensilsCrossed} label="Restaurants" value={savedRestaurants.length} />
            </div>

            <div className="mt-6 flex justify-end">
              <Button variant="danger" size="sm" onClick={handleLogout} leftIcon={<LogOut className="w-4 h-4" />}>Logout</Button>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <Tabs
          tabs={[
            { label: 'Saved Places', content: (
              <div>
                {loading ? <p className="text-gray-400 text-sm">Loading…</p> :
                  savedPlaces.length === 0 ? (
                    <EmptyState icon={MapPin} title="No saved places" description="Save places from the Explore page and they'll appear here" />
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {savedPlaces.map((p) => (
                        <div key={p.id} className="relative">
                          <PlaceCard place={p} onDirections={handleDirections} />
                          <button onClick={() => setDeletePlace(p.id)} className="absolute top-3 right-14 w-8 h-8 rounded-lg bg-white/90 dark:bg-gray-900/90 flex items-center justify-center shadow-sm hover:bg-error-50 dark:hover:bg-error-950/30 text-gray-400 hover:text-error-500 transition z-10">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )
                }
              </div>
            )},
            { label: 'Saved Restaurants', content: (
              <div>
                {loading ? <p className="text-gray-400 text-sm">Loading…</p> :
                  savedRestaurants.length === 0 ? (
                    <EmptyState icon={UtensilsCrossed} title="No saved restaurants" description="Save restaurants from the Restaurants page and they'll appear here" />
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {savedRestaurants.map((r) => (
                        <div key={r.id} className="relative">
                          <RestaurantCard restaurant={r} onDirections={handleDirections} />
                          <button onClick={() => setDeleteRestaurant(r.id)} className="absolute top-3 right-14 w-8 h-8 rounded-lg bg-white/90 dark:bg-gray-900/90 flex items-center justify-center shadow-sm hover:bg-error-50 text-gray-400 hover:text-error-500 transition z-10">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )
                }
              </div>
            )},
            { label: 'My Trips', content: (
              <div>
                {loading ? <p className="text-gray-400 text-sm">Loading…</p> :
                  trips.length === 0 ? (
                    <EmptyState icon={Plane} title="No trips yet" description="Plan your first AI-powered trip" action={<Button onClick={() => navigate('/plan')} leftIcon={<Bookmark className="w-4 h-4" />}>Plan a Trip</Button>} />
                  ) : (
                    <div className="space-y-3">
                      {trips.map((trip) => (
                        <Card key={trip.id} hover className="p-4 flex items-center justify-between cursor-pointer" onClick={() => navigate(`/trips/${trip.id}`)}>
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                              <Plane className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h4 className="font-bold text-sm">{trip.destination}</h4>
                              <p className="text-xs text-gray-500 flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> {trip.start_date ? formatDate(trip.start_date) : `${trip.duration} days`} · {trip.travelers} travelers
                              </p>
                            </div>
                          </div>
                          <Badge variant="primary" size="xs">{trip.travel_style}</Badge>
                        </Card>
                      ))}
                    </div>
                  )
                }
              </div>
            )},
          ]}
        />

        <Modal open={!!deletePlace} onClose={() => setDeletePlace(null)} title="Remove saved place?" size="sm"
          footer={<div className="flex gap-2 justify-end"><Button variant="secondary" onClick={() => setDeletePlace(null)}>Cancel</Button><Button variant="danger" onClick={handleDeletePlace}>Remove</Button></div>}>
          <p className="text-sm text-gray-500">Remove this place from your saved list?</p>
        </Modal>
        <Modal open={!!deleteRestaurant} onClose={() => setDeleteRestaurant(null)} title="Remove saved restaurant?" size="sm"
          footer={<div className="flex gap-2 justify-end"><Button variant="secondary" onClick={() => setDeleteRestaurant(null)}>Cancel</Button><Button variant="danger" onClick={handleDeleteRestaurant}>Remove</Button></div>}>
          <p className="text-sm text-gray-500">Remove this restaurant from your saved list?</p>
        </Modal>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="text-center p-3 rounded-xl bg-gray-50 dark:bg-gray-900">
      <Icon className="w-5 h-5 text-primary-500 mx-auto mb-1" />
      <p className="text-xl font-extrabold">{value}</p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  );
}
