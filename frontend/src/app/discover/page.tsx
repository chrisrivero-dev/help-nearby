'use client';

import { useSearchParams } from 'next/navigation';
import Discover from '@/components/Discover';

export default function DiscoverPage() {
  const searchParams = useSearchParams();
  const lat = parseFloat(searchParams.get('lat') ?? '40.7829');
  const lng = parseFloat(searchParams.get('lng') ?? '-73.9654');

  return <Discover centerLat={lat} centerLng={lng} />;
}
