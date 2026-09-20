import { classNames } from '@/utils/format';

export function Input({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  className,
  id,
  ...props
}) {
  const inputId = id || props.name;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">{leftIcon}</div>
        )}
        <input
          id={inputId}
          className={classNames(
            'w-full rounded-xl border bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500',
            leftIcon ? 'pl-10' : 'pl-4',
            rightIcon ? 'pr-10' : 'pr-4',
            'py-2.5 text-sm',
            error ? 'border-error-400 dark:border-error-500' : 'border-gray-200 dark:border-gray-700',
            className,
          )}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{rightIcon}</div>
        )}
      </div>
      {error && <p className="mt-1.5 text-xs text-error-500">{error}</p>}
      {hint && !error && <p className="mt-1.5 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

export function Select({ label, error, children, className, id, ...props }) {
  const selectId = id || props.name;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={classNames(
          'w-full rounded-xl border bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-4 py-2.5 text-sm transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500',
          error ? 'border-error-400' : 'border-gray-200 dark:border-gray-700',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="mt-1.5 text-xs text-error-500">{error}</p>}
    </div>
  );
}

export function Textarea({ label, error, className, id, ...props }) {
  const textareaId = id || props.name;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={textareaId} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={classNames(
          'w-full rounded-xl border bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 px-4 py-2.5 text-sm transition-all duration-200 resize-y min-h-[100px]',
          'focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500',
          error ? 'border-error-400' : 'border-gray-200 dark:border-gray-700',
          className,
        )}
        {...props}
      />
      {error && <p className="mt-1.5 text-xs text-error-500">{error}</p>}
    </div>
  );
}

export default Input;
