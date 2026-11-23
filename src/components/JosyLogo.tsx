import React from 'react';

interface JosyLogoProps {
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  className?: string;
}

export function JosyLogo({
  variant = 'light',
  size = 'md',
  showTagline = false,
  className = '',
}: JosyLogoProps) {
  const isDark = variant === 'dark';

  const emblemSizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12 sm:w-14 sm:h-14',
    xl: 'w-20 h-20 sm:w-24 sm:h-24',
  };

  const titleSizes = {
    sm: 'text-lg sm:text-xl tracking-[0.15em]',
    md: 'text-xl sm:text-[24px] tracking-[0.16em]',
    lg: 'text-2xl sm:text-[34px] tracking-[0.16em]',
    xl: 'text-3xl sm:text-5xl tracking-[0.16em]',
  };

  const taglineSizes = {
    sm: 'text-[9px] tracking-[0.24em]',
    md: 'text-[9px] tracking-[0.26em]',
    lg: 'text-[10px] sm:text-[11px] tracking-[0.28em]',
    xl: 'text-xs tracking-[0.3em]',
  };

  const frameStroke = isDark ? '#D4AF37' : '#B48436';
  const primaryStroke = isDark ? '#FFFFFF' : '#111113';
  const accentFill = '#1B365D';
  const crestBg = isDark ? '#18181B' : '#FFFFFF';
  const wordmarkColor = isDark ? 'text-white' : 'text-[#111113]';
  const taglineColor = isDark ? 'text-[#A1A1AA]' : 'text-[#71717A]';

  return (
    <span className={`inline-flex items-center gap-3 sm:gap-3.5 select-none ${className}`}>
      {/* Architectural Woven Crest & JT Monogram */}
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className={`${emblemSizes[size]} shrink-0`}
      >
        <rect
          x="2"
          y="2"
          width="44"
          height="44"
          rx="2"
          fill={crestBg}
          stroke={frameStroke}
          strokeWidth="1.4"
        />
        <path
          d="M24 5.5L42.5 24L24 42.5L5.5 24L24 5.5Z"
          stroke={frameStroke}
          strokeWidth="0.85"
          strokeOpacity="0.65"
        />
        <rect x="5" y="5" width="2.2" height="2.2" fill={frameStroke} />
        <rect x="40.8" y="5" width="2.2" height="2.2" fill={frameStroke} />
        <rect x="5" y="40.8" width="2.2" height="2.2" fill={frameStroke} />
        <rect x="40.8" y="40.8" width="2.2" height="2.2" fill={frameStroke} />

        {/* Interlocking T */}
        <path
          d="M14.5 14.5H33.5"
          stroke={primaryStroke}
          strokeWidth="2.1"
          strokeLinecap="square"
        />
        <path
          d="M26.5 14.5V34"
          stroke={primaryStroke}
          strokeWidth="2.1"
          strokeLinecap="square"
        />
        <path
          d="M23.5 34H29.5"
          stroke={primaryStroke}
          strokeWidth="1.4"
          strokeLinecap="square"
        />

        {/* Sculpted J */}
        <path
          d="M21.5 14.5V27.5C21.5 31.2 19.2 33.6 16.2 33.6C14.4 33.6 13.1 32.8 12.4 31.6"
          stroke={isDark ? '#D4AF37' : accentFill}
          strokeWidth="2.2"
          strokeLinecap="round"
        />

        {/* Golden Tailor Needle & Woven Thread */}
        <path
          d="M13 24.5H35"
          stroke={frameStroke}
          strokeWidth="1.05"
          strokeDasharray="2.2 2.2"
        />
        <circle cx="24" cy="24.5" r="1.8" fill={frameStroke} />
      </svg>

      {/* Editorial Wordmark */}
      <span className="flex flex-col text-left leading-none">
        <span
          className={`font-editorial font-semibold whitespace-nowrap ${titleSizes[size]} ${wordmarkColor}`}
        >
          JOSY TEXTILE
        </span>
        {showTagline && (
          <span
            className={`font-sans uppercase mt-1.5 whitespace-nowrap ${taglineSizes[size]} ${taglineColor}`}
          >
            Ughelli Luxury Atelier
          </span>
        )}
      </span>
    </span>
  );
}
