import React, { useState, useEffect } from 'react';
import { resolveImageUrl } from '@/lib/imageUrl';

export default function CachedImage({ src, alt, className, ...props }) {
  const [imgSrc, setImgSrc] = useState(null);

  useEffect(() => {
    let isMounted = true;
    
    if (!src) return;

    const fullUrl = resolveImageUrl(src);

    const loadImg = async () => {
      try {
        if (typeof window !== 'undefined' && 'caches' in window) {
          const cache = await caches.open('ppt-slides-cache');
          const cachedResponse = await cache.match(fullUrl);
          
          if (cachedResponse) {
            const blob = await cachedResponse.blob();
            if (isMounted) setImgSrc(URL.createObjectURL(blob));
            return;
          } else {
            // Fetch from network
            const response = await fetch(fullUrl);
            if (response.ok) {
              // Clone response to put in cache
              cache.put(fullUrl, response.clone());
              const blob = await response.blob();
              if (isMounted) setImgSrc(URL.createObjectURL(blob));
              return;
            }
          }
        }
        if (isMounted) setImgSrc(fullUrl);
      } catch (err) {
        if (isMounted) setImgSrc(fullUrl);
      }
    };

    loadImg();

    return () => {
      isMounted = false;
    };
  }, [src]);

  return <img src={imgSrc || resolveImageUrl(src)} alt={alt} className={className} loading="lazy" {...props} />;
}
