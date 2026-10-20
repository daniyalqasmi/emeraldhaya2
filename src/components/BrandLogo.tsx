import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';

interface BrandLogoProps {
  variant?: 'light' | 'dark' | 'gold';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  customImageSrc?: string;
  className?: string;
  showText?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ 
  size = 'md',
  customImageSrc,
  className = '',
  showText = false
}) => {
  const [imageError, setImageError] = useState(false);
  let storeLogoUrl: string | undefined;
  let brandName = 'Emerald Haya';

  try {
    const store = useStore();
    storeLogoUrl = store.settings?.logoUrl;
    brandName = store.settings?.brandName || brandName;
  } catch {
    // Graceful fallback if rendered outside of StoreProvider
  }

  // Dimension scaling keeping exact natural aspect ratio without pixelation or stretching
  const sizeConfig = {
    sm: { imgClass: 'h-8 sm:h-9 max-h-9 max-w-[150px] w-auto', textClass: 'text-sm' },
    md: { imgClass: 'h-10 sm:h-12 max-h-12 max-w-[220px] w-auto', textClass: 'text-base' },
    lg: { imgClass: 'h-14 sm:h-16 max-h-16 max-w-[280px] w-auto', textClass: 'text-xl' },
    xl: { imgClass: 'h-20 sm:h-24 max-h-24 max-w-[360px] w-auto', textClass: 'text-2xl' }
  }[size];

  // Primary source determination with robust fallback
  const rawSrc = customImageSrc || storeLogoUrl || '/logo.svg';
  // Normalize any internal paths that might have been stored as /src/assets/logo.svg
  const normalizedSrc = rawSrc === '/src/assets/logo.svg' ? '/logo.svg' : rawSrc;
  const finalSrc = imageError ? '/logo.svg' : normalizedSrc;

  return (
    <div className={`inline-flex items-center justify-center select-none ${className}`}>
      <img
        src={finalSrc}
        alt={brandName}
        loading="eager"
        decoding="async"
        onError={() => {
          if (!imageError) setImageError(true);
        }}
        className={`${sizeConfig.imgClass} object-contain transition-transform duration-200 hover:scale-[1.01] drop-shadow-xs`}
        style={{
          imageRendering: '-webkit-optimize-contrast',
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden'
        }}
      />
      {showText && (
        <span className={`ml-2.5 font-serif tracking-widest font-bold text-[#002814] ${sizeConfig.textClass}`}>
          {brandName}
        </span>
      )}
    </div>
  );
};
