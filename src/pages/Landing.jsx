import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, MapPin, Cloud, UtensilsCrossed, Navigation, Search,
  Plane, Calendar, Users, Wallet, ArrowRight, Star, Globe,
  Sun, CloudRain, MapPinned, MessageSquare, ShieldCheck, Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SearchBar } from '@/components/ui/SearchBar';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { api } from '@/services/api';
import { useDebounce } from '@/hooks';

const HERO_IMG = 'https://images.pexels.com/photos/4784345/pexels-photo-4784345.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';

const popularDestinations = [
  { name: 'Bali, Indonesia', img: 'https://images.pexels.com/photos/32346148/pexels-photo-32346148.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', country: 'Indonesia', rating: 4.8 },
  { name: 'Maldives', img: 'https://images.pexels.com/photos/15923489/pexels-photo-15923489.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', country: 'Indian Ocean', rating: 4.9 },
  { name: 'Swiss Alps', img: 'https://images.pexels.com/photos/1325140/pexels-photo-1325140.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', country: 'Switzerland', rating: 4.7 },
  { name: 'Madrid, Spain', img: 'https://images.pexels.com/photos/22922043/pexels-photo-22922043.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', country: 'Spain', rating: 4.6 },
  { name: 'Budapest', img: 'https://images.pexels.com/photos/7513451/pexels-photo-7513451.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', country: 'Hungary', rating: 4.7 },
  { name: 'Copenhagen', img: 'https://images.pexels.com/photos/11064392/pexels-photo-11064392.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', country: 'Denmark', rating: 4.5 },
];

const features = [
  { icon: Sparkles, title: 'AI Trip Planner', desc: 'Generate personalized day-by-day itineraries with real places, restaurants, and weather-aware recommendations.', color: 'from-primary-500 to-accent-500' },
  { icon: MessageSquare, title: 'AI Travel Assistant', desc: 'Chat naturally about destinations, ask for restaurant suggestions, weather updates, and budget tips.', color: 'from-secondary-500 to-warning-500' },
  { icon: MapPinned, title: 'Explore Real Places', desc: 'Discover attractions, restaurants, and hotels from live Geoapify data with ratings, hours, and distances.', color: 'from-success-500 to-primary-500' },
  { icon: Cloud, title: 'Live Weather', desc: 'Check current conditions and multi-day forecasts to plan weather-aware activities and avoid surprises.', color: 'from-accent-500 to-primary-600' },
  { icon: Navigation, title: 'Interactive Maps', desc: 'Browse destinations on interactive Leaflet maps with markers, popups, and Google Maps directions.', color: 'from-primary-600 to-secondary-500' },
  { icon: ShieldCheck, title: 'Real Data Only', desc: 'No fabricated information. All places, weather, and travel data come from verified external APIs.', color: 'from-success-600 to-accent-600' },
];

