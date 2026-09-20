import { classNames } from '@/utils/format';

const variants = {
  primary: 'bg-primary-600 hover:bg-primary-700 text-white shadow-sm hover:shadow-glow disabled:bg-primary-400',
  secondary: 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700',
  accent: 'bg-accent-500 hover:bg-accent-600 text-white shadow-sm',
  ghost: 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300',
  outline: 'border border-primary-600 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950/30',
  danger: 'bg-error-500 hover:bg-error-600 text-white shadow-sm',
  warning: 'bg-warning-500 hover:bg-warning-600 text-white shadow-sm',
  success: 'bg-success-500 hover:bg-success-600 text-white shadow-sm',
};

const sizes = {
  xs: 'px-2.5 py-1.5 text-xs gap-1.5',
  sm: 'px-3.5 py-2 text-sm gap-2',
  md: 'px-5 py-2.5 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2.5',
  xl: 'px-8 py-4 text-lg gap-3',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  ...props
}) {
  return (
    <button
      className={classNames(
        'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:ring-offset-1 dark:focus:ring-offset-gray-900 active:scale-[0.98]',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className,
      )}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      )}
      {!loading && leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  );
}

export default Button;
