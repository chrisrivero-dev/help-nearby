'use client';

import { SHELTERS } from '@/data/shelters.static';
import type { NormalizedLocation } from '@/lib/location/types';

interface Props {
  location: NormalizedLocation;
}

export default function ShelterResults({ location }: Props) {
  // 🔎 HARD PROOF #1: component mounted
  console.log('[ShelterResults] mounted with location:', location);

  // V1: simple filter by state
  const results = SHELTERS.filter(
    (shelter) => shelter.state === location.stateCode,
  );

  // 🔎 HARD PROOF #2: data outcome
  console.log(
    '[ShelterResults] state:',
    location.stateCode,
    'matches:',
    results.length,
  );

  if (results.length === 0) {
    return (
      <div className="p-4 border border-dashed rounded text-sm text-gray-600">
        <strong>ShelterResults rendered</strong>
        <div>No shelter data for state: {location.stateCode}</div>
        <div>Total shelters in dataset: {SHELTERS.length}</div>
      </div>
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
