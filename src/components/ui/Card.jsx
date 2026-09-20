import { classNames } from '@/utils/format';

export function Card({ children, className, hover = false, onClick, ...props }) {
  return (
    <div
      onClick={onClick}
      className={classNames(
        'bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-card transition-all duration-300',
        hover && 'hover:shadow-card-hover hover:-translate-y-1 cursor-pointer',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardBody({ children, className }) {
  return <div className={classNames('p-5', className)}>{children}</div>;
}

export default Card;
