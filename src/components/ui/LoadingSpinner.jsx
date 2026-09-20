import { Loader2 } from 'lucide-react';

export function LoadingSpinner({ size = 'md', className, label }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8', xl: 'w-12 h-12' };
  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className || ''}`}>
      <Loader2 className={`${sizes[size]} text-primary-500 animate-spin`} />
      {label && <p className="text-sm text-gray-500">{label}</p>}
    </div>
  );
}

export function FullPageLoader({ label = 'Loading…' }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <LoadingSpinner size="xl" label={label} />
    </div>
  );
}

export default LoadingSpinner;
