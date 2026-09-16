import React, { useState, useEffect } from 'react';
import { Building } from 'lucide-react';

export function sanitizeImageUrl(url) {
  if (!url || typeof url !== 'string') return '';
  let cleaned = url.trim();
  if (cleaned.startsWith('http://')) {
    cleaned = cleaned.replace('http://', 'https://');
  }
  try {
    return encodeURI(cleaned);
  } catch (e) {
    return cleaned;
  }
}

export function SafeImage({
  src,
  alt = 'Imagem',
  className = '',
  fallbackClassName = '',
  fallbackText = 'Imagem indisponível',
  showIcon = true,
  ...props
}) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  const cleanUrl = sanitizeImageUrl(src);

  if (!cleanUrl || hasError) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-950 text-slate-400 dark:text-slate-600 text-xs p-2 gap-1.5 select-none ${fallbackClassName || className}`}
      >
        {showIcon && <Building className="w-7 h-7 stroke-[1.5]" />}
        <span className="text-[10px] font-medium text-center">{fallbackText}</span>
      </div>
    );
  }

  return (
    <img
      src={cleanUrl}
      alt={alt}
      onError={() => setHasError(true)}
      className={className}
      {...props}
    />
  );
}
