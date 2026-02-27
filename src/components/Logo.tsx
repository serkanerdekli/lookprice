import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  color?: string;
}

export const Logo: React.FC<LogoProps> = ({ className = "", size = 40, color = "currentColor" }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 40 40" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Barcode Lines */}
      <rect x="6" y="10" width="2" height="20" fill={color} />
      <rect x="10" y="10" width="4" height="20" fill={color} />
      <rect x="16" y="10" width="1" height="20" fill={color} />
      <rect x="19" y="10" width="3" height="20" fill={color} />
      <rect x="24" y="10" width="2" height="20" fill={color} />
      
      {/* Price Tag Shape */}
      <path 
        d="M28 14L36 22L28 30H22V14H28Z" 
        fill={color} 
        className="opacity-90"
      />
      
      {/* Tag Hole */}
      <circle cx="27" cy="22" r="1.5" fill="white" />
      
      {/* Scan Line Effect */}
      <rect x="4" y="19" width="32" height="2" fill="#ef4444" className="opacity-80" />
    </svg>
  );
};

export const FaviconSVG = `
<svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="6" y="10" width="2" height="20" fill="#4f46e5" />
  <rect x="10" y="10" width="4" height="20" fill="#4f46e5" />
  <rect x="16" y="10" width="1" height="20" fill="#4f46e5" />
  <rect x="19" y="10" width="3" height="20" fill="#4f46e5" />
  <rect x="24" y="10" width="2" height="20" fill="#4f46e5" />
  <path d="M28 14L36 22L28 30H22V14H28Z" fill="#4f46e5" />
  <circle cx="27" cy="22" r="1.5" fill="white" />
</svg>
`;
