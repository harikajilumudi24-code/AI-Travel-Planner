import { useState } from 'react';
import { classNames } from '@/utils/format';

export function Tabs({ tabs, defaultIndex = 0, onChange, className }) {
  const [active, setActive] = useState(defaultIndex);
  const current = tabs[active];

  const handleSelect = (i) => {
    setActive(i);
    onChange?.(i);
  };

  return (
    <div className={className}>
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl overflow-x-auto">
        {tabs.map((tab, i) => (
          <button
            key={tab.label ?? i}
            onClick={() => handleSelect(i)}
            className={classNames(
              'px-4 py-2 text-sm font-semibold rounded-lg whitespace-nowrap transition-all duration-200',
              active === i
                ? 'bg-white dark:bg-gray-900 text-primary-600 dark:text-primary-400 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {current?.content && <div className="mt-4">{current.content}</div>}
    </div>
  );
}

export default Tabs;
