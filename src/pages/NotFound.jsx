import { Link } from 'react-router-dom';
import { Compass, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center mb-6 animate-float">
        <Compass className="w-8 h-8 text-white" />
      </div>
      <h1 className="font-display text-6xl font-extrabold text-primary-600 mb-2">404</h1>
      <p className="text-xl font-bold mb-2">Page not found</p>
      <p className="text-gray-500 mb-8 max-w-sm">The page you're looking for doesn't exist or has been moved.</p>
      <Link to="/"><Button leftIcon={<ArrowLeft className="w-4 h-4" />}>Back to home</Button></Link>
    </div>
  );
}
