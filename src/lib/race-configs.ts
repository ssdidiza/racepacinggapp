/**
 * @fileOverview Defines the data layer for supported races.
 */

export interface Checkpoint {
  name: string;
  distance: number;
  terrainFactor: number;
  description: string;
}

export interface RaceConfig {
  id: string;
  name: string;
  shortName: string;
  distance: number;
  location: string;
  defaultStartTime: string;
  month: string;
  checkpoints: Checkpoint[];
  paceValidation: {
    minMinutes: number;
    eliteMinutes: number;
  };
  hillWarningCheckpoints: string[];
  csvFilenamePrefix: string;
}

export const RACE_CONFIGS: RaceConfig[] = [
  {
    id: '947-joburg',
    name: '947 Ride Joburg',
    shortName: '947',
    distance: 98,
    location: 'Johannesburg, South Africa',
    defaultStartTime: '06:00',
    month: 'November',
    checkpoints: [
      { name: 'M1 17km', distance: 17, terrainFactor: 1.0, description: 'Moderate start, mixed terrain' },
      { name: 'Kyalami Entrance 44.2km', distance: 44.2, terrainFactor: 1.25, description: 'Fast section - downhill/flat' },
      { name: 'Kyalami Exit 49.3km', distance: 49.3, terrainFactor: 0.75, description: 'Challenging hills - expect slowdown' },
      { name: 'Mandela Bridge 84.2km', distance: 84.2, terrainFactor: 0.65, description: 'Toughest section - major hills' },
      { name: 'Finish 98km', distance: 98, terrainFactor: 0.85, description: 'Final push - mixed terrain' }
    ],
    hillWarningCheckpoints: ['Kyalami Exit 49.3km', 'Mandela Bridge 84.2km'],
    paceValidation: {
      minMinutes: 150,
      eliteMinutes: 180
    },
    csvFilenamePrefix: '947_ride_terrain_splits'
  },
  {
    id: 'ctct',
    name: 'Cape Town Cycle Tour',
    shortName: 'CTCT',
    distance: 109,
    location: 'Cape Town, South Africa',
    defaultStartTime: '06:30',
    month: 'March',
    checkpoints: [
      { name: 'Ou Kaapse Weg Base 35km', distance: 35, terrainFactor: 0.95, description: 'Rolling coastal roads, find your rhythm' },
      { name: 'Ou Kaapse Weg Summit 42km', distance: 42, terrainFactor: 0.55, description: 'The toughest climb - steep sustained ascent, reduce pace significantly' },
      { name: 'Sun Valley 50km', distance: 50, terrainFactor: 1.35, description: 'Fast technical descent - recover and spin out legs' },
      { name: "Chapman's Peak 65km", distance: 65, terrainFactor: 1.0, description: 'Scenic rolling coastal section, manageable pace' },
      { name: 'Noordhoek Valley 75km', distance: 75, terrainFactor: 1.1, description: 'Flat valley - beware SE Cape Doctor headwind' },
      { name: 'Hout Bay 85km', distance: 85, terrainFactor: 0.9, description: 'Rolling hills into Hout Bay' },
      { name: 'Suikerbossie 95km', distance: 95, terrainFactor: 0.65, description: 'Second major climb - legs will be tired, dig deep' },
      { name: 'Finish Green Point 109km', distance: 109, terrainFactor: 1.15, description: 'Flat final push into Cape Town city centre' }
    ],
    hillWarningCheckpoints: ["Ou Kaapse Weg Summit 42km", "Suikerbossie 95km"],
    paceValidation: {
      minMinutes: 165,
      eliteMinutes: 200
    },
    csvFilenamePrefix: 'ctct_splits'
  }
];

export function getRaceConfig(id: string): RaceConfig {
  const config = RACE_CONFIGS.find(r => r.id === id);
  if (!config) {
    throw new Error(`Race configuration not found for id: ${id}`);
  }
  return config;
}