const travelStyles = ['Budget', 'Comfort', 'Luxury', 'Adventure', 'Family', 'Solo', 'Romantic'];

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 350);

  const [quickForm, setQuickForm] = useState({
    destination: '', duration: 5, travelers: 2, style: 'Comfort',
  });

  useEffect(() => {
    if (!debouncedQuery || typeof debouncedQuery !== 'string' || debouncedQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    let isMounted = true;
    const fetchSuggestions = async () => {
      setSearchLoading(true);
      try {
        const res = await api.search(debouncedQuery.trim());
        if (isMounted) {
          setSuggestions(Array.isArray(res?.results) ? res.results : []);
        }
      } catch {
        if (isMounted) {
          setSuggestions([]);
        }
      } finally {
        if (isMounted) {
          setSearchLoading(false);
        }
      }
    };
    fetchSuggestions();
    return () => {
      isMounted = false;
    };
  }, [debouncedQuery]);

  const handleDestinationSelect = (s) => {
    if (!s) return;
    const destName = typeof s === 'string' ? s : (s.name || s.label || '');
    setQuery(destName);
    setQuickForm((f) => ({ ...f, destination: destName }));
  };

  const handleQuickPlan = () => {
    if (!quickForm.destination) { toast.error('Please enter a destination first'); return; }
    if (!user) { toast.info('Sign up to plan and save your trip'); navigate('/register'); return; }
    navigate('/plan', { state: { prefill: quickForm } });
  };

  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-[92vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={HERO_IMG} alt="Tropical destination" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-gray-950/70 via-gray-950/50 to-white dark:to-gray-950" />
        </div>

        <div className="relative container-app pt-20 pb-16">
          <div className="max-w-3xl animate-fade-in-up">
            <Badge variant="primary" size="md" className="mb-5 backdrop-blur bg-white/20 text-white border border-white/20">
              <Sparkles className="w-3.5 h-3.5" /> Powered by Groq Llama 3.3 + RAG
            </Badge>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] mb-5">
              Plan smarter trips<br />with <span className="bg-gradient-to-r from-primary-400 to-accent-300 bg-clip-text text-transparent">AI-powered</span> travel
            </h1>
            <p className="text-lg text-white/80 mb-8 max-w-xl leading-relaxed">
              Discover real places, check live weather, chat with an AI travel assistant,
              and generate personalized day-by-day itineraries — all backed by real data.
            </p>

            <div className="max-w-2xl">
              <SearchBar
                value={query}
                onChange={setQuery}
                onSearch={() => query && navigate('/explore', { state: { q: query } })}
                suggestions={suggestions}
                onSuggestionSelect={handleDestinationSelect}
                loading={searchLoading}
                placeholder="Where do you want to go? Try 'Goa', 'Paris', 'Tokyo'…"
                size="lg"
                className="shadow-xl"
              />
              <div className="flex flex-wrap gap-2 mt-4">
                {['Goa', 'Paris', 'Tokyo', 'Bali', 'Barcelona'].map((dest) => (
                  <button
                    key={dest}
                    onClick={() => { setQuery(dest); navigate('/explore', { state: { q: dest } }); }}
                    className="px-3 py-1.5 text-sm text-white/90 bg-white/10 hover:bg-white/20 backdrop-blur rounded-lg border border-white/10 transition"
                  >
                    {dest}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-4 mt-8">
              <Button size="lg" onClick={() => navigate(user ? '/plan' : '/register')} rightIcon={<ArrowRight className="w-4 h-4" />}>
                <Sparkles className="w-4 h-4" /> Plan your trip with AI
              </Button>
              <Button size="lg" variant="secondary" onClick={() => navigate('/explore')} className="bg-white/10 text-white border-white/20 hover:bg-white/20 backdrop-blur">
                <MapPin className="w-4 h-4" /> Explore Places
              </Button>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white dark:from-gray-950 to-transparent pointer-events-none" />
      </section>

      {/* Quick Trip Planner */}
      <section className="container-app -mt-12 relative z-10 mb-20">
        <Card className="p-6 sm:p-8 shadow-card-hover animate-fade-in-up">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg">Quick Trip Planner</h2>
              <p className="text-xs text-gray-500">Start planning in seconds</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Destination</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={quickForm.destination}
                  onChange={(e) => setQuickForm((f) => ({ ...f, destination: e.target.value }))}
                  placeholder="e.g. Goa"
                  className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Duration (days)</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="number" min={1} max={30}
                  value={quickForm.duration}
                  onChange={(e) => setQuickForm((f) => ({ ...f, duration: parseInt(e.target.value) || 1 }))}
                  className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Travelers</label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="number" min={1} max={20}
                  value={quickForm.travelers}
                  onChange={(e) => setQuickForm((f) => ({ ...f, travelers: parseInt(e.target.value) || 1 }))}
                  className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Style</label>
              <select
                value={quickForm.style}
                onChange={(e) => setQuickForm((f) => ({ ...f, style: e.target.value }))}
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              >
                {travelStyles.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <Button onClick={handleQuickPlan} size="lg" fullWidth className="mt-5" rightIcon={<ArrowRight className="w-4 h-4" />}>
            Generate My Trip
          </Button>
        </Card>
      </section>

      {/* Popular Destinations */}
      <section className="container-app mb-20">
        <div className="text-center mb-10">
          <Badge variant="primary" className="mb-3"><Globe className="w-3.5 h-3.5" /> Trending Now</Badge>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold mb-3">Popular Destinations</h2>
          <p className="text-gray-500 max-w-lg mx-auto">Explore some of the world's most loved travel spots, backed by real data</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {popularDestinations.map((dest, i) => (
            <Card key={dest.name} hover className="overflow-hidden group cursor-pointer animate-fade-in-up" onClick={() => navigate('/explore', { state: { q: dest.name } })} style={{ animationDelay: `${i * 80}ms` }}>
              <div className="relative h-56 overflow-hidden">
                <img src={dest.img} alt={dest.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-950/80 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-white text-lg">{dest.name}</h3>
                      <p className="text-white/70 text-sm">{dest.country}</p>
                    </div>
                    <span className="flex items-center gap-1 text-white font-semibold text-sm bg-white/20 backdrop-blur px-2.5 py-1 rounded-lg">
                      <Star className="w-3.5 h-3.5 fill-secondary-400 text-secondary-400" /> {dest.rating}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 dark:bg-gray-950/50 py-20">
        <div className="container-app">
          <div className="text-center mb-12">
            <Badge variant="accent" className="mb-3"><Sparkles className="w-3.5 h-3.5" /> Everything You Need</Badge>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold mb-3">One platform for your entire trip</h2>
            <p className="text-gray-500 max-w-lg mx-auto">From AI planning to real-time data, VoyageAI handles every step of your journey</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <Card key={f.title} hover className="p-6 group animate-fade-in-up" style={{ animationDelay: `${i * 60}ms` }}>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* AI Assistant Section */}
      <section className="container-app py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-in-up">
            <Badge variant="secondary" className="mb-3"><MessageSquare className="w-3.5 h-3.5" /> AI Travel Assistant</Badge>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold mb-4">Chat with your AI travel guide</h2>
            <p className="text-gray-500 mb-6 leading-relaxed">
              Ask anything in natural language. The AI understands your intent, retrieves real data from
              Geoapify, OpenWeather, and Tavily, then generates grounded responses — no hallucinations.
            </p>
            <div className="space-y-3 mb-8">
              {[
                'Plan a 5 day trip to Goa for 2 people',
                'Find restaurants near Baga Beach',
                'What will the weather be tomorrow in Paris?',
                'Give me a budget-friendly itinerary for Bali',
              ].map((q) => (
                <div key={q} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
                  <Sparkles className="w-4 h-4 text-primary-500 shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">"{q}"</span>
                </div>
              ))}
            </div>
            <Button size="lg" onClick={() => navigate(user ? '/assistant' : '/register')} rightIcon={<ArrowRight className="w-4 h-4" />}>
              Try the AI Assistant
            </Button>
          </div>

          <div className="animate-fade-in-up" style={{ animationDelay: '120ms' }}>
            <Card className="p-6 shadow-card-hover">
              <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-100 dark:border-gray-800">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-sm">VoyageAI Assistant</p>
                  <p className="text-xs text-success-500 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-success-500" /> Online</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-end">
                  <div className="bg-primary-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[80%] text-sm">
                    Plan a 3 day trip to Paris for 2 people
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[85%] text-sm space-y-2">
                    <p>Here's a 3-day Paris itinerary based on real places:</p>
                    <p className="text-xs text-gray-500"><strong>Day 1:</strong> Eiffel Tower → Seine cruise → dinner in Le Marais</p>
                    <p className="text-xs text-gray-500"><strong>Day 2:</strong> Louvre Museum → Tuileries → Montmartre</p>
                    <p className="text-xs text-gray-500"><strong>Day 3:</strong> Versailles day trip → Arc de Triomphe</p>
                    <p className="text-[10px] text-primary-500 mt-2">Sources: Geoapify, OpenWeather</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container-app pb-20">
        <Card className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-accent-600 to-primary-700 p-8 sm:p-12 text-center">
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/10 rounded-full" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-white/5 rounded-full" />
          <div className="relative">
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white mb-4">Ready to plan your next adventure?</h2>
            <p className="text-white/80 mb-8 max-w-xl mx-auto">Create an account to save trips, chat with AI, and build personalized itineraries with real data.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="xl" variant="secondary" onClick={() => navigate(user ? '/plan' : '/register')} className="bg-white text-primary-700 hover:bg-gray-50">
                <Plane className="w-5 h-5" /> {user ? 'Plan a Trip' : 'Get Started Free'}
              </Button>
              <Button size="xl" onClick={() => navigate('/explore')} className="bg-white/10 text-white border border-white/20 hover:bg-white/20 backdrop-blur">
                <MapPin className="w-5 h-5" /> Explore Places
              </Button>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}
