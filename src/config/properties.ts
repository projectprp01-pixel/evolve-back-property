export interface Property {
  id: string;
  name: string;
  rooms: number;
  themeColor: string;
}

export const PROPERTIES: Property[] = [
  { id: 'default', name: 'Evolve Back Resort Coorg',  rooms: 55, themeColor: '#662D0A' },
  { id: 'kabini',  name: 'Evolve Back Resort Kabini', rooms: 0,  themeColor: '#1A5276' },
  { id: 'hampi',   name: 'Evolve Back Resort Hampi',  rooms: 0,  themeColor: '#784212' },
];

export const DEFAULT_PROPERTY = PROPERTIES[0];
