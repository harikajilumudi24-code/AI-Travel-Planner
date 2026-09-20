import { Search, X, MapPin, Loader2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { classNames } from '@/utils/format';

export function SearchBar({
  value,
  onChange,
  onSearch,
  placeholder = 'Search...',
  suggestions = [],
  onSuggestionSelect,
  loading = false,
  className,
  size = 'md',
  autoFocus = false,
}) {
  const [focused, setFocused] = useState(false);
  const ref = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setFocused(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  const sizes = { sm: 'py-2 text-sm', md: 'py-3 text-sm', lg: 'py-4 text-base' };

  const handleKey = (e) => {
    if (e.key === 'Enter') {
      setFocused(false);
      onSearch?.(value);
    }
  };

  const safeSuggestions = Array.isArray(suggestions) ? suggestions : [];

  return (
    <div className={classNames('relative', className)} ref={ref}>
      <div className={classNames(
        'flex items-center gap-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 transition-all duration-200',
        focused && 'ring-2 ring-primary-500/50 border-primary-500',
      )}>
        <Search className="w-5 h-5 text-gray-400 ml-3.5 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={value ?? ''}
          onChange={(e) => onChange?.(e.target.value)}
          onFocus={() => setFocused(true)}
          onKeyDown={handleKey}
          placeholder={placeholder}
          className={classNames('flex-1 bg-transparent border-0 focus:outline-none placeholder-gray-400 text-gray-900 dark:text-gray-100', sizes[size] || sizes.md)}
        />
        {loading && <Loader2 className="w-4 h-4 text-primary-500 animate-spin mr-3" />}
        {Boolean(value) && !loading && (
          <button onClick={() => { onChange?.(''); onSearch?.(''); }} className="mr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      {focused && safeSuggestions.length > 0 && (
        <div className="absolute top-full mt-2 w-full glass-strong rounded-xl shadow-card-hover py-2 z-50 max-h-72 overflow-y-auto animate-scale-in origin-top">
          {safeSuggestions.map((s, i) => {
            if (!s) return null;
            const title = typeof s === 'string' ? s : (s.name || s.label || '');
            return (
              <button
                key={i}
                onClick={() => { onSuggestionSelect?.(s); setFocused(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                <MapPin className="w-4 h-4 text-primary-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{title}</p>
                  {s.address && <p className="text-xs text-gray-400 truncate">{s.address}</p>}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default SearchBar;
