import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { classNames } from '@/utils/format';

export function Dropdown({ trigger, children, align = 'right', className }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <div onClick={() => setOpen((o) => !o)}>{trigger}</div>
      {open && (
        <div
          className={classNames(
            'absolute top-full mt-2 min-w-[200px] glass-strong rounded-xl shadow-card-hover py-2 z-50 animate-scale-in origin-top',
            align === 'right' ? 'right-0' : 'left-0',
            className,
          )}
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function DropdownItem({ children, onClick, icon, danger = false, className }) {
  return (
    <button
      onClick={onClick}
      className={classNames(
        'w-full flex items-center gap-3 px-4 py-2 text-sm text-left transition-colors',
        danger ? 'text-error-500 hover:bg-error-50 dark:hover:bg-error-950/30' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800',
        className,
      )}
    >
      {icon}
      {children}
    </button>
  );
}

export default Dropdown;
