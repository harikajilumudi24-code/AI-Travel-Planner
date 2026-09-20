import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Compass, ArrowRight } from 'lucide-react';
import { Input, Button } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

const HERO_IMG = 'https://images.pexels.com/photos/25026852/pexels-photo-25026852.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (password !== confirm) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      const data = await register(name, email, password);
      toast.success(`Welcome aboard, ${data.user.name}!`);
      navigate('/plan');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] grid lg:grid-cols-2">
      <div className="flex items-center justify-center p-6 sm:p-12 order-2 lg:order-1">
        <div className="w-full max-w-sm animate-fade-in-up">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <span className="font-display text-xl font-extrabold">VoyageAI</span>
          </div>

          <h1 className="font-display text-2xl font-extrabold mb-1">Create your account</h1>
          <p className="text-sm text-gray-500 mb-8">Start planning smarter trips with AI today.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Full name" name="name" placeholder="Jane Doe" value={name} onChange={(e) => setName(e.target.value)} required leftIcon={<User className="w-4 h-4" />} />
            <Input type="email" label="Email" name="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required leftIcon={<Mail className="w-4 h-4" />} />
            <Input type="password" label="Password" name="password" placeholder="At least 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} required leftIcon={<Lock className="w-4 h-4" />} />
            <Input type="password" label="Confirm password" name="confirm" placeholder="Repeat your password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required leftIcon={<Lock className="w-4 h-4" />} />

            {error && <div className="p-3 rounded-xl bg-error-50 dark:bg-error-950/30 text-error-600 text-sm">{error}</div>}

            <Button type="submit" fullWidth size="lg" loading={loading} rightIcon={<ArrowRight className="w-4 h-4" />}>
              Create account
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>

      <div className="relative hidden lg:block order-1 lg:order-2">
        <img src={HERO_IMG} alt="Mountain adventure" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-bl from-accent-900/80 to-primary-900/60" />
        <div className="relative h-full flex flex-col justify-end p-12 text-white">
          <Compass className="w-10 h-10 mb-4" />
          <h2 className="font-display text-3xl font-extrabold mb-3">Your next adventure starts here</h2>
          <p className="text-white/80 max-w-md">Join VoyageAI to plan trips with AI, discover real places, check live weather, and save personalized itineraries.</p>
        </div>
      </div>
    </div>
  );
}
