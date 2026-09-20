import { useState } from 'react';
import { Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Mail, Lock, Compass, ArrowRight } from 'lucide-react';
import { Input, Button, Card } from '@/components/ui';
import { FullPageLoader } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

const HERO_IMG = 'https://images.pexels.com/photos/953641/pexels-photo-953641.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';

export default function Login() {
  const { user, loading: authLoading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const from = location.state?.from || '/trips';

  if (authLoading) return <FullPageLoader label="Loading your account…" />;
  if (user) return <Navigate to={from !== '/' ? from : '/trips'} replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(email, password);
      toast.success(`Welcome back, ${data.user.name}!`);
      navigate(from);
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-hidden">
      {/* Background travel image */}
      <img
        src={HERO_IMG}
        alt="Travel destination"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Dark overlay for contrast & readability */}
      <div className="absolute inset-0 bg-gray-950/60 backdrop-blur-[2px]" />

      {/* Centered Sign In card */}
      <div className="relative z-10 w-full max-w-md animate-fade-in-up">
        <Card className="p-6 sm:p-8 glass-strong backdrop-blur-xl border border-white/30 dark:border-gray-800 shadow-2xl">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <span className="font-display text-xl font-extrabold">VoyageAI</span>
          </div>

          <h1 className="font-display text-2xl font-extrabold mb-1">Sign in</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">Welcome back! Please enter your details.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email" label="Email" name="email" placeholder="you@example.com"
              value={email} onChange={(e) => setEmail(e.target.value)} required
              leftIcon={<Mail className="w-4 h-4" />}
            />
            <Input
              type="password" label="Password" name="password" placeholder="Your password"
              value={password} onChange={(e) => setPassword(e.target.value)} required
              leftIcon={<Lock className="w-4 h-4" />}
            />

            {error && <div className="p-3 rounded-xl bg-error-50 dark:bg-error-950/30 text-error-600 text-sm">{error}</div>}

            <Button type="submit" fullWidth size="lg" loading={loading} rightIcon={<ArrowRight className="w-4 h-4" />}>
              Sign in
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-600 dark:text-primary-400 font-semibold hover:underline">Sign up free</Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
