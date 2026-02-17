import clsx from 'clsx';

const Controls = ({ icon: Icon, fn, size = 16, className, children, title, disabled = false }) => {
  return (
    <button
      type="button"
      onClick={fn}
      title={title}
      aria-label={title || 'control'}
      disabled={disabled || typeof fn !== 'function'}
      className={clsx(
        'h-9 flex justify-center items-center rounded-lg transition-colors',
        children ? 'px-3 gap-1.5 min-w-9' : 'w-9',
        'bg-white/5 border border-white/15 hover:bg-white/12',
        (disabled || typeof fn !== 'function') && 'opacity-40 cursor-not-allowed hover:bg-white/5',
        className,
      )}
    >
      <Icon size={size} className="shrink-0" />
      {children}
    </button>
  );
};
export default Controls;
