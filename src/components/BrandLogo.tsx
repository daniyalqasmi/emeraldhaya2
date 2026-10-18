import React from 'react';
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
  let storeLogoUrl: string | undefined;
  try {
    const store = useStore();
    storeLogoUrl = store.settings?.logoUrl;
  } catch {
    // Graceful fallback if rendered outside of StoreProvider
  }

  // Responsive dimensions for the official emblem logo
  const sizeClasses = {
    sm: 'h-10 w-auto max-w-[120px]',
    md: 'h-12 sm:h-14 md:h-16 w-auto max-w-[170px]',
    lg: 'h-20 sm:h-24 md:h-28 w-auto max-w-[240px]',
    xl: 'h-32 sm:h-36 md:h-44 w-auto max-w-[320px]'
  }[size];

  // Official logo source
  const logoImageSrc = customImageSrc || storeLogoUrl || '/logo.svg';

  return (
    <div className={`inline-flex items-center justify-center select-none ${className}`}>
      <img
        src={logoImageSrc}
        alt="Emerald Haya"
        className={`${sizeClasses} object-contain transition-transform duration-300 hover:scale-[1.02] drop-shadow-sm cursor-pointer`}
      />
    </div>
  );
};
