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
    defaultStartTime: '06:30',
    month: 'March',
    checkpoints: [
      { name: 'Constantia 9.9km', distance: 9.9, terrainFactor: 0.94, description: 'Rolling coastal start — expect peloton congestion, settle into your rhythm' },
      { name: "Simon's Town 20.8km", distance: 20.8, terrainFactor: 1.27, description: 'Fast coastal section — includes steep climb then big descent to Simon\'s Town' },
      { name: 'Klaas Jagersberg 37.9km', distance: 37.9, terrainFactor: 1.16, description: 'Fast flat return leg — bank time here, the OKW climb is coming' },
      { name: 'Perdekloof 51.2km', distance: 51.2, terrainFactor: 0.94, description: '⚠️ Ou Kaapse Weg — 5km sustained climb at ~20 km/h, biggest challenge on the route' },
      { name: 'Noordhoek 62km', distance: 62.0, terrainFactor: 1.18, description: 'OKW descent into Noordhoek valley — fast recovery, let the legs spin out' },
      { name: 'Hout Bay 70.1km', distance: 70.1, terrainFactor: 1.12, description: 'Rolling coastal section into Hout Bay — manageable hills, stay fuelled' },
      { name: 'Tokai 89km', distance: 89.0, terrainFactor: 1.03, description: 'Mixed terrain — notable climb (+96m) followed by big descent (-149m), nets average pace' },
      { name: 'Suikerbossie 95km', distance: 95.0, terrainFactor: 0.96, description: '⚠️ Suikerbossie climb (+133m at 15 km/h) — the final major climb, give everything you have' },
      { name: 'Finish Green Point 109km', distance: 109.0, terrainFactor: 1.08, description: 'Fast descent then flat run into Cape Town city centre — empty the tank all the way to Green Point' }
    ],
    hillWarningCheckpoints: ["Perdekloof 51.2km", "Suikerbossie 95km"],
    paceValidation: {
      minMinutes: 200,
      eliteMinutes: 225,
      beginnerWarningMinutes: 270
    },
    csvFilenamePrefix: 'ctct_109km_splits',
    infoBanner: "Ou Kaapse Weg at 44-50km and Suikerbossie at 88-95km are the defining climbs"
  }
];

export function getRaceConfig(id: string): RaceConfig {
  const config = RACE_CONFIGS.find(r => r.id === id);
  if (!config) {
    throw new Error(`Race configuration not found for id: ${id}`);
  }
  return config;
}
