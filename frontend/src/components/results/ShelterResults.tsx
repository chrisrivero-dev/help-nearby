'use client';

import { SHELTERS } from '@/data/shelters.static';
import type { NormalizedLocation } from '@/lib/location/types';

interface Props {
  location: NormalizedLocation;
}

export default function ShelterResults({ location }: Props) {
  const results = SHELTERS.filter(
    (shelter) => shelter.state === location.stateCode,
  );

  if (results.length === 0) {
    return (
      <p className="text-sm text-gray-600">
        No shelter data available for this area yet.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {results.map((shelter) => (
        <li key={shelter.id} className="p-4 border rounded bg-neutral-50">
          <div className="font-medium">{shelter.name}</div>
          <div className="text-sm text-gray-600">
            {shelter.address}, {shelter.city}, {shelter.state}
          </div>
          {shelter.phone && (
            <div className="text-sm text-gray-500">📞 {shelter.phone}</div>
          )}
        </li>
      ))}
    </ul>
  );
}
