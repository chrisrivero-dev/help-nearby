// src/data/shelters.static.ts

export interface Shelter {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  latitude: number;
  longitude: number;
  phone?: string;
  notes?: string;
}

export const SHELTERS: Shelter[] = [
  {
    id: 'nyc-001',
    name: 'Bowery Mission Shelter',
    address: '227 Bowery',
    city: 'New York',
    state: 'NY',
    zip: '10002',
    latitude: 40.7209,
    longitude: -73.9936,
    phone: '212-674-3456',
  },
  {
    id: 'la-001',
    name: 'Union Rescue Mission',
    address: '545 S San Pedro St',
    city: 'Los Angeles',
    state: 'CA',
    zip: '90013',
    latitude: 34.0402,
    longitude: -118.2468,
  },
];
