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
  const { setLocation, isValid } = useLocationContext();

  useEffect(() => {
    // Only seed from the URL on a cold deep-link (no location resolved yet).
    // When the shared context already holds a location, keep it so the precise
    // ZIP isn't clobbered by a coordinate-based reverse geocode on the normal
    // /help → Discover → /help round-trip.
    if (hasInitialCenter && !isValid) {
      setLocation(`${lat},${lng}`);
    }
  }, [hasInitialCenter, isValid, lat, lng, setLocation]);

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
