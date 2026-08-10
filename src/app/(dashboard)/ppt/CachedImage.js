import React, { useState, useEffect } from 'react';

export default function CachedImage({ src, alt, className, ...props }) {
  const [imgSrc, setImgSrc] = useState(null);

  useEffect(() => {
    let isMounted = true;
    
    if (!src) return;

    // Resolve full URL if relative R2 key path is stored
    let fullUrl = src;
    if (!src.startsWith('http://') && !src.startsWith('https://') && !src.startsWith('data:')) {
      if (src.startsWith('/uploads/') || src.startsWith('uploads/')) {
        fullUrl = src.startsWith('/') ? src : `/${src}`;
      } else {
        const publicBase = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "https://cdn.webly.biz.id/";
        const baseUrl = publicBase.endsWith('/') ? publicBase : `${publicBase}/`;
        fullUrl = `${baseUrl}${src.replace(/^\//, '')}`;
      }
    }

    const loadImg = async () => {
      try {
        const cache = await caches.open('ppt-slides-cache');
        const cachedResponse = await cache.match(fullUrl);
        
        if (cachedResponse) {
          const blob = await cachedResponse.blob();
          if (isMounted) setImgSrc(URL.createObjectURL(blob));
        } else {
          // Fetch from network
          const response = await fetch(fullUrl);
          if (response.ok) {
            // Clone response to put in cache
            cache.put(fullUrl, response.clone());
            const blob = await response.blob();
            if (isMounted) setImgSrc(URL.createObjectURL(blob));
          } else {
            // fallback
            if (isMounted) setImgSrc(fullUrl);
          }
        }
      } catch (err) {
        console.error("Cache API failed, falling back to direct src", err);
        if (isMounted) setImgSrc(fullUrl);
      }
    };

    loadImg();

    return () => {
      isMounted = false;
    };
  }, [src]);

  return <img src={imgSrc || src} alt={alt} className={className} loading="lazy" {...props} />;
}
