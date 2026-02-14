import clsx from 'clsx';

const Controls = ({ icon: Icon, fn, size = 18, className, children }) => {
  return (
    <div
      onClick={fn}
      className={clsx(
        'h-7 flex justify-center items-center rounded-md cursor-pointer hover:opacity-60',
        children ? 'px-2 gap-2 min-w-7' : 'w-7',
        'bg-[#1b273a] border border-[#1f324e]',
        className,
      )}
    >
      <Icon size={size} className="shrink-0" />
      {children}
    </div>
  );
};
export default Controls;
