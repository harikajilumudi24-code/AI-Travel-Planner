import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  MapPin, Calendar, Users, Wallet, Sparkles, Plane, Heart, UtensilsCrossed,
  BedDouble, Car, Check, ArrowRight, ArrowLeft, Loader2, CloudRain, Sun,
} from 'lucide-react';
import { Input, Select, Textarea, Button, Card, Badge } from '@/components/ui';
import { useToast } from '@/context/ToastContext';
import { api } from '@/services/api';
import { classNames, daysBetween, formatCurrency } from '@/utils/format';

const travelStyles = ['Budget', 'Comfort', 'Luxury', 'Adventure', 'Family', 'Solo', 'Romantic'];
const interests = ['Beaches', 'Food', 'History', 'Nature', 'Shopping', 'Nightlife', 'Culture', 'Adventure', 'Photography', 'Architecture'];
const dietaryOptions = ['None', 'Vegetarian', 'Vegan', 'Halal', 'Kosher', 'Gluten-free', 'Pescatarian'];
const accommodationOptions = ['Hotel', 'Hostel', 'Resort', 'Apartment', 'Guesthouse', 'Villa', 'Campsite'];
const transportOptions = ['Walking', 'Public transit', 'Rental car', 'Taxi/Rideshare', 'Bicycle', 'Flight'];
const currencies = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'AUD', 'CAD', 'SGD', 'AED'];

