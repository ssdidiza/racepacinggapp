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
    beginnerWarningMinutes: number;
  };
  hillWarningCheckpoints: string[];
  csvFilenamePrefix: string;
  infoBanner: string;
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
      eliteMinutes: 180,
      beginnerWarningMinutes: 240
    },
    csvFilenamePrefix: '947_ride_joburg_splits',
    infoBanner: "Watch for Mandela Bridge at 84km — the race is won or lost there"
  },
  {
    id: 'ctct',
    name: 'Cape Town Cycle Tour',
    shortName: 'CTCT',
    distance: 109,
    location: 'Cape Town, South Africa',
    defaultStartTime: '07:00',
    month: 'March',
    checkpoints: [
      { 
        name: 'Strand St 1km', 
        distance: 1.0, 
        terrainFactor: 0.54, 
        description: 'Peloton rollout — 15 km/h average due to mass start. Do NOT panic, this is normal.' 
      },
      { 
        name: 'Edinburg Dr 11.3km', 
        distance: 11.3, 
        terrainFactor: 0.82, 
        description: 'Rolling southern suburbs — early congestion clears, but undulating terrain keeps pace honest' 
      },
      { 
        name: 'Tokai 17.5km', 
        distance: 17.5, 
        terrainFactor: 1.00, 
        description: 'Moderate tempo — roads open up, find your race rhythm here' 
      },
      { 
        name: 'Fish Hoek 27.3km', 
        distance: 27.3, 
        terrainFactor: 1.05, 
        description: 'Slightly above average pace — False Bay coastal road, flat and fast' 
      },
      { 
        name: "Simon's Town 35.3km", 
        distance: 35.3, 
        terrainFactor: 1.07, 
        description: 'Fastest leg — descent into Simon\'s Town, southernmost turnaround point. Bank this time.' 
      },
      { 
        name: 'Scarborough 57.9km', 
        distance: 57.9, 
        terrainFactor: 1.04, 
        description: '⚠️ Ou Kaapse Weg climb is in this segment — but the descent to Scarborough compensates. Survive the climb (5km at ~20 km/h) and the descent rewards you.' 
      },
      { 
        name: 'Noordhoek 74.3km', 
        distance: 74.3, 
        terrainFactor: 1.05, 
        description: 'Noordhoek valley — wide open roads, possible Cape Doctor headwind. Stay aero.' 
      },
      { 
        name: 'Hout Bay 87km', 
        distance: 87.0, 
        terrainFactor: 1.02, 
        description: 'Rolling coastal section into Hout Bay — stay fuelled for what\'s coming' 
      },
      { 
        name: 'Finish Green Point 109km', 
        distance: 109.0, 
        terrainFactor: 1.01, 
        description: '⚠️ Suikerbossie climb at 88-95km (+133m). After the summit, descend and empty the tank all the way to Green Point finish.' 
      },
    ],
    hillWarningCheckpoints: ["Scarborough 57.9km", "Finish Green Point 109km"],
    paceValidation: {
      minMinutes: 210,
      eliteMinutes: 190,
      beginnerWarningMinutes: 330
    },
    csvFilenamePrefix: 'ctct_109km_splits',
    infoBanner: "Ou Kaapse Weg is buried in the 35-58km leg. Suikerbossie is the final sting at 88-95km. The peloton start means your first 1km will show 15 km/h — that's normal."
  }
];

export function getRaceConfig(id: string): RaceConfig {
  const config = RACE_CONFIGS.find(r => r.id === id);
  if (!config) {
    throw new Error(`Race configuration not found for id: ${id}`);
  }
  return config;
}
