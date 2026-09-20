import { classNames } from '@/utils/format';

export function Skeleton({ className, variant = 'rect' }) {
  const variants = {
    rect: 'rounded-xl',
    text: 'rounded',
    circle: 'rounded-full',
  };
  return <div className={classNames('skeleton', variants[variant], className)} />;
}

export function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
      <Skeleton className="h-40 w-full mb-4" />
      <Skeleton className="h-5 w-3/4 mb-2" />
      <Skeleton className="h-4 w-1/2 mb-4" />
      <div className="flex gap-2">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-6 w-20" />
      </div>
    </div>
  );
}

export default Skeleton;
