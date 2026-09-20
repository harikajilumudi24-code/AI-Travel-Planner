import { Link } from 'react-router-dom';
import { classNames } from '@/utils/format';

export function EmptyState({ icon, title, description, action, actionLabel, className }) {
  const Icon = icon;
  return (
    <div className={classNames('flex flex-col items-center justify-center text-center py-16 px-4', className)}>
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-primary-50 dark:bg-primary-950/30 flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-primary-500" />
        </div>
      )}
      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1.5">{title}</h3>
      {description && <p className="text-sm text-gray-500 max-w-sm mb-5">{description}</p>}
      {action || (actionLabel && (
        <Link to={action || '#'} className="inline-flex items-center px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl transition">
          {actionLabel}
        </Link>
      ))}
    </div>
  );
}

export default EmptyState;
