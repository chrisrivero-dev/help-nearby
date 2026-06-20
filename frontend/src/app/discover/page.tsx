'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import Discover from '@/components/Discover';
import { useLocationContext } from '@/components/help/LocationContext';

function DiscoverContent() {
  const searchParams = useSearchParams();
  const latParam = searchParams?.get('lat');
  const lngParam = searchParams?.get('lng');
  const lat = latParam === null ? NaN : parseFloat(latParam);
  const lng = lngParam === null ? NaN : parseFloat(lngParam);
  const hasInitialCenter =
    latParam !== null &&
    lngParam !== null &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180;
  const { setLocation } = useLocationContext();

  useEffect(() => {
    if (hasInitialCenter) {
      setLocation(`${lat},${lng}`);
    }
  }, [hasInitialCenter, lat, lng, setLocation]);

  return (
    <Discover
      centerLat={hasInitialCenter ? lat : 0}
      centerLng={hasInitialCenter ? lng : 0}
      hasInitialCenter={hasInitialCenter}
    />
  );
}

export default function DiscoverPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DiscoverContent />
    </Suspense>
  );
}
