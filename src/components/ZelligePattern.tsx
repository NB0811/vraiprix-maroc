import React from 'react';

interface ZelligePatternProps {
  className?: string;
  opacity?: number;
}

export const ZelligePattern: React.FC<ZelligePatternProps> = ({
  className = '',
  opacity = 0.04,
}) => {
  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      style={{ opacity }}
      aria-hidden="true"
    >
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern
            id="moroccan-zellige"
            x="0"
            y="0"
            width="60"
            height="60"
            patternUnits="userSpaceOnUse"
          >
            {/* Moroccan 8-pointed star and interlocking geometric motif */}
            <path
              d="M30 5 L35 17 L47 17 L38 25 L41 37 L30 30 L19 37 L22 25 L13 17 L25 17 Z"
              fill="none"
              stroke="#006233"
              strokeWidth="1.2"
            />
            <rect
              x="15"
              y="15"
              width="30"
              height="30"
              transform="rotate(45 30 30)"
              fill="none"
              stroke="#C1272D"
              strokeWidth="0.8"
            />
            <circle cx="30" cy="30" r="8" fill="none" stroke="#006233" strokeWidth="0.8" />
            <path
              d="M0 0 L15 15 M60 0 L45 15 M0 60 L15 45 M60 60 L45 45"
              stroke="#006233"
              strokeWidth="0.8"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#moroccan-zellige)" />
      </svg>
    </div>
  );
};
