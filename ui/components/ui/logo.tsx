import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Logo({ size = 'md', className = '' }: LogoProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  };

  const textSizeClasses = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl'
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Logo Icon - Brain/Network Graph */}
      <div className={`${sizeClasses[size]} relative`}>
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Neural Network/Brain Structure */}
          <g stroke="#384166" strokeWidth="2" fill="none">
            {/* Central hub */}
            <circle cx="24" cy="24" r="3" fill="#0CDC2A" />

            {/* Primary nodes */}
            <circle cx="12" cy="12" r="2.5" fill="#639D75" />
            <circle cx="36" cy="12" r="2.5" fill="#639D75" />
            <circle cx="12" cy="36" r="2.5" fill="#639D75" />
            <circle cx="36" cy="36" r="2.5" fill="#639D75" />

            {/* Secondary nodes */}
            <circle cx="8" cy="24" r="2" fill="#0B735F" />
            <circle cx="40" cy="24" r="2" fill="#0B735F" />
            <circle cx="24" cy="8" r="2" fill="#0B735F" />
            <circle cx="24" cy="40" r="2" fill="#0B735F" />

            {/* Connections from center */}
            <line x1="24" y1="24" x2="12" y2="12" stroke="#384166" strokeWidth="1.5" opacity="0.7" />
            <line x1="24" y1="24" x2="36" y2="12" stroke="#384166" strokeWidth="1.5" opacity="0.7" />
            <line x1="24" y1="24" x2="12" y2="36" stroke="#384166" strokeWidth="1.5" opacity="0.7" />
            <line x1="24" y1="24" x2="36" y2="36" stroke="#384166" strokeWidth="1.5" opacity="0.7" />

            {/* Secondary connections */}
            <line x1="24" y1="24" x2="8" y2="24" stroke="#0B735F" strokeWidth="1" opacity="0.6" />
            <line x1="24" y1="24" x2="40" y2="24" stroke="#0B735F" strokeWidth="1" opacity="0.6" />
            <line x1="24" y1="24" x2="24" y2="8" stroke="#0B735F" strokeWidth="1" opacity="0.6" />
            <line x1="24" y1="24" x2="24" y2="40" stroke="#0B735F" strokeWidth="1" opacity="0.6" />

            {/* Interconnections */}
            <line x1="12" y1="12" x2="24" y2="8" stroke="#639D75" strokeWidth="1" opacity="0.4" />
            <line x1="36" y1="12" x2="24" y2="8" stroke="#639D75" strokeWidth="1" opacity="0.4" />
            <line x1="12" y1="36" x2="8" y2="24" stroke="#639D75" strokeWidth="1" opacity="0.4" />
            <line x1="36" y1="36" x2="40" y2="24" stroke="#639D75" strokeWidth="1" opacity="0.4" />
          </g>
        </svg>
      </div>

      {/* Brand Text */}
      <div className="flex flex-col">
        <h1 className={`${textSizeClasses[size]} font-bold text-nous-navy leading-none`}>
          Nous<span className="text-nous-green">Graph</span>
        </h1>
        <p className="text-xs text-nous-teal font-medium tracking-wide uppercase">
          Medical AI Analytics
        </p>
      </div>
    </div>
  );
}
