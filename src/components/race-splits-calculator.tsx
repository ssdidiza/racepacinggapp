"use client";

import { useState, useEffect, useRef } from 'react';
import { Download, Calculator, Clock, Mountain, TrendingUp, BarChart, ChevronRight, AlertTriangle, Info, CheckCircle2, XCircle, Coffee, Heart, Fuel, Droplet, ChevronDown, Cloud, Loader2, Map, GraduationCap, Calendar, Users, Bike, ExternalLink } from 'lucide-react';
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { getWeatherForecast } from '@/ai/flows/weather-flow';
import { type WeatherForecast, type HourlyForecast } from '@/ai/schemas/weather-schema';
import { RACE_CONFIGS, getRaceConfig, type RaceConfig, type Checkpoint } from '@/lib/race-configs';


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
  terrainFactor: number;
  description: string;
  nutritionEvents: NutritionEvent[];
  weather?: HourlyForecast;
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
  const [selectedRaceId, setSelectedRaceId] = useState<string>('947-joburg');
  const [targetHours, setTargetHours] = useState(3);
  const [targetMinutes, setTargetMinutes] = useState(45);
  const [startTime, setStartTime] = useState('06:00');
  const [splits, setSplits] = useState<Split[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [paceValidation, setPaceValidation] = useState<PaceValidation>(null);
  const [nutritionStrategy, setNutritionStrategy] = useState<NutritionStrategy>('standard');
  const [nutritionEvents, setNutritionEvents] = useState<NutritionEvent[]>([]);
  const [weatherForecast, setWeatherForecast] = useState<WeatherForecast | null>(null);
  const [riderProfile, setRiderProfile] = useState<RiderProfile>('intermediate');
  const [isLoading, setIsLoading] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const footerRef = useRef<HTMLDivElement>(null);

  const currentRace = getRaceConfig(selectedRaceId);

  useEffect(() => {
    validatePace();
    setShowResults(false);
  }, [targetHours, targetMinutes, riderProfile, selectedRaceId]);
  
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
    const { minMinutes, eliteMinutes } = currentRace.paceValidation;

    if (riderProfile === 'beginner' && totalMinutes < eliteMinutes * 1.33) { 
        setPaceValidation({ level: 'warning', title: 'Ambitious Pace for a Beginner', message: 'This is a very fast time for a beginner. Make sure your training supports this goal!', Icon: AlertTriangle });
    } else if (riderProfile === 'pro' && totalMinutes > eliteMinutes * 1.5) { 
        setPaceValidation({ level: 'info', title: 'Cruising Pace for a Pro', message: 'This seems like a relaxed pace for a pro rider. Planning an easy day?', Icon: Coffee });
    } else if (totalMinutes < minMinutes) { 
      setPaceValidation({ level: 'error', title: 'Elite Professional Pace', message: 'This is a world-class time, typically reserved for professional cyclists. Please ensure this is a realistic goal.', Icon: XCircle });
    } else if (totalMinutes < eliteMinutes) { 
      setPaceValidation({ level: 'warning', title: 'Very Aggressive Pace', message: 'This is a highly competitive goal for experienced racers. It requires dedicated training and race strategy.', Icon: AlertTriangle });
    } else if (totalMinutes < eliteMinutes * 1.2) { 
      setPaceValidation({ level: 'info', title: 'Competitive Time', message: 'A strong and challenging goal for dedicated recreational cyclists. Great job!', Icon: Info });
    } else if (totalMinutes <= eliteMinutes * 1.5) {
      setPaceValidation({ level: 'success', title: 'Realistic & Achievable', message: 'This is a great target for most riders. With consistent training, you can achieve this!', Icon: CheckCircle2 });
    } else { 
      setPaceValidation({ level: 'info', title: 'Leisurely & Enjoyable Pace', message: 'A comfortable pace to enjoy the ride and soak in the atmosphere. Perfect for a fun day out.', Icon: Coffee });
    }
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
  
  const getDifficultyIcon = (terrainFactor: number, className?: string) => {
    if (terrainFactor >= 1.2) return <span className={cn("material-symbols-outlined text-green-500", className)}>trending_flat</span>;
    if (terrainFactor >= 0.8 && terrainFactor < 1.2) return <span className={cn("material-symbols-outlined text-yellow-500", className)}>show_chart</span>;
    if (terrainFactor >= 0.7 && terrainFactor < 0.8) return <span className={cn("material-symbols-outlined text-orange-500", className)}>trending_up</span>;
    return <span className={cn("material-symbols-outlined text-red-500", className)}>altitude</span>;
  };
  
  const getDifficultyDescription = (terrainFactor: number) => {
    if (terrainFactor >= 1.2) return "Fast";
    if (terrainFactor >= 0.8) return "Moderate";
    return "Hilly";
  };


  const handleCalculate = async () => {
    setIsLoading(true);
    try {
      await calculateSplits();
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
      console.error("Failed to calculate splits:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateSplits = async () => {
    const targetTotalMinutes = targetHours * 60 + targetMinutes;
    if (targetTotalMinutes <= 0) return;
    
    // Fetch weather forecast
    const forecast = await getWeatherForecast({
      location: currentRace.location,
      raceStartTime: startTime,
      raceHours: targetHours,
    });
    setWeatherForecast(forecast);

    const totalDistance = currentRace.distance;
    
    const baseAverageSpeed = totalDistance / (targetTotalMinutes / 60);
    
    let calculatedSplits: Omit<Split, 'movingAverageSpeed' | 'nutritionEvents' | 'timeOfDay' | 'weather'>[] = [];
    let cumulativeTime = 0;
    
    for (let i = 0; i < currentRace.checkpoints.length; i++) {
      const checkpoint = currentRace.checkpoints[i];
      const prevDistance = i === 0 ? 0 : currentRace.checkpoints[i - 1].distance;
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
    const finalSplitsWithoutNutrition = calculatedSplits.map((split): Omit<Split, 'nutritionEvents' | 'weather'> => {
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

      const arrivalHour = split.timeOfDay.split(':')[0] + ':00';
      const weatherForSplit = forecast?.hourly.find(h => h.time === arrivalHour);

      return { ...split, nutritionEvents: nutritionForSplit, weather: weatherForSplit };
    });

    setSplits(finalSplits);
    setShowResults(true);
  };

  const calculateNutritionEvents = (currentSplits: Omit<Split, 'nutritionEvents' | 'weather'>[], targetTime: number): NutritionEvent[] => {
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
  
      const isPreHillWarning = currentRace.hillWarningCheckpoints.includes(split.name) && (split.timeToPoint - time < 15);
  
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
    a.download = `${currentRace.csvFilenamePrefix}_${targetHours}h${targetMinutes}m.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const heroImage = PlaceHolderImages.find(p => p.id === 'cyclist-hero-2');
  const ctctImage = PlaceHolderImages.find(p => p.id === 'ctct-preview');
  const spinTribeImage = PlaceHolderImages.find(p => p.id === 'spin-tribe-preview');

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
                <h1 className="text-4xl font-black md:text-6xl tracking-tight">
                  Plan Your Perfect Race
                </h1>
                <h2 className="text-lg text-gray-200 md:text-xl font-medium">
                  Enter your race details for a personalized pacing strategy.
                </h2>
              </div>
              
              <Card className="bg-card/80 backdrop-blur-sm border-white/20 shadow-2xl">
                <CardContent className="p-6">
                  <div className="grid gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label className="text-white text-lg font-bold flex items-center gap-2">
                          <Map className="w-5 h-5" />
                          Select Race
                        </Label>
                        <div className="flex mt-2">
                          <div className="flex h-12 flex-1 items-center justify-center rounded-lg bg-white/10 p-1">
                            {RACE_CONFIGS.map(race => (
                              <label key={race.id} className="flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-md px-3 has-[:checked]:bg-primary has-[:checked]:shadow-md has-[:checked]:text-white text-gray-300 text-sm font-medium transition-all duration-200">
                                <span className="truncate">{race.shortName}</span>
                                <input 
                                  className="invisible w-0" 
                                  name="race-select" 
                                  type="radio" 
                                  value={race.id}
                                  checked={selectedRaceId === race.id}
                                  onChange={() => setSelectedRaceId(race.id)}
                                />
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label className="text-white text-lg font-bold flex items-center gap-2">
                          <Users className="w-5 h-5" />
                          Rider Profile
                        </Label>
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
                    </div>

                    <div>
                      <Label className="text-white text-lg font-bold flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        Enter Your Target Time
                      </Label>
                      <div className="flex flex-wrap items-end gap-4 mt-2">
                        <div className="grid gap-2 flex-1 min-w-40">
                          <Label htmlFor="hours" className="text-gray-300 font-medium">Hours</Label>
                          <Input
                            id="hours"
                            type="number" min="1" max="10" value={targetHours}
                            onChange={(e) => setTargetHours(parseInt(e.target.value) || 2)}
                            className="h-14 p-4 text-lg bg-white/10 text-white border-white/30 focus:border-primary transition-all"
                            placeholder="3"
                          />
                        </div>
                        <div className="grid gap-2 flex-1 min-w-40">
                          <Label htmlFor="minutes" className="text-gray-300 font-medium">Minutes</Label>
                          <Input
                            id="minutes"
                            type="number" min="0" max="59" value={targetMinutes}
                            onChange={(e) => setTargetMinutes(parseInt(e.target.value) || 0)}
                            className="h-14 p-4 text-lg bg-white/10 text-white border-white/30 focus:border-primary transition-all"
                            placeholder="45"
                          />
                        </div>
                        <div className="grid gap-2 flex-1 min-w-40">
                          <Label htmlFor="startTime" className="text-gray-300 font-medium">Start Time</Label>
                          <Input
                            id="startTime"
                            type="time" value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className="h-14 p-4 text-lg bg-white/10 text-white border-white/30 focus:border-primary transition-all"
                          />
                        </div>
                      </div>
                    </div>
                    
                    {paceValidation && (
                      <Alert variant={paceValidation.level === 'error' ? 'destructive' : 'default'} className={cn('bg-opacity-20 border-opacity-40 text-white animate-in fade-in slide-in-from-top-4 duration-300', {
                        'bg-yellow-500/20 border-yellow-300/40 [&>svg]:text-yellow-300': paceValidation.level === 'warning',
                        'bg-blue-500/20 border-blue-300/40 [&>svg]:text-blue-300': paceValidation.level === 'info',
                        'bg-green-500/20 border-green-300/40 [&>svg]:text-green-300': paceValidation.level === 'success',
                        'bg-red-500/20 border-red-300/40 [&>svg]:text-red-300': paceValidation.level === 'error',
                      })}>
                        <paceValidation.Icon className="h-4 w-4" />
                        <AlertTitle className="text-white font-bold">{paceValidation.title}</AlertTitle>
                        <AlertDescription className="text-gray-200">{paceValidation.message}</AlertDescription>
                      </Alert>
                    )}

                    <Button onClick={handleCalculate} size="lg" className="h-14 w-full text-lg font-bold shadow-xl transition-all hover:scale-[1.01]" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 animate-spin" />
                          Generating {currentRace.shortName} Plan...
                        </>
                      ) : (
                        <>
                          <Calculator className="mr-2" />
                          Generate Race Plan
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </section>


            {showResults && (
              <div ref={resultsRef} className="mt-12 space-y-12 animate-in fade-in duration-700">
                <section>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight">{currentRace.name} Plan</h2>
                            <p className="text-muted-foreground mt-2">Personalized performance breakdown and weather forecast.</p>
                        </div>
                        <Button onClick={downloadCSV} variant="outline" size="lg" className="w-full md:w-auto shadow-sm">
                            <Download className="mr-2 h-4 w-4" />
                            Download CSV
                        </Button>
                    </div>
                  
                  <div className="mt-6 grid grid-cols-1 gap-4 md:hidden">
                    <Accordion type="single" collapsible className="w-full space-y-3">
                      {splits.map((split, index) => (
                        <AccordionItem value={`item-${index}`} key={index} className="border-none">
                          <Card className="overflow-hidden shadow-md border-primary/10">
                             <AccordionTrigger className="w-full hover:no-underline px-4 py-4">
                              <div className="flex flex-row items-center justify-between w-full pr-4">
                                <div className="text-left">
                                  <CardTitle className="text-lg font-bold">{split.name}</CardTitle>
                                  <CardDescription className="flex items-center gap-1">
                                    {split.distance.toFixed(1)}km • {getDifficultyDescription(split.terrainFactor)}
                                  </CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                  {getDifficultyIcon(split.terrainFactor, 'text-2xl')}
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                               <CardContent className="px-4 pb-4 space-y-4 pt-0">
                                <div className="grid grid-cols-2 gap-4 text-center p-3 bg-muted/30 rounded-lg">
                                  <div>
                                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Arrival</p>
                                    <p className="text-xl font-black text-primary">{split.timeOfDay}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Split Time</p>
                                    <p className="text-xl font-mono font-bold">{formatTime(split.splitTime).substring(0, 5)}</p>
                                  </div>
                                   <div>
                                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Est. Speed</p>
                                    <p className={cn("text-xl font-black", split.terrainFactor >= 1.2 ? 'text-green-500' : split.terrainFactor < 0.8 ? 'text-red-500' : '')}>
                                      {split.speedOnSplit.toFixed(1)} km/h
                                    </p>
                                  </div>
                                   <div>
                                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Avg. Speed</p>
                                    <p className="text-xl font-mono font-bold">{split.movingAverageSpeed.toFixed(1)} km/h</p>
                                  </div>
                                </div>

                                {split.weather && (
                                  <div className="p-3 border rounded-lg bg-card shadow-sm">
                                    <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2 text-center">Weather Forecast</h4>
                                    <div className="flex items-center justify-center gap-6 text-center">
                                      <div className="flex flex-col items-center">
                                        <span className="material-symbols-outlined text-4xl text-amber-500 mb-1">{split.weather.icon}</span>
                                        <p className="text-xs text-muted-foreground">{split.weather.condition}</p>
                                      </div>
                                      <div>
                                        <p className="font-black text-2xl">{split.weather.temperature}°C</p>
                                        <p className="text-xs text-muted-foreground">Temp</p>
                                      </div>
                                      <div>
                                        <p className="font-black text-2xl">{split.weather.windSpeed}</p>
                                        <p className="text-xs text-muted-foreground">Wind ({split.weather.windDirection})</p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                
                                {split.nutritionEvents.length > 0 && (
                                  <div className="p-3 border rounded-lg bg-card shadow-sm">
                                    <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2 text-center">Nutrition & Hydration</h4>
                                    <div className="flex flex-col gap-2">
                                      {split.nutritionEvents.map((event, idx) => (
                                        <div key={idx} className={cn("flex items-center gap-3 text-sm p-2 rounded-md", event.isPreHillWarning ? 'bg-amber-100 dark:bg-amber-900/50 border border-amber-200 dark:border-amber-800' : 'bg-muted/50')}>
                                          <div className="p-1.5 bg-background rounded-full">
                                            {event.type === 'fuel' ? <Fuel className="w-4 h-4 text-orange-500" /> : <Droplet className="w-4 h-4 text-blue-500" />}
                                          </div>
                                          <div className="flex-1">
                                            <p className="font-bold">{event.timeOfDay}</p>
                                            <p className="text-xs text-muted-foreground">{event.details}</p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </AccordionContent>
                          </Card>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>

                  <div className="hidden md:block mt-6">
                    <Card className="shadow-lg border-primary/10 overflow-hidden">
                    <Table>
                        <TableHeader className="bg-muted/50">
                          <TableRow>
                            <TableHead className="w-[180px] font-bold">Checkpoint</TableHead>
                            <TableHead className="text-right font-bold">Arrival</TableHead>
                            <TableHead className="text-right font-bold">Split Time</TableHead>
                            <TableHead className="text-right font-bold">Split Speed</TableHead>
                            <TableHead className="text-right font-bold">Avg. Speed</TableHead>
                            <TableHead className="font-bold">Weather</TableHead>
                            <TableHead className="font-bold">Nutrition</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {splits.map((split, index) => (
                            <TableRow key={index} className="hover:bg-muted/20 transition-colors">
                              <TableCell className="font-bold flex items-center gap-2">
                                {getDifficultyIcon(split.terrainFactor)}
                                {split.name}
                              </TableCell>
                              <TableCell className="text-right font-mono text-primary font-black text-lg">{split.timeOfDay}</TableCell>
                              <TableCell className="text-right font-mono font-medium">{formatTime(split.splitTime)}</TableCell>
                              <TableCell className={cn("text-right font-black font-mono", split.terrainFactor >= 1.2 ? 'text-green-500' : split.terrainFactor < 0.8 ? 'text-red-500' : '')}>
                                {split.speedOnSplit.toFixed(1)} km/h
                              </TableCell>
                              <TableCell className="text-right font-mono font-bold">{split.movingAverageSpeed.toFixed(1)} km/h</TableCell>
                              <TableCell>
                                {split.weather && (
                                    <div className="flex items-center gap-2 text-xs font-medium">
                                        <span className="material-symbols-outlined text-xl text-amber-500">{split.weather.icon}</span>
                                        <div className="flex flex-col">
                                          <span className="font-bold">{split.weather.temperature}°C</span>
                                          <span className="text-muted-foreground">{split.weather.windSpeed} km/h {split.weather.windDirection}</span>
                                        </div>
                                    </div>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col gap-1.5">
                                  {split.nutritionEvents.map((event, idx) => (
                                      <div key={idx} className={cn("flex items-center gap-2 text-xs p-1.5 rounded-md shadow-sm", event.isPreHillWarning ? 'bg-amber-100 dark:bg-amber-900/50 border border-amber-200' : 'bg-muted/50')}>
                                          {event.type === 'fuel' ? <Fuel className="w-3.5 h-3.5 text-orange-500" /> : <Droplet className="w-3.5 h-3.5 text-blue-500" />}
                                          <span className="font-bold">@{event.timeOfDay}</span>
                                      </div>
                                  ))}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Card>
                  </div>
                </section>
                
                <section>
                    <h3 className="text-2xl font-bold tracking-tight mb-6">Terrain Legend</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                          { icon: 'trending_flat', color: 'text-green-500', label: 'Fast / Flat' },
                          { icon: 'show_chart', color: 'text-yellow-500', label: 'Rolling Hills' },
                          { icon: 'trending_up', color: 'text-orange-500', label: 'Climb' },
                          { icon: 'altitude', color: 'text-red-500', label: 'Steep Climb' }
                        ].map((item, i) => (
                          <Card key={i} className="flex items-center space-x-3 p-4 hover:bg-muted/30 transition-colors shadow-sm">
                            <span className={cn("material-symbols-outlined", item.color)}>{item.icon}</span>
                            <span className="text-sm font-semibold">{item.label}</span>
                          </Card>
                        ))}
                    </div>
                </section>

                 {nutritionEvents.length > 0 && (
                    <section>
                      <Card className="shadow-xl border-primary/5">
                          <CardHeader className="border-b bg-muted/30">
                              <CardTitle className="text-2xl font-bold tracking-tight">Full Nutrition Timeline</CardTitle>
                              <CardDescription>
                                  Strategic fueling and hydration plan for a <strong>{nutritionStrategy}</strong> strategy.
                              </CardDescription>
                          </CardHeader>
                          <CardContent className="pt-6">
                              <ScrollArea className="h-[400px] w-full pr-4">
                                  <div className="relative pl-8">
                                      <div className="absolute left-[9px] h-full w-0.5 bg-gradient-to-b from-primary/50 to-muted"></div>
                                      {nutritionEvents.map((event, index) => (
                                          <div key={index} className="mb-8 flex items-start gap-4 animate-in slide-in-from-left duration-500" style={{ animationDelay: `${index * 50}ms` }}>
                                              <div className={cn("mt-1.5 flex-shrink-0 h-4.5 w-4.5 rounded-full border-4 flex items-center justify-center shadow-md", event.type === 'fuel' ? 'bg-orange-500 border-orange-100 dark:border-orange-950' : 'bg-blue-500 border-blue-100 dark:border-blue-950')}>
                                              </div>
                                              <div className="flex-grow p-4 bg-muted/20 rounded-xl border border-transparent hover:border-primary/20 transition-all">
                                                  <div className="flex justify-between items-center mb-1">
                                                    <p className="font-black text-lg">{event.timeOfDay}</p>
                                                    <span className="text-xs font-bold text-muted-foreground bg-muted px-2 py-1 rounded-full">{event.distance.toFixed(1)} km</span>
                                                  </div>
                                                  <p className="text-sm font-medium">{event.details}</p>
                                                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                                    <Map className="w-3 h-3" />
                                                    {event.checkpointName}
                                                  </p>
                                                  {event.isPreHillWarning && (
                                                      <div className="mt-3 flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-400 p-2 bg-amber-100/50 dark:bg-amber-900/30 rounded-lg border border-amber-200/50">
                                                          <AlertTriangle className="w-4 h-4 animate-pulse" />
                                                          <span>PRE-CLIMB FUEL: Energy needed for upcoming ascent!</span>
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
              </div>
            )}

            {/* Bento Grid Shelf */}
            <section className="mt-24 space-y-8">
              <div className="text-center">
                <h2 className="text-3xl font-black tracking-tight">The RideWise Shelf</h2>
                <p className="text-muted-foreground mt-2 font-medium">Explore more rides, training, and community projects.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Featured: Cape Town Cycle Tour */}
                <Card className="md:col-span-2 relative overflow-hidden group shadow-lg border-primary/5 min-h-[300px]">
                  <div 
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" 
                    style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.8)), url("${ctctImage?.imageUrl}")` }}
                  />
                  <CardHeader className="relative z-10 text-white mt-auto h-full flex flex-col justify-end">
                    <div className="bg-primary/20 backdrop-blur-md self-start px-3 py-1 rounded-full text-xs font-bold mb-3 border border-white/20 flex items-center gap-2">
                      <Calendar className="w-3 h-3" />
                      {selectedRaceId === 'ctct' ? 'LIVE NOW' : 'COMING MARCH 2025'}
                    </div>
                    <CardTitle className="text-3xl font-black">Cape Town Cycle Tour</CardTitle>
                    <CardDescription className="text-gray-200 text-lg font-medium mt-2">
                      The world's largest timed cycle race. We've built a dedicated terrain-adjusted calculator for the coastal winds.
                    </CardDescription>
                  </CardHeader>
                  <CardFooter className="relative z-10 pt-0">
                    <Button 
                      variant="secondary" 
                      className="font-bold shadow-lg"
                      onClick={() => {
                        setSelectedRaceId('ctct');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                    >
                      {selectedRaceId === 'ctct' ? 'Currently Selected' : 'Try CTCT Calculator'}
                    </Button>
                  </CardFooter>
                </Card>

                {/* Spin Tribe */}
                <Card className="flex flex-col bg-primary text-primary-foreground shadow-lg border-none overflow-hidden relative group">
                   <div 
                    className="absolute inset-0 opacity-20 bg-cover bg-center transition-opacity duration-500 group-hover:opacity-30" 
                    style={{ backgroundImage: `url("${spinTribeImage?.imageUrl}")` }}
                  />
                  <CardHeader className="relative z-10">
                    <GraduationCap className="w-12 h-12 mb-4" />
                    <CardTitle className="text-2xl font-black">Spin Tribe</CardTitle>
                    <CardDescription className="text-primary-foreground/80 font-medium">
                      Master your ride with expert-led cycling lessons and community workshops.
                    </CardDescription>
                  </CardHeader>
                  <CardFooter className="mt-auto relative z-10">
                    <Button variant="outline" className="w-full font-bold bg-white/10 border-white/20 hover:bg-white/20 text-white">
                      Explore Lessons
                    </Button>
                  </CardFooter>
                </Card>

                {/* Training Plans */}
                <Card className="shadow-lg border-primary/5 hover:border-primary/20 transition-all group">
                  <CardHeader>
                    <div className="p-3 bg-primary/10 rounded-xl w-fit mb-2 group-hover:bg-primary/20 transition-colors">
                      <Bike className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl font-bold tracking-tight">Training Plans</CardTitle>
                    <CardDescription className="font-medium">
                      Power-based plans tailored for high-altitude South African racing.
                    </CardDescription>
                  </CardHeader>
                  <CardFooter className="mt-auto">
                    <Button variant="ghost" className="p-0 font-bold hover:bg-transparent text-primary hover:text-primary/80 flex items-center gap-2">
                      See Plans <ChevronRight className="w-4 h-4" />
                    </Button>
                  </CardFooter>
                </Card>

                {/* Community Forum */}
                <Card className="shadow-lg border-primary/5 hover:border-primary/20 transition-all group">
                  <CardHeader>
                    <div className="p-3 bg-accent/10 rounded-xl w-fit mb-2 group-hover:bg-accent/20 transition-colors">
                      <Users className="w-6 h-6 text-accent" />
                    </div>
                    <CardTitle className="text-xl font-bold tracking-tight">The Pelaton</CardTitle>
                    <CardDescription className="font-medium">
                      Join the local community of RideWise athletes to swap tips and strategies.
                    </CardDescription>
                  </CardHeader>
                   <CardFooter className="mt-auto">
                    <Button variant="ghost" className="p-0 font-bold hover:bg-transparent text-accent hover:text-accent/80 flex items-center gap-2">
                      Join Community <ChevronRight className="w-4 h-4" />
                    </Button>
                  </CardFooter>
                </Card>

                {/* Suggest a Race */}
                <Card className="shadow-lg border-primary/5 hover:border-primary/20 transition-all border-dashed bg-muted/20 flex flex-col items-center justify-center p-8 text-center">
                  <div className="p-4 bg-muted rounded-full mb-4">
                    <ExternalLink className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-lg font-bold">Your Ride Here?</CardTitle>
                  <CardDescription className="mt-2 mb-4 font-medium">
                    Want a specific race added to the calculator?
                  </CardDescription>
                  <Button variant="outline" className="font-bold">Request Race</Button>
                </Card>
              </div>
            </section>

            <footer ref={footerRef} className="mt-24 border-t pt-12 pb-12">
              <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="text-center md:text-left">
                  <p className="text-sm text-muted-foreground font-medium">
                    A passion project for the South African cycling community by{' '}
                    <Link 
                      href="https://strava.app.link/FSnhCW2qsXb" 
                      target="_blank" 
                      className="font-black text-primary underline underline-offset-4 decoration-2 hover:text-primary/80 transition-colors"
                    >
                      Spera Didiza
                    </Link>
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    © {new Date().getFullYear()} RideWise Splits. All rights reserved.
                  </p>
                </div>
                
                <div className="flex flex-wrap justify-center gap-4">
                  <Button asChild variant="outline" className="font-bold border-primary/20 hover:border-primary/40">
                    <Link href="https://strava.app.link/FSnhCW2qsXb" target="_blank">
                      <Heart className="mr-2 h-4 w-4 text-red-500 fill-red-500" />
                      Follow on Strava
                    </Link>
                  </Button>
                  <Button asChild variant="link" className={cn("text-primary hover:text-primary/80 font-bold", isAtBottom ? "flex" : "hidden")}>
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
            className={cn(
              "fixed bottom-6 right-6 z-50 h-16 w-16 bg-primary rounded-full flex items-center justify-center text-white shadow-2xl transition-all duration-500 hover:scale-110 active:scale-95 group",
              isAtBottom ? "translate-y-24 opacity-0" : "translate-y-0 opacity-100"
            )}
        >
            <Coffee className="w-8 h-8 group-hover:animate-bounce" />
            <span className="sr-only">Buy me a coffee</span>
            <div className="absolute -top-10 right-0 bg-white text-primary text-[10px] font-black px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border">
              SUPPORT THE PROJECT
            </div>
        </Link>
      </div>
    </div>
  );
};

export default RaceSplitsCalculator;
