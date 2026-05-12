'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Discover from '@/components/Discover';

function DiscoverContent() {
  const searchParams = useSearchParams();
  const lat = parseFloat(searchParams.get('lat') ?? '40.7829');
  const lng = parseFloat(searchParams.get('lng') ?? '-73.9654');
  return <Discover centerLat={lat} centerLng={lng} />;
}

export default function DiscoverPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DiscoverContent />
    </Suspense>
  );
}
