"use client";

import { useState, useEffect } from 'react';
import { Download, Calculator, Clock, Mountain, TrendingUp, BarChart, ChevronRight, AlertTriangle, Info, CheckCircle2, XCircle, Coffee, Heart, Fuel, Droplet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import Link from 'next/link';
import { PlaceHolderImages } from '@/lib/placeholder-images';

type TerrainFactor = 1.0 | 1.25 | 0.75 | 0.65 | 0.85;

interface Checkpoint {
  name: string;
  distance: number;
  terrainFactor: TerrainFactor;
  description: string;
}

interface Split {
  name: string;
  distance: number;
  cumulativeDistance: number;
  timeToPoint: number;
  splitTime: number;
  splitDistance: number;
  speedOnSplit: number;
  movingAverageSpeed: number;
  terrainFactor: TerrainFactor;
  description: string;
  nutritionEvents: NutritionEvent[];
}

interface NutritionEvent {
  time: number;
  type: 'fuel' | 'hydration';
  details: string;
  checkpointName: string;
  distance: number;
  isPreHillWarning: boolean;
}

type PaceValidation = {
  level: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  Icon: React.ElementType;
} | null;

type NutritionStrategy = 'aggressive' | 'standard' | 'conservative' | 'none';

type RiderProfile = 'beginner' | 'intermediate' | 'pro';


const RaceSplitsCalculator = () => {
  const [targetHours, setTargetHours] = useState(3);
  const [targetMinutes, setTargetMinutes] = useState(45);
  const [splits, setSplits] = useState<Split[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [paceValidation, setPaceValidation] = useState<PaceValidation>(null);
  const [nutritionStrategy, setNutritionStrategy] = useState<NutritionStrategy>('none');
  const [nutritionEvents, setNutritionEvents] = useState<NutritionEvent[]>([]);
  const [riderProfile, setRiderProfile] = useState<RiderProfile>('intermediate');


  const checkpoints: Checkpoint[] = [
    { name: 'M1 17km', distance: 17, terrainFactor: 1.0, description: 'Moderate start, mixed terrain' },
    { name: 'Kyalami Entrance 44.2km', distance: 44.2, terrainFactor: 1.25, description: 'Fast section - downhill/flat' },
    { name: 'Kyalami Exit 49.3km', distance: 49.3, terrainFactor: 0.75, description: 'Challenging hills - expect slowdown' },
    { name: 'Mandela Bridge 84.2km', distance: 84.2, terrainFactor: 0.65, description: 'Toughest section - major hills' },
    { name: 'Finish 98km', distance: 98, terrainFactor: 0.85, description: 'Final push - mixed terrain' }
  ];

  const presets = [
    { label: 'Competitive', time: '3:00', hours: 3, minutes: 0 },
    { label: 'Strong', time: '3:30', hours: 3, minutes: 30 },
    { label: 'Recreational', time: '4:00', hours: 4, minutes: 0 },
    { label: 'Finisher', time: '4:30', hours: 4, minutes: 30 },
    { label: 'Cruiser', time: '5:00', hours: 5, minutes: 0 },
  ];

  const heroImage = PlaceHolderImages.find(p => p.id === 'cyclist-hero');

  useEffect(() => {
    validatePace();
    setShowResults(false);
  }, [targetHours, targetMinutes]);


  const validatePace = () => {
    const totalMinutes = targetHours * 60 + targetMinutes;
    if (totalMinutes < 150) { 
      setPaceValidation({ level: 'error', title: 'Elite Professional Pace', message: 'This is a world-class time, typically reserved for professional cyclists. Please ensure this is a realistic goal.', Icon: XCircle });
    } else if (totalMinutes < 180) { 
      setPaceValidation({ level: 'warning', title: 'Very Aggressive Pace', message: 'This is a highly competitive goal for experienced racers. It requires dedicated training and race strategy.', Icon: AlertTriangle });
    } else if (totalMinutes < 210) { 
      setPaceValidation({ level: 'info', title: 'Competitive Time', message: 'A strong and challenging goal for dedicated recreational cyclists. Great job!', Icon: Info });
    } else if (totalMinutes <= 270) { 
      setPaceValidation({ level: 'success', title: 'Realistic & Achievable', message: 'This is a great target for most riders. With consistent training, you can achieve this!', Icon: CheckCircle2 });
    } else if (totalMinutes <= 360) { 
      setPaceValidation({ level: 'info', title: 'Leisurely & Enjoyable Pace', message: 'A comfortable pace to enjoy the ride and soak in the atmosphere. Perfect for a fun day out.', Icon: Info });
    } else { 
      setPaceValidation({ level: 'warning', title: 'Very Conservative Pace', message: 'This pace is quite relaxed. Be mindful of official cut-off times along the route.', Icon: AlertTriangle });
    }
  };
  
  const setPresetTime = (hours: number, minutes: number) => {
    setTargetHours(hours);
    setTargetMinutes(minutes);
  };


  const formatTime = (totalMinutes: number) => {
    if (isNaN(totalMinutes)) return "00:00:00";
    const totalSeconds = totalMinutes * 60;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  const getDifficultyIcon = (terrainFactor: TerrainFactor, className?: string) => {
    if (terrainFactor >= 1.2) return <span className={cn("material-symbols-outlined text-green-500", className)}>trending_flat</span>;
    if (terrainFactor >= 0.8 && terrainFactor < 1.2) return <span className={cn("material-symbols-outlined text-yellow-500", className)}>show_chart</span>;
    if (terrainFactor >= 0.7 && terrainFactor < 0.8) return <span className={cn("material-symbols-outlined text-orange-500", className)}>trending_up</span>;
    return <span className={cn("material-symbols-outlined text-red-500", className)}>altitude</span>;
  };
  
  const getDifficultyDescription = (terrainFactor: TerrainFactor) => {
    if (terrainFactor >= 1.2) return "Fast";
    if (terrainFactor >= 0.8) return "Moderate";
    return "Hilly";
  };


  const calculateSplits = () => {
    const targetTotalMinutes = targetHours * 60 + targetMinutes;
    if (targetTotalMinutes <= 0) return;
    const totalDistance = 98;
    
    const baseAverageSpeed = totalDistance / (targetTotalMinutes / 60);
    
    let calculatedSplits: Omit<Split, 'movingAverageSpeed' | 'nutritionEvents'>[] = [];
    let cumulativeTime = 0;
    
    for (let i = 0; i < checkpoints.length; i++) {
      const checkpoint = checkpoints[i];
      const prevDistance = i === 0 ? 0 : checkpoints[i - 1].distance;
      const splitDistance = checkpoint.distance - prevDistance;
      
      const adjustedSpeed = baseAverageSpeed * checkpoint.terrainFactor;
      const splitTimeMinutes = (splitDistance / adjustedSpeed) * 60;
      
      cumulativeTime += splitTimeMinutes;
      
      calculatedSplits.push({
        name: checkpoint.name,
        distance: checkpoint.distance,
        cumulativeDistance: checkpoint.distance,
        timeToPoint: cumulativeTime,
        splitTime: splitTimeMinutes,
        splitDistance: splitDistance,
        speedOnSplit: adjustedSpeed,
        terrainFactor: checkpoint.terrainFactor,
        description: checkpoint.description
      });
    }
    
    const totalCalculatedTime = calculatedSplits[calculatedSplits.length - 1].timeToPoint;
    const normalizationFactor = targetTotalMinutes / totalCalculatedTime;
    
    let normalizedCumulativeTime = 0;
    const finalSplitsWithoutNutrition = calculatedSplits.map((split): Omit<Split, 'nutritionEvents'> => {
      const normalizedSplitTime = split.splitTime * normalizationFactor;
      normalizedCumulativeTime += normalizedSplitTime;

      return {
          ...split,
          timeToPoint: normalizedCumulativeTime,
          splitTime: normalizedSplitTime,
          speedOnSplit: split.splitDistance / (normalizedSplitTime / 60),
          movingAverageSpeed: split.cumulativeDistance / (normalizedCumulativeTime / 60),
      };
    });

    const calculatedNutritionEvents = calculateNutritionEvents(finalSplitsWithoutNutrition, targetTotalMinutes);
    setNutritionEvents(calculatedNutritionEvents);
    
    const finalSplits = finalSplitsWithoutNutrition.map(split => {
      const nutritionForSplit = calculatedNutritionEvents.filter(event => {
          const prevSplit = finalSplitsWithoutNutrition.find((s,i) => i > 0 && finalSplitsWithoutNutrition[i].name === split.name);
          const prevTime = prevSplit ? prevSplit.timeToPoint - prevSplit.splitTime : 0;
          return event.time > prevTime && event.time <= split.timeToPoint;
      });
      return { ...split, nutritionEvents: nutritionForSplit };
    });

    setSplits(finalSplits);
    setShowResults(true);
  };

  const calculateNutritionEvents = (currentSplits: Omit<Split, 'nutritionEvents'>[], targetTime: number): NutritionEvent[] => {
    if (nutritionStrategy === 'none') return [];
  
    const nutritionPresets = {
      aggressive: { fuelingInterval: 20, carbs: 90, details: 'Gel every 20min, 90g carbs/hour' },
      standard: { fuelingInterval: 30, carbs: 60, details: 'Gel every 30min, 60g carbs/hour' },
      conservative: { fuelingInterval: 45, carbs: 40, details: 'Bar/Gel every 45min, 40-50g carbs/hour' },
    };
    
    const preset = nutritionPresets[nutritionStrategy];
    if (!preset) return [];
  
    const events: NutritionEvent[] = [];
    const raceFinishTime = targetTime;
    const finalFuelTime = raceFinishTime - 10;
  
    // Fueling events
    for (let time = 15; time < finalFuelTime; time += preset.fuelingInterval) {
      const split = currentSplits.find(s => s.timeToPoint >= time);
      if (!split) continue;
  
      const prevSplit = currentSplits[currentSplits.indexOf(split) - 1];
      const timeIntoSplit = prevSplit ? time - prevSplit.timeToPoint : time;
      const distance = (prevSplit ? prevSplit.distance : 0) + (timeIntoSplit / split.splitTime) * split.splitDistance;
  
      const isPreHillWarning = (split.name === 'Kyalami Exit 49.3km' || split.name === 'Mandela Bridge 84.2km') && (split.timeToPoint - time < 15);
  
      events.push({
        time,
        type: 'fuel',
        details: `Take 1x Gel (${Math.round(preset.carbs / (60 / preset.fuelingInterval))}g carbs)`,
        checkpointName: `Towards ${split.name}`,
        distance,
        isPreHillWarning
      });
    }

    // Hydration events
    for (let time = 10; time < raceFinishTime - 5; time += 20) {
        const split = currentSplits.find(s => s.timeToPoint >= time);
        if (!split) continue;
    
        const prevSplit = currentSplits[currentSplits.indexOf(split) - 1];
        const timeIntoSplit = prevSplit ? time - prevSplit.timeToPoint : time;
        const distance = (prevSplit ? prevSplit.distance : 0) + (timeIntoSplit / split.splitTime) * split.splitDistance;
    
        events.push({
          time,
          type: 'hydration',
          details: 'Sip of water/electrolytes',
          checkpointName: `Towards ${split.name}`,
          distance,
          isPreHillWarning: false,
        });
      }
  
    return events.sort((a, b) => a.time - b.time);
  };
  
  
  const downloadCSV = () => {
    if (typeof window === "undefined") return;
    const headers = [
      'Point on Route', 'Distance (km)', 'Time to Point', 'Split Time', 
      'Split Distance (km)', 'Speed on Split (km/h)', 'Moving Average Speed (km/h)', 'Terrain Description', 'Nutrition'
    ];
    
    const csvData = splits.map(split => {
      const nutritionInfo = split.nutritionEvents.map(e => `${e.type} at ${formatTime(e.time)}`).join('; ');
      return [
        split.name, split.distance.toFixed(1),
        formatTime(split.timeToPoint), formatTime(split.splitTime), split.splitDistance.toFixed(1),
        split.speedOnSplit.toFixed(2), split.movingAverageSpeed.toFixed(2), `"${split.description}"`, `"${nutritionInfo}"`
      ]
    });
    
    const csv = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `947_ride_terrain_splits_${targetHours}h${targetMinutes}m.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const overallAverageSpeed = (98 / ((targetHours * 60 + targetMinutes) / 60));

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col group/design-root overflow-x-hidden">
      <div className="layout-container flex h-full grow flex-col">
        <div className="px-4 md:px-10 lg:px-40 flex flex-1 justify-center py-5">
          <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
            
            <div className="@container">
              <div className="@[480px]:p-4">
                <div 
                  className="flex min-h-[480px] flex-col gap-6 bg-cover bg-center bg-no-repeat @[480px]:gap-8 @[480px]:rounded-xl items-center justify-center p-4" 
                  style={{
                    backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.6) 100%), url("${heroImage?.imageUrl}")`
                  }}
                  data-ai-hint={heroImage?.imageHint}
                >
                  <div className="flex flex-col gap-2 text-center">
                    <h1 className="text-white text-4xl font-black leading-tight tracking-[-0.033em] @[480px]:text-6xl">
                      Plan Your Perfect Race
                    </h1>
                    <h2 className="text-gray-200 text-base font-normal leading-normal @[480px]:text-lg">
                      Enter your 947 Ride Joburg target time to get a personalized plan.
                    </h2>
                  </div>
                  <Button onClick={calculateSplits} size="lg" className="h-12 px-5 bg-primary text-white text-base font-bold tracking-wide hover:bg-primary/90 transition-colors">
                    <Calculator className="mr-2" />
                    Generate Race Plan
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-gray-900 dark:text-white text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">Enter Your Target Time</h2>
              <div className="flex flex-wrap items-end gap-4 px-4 py-3">
                <div className="grid gap-2 flex-1 min-w-40">
                  <Label htmlFor="hours" className="text-gray-800 dark:text-gray-300 text-base font-medium leading-normal">Hours</Label>
                  <Input
                    id="hours"
                    type="number" min="2" max="8" value={targetHours}
                    onChange={(e) => setTargetHours(parseInt(e.target.value) || 2)}
                    className="form-input h-14 p-[15px] text-base"
                    placeholder="03"
                  />
                </div>
                <div className="grid gap-2 flex-1 min-w-40">
                  <Label htmlFor="minutes" className="text-gray-800 dark:text-gray-300 text-base font-medium leading-normal">Minutes</Label>
                  <Input
                    id="minutes"
                    type="number" min="0" max="59" value={targetMinutes}
                    onChange={(e) => setTargetMinutes(parseInt(e.target.value) || 0)}
                    className="form-input h-14 p-[15px] text-base"
                    placeholder="45"
                  />
                </div>
                <div className="grid gap-2 flex-1 min-w-40">
                  <Label className="text-gray-800 dark:text-gray-300 text-base font-medium leading-normal">Your Goal</Label>
                   <div className="text-2xl font-bold text-primary pb-2 h-14 flex items-center">
                    {targetHours}:{targetMinutes.toString().padStart(2, '0')}:00
                  </div>
                </div>
              </div>
              {paceValidation && (
                <div className="px-4 py-2">
                  <Alert variant={paceValidation.level === 'error' ? 'destructive' : 'default'} className={cn({
                    'bg-yellow-50 border-yellow-300 text-yellow-800 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-200 [&>svg]:text-yellow-500': paceValidation.level === 'warning',
                    'bg-blue-50 border-blue-300 text-blue-800 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-200 [&>svg]:text-blue-500': paceValidation.level === 'info',
                    'bg-green-50 border-green-300 text-green-800 dark:bg-green-950 dark:border-green-800 dark:text-green-200 [&>svg]:text-green-500': paceValidation.level === 'success',
                  })}>
                    <paceValidation.Icon className="h-4 w-4" />
                    <AlertTitle>{paceValidation.title}</AlertTitle>
                    <AlertDescription>{paceValidation.message}</AlertDescription>
                  </Alert>
                </div>
              )}
            </div>

            <div className="mt-4">
              <h3 className="text-gray-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">Select Your Rider Profile</h3>
              <div className="flex px-4 py-3">
                <div className="flex h-12 flex-1 items-center justify-center rounded-lg bg-gray-200 dark:bg-gray-800 p-1">
                  {(['beginner', 'intermediate', 'pro'] as RiderProfile[]).map(profile => (
                    <label key={profile} className="flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-md px-3 has-[:checked]:bg-white dark:has-[:checked]:bg-gray-900 has-[:checked]:shadow-md has-[:checked]:text-primary text-gray-600 dark:text-gray-400 text-sm font-medium leading-normal transition-all duration-200">
                      <span className="truncate capitalize">{profile}</span>
                      <input 
                        className="invisible w-0" 
                        name="rider-profile" 
                        type="radio" 
                        value={profile}
                        checked={riderProfile === profile}
                        onChange={() => setRiderProfile(profile)}
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {showResults && (
              <>
                <div className="mt-8">
                  <h2 className="text-gray-900 dark:text-white text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">Your Race Plan</h2>
                  
                  <div className="md:hidden grid grid-cols-1 sm:grid-cols-2 gap-4 px-4 py-3">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5 border border-gray-200 dark:border-gray-700">
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg. Speed</h4>
                      <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{overallAverageSpeed.toFixed(1)} km/h</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5 border border-gray-200 dark:border-gray-700">
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Halfway Split</h4>
                      <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{splits.length > 2 ? formatTime(splits[2].timeToPoint): 'N/A'}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5 border border-gray-200 dark:border-gray-700 col-span-1 sm:col-span-2">
                       <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Estimated Finish</h4>
                       <p className="mt-1 text-3xl font-bold text-primary">{formatTime(targetHours*60 + targetMinutes)}</p>
                    </div>
                  </div>

                  <div className="hidden md:block px-4 py-3">
                    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                      <Table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                        <TableHeader className="bg-gray-50 dark:bg-gray-700/50">
                          <TableRow>
                            <TableHead>Checkpoint</TableHead>
                            <TableHead className="text-center">Terrain</TableHead>
                            <TableHead className="text-center">Dist.</TableHead>
                            <TableHead className="text-center">Time to Point</TableHead>
                            <TableHead className="text-center">Split Time</TableHead>
                            <TableHead className="text-center">Speed</TableHead>
                             <TableHead>Nutrition</TableHead>
                            <TableHead>Description</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {splits.map((split, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{split.name}</TableCell>
                              <TableCell className="flex justify-center items-center h-full pt-6">{getDifficultyIcon(split.terrainFactor)}</TableCell>
                              <TableCell className="text-center font-mono">{split.distance.toFixed(1)}km</TableCell>
                              <TableCell className="text-center font-mono text-primary font-semibold">{formatTime(split.timeToPoint)}</TableCell>
                              <TableCell className="text-center font-mono">{formatTime(split.splitTime)}</TableCell>
                              <TableCell className={cn("text-center font-medium font-mono", split.terrainFactor >= 1.2 ? 'text-green-600' : split.terrainFactor < 0.8 ? 'text-red-600' : '')}>
                                {split.speedOnSplit.toFixed(1)} km/h
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col gap-1.5">
                                  {split.nutritionEvents.map((event, idx) => (
                                      <div key={idx} className={cn("flex items-center gap-2 text-xs p-1 rounded-md", event.isPreHillWarning ? 'bg-amber-100 dark:bg-amber-900/50' : '')}>
                                          {event.type === 'fuel' ? <Fuel className="w-3.5 h-3.5 text-orange-500" /> : <Droplet className="w-3.5 h-3.5 text-blue-500" />}
                                          <span>@{formatTime(event.time)}</span>
                                      </div>
                                  ))}
                                </div>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground whitespace-pre-wrap min-w-[200px]">{split.description}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <h3 className="text-gray-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">Terrain Legend</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-4 py-3">
                      <div className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                          <span className="material-symbols-outlined text-green-500">trending_flat</span>
                          <span className="text-sm text-gray-700 dark:text-gray-300">Fast / Flat</span>
                      </div>
                      <div className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                          <span className="material-symbols-outlined text-yellow-500">show_chart</span>
                          <span className="text-sm text-gray-700 dark:text-gray-300">Rolling Hills</span>
                      </div>
                      <div className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                          <span className="material-symbols-outlined text-orange-500">trending_up</span>
                          <span className="text-sm text-gray-700 dark:text-gray-300">Climb</span>
                      </div>
                      <div className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                          <span className="material-symbols-outlined text-red-500">altitude</span>
                          <span className="text-sm text-gray-700 dark:text-gray-300">Steep Climb</span>
                      </div>
                  </div>
                </div>

                 {showResults && nutritionEvents.length > 0 && (
                    <Card className="m-4">
                        <CardHeader>
                            <CardTitle>Nutrition Timeline</CardTitle>
                            <CardDescription>
                                Your personalized fueling and hydration plan based on a <strong>{nutritionStrategy}</strong> strategy.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[300px] w-full pr-4">
                                <div className="relative pl-6">
                                    <div className="absolute left-[1px] h-full w-0.5 bg-border -translate-x-1/2"></div>
                                    {nutritionEvents.map((event, index) => (
                                        <div key={index} className="mb-6 flex items-start gap-4">
                                            <div className={cn("mt-1 flex-shrink-0 h-4 w-4 rounded-full border-2 flex items-center justify-center", event.type === 'fuel' ? 'bg-orange-500 border-orange-300' : 'bg-blue-500 border-blue-300')}>
                                                {event.type === 'fuel' ? <Fuel className="w-2.5 h-2.5 text-white" /> : <Droplet className="w-2.5 h-2.5 text-white" />}
                                            </div>
                                            <div className="flex-grow">
                                                <p className="font-bold">{formatTime(event.time)} ({event.distance.toFixed(1)} km)</p>
                                                <p className="text-sm text-muted-foreground">{event.details}</p>
                                                <p className="text-xs text-muted-foreground">{event.checkpointName}</p>
                                                {event.isPreHillWarning && (
                                                    <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 p-1 bg-amber-100 dark:bg-amber-900/50 rounded-md">
                                                        <AlertTriangle className="w-3.5 h-3.5" />
                                                        <span>Fuel before the next big climb!</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                )}
              </>
            )}

            <footer className="mt-16 border-t border-gray-200 dark:border-gray-700 pt-8 pb-8 px-4">
              <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                <p>A passion project by Spera Didiza. © 2024 RideWise Splits.</p>
                <div className="flex space-x-4 mt-4 md:mt-0">
                  <Button asChild variant="link" className="text-primary hover:text-primary/80">
                    <Link href="https://paystack.shop/pay/spera" target="_blank">
                      <Coffee className="mr-2" />
                      Buy me a coffee
                    </Link>
                  </Button>
                </div>
              </div>
            </footer>

          </div>
        </div>
      </div>
    </div>
  );
};

export default RaceSplitsCalculator;