export default function PlanTrip() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const prefill = location.state?.prefill;

  const [form, setForm] = useState({
    destination: prefill?.destination || '',
    start_date: '',
    end_date: '',
    duration: prefill?.duration || 5,
    travelers: prefill?.travelers || 2,
    budget: 2000,
    currency: 'USD',
    travel_style: prefill?.style || 'Comfort',
    interests: ['Food', 'Culture'],
    dietary: 'None',
    accommodation: 'Hotel',
    transportation: 'Public transit',
    notes: '',
  });
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const toggleInterest = (interest) => {
    setForm((f) => ({
      ...f,
      interests: f.interests.includes(interest)
        ? f.interests.filter((i) => i !== interest)
        : [...f.interests, interest],
    }));
  };

  const handleDatesChange = (key, val) => {
    setForm((f) => {
      let start = key === 'start_date' ? val : f.start_date;
      let end = key === 'end_date' ? val : f.end_date;

      // Prevent End Date from being before Start Date
      if (start && end && end < start) {
        end = start;
      }

      let duration = f.duration;
      if (start && end) {
        duration = daysBetween(start, end);
      }

      return {
        ...f,
        start_date: start,
        end_date: end,
        duration: duration,
      };
    });
  };

  const handleDatePickerClick = (e) => {
    if (typeof e.target.showPicker === 'function') {
      try {
        e.target.showPicker();
      } catch {
        /* Ignore browser security restrictions if picker already open */
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.destination.trim()) { setError('Please enter a destination'); return; }
    if (form.interests.length === 0) { setError('Select at least one interest'); return; }

    setGenerating(true);
    try {
      const trip = await api.planTrip(form);
      toast.success('Your AI itinerary is ready!');
      navigate(`/trips/${trip.id}`);
    } catch (err) {
      setError(err.message || 'Failed to generate trip. Please try again.');
      toast.error(err.message || 'Failed to generate trip');
    } finally { setGenerating(false); }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-950/30 py-8">
      <div className="container-app max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Badge variant="primary" className="mb-2"><Sparkles className="w-3.5 h-3.5" /> AI Trip Planner</Badge>
            <h1 className="font-display text-3xl font-extrabold">Plan your trip</h1>
            <p className="text-gray-500 text-sm mt-1">Fill in the details and let AI generate a personalized itinerary with real places</p>
          </div>
          <Button variant="ghost" onClick={() => navigate('/trips')} leftIcon={<ArrowLeft className="w-4 h-4" />} className="hidden sm:flex">My Trips</Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <Card className="p-6 animate-fade-in-up">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><MapPin className="w-5 h-5 text-primary-500" /> Destination & Dates</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Destination" placeholder="e.g. Goa, India"
                value={form.destination}
                onChange={(e) => set('destination', e.target.value)}
                leftIcon={<MapPin className="w-4 h-4" />}
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="date"
                  label="Start date"
                  value={form.start_date}
                  onChange={(e) => handleDatesChange('start_date', e.target.value)}
                  onClick={handleDatePickerClick}
                  leftIcon={<Calendar className="w-4 h-4" />}
                />
                <Input
                  type="date"
                  label="End date"
                  value={form.end_date}
                  min={form.start_date || undefined}
                  onChange={(e) => handleDatesChange('end_date', e.target.value)}
                  onClick={handleDatePickerClick}
                  leftIcon={<Calendar className="w-4 h-4" />}
                />
              </div>
              <Input type="number" label="Duration (days)" min={1} max={30} value={form.duration} onChange={(e) => set('duration', parseInt(e.target.value) || 1)} leftIcon={<Calendar className="w-4 h-4" />} />
              <Input type="number" label="Travelers" min={1} max={20} value={form.travelers} onChange={(e) => set('travelers', parseInt(e.target.value) || 1)} leftIcon={<Users className="w-4 h-4" />} />
            </div>
          </Card>

          {/* Budget */}
          <Card className="p-6 animate-fade-in-up">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><Wallet className="w-5 h-5 text-success-500" /> Budget</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Budget: <span className="text-primary-600 font-bold">{formatCurrency(form.budget, form.currency)}</span>
                </label>
                <input
                  type="range" min={200} max={20000} step={100}
                  value={form.budget}
                  onChange={(e) => set('budget', parseInt(e.target.value))}
                  className="w-full accent-primary-600"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>{formatCurrency(200, form.currency)}</span>
                  <span>{formatCurrency(20000, form.currency)}</span>
                </div>
              </div>
              <Select label="Currency" value={form.currency} onChange={(e) => set('currency', e.target.value)}>
                {currencies.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </div>
          </Card>

          {/* Travel Style */}
          <Card className="p-6 animate-fade-in-up">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><Plane className="w-5 h-5 text-accent-500" /> Travel Style</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {travelStyles.map((style) => (
                <button
                  key={style} type="button"
                  onClick={() => set('travel_style', style)}
                  className={classNames(
                    'px-3 py-2.5 text-sm font-semibold rounded-xl border transition-all',
                    form.travel_style === style
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400 ring-2 ring-primary-500/30'
                      : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-primary-300',
                  )}
                >
                  {style}
                </button>
              ))}
            </div>
          </Card>

          {/* Interests */}
          <Card className="p-6 animate-fade-in-up">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><Heart className="w-5 h-5 text-error-500" /> Interests</h2>
            <div className="flex flex-wrap gap-2">
              {interests.map((interest) => (
                <button
                  key={interest} type="button"
                  onClick={() => toggleInterest(interest)}
                  className={classNames(
                    'inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-full border transition-all',
                    form.interests.includes(interest)
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400'
                      : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-primary-300',
                  )}
                >
                  {form.interests.includes(interest) && <Check className="w-3.5 h-3.5" />}
                  {interest}
                </button>
              ))}
            </div>
          </Card>

          {/* Preferences */}
          <Card className="p-6 animate-fade-in-up">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><UtensilsCrossed className="w-5 h-5 text-secondary-500" /> Preferences</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Select label="Dietary" value={form.dietary} onChange={(e) => set('dietary', e.target.value)}>
                {dietaryOptions.map((d) => <option key={d} value={d}>{d}</option>)}
              </Select>
              <Select label="Accommodation" value={form.accommodation} onChange={(e) => set('accommodation', e.target.value)}>
                {accommodationOptions.map((a) => <option key={a} value={a}>{a}</option>)}
              </Select>
              <Select label="Transportation" value={form.transportation} onChange={(e) => set('transportation', e.target.value)}>
                {transportOptions.map((t) => <option key={t} value={t}>{t}</option>)}
              </Select>
            </div>
            <div className="mt-4">
              <Textarea label="Additional notes (optional)" placeholder="Any specific preferences, must-see places, or constraints…" value={form.notes} onChange={(e) => set('notes', e.target.value)} />
            </div>
          </Card>

          {error && <div className="p-4 rounded-xl bg-error-50 dark:bg-error-950/30 text-error-600 text-sm font-medium">{error}</div>}

          {/* Submit */}
          <div className="flex flex-col sm:flex-row gap-3 sticky bottom-4 z-10">
            <Card className="p-4 flex items-center justify-between gap-4 w-full glass-strong">
              <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500">
                <Sparkles className="w-4 h-4 text-primary-500" />
                AI will use real data from Geoapify, OpenWeather & Tavily
              </div>
              <Button type="submit" size="lg" loading={generating} rightIcon={!generating && <ArrowRight className="w-4 h-4" />} className="flex-1 sm:flex-none">
                {generating ? 'Generating itinerary…' : 'Generate AI Itinerary'}
              </Button>
            </Card>
          </div>
        </form>
      </div>
    </div>
  );
}
