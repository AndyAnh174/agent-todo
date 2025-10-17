import React from 'react';

interface ListHeaderProps {
  title: string;
  subtitle?: string;
  backgroundImageUrl?: string;
  gradientClassName?: string; // tailwind gradient bg fallback
  rightActions?: React.ReactNode;
}

export function ListHeader({
  title,
  subtitle,
  backgroundImageUrl,
  gradientClassName = 'bg-gradient-to-b from-sky-500 to-sky-700',
  rightActions,
}: ListHeaderProps) {
  return (
    <div
      className={
        'relative w-full rounded-b-xl overflow-hidden shadow-sm mb-6 ' +
        (!backgroundImageUrl ? gradientClassName : '')
      }
      style={backgroundImageUrl ? { backgroundImage: `url(${backgroundImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
    >
      <div className="backdrop-brightness-95/90">
        <div className="flex items-start justify-between px-6 py-6 sm:px-8 sm:py-8">
          <div>
            <h1 className="text-white text-2xl sm:text-3xl font-semibold drop-shadow">{title}</h1>
            {subtitle && (
              <p className="text-white/90 text-sm mt-1 drop-shadow-sm">{subtitle}</p>
            )}
          </div>
          {rightActions && <div className="flex items-center gap-2">{rightActions}</div>}
        </div>
      </div>
    </div>
  );
}


