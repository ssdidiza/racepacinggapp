"use client";

import { useState, useEffect, useRef } from 'react';
import { Download, Calculator, Clock, Mountain, TrendingUp, BarChart, ChevronRight, AlertTriangle, Info, CheckCircle2, XCircle, Coffee, Heart, Fuel, Droplet, ChevronDown } from 'lucide-react';
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
  timeOfDay: string;
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
  timeOfDay: string;
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
  const [startTime, setStartTime] = useState('06:00');
  const [splits, setSplits] = useState<Split[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [paceValidation, setPaceValidation] = useState<PaceValidation>(null);
  const [nutritionStrategy, setNutritionStrategy] = useState<NutritionStrategy>('standard');
  const [nutritionEvents, setNutritionEvents] = useState<NutritionEvent[]>([]);
  const [riderProfile, setRiderProfile] = useState<RiderProfile>('intermediate');
  const resultsRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const footerRef = useRef<HTMLDivElement>(null);


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

  const heroImage = PlaceHolderImages.find(p => p.id === 'cyclist-hero-2');

  useEffect(() => {
    validatePace();
    setShowResults(false);
  }, [targetHours, targetMinutes]);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsAtBottom(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (footerRef.current) {
      observer.observe(footerRef.current);
    }

    return () => {
      if (footerRef.current) {
        observer.unobserve(footerRef.current);
      }
    };
  }, [showResults]);


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
      setPaceValidation({ level: 'info', title: 'Leisurely & Enjoyable Pace', message: 'A comfortable pace to enjoy the ride and soak in the atmosphere. Perfect for a fun day out.', Icon: Coffee });
    } else { 
      setPaceValidation({ level: 'warning', title: 'Very Conservative Pace', message: 'This pace is quite relaxed. Be mindful of official cut-off times along the route.', Icon: AlertTriangle });
    }
  };
  
  const setPresetTime = (hours: number, minutes: number) => {
    setTargetHours(hours);
    setTargetMinutes(minutes);
  };


  const formatTime = (totalMinutes: number) => {
    if (isNaN(totalMinutes) || totalMinutes < 0) return "00:00:00";
    const totalSeconds = Math.round(totalMinutes * 60);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatTimeOfDay = (baseTime: string, addedMinutes: number) => {
    if (!baseTime) return '';
    const [startHours, startMinutes] = baseTime.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(startHours, startMinutes, 0, 0);
    const newDate = new Date(startDate.getTime() + addedMinutes * 60000);
    return newDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
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


  const handleCalculate = () => {
    calculateSplits();
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const calculateSplits = () => {
    const targetTotalMinutes = targetHours * 60 + targetMinutes;
    if (targetTotalMinutes <= 0) return;
    const totalDistance = 98;
    
    const baseAverageSpeed = totalDistance / (targetTotalMinutes / 60);
    
    let calculatedSplits: Omit<Split, 'movingAverageSpeed' | 'nutritionEvents' | 'timeOfDay'>[] = [];
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
          timeOfDay: formatTimeOfDay(startTime, normalizedCumulativeTime),
          splitTime: normalizedSplitTime,
          speedOnSplit: split.splitDistance / (normalizedSplitTime / 60),
          movingAverageSpeed: split.cumulativeDistance / (normalizedCumulativeTime / 60),
      };
    });

    const calculatedNutritionEvents = calculateNutritionEvents(finalSplitsWithoutNutrition, targetTotalMinutes);
    setNutritionEvents(calculatedNutritionEvents);
    
    const finalSplits = finalSplitsWithoutNutrition.map(split => {
      const nutritionForSplit = calculatedNutritionEvents.filter(event => {
          const prevSplitIndex = finalSplitsWithoutNutrition.findIndex(s => s.name === split.name) - 1;
          const prevTime = prevSplitIndex >= 0 ? finalSplitsWithoutNutrition[prevSplitIndex].timeToPoint : 0;
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
  
    for (let time = 15; time < finalFuelTime; time += preset.fuelingInterval) {
      const split = currentSplits.find(s => s.timeToPoint >= time);
      if (!split) continue;
  
      const splitIndex = currentSplits.indexOf(split);
      const prevSplit = splitIndex > 0 ? currentSplits[splitIndex - 1] : null;
      const prevTime = prevSplit ? prevSplit.timeToPoint : 0;
      const prevDistance = prevSplit ? prevSplit.distance : 0;
      
      const timeIntoSplit = time - prevTime;
      const distance = prevDistance + (timeIntoSplit / split.splitTime) * split.splitDistance;
  
      const isPreHillWarning = (split.name === 'Kyalami Exit 49.3km' || split.name === 'Mandela Bridge 84.2km') && (split.timeToPoint - time < 15);
  
      events.push({
        time,
        timeOfDay: formatTimeOfDay(startTime, time),
        type: 'fuel',
        details: `Take 1x Gel (${Math.round(preset.carbs / (60 / preset.fuelingInterval))}g carbs)`,
        checkpointName: `Towards ${split.name}`,
        distance,
        isPreHillWarning
      });
    }

    for (let time = 10; time < raceFinishTime - 5; time += 20) {
        const split = currentSplits.find(s => s.timeToPoint >= time);
        if (!split) continue;
    
        const splitIndex = currentSplits.indexOf(split);
        const prevSplit = splitIndex > 0 ? currentSplits[splitIndex - 1] : null;
        const prevTime = prevSplit ? prevSplit.timeToPoint : 0;
        const prevDistance = prevSplit ? prevSplit.distance : 0;

        const timeIntoSplit = time - prevTime;
        const distance = prevDistance + (timeIntoSplit / split.splitTime) * split.splitDistance;
    
        events.push({
          time,
          timeOfDay: formatTimeOfDay(startTime, time),
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
      'Point on Route', 'Distance (km)', 'Time of Day', 'Time to Point', 'Split Time', 
      'Split Distance (km)', 'Speed on Split (km/h)', 'Moving Average Speed (km/h)', 'Terrain Description', 'Nutrition'
    ];
    
    let allEvents = splits.flatMap(split => {
      const splitRow = [
          split.name, split.distance.toFixed(1),
          split.timeOfDay, formatTime(split.timeToPoint), formatTime(split.splitTime), split.splitDistance.toFixed(1),
          split.speedOnSplit.toFixed(2), split.movingAverageSpeed.toFixed(2), `"${split.description}"`,""
      ];
      
      const nutritionRows = split.nutritionEvents.map(e => [
        `Nutrition Event`,
        e.distance.toFixed(1),
        e.timeOfDay,
        formatTime(e.time),
        "", "", "", "",
        `"${e.checkpointName}"`,
        `"${e.type}: ${e.details}"`
      ]);

      return [splitRow, ...nutritionRows];
    });

    const uniqueRows = Array.from(new Set(allEvents.map(JSON.stringify))).map(s => JSON.parse(s));

    const csv = [headers, ...uniqueRows].map(row => row.join(',')).join('\n');

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

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col group/design-root overflow-x-hidden bg-background">
      <div className="layout-container flex h-full grow flex-col">
        <main className="flex flex-1 justify-center py-5">
          <div className="layout-content-container flex flex-col max-w-[960px] flex-1 px-4 md:px-6">
            
            <section
              className="flex flex-col gap-8 rounded-xl bg-cover bg-center p-6 md:p-8 lg:p-12"
              style={{
                backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.7) 100%), url("${heroImage?.imageUrl}")`
              }}
              data-ai-hint={heroImage?.imageHint}
            >
              <div className="flex flex-col gap-2 text-center text-white">
                <h1 className="text-4xl font-black md:text-6xl">
                  Plan Your Perfect Race
                </h1>
                <h2 className="text-lg text-gray-200 md:text-xl">
                  Enter your 947 Ride Joburg target time to get a personalized plan.
                </h2>
              </div>
              
              <Card className="bg-card/80 backdrop-blur-sm border-white/20">
                <CardContent className="p-6">
                  <div className="grid gap-6">
                    <div>
                      <Label className="text-white text-lg font-bold">Enter Target Time</Label>
                      <div className="flex flex-wrap items-end gap-4 mt-2">
                        <div className="grid gap-2 flex-1 min-w-40">
                          <Label htmlFor="hours" className="text-gray-300 font-medium">Hours</Label>
                          <Input
                            id="hours"
                            type="number" min="2" max="8" value={targetHours}
                            onChange={(e) => setTargetHours(parseInt(e.target.value) || 2)}
                            className="h-14 p-4 text-lg bg-white/10 text-white border-white/30 focus:border-primary"
                            placeholder="3"
                          />
                        </div>
                        <div className="grid gap-2 flex-1 min-w-40">
                          <Label htmlFor="minutes" className="text-gray-300 font-medium">Minutes</Label>
                          <Input
                            id="minutes"
                            type="number" min="0" max="59" value={targetMinutes}
                            onChange={(e) => setTargetMinutes(parseInt(e.target.value) || 0)}
                            className="h-14 p-4 text-lg bg-white/10 text-white border-white/30 focus:border-primary"
                            placeholder="45"
                          />
                        </div>
                        <div className="grid gap-2 flex-1 min-w-40">
                          <Label htmlFor="startTime" className="text-gray-300 font-medium">Start Time</Label>
                          <Input
                            id="startTime"
                            type="time" value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className="h-14 p-4 text-lg bg-white/10 text-white border-white/30 focus:border-primary"
                          />
                        </div>
                      </div>
                    </div>
                    {paceValidation && (
                      <Alert variant={paceValidation.level === 'error' ? 'destructive' : 'default'} className={cn('bg-opacity-20 border-opacity-40 text-white', {
                        'bg-yellow-500/20 border-yellow-300/40 [&>svg]:text-yellow-300': paceValidation.level === 'warning',
                        'bg-blue-500/20 border-blue-300/40 [&>svg]:text-blue-300': paceValidation.level === 'info',
                        'bg-green-500/20 border-green-300/40 [&>svg]:text-green-300': paceValidation.level === 'success',
                        'bg-red-500/20 border-red-300/40 [&>svg]:text-red-300': paceValidation.level === 'error',
                      })}>
                        <paceValidation.Icon className="h-4 w-4" />
                        <AlertTitle className="text-white">{paceValidation.title}</AlertTitle>
                        <AlertDescription className="text-gray-200">{paceValidation.message}</AlertDescription>
                      </Alert>
                    )}

                    <div>
                      <Label className="text-white font-bold text-lg">Rider Profile</Label>
                      <div className="flex mt-2">
                        <div className="flex h-12 flex-1 items-center justify-center rounded-lg bg-white/10 p-1">
                          {(['beginner', 'intermediate', 'pro'] as RiderProfile[]).map(profile => (
                            <label key={profile} className="flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-md px-3 has-[:checked]:bg-primary has-[:checked]:shadow-md has-[:checked]:text-white text-gray-300 text-sm font-medium transition-all duration-200">
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

                    <Button onClick={handleCalculate} size="lg" className="h-14 w-full text-lg font-bold">
                      <Calculator className="mr-2" />
                      Generate Race Plan
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </section>


            {showResults && (
              <div ref={resultsRef} className="mt-12 space-y-12">
                <section>
                  <h2 className="text-3xl font-bold tracking-tight">Your Race Plan</h2>
                  <p className="text-muted-foreground mt-2">A detailed breakdown of your race, split by split.</p>
                  
                  <div className="mt-6 grid grid-cols-1 gap-4 md:hidden">
                  {splits.map((split, index) => (
                    <Card key={index} className="overflow-hidden">
                      <CardHeader className="flex flex-row items-center justify-between bg-muted/50 p-4">
                        <CardTitle className="text-lg">{split.name}</CardTitle>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">{split.distance.toFixed(1)}km</span>
                          {getDifficultyIcon(split.terrainFactor)}
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-center">
                          <div>
                            <p className="text-sm text-muted-foreground">Arrival Time</p>
                            <p className="text-lg font-bold text-primary">{split.timeOfDay}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Est. Speed</p>
                            <p className={cn("text-lg font-bold", split.terrainFactor >= 1.2 ? 'text-green-500' : split.terrainFactor < 0.8 ? 'text-red-500' : '')}>
                              {split.speedOnSplit.toFixed(1)} km/h
                            </p>
                          </div>
                        </div>
                        {split.nutritionEvents.length > 0 && (
                          <div className="border-t pt-4">
                            <h4 className="text-sm font-semibold mb-2">Nutrition Stops</h4>
                            <div className="flex flex-col gap-2">
                              {split.nutritionEvents.map((event, idx) => (
                                <div key={idx} className={cn("flex items-center gap-2 text-xs p-1.5 rounded-md", event.isPreHillWarning ? 'bg-amber-100 dark:bg-amber-900/50' : '')}>
                                  {event.type === 'fuel' ? <Fuel className="w-4 h-4 text-orange-500" /> : <Droplet className="w-4 h-4 text-blue-500" />}
                                  <span>{event.details} at <strong>{event.timeOfDay}</strong></span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground text-center pt-2">{split.description}</p>
                      </CardContent>
                      {index < splits.length - 1 && (
                         <div className="flex justify-center -mb-3">
                           <ChevronDown className="w-6 h-6 text-border" />
                         </div>
                      )}
                    </Card>
                  ))}
                  </div>

                  <div className="hidden md:block mt-6">
                    <Card>
                    <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[180px]">Checkpoint</TableHead>
                            <TableHead className="text-center">Terrain</TableHead>
                            <TableHead className="text-center">Dist.</TableHead>
                            <TableHead className="text-center">Arrival Time</TableHead>
                            <TableHead className="text-center">Time to Point</TableHead>
                            <TableHead className="text-center">Speed</TableHead>
                            <TableHead>Nutrition</TableHead>
                            <TableHead className="min-w-[200px]">Description</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {splits.map((split, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{split.name}</TableCell>
                              <TableCell className="flex justify-center items-center h-full pt-4">{getDifficultyIcon(split.terrainFactor)}</TableCell>
                              <TableCell className="text-center font-mono">{split.distance.toFixed(1)}km</TableCell>
                              <TableCell className="text-center font-mono text-primary font-semibold">{split.timeOfDay}</TableCell>
                              <TableCell className="text-center font-mono">{formatTime(split.timeToPoint)}</TableCell>
                              <TableCell className={cn("text-center font-medium font-mono", split.terrainFactor >= 1.2 ? 'text-green-500' : split.terrainFactor < 0.8 ? 'text-red-500' : '')}>
                                {split.speedOnSplit.toFixed(1)} km/h
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col gap-1.5">
                                  {split.nutritionEvents.map((event, idx) => (
                                      <div key={idx} className={cn("flex items-center gap-2 text-xs p-1 rounded-md", event.isPreHillWarning ? 'bg-amber-100 dark:bg-amber-900/50' : '')}>
                                          {event.type === 'fuel' ? <Fuel className="w-3.5 h-3.5 text-orange-500" /> : <Droplet className="w-3.5 h-3.5 text-blue-500" />}
                                          <span>@{event.timeOfDay}</span>
                                      </div>
                                  ))}
                                </div>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">{split.description}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Card>
                  </div>
                </section>
                
                <section>
                    <h3 className="text-3xl font-bold tracking-tight">Terrain Legend</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                        <Card className="flex items-center space-x-3 p-4">
                            <span className="material-symbols-outlined text-green-500">trending_flat</span>
                            <span className="text-sm text-muted-foreground">Fast / Flat</span>
                        </Card>
                         <Card className="flex items-center space-x-3 p-4">
                            <span className="material-symbols-outlined text-yellow-500">show_chart</span>
                            <span className="text-sm text-muted-foreground">Rolling Hills</span>
                        </Card>
                         <Card className="flex items-center space-x-3 p-4">
                            <span className="material-symbols-outlined text-orange-500">trending_up</span>
                            <span className="text-sm text-muted-foreground">Climb</span>
                        </Card>
                         <Card className="flex items-center space-x-3 p-4">
                            <span className="material-symbols-outlined text-red-500">altitude</span>
                            <span className="text-sm text-muted-foreground">Steep Climb</span>
                        </Card>
                    </div>
                </section>

                 {nutritionEvents.length > 0 && (
                    <section>
                      <Card>
                          <CardHeader>
                              <CardTitle className="text-3xl font-bold tracking-tight">Nutrition Timeline</CardTitle>
                              <CardDescription>
                                  Your personalized fueling and hydration plan based on a <strong>{nutritionStrategy}</strong> strategy.
                              </CardDescription>
                          </CardHeader>
                          <CardContent>
                              <ScrollArea className="h-[300px] w-full pr-4">
                                  <div className="relative pl-6">
                                      <div className="absolute left-[8px] h-full w-0.5 bg-border"></div>
                                      {nutritionEvents.map((event, index) => (
                                          <div key={index} className="mb-8 flex items-start gap-4">
                                              <div className={cn("mt-1 flex-shrink-0 h-4 w-4 rounded-full border-4 flex items-center justify-center", event.type === 'fuel' ? 'bg-orange-500 border-orange-300' : 'bg-blue-500 border-blue-300')}>
                                              </div>
                                              <div className="flex-grow">
                                                  <p className="font-bold">{event.timeOfDay} ({event.distance.toFixed(1)} km)</p>
                                                  <p className="text-sm text-muted-foreground">{event.details}</p>
                                                  <p className="text-xs text-muted-foreground">{event.checkpointName}</p>
                                                  {event.isPreHillWarning && (
                                                      <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 p-1.5 bg-amber-100 dark:bg-amber-900/50 rounded-md">
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
                    </section>
                )}
                 <div className="flex justify-end">
                  <Button onClick={downloadCSV} variant="outline" size="lg">
                    <Download className="mr-2 h-4 w-4" />
                    Download CSV
                  </Button>
                </div>
              </div>
            )}

            <footer ref={footerRef} className="mt-16 border-t pt-8 pb-8">
              <div className="flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
                <p>
                  A passion project by{' '}
                  <Link href="https://strava.app.link/FSnhCW2qsXb" target="_blank" className="font-semibold text-primary underline hover:text-primary/80">
                    Spera Didiza
                  </Link>
                  . © {new Date().getFullYear()} RideWise Splits.
                </p>
                <div className="flex space-x-4 mt-4 md:mt-0 items-center">
                    <Button asChild variant="link" className={cn("text-primary hover:text-primary/80", isAtBottom ? "relative" : "hidden")}>
                        <Link href="https://paystack.shop/pay/spera" target="_blank">
                        <Coffee className="mr-2" />
                        Buy me a coffee
                        </Link>
                    </Button>
                </div>
              </div>
            </footer>
          </div>
        </main>
        <Link 
            href="https://paystack.shop/pay/spera" 
            target="_blank" 
            className={cn("fixed bottom-6 right-6 z-50 h-16 w-16 bg-primary rounded-full flex items-center justify-center text-white shadow-lg transition-transform duration-300 hover:scale-110", isAtBottom ? "translate-y-24" : "translate-y-0")}
        >
            <Coffee className="w-8 h-8" />
            <span className="sr-only">Buy me a coffee</span>
        </Link>
      </div>
    </div>
  );
};

export default RaceSplitsCalculator;
