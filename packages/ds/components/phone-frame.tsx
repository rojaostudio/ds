export interface PhoneFrameProps {
  children: React.ReactNode;
  className?: string;
}

export function PhoneFrame({ children, className = '' }: PhoneFrameProps) {
  return (
    <div
      className={[
        // rojao-detect-disable over-rounding
        'relative rounded-[2.5rem] border-[6px] border-(--text-primary)',
        'bg-white overflow-hidden shadow-2xl',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="h-full overflow-y-auto overflow-x-hidden scrollbar-none">
        {children}
      </div>
    </div>
  );
}
