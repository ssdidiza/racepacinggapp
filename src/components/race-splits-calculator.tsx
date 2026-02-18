"use client";

import { useState, useEffect, useRef } from 'react';
import { Download, Calculator, Clock, Mountain, TrendingUp, BarChart, ChevronRight, AlertTriangle, Info, CheckCircle2, XCircle, Coffee, Heart, Fuel, Droplet, ChevronDown, Cloud, Loader2, Map, GraduationCap, Calendar, Bike, ExternalLink, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { getWeatherForecast } from '@/ai/flows/weather-flow';
import { type WeatherForecast, type HourlyForecast } from '@/ai/schemas/weather-schema';
import { RACE_CONFIGS, getRaceConfig, type RaceConfig } from '@/lib/race-configs';

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
    setStartTime(currentRace.defaultStartTime);
    setShowResults(false);
  }, [selectedRaceId, currentRace.defaultStartTime]);
  
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
    const { minMinutes, eliteMinutes, beginnerWarningMinutes } = currentRace.paceValidation;

    if (riderProfile === 'beginner' && totalMinutes < beginnerWarningMinutes) { 
        setPaceValidation({ level: 'warning', title: `Ambitious Pace for a Beginner`, message: `This is a very fast time for a beginner at ${currentRace.shortName}. Make sure your training supports this goal!`, Icon: AlertTriangle });
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
    if (terrainFactor >= 1.15) return <span className={cn("material-symbols-outlined text-green-500", className)}>trending_flat</span>;
    if (terrainFactor >= 0.95 && terrainFactor < 1.15) return <span className={cn("material-symbols-outlined text-yellow-500", className)}>show_chart</span>;
    if (terrainFactor >= 0.8 && terrainFactor < 0.95) return <span className={cn("material-symbols-outlined text-orange-500", className)}>trending_up</span>;
    return <span className={cn("material-symbols-outlined text-red-500", className)}>altitude</span>;
  };
  
  const getDifficultyDescription = (terrainFactor: number) => {
    if (terrainFactor >= 1.15) return "Fast";
    if (terrainFactor >= 0.95) return "Moderate";
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
    
    const forecast = await getWeatherForecast({
      location: currentRace.location,
      month: currentRace.month,
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

  const heroImage = PlaceHolderImages.find(p => p.id === 'cyclist-hero');
  const ctctImage = PlaceHolderImages.find(p => p.id === 'ctct-preview');
  const spinTribeImage = PlaceHolderImages.find(p => p.id === 'spin-tribe-preview');
  const amashovaImage = PlaceHolderImages.find(p => p.id === 'amashova-preview');

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-[#0a0a0c] text-white">
      {/* Hero Section */}
      <section 
        className="relative flex min-h-[85vh] flex-col items-center justify-center bg-cover bg-center px-4 py-20"
        style={{ backgroundImage: `url("${heroImage?.imageUrl}")` }}
      >
        <div className="absolute inset-0 bg-black/60" />
        
        <div className="relative z-10 w-full max-w-4xl text-center">
          <h1 className="text-5xl font-black tracking-tight md:text-7xl">
            Plan Your Perfect Race
          </h1>
          <p className="mt-4 text-lg font-medium text-gray-300 md:text-xl">
            Enter your race details for a personalized pacing strategy.
          </p>

          <Card className="mt-12 bg-white/5 backdrop-blur-2xl border-white/10 shadow-2xl overflow-hidden">
            <CardContent className="p-8 text-left space-y-8">
              {/* Select Your Race */}
              <div>
                <Label className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">
                  <Map className="w-4 h-4" /> Select Your Race
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {RACE_CONFIGS.map(race => (
                    <button
                      key={race.id}
                      onClick={() => setSelectedRaceId(race.id)}
                      className={cn(
                        "relative flex flex-col items-start p-4 rounded-xl border transition-all duration-300 text-left group",
                        selectedRaceId === race.id 
                          ? "bg-primary border-primary shadow-[0_0_20px_rgba(139,92,246,0.3)]" 
                          : "bg-white/5 border-white/10 hover:bg-white/10"
                      )}
                    >
                      <span className="text-lg font-bold">{race.name}</span>
                      <span className="text-[10px] font-medium opacity-70 uppercase tracking-widest mt-1">
                        {race.distance}KM · {race.location.split(',')[0].toUpperCase()} · {race.month.toUpperCase()}
                      </span>
                      {selectedRaceId === race.id && (
                        <div className="absolute bottom-2 right-4 opacity-40">
                          <svg width="80" height="20" viewBox="0 0 80 20" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M0 15 Q 10 15, 20 10 T 40 10 T 60 5 T 80 15" strokeLinecap="round" />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                
                <div className="mt-4 p-4 rounded-lg bg-black/30 border border-white/5 flex items-start gap-3">
                  <Info className="w-4 h-4 mt-0.5 text-primary" />
                  <p className="text-xs text-gray-400 font-medium leading-relaxed">
                    {currentRace.infoBanner}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Rider Profile */}
                <div className="space-y-4">
                  <Label className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gray-400">
                    <Users className="w-4 h-4" /> Rider Profile
                  </Label>
                  <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
                    {(['beginner', 'intermediate', 'pro'] as RiderProfile[]).map(profile => (
                      <button
                        key={profile}
                        onClick={() => setRiderProfile(profile)}
                        className={cn(
                          "flex-1 py-2 px-4 rounded-lg text-sm font-bold capitalize transition-all",
                          riderProfile === profile ? "bg-primary text-white shadow-lg" : "text-gray-400 hover:text-white"
                        )}
                      >
                        {profile}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Race Start Time */}
                <div className="space-y-4">
                  <Label className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gray-400">
                    <Clock className="w-4 h-4" /> Race Start Time
                  </Label>
                  <div className="relative">
                    <Input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="h-12 bg-black/40 border-white/5 text-white pl-4 rounded-xl focus:ring-primary focus:border-primary"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-500 pointer-events-none">
                      {selectedRaceId === 'ctct' ? 'BATCH START' : 'GUN START'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Target Time */}
              <div className="space-y-4">
                <Label className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gray-400">
                  <TrendingUp className="w-4 h-4" /> Enter Your Target Time
                </Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <Input
                      type="number" value={targetHours}
                      onChange={(e) => setTargetHours(parseInt(e.target.value) || 2)}
                      className="h-14 bg-black/40 border-white/5 text-xl font-bold rounded-xl"
                    />
                    <span className="absolute left-4 -top-2.5 bg-[#121214] px-2 text-[10px] font-black text-gray-500 uppercase tracking-widest">Hours</span>
                  </div>
                  <div className="relative">
                    <Input
                      type="number" value={targetMinutes}
                      onChange={(e) => setTargetMinutes(parseInt(e.target.value) || 0)}
                      className="h-14 bg-black/40 border-white/5 text-xl font-bold rounded-xl"
                    />
                    <span className="absolute left-4 -top-2.5 bg-[#121214] px-2 text-[10px] font-black text-gray-500 uppercase tracking-widest">Minutes</span>
                  </div>
                </div>
              </div>

              {paceValidation && (
                <div className={cn(
                  "p-4 rounded-xl flex items-start gap-3 border animate-in fade-in slide-in-from-top-2",
                  paceValidation.level === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 
                  paceValidation.level === 'warning' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' :
                  paceValidation.level === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                )}>
                  <paceValidation.Icon className="w-5 h-5 shrink-0" />
                  <div className="space-y-1">
                    <p className="text-sm font-bold">{paceValidation.title}</p>
                    <p className="text-xs opacity-80 leading-relaxed">{paceValidation.message}</p>
                  </div>
                </div>
              )}

              <Button 
                onClick={handleCalculate} 
                disabled={isLoading}
                className="w-full h-16 bg-primary hover:bg-primary/90 text-lg font-black uppercase tracking-widest shadow-[0_10px_30px_rgba(139,92,246,0.3)] transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 animate-spin" />
                ) : (
                  <Calculator className="mr-2" />
                )}
                Generate Race Plan
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Results Section */}
      {showResults && (
        <main ref={resultsRef} className="max-w-5xl mx-auto px-4 py-20 space-y-20">
          <section className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-end gap-6">
              <div className="space-y-2">
                <h2 className="text-4xl font-black tracking-tight">{currentRace.name} — Breakdown</h2>
                <p className="text-gray-400 font-medium italic">Your terrain-adjusted strategy for {targetHours}h {targetMinutes}m.</p>
              </div>
              <Button onClick={downloadCSV} variant="outline" size="lg" className="rounded-full font-bold border-white/10 hover:bg-white/5 h-12">
                <Download className="mr-2 w-4 h-4" /> Download Plan
              </Button>
            </div>

            {/* Mobile View */}
            <div className="md:hidden space-y-4">
              <Accordion type="single" collapsible className="space-y-3">
                {splits.map((split, index) => (
                  <AccordionItem value={`item-${index}`} key={index} className="border-none">
                    <Card className="bg-white/5 border-white/5 overflow-hidden rounded-2xl">
                      <AccordionTrigger className="px-5 py-5 hover:no-underline group">
                        <div className="flex items-center justify-between w-full pr-4 text-left">
                          <div>
                            <p className="text-lg font-black text-white">{split.name}</p>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{split.distance.toFixed(1)}KM · {getDifficultyDescription(split.terrainFactor)}</p>
                          </div>
                          {getDifficultyIcon(split.terrainFactor, 'text-2xl')}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-5 pb-5 pt-0 space-y-5">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                            <p className="text-[10px] font-black text-gray-500 uppercase mb-1">Arrival</p>
                            <p className="text-2xl font-black text-primary">{split.timeOfDay}</p>
                          </div>
                          <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                            <p className="text-[10px] font-black text-gray-500 uppercase mb-1">Split Time</p>
                            <p className="text-2xl font-black">{formatTime(split.splitTime).substring(0, 5)}</p>
                          </div>
                        </div>

                        {split.weather && (
                          <div className="flex items-center justify-between bg-black/20 p-4 rounded-xl border border-white/5">
                            <div className="flex items-center gap-3">
                              <span className="material-symbols-outlined text-3xl text-amber-500">{split.weather.icon}</span>
                              <div>
                                <p className="text-sm font-black">{split.weather.temperature}°C</p>
                                <p className="text-[10px] text-gray-500 uppercase font-bold">{split.weather.condition}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-black">{split.weather.windSpeed} km/h</p>
                              <p className="text-[10px] text-gray-500 uppercase font-bold">WIND {split.weather.windDirection}</p>
                            </div>
                          </div>
                        )}

                        {split.nutritionEvents.length > 0 && (
                          <div className="space-y-2">
                            {split.nutritionEvents.map((event, idx) => (
                              <div key={idx} className={cn(
                                "flex items-center gap-3 p-3 rounded-xl text-xs font-bold",
                                event.isPreHillWarning ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400' : 'bg-muted/30'
                              )}>
                                {event.type === 'fuel' ? <Fuel className="w-4 h-4" /> : <Droplet className="w-4 h-4" />}
                                <span>{event.timeOfDay}: {event.details}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </AccordionContent>
                    </Card>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>

            {/* Desktop View */}
            <Card className="hidden md:block bg-white/5 border-white/5 rounded-2xl overflow-hidden shadow-2xl">
              <Table>
                <TableHeader className="bg-black/40 border-b border-white/5">
                  <TableRow className="hover:bg-transparent border-none">
                    <TableHead className="py-6 font-black text-gray-400 uppercase tracking-widest text-[10px]">Checkpoint</TableHead>
                    <TableHead className="text-right font-black text-gray-400 uppercase tracking-widest text-[10px]">Arrival</TableHead>
                    <TableHead className="text-right font-black text-gray-400 uppercase tracking-widest text-[10px]">Split</TableHead>
                    <TableHead className="text-right font-black text-gray-400 uppercase tracking-widest text-[10px]">Speed</TableHead>
                    <TableHead className="text-right font-black text-gray-400 uppercase tracking-widest text-[10px]">Avg Speed</TableHead>
                    <TableHead className="font-black text-gray-400 uppercase tracking-widest text-[10px]">Weather</TableHead>
                    <TableHead className="font-black text-gray-400 uppercase tracking-widest text-[10px]">Nutrition</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {splits.map((split, index) => (
                    <TableRow key={index} className="border-white/5 hover:bg-white/5 transition-colors group">
                      <TableCell className="py-5 font-black text-lg">
                        <div className="flex items-center gap-3">
                          {getDifficultyIcon(split.terrainFactor)}
                          <div>
                            <p>{split.name}</p>
                            <p className="text-[10px] text-gray-500 uppercase tracking-tighter">Distance: {split.distance.toFixed(1)}km</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-black text-2xl text-primary">{split.timeOfDay}</TableCell>
                      <TableCell className="text-right font-black opacity-80">{formatTime(split.splitTime).substring(0, 5)}</TableCell>
                      <TableCell className={cn(
                        "text-right font-black text-xl",
                        split.terrainFactor >= 1.15 ? 'text-green-500' : split.terrainFactor < 0.95 ? 'text-red-500' : ''
                      )}>
                        {split.speedOnSplit.toFixed(1)} <span className="text-[10px] opacity-40">km/h</span>
                      </TableCell>
                      <TableCell className="text-right font-black opacity-60 italic">{split.movingAverageSpeed.toFixed(1)}</TableCell>
                      <TableCell>
                        {split.weather && (
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-amber-500">{split.weather.icon}</span>
                            <div className="flex flex-col text-[10px] font-bold">
                              <span>{split.weather.temperature}°C</span>
                              <span className="text-gray-500">{split.weather.windSpeed} km/h {split.weather.windDirection}</span>
                            </div>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {split.nutritionEvents.map((event, idx) => (
                            <div key={idx} className={cn(
                              "flex items-center gap-1.5 p-1 px-2 rounded-md text-[9px] font-black uppercase w-fit",
                              event.isPreHillWarning ? 'bg-amber-500 text-black' : 'bg-white/10 text-gray-300'
                            )}>
                              {event.type === 'fuel' ? <Fuel className="w-2.5 h-2.5" /> : <Droplet className="w-2.5 h-2.5" />}
                              {event.timeOfDay}
                            </div>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </section>

          {/* Bento Grid Shelf */}
          <section className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Spin Tribe */}
              <Card className="bg-white/5 border-white/5 p-8 rounded-3xl flex flex-col justify-between group hover:bg-white/10 transition-all shadow-xl min-h-[280px]">
                <div className="space-y-6">
                  <div className="p-4 bg-primary/20 rounded-2xl w-fit group-hover:bg-primary transition-colors">
                    <GraduationCap className="w-8 h-8 text-primary group-hover:text-white" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black">Spin Tribe</h3>
                    <p className="text-gray-400 font-medium mt-2 leading-relaxed">
                      Master your ride with expert-led cycling lessons and community workshops.
                    </p>
                  </div>
                </div>
                <Button className="w-fit bg-primary hover:bg-primary/90 rounded-full font-bold px-8 mt-8">Explore Lessons</Button>
              </Card>

              {/* Amashova */}
              <Card className="bg-white/5 border-white/5 p-8 rounded-3xl flex flex-col justify-between group relative overflow-hidden min-h-[280px]">
                <div className="absolute top-6 right-8 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black text-gray-400 tracking-widest border border-white/5">
                  JULY 2025
                </div>
                <div className="space-y-6">
                  <div className="p-4 bg-muted rounded-2xl w-fit">
                    <Calendar className="w-8 h-8 text-gray-500" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black">Amashova Classic</h3>
                    <p className="text-gray-400 font-medium mt-2 leading-relaxed">
                      Durban to Pietermaritzburg. 106km of rolling Natal hills.
                    </p>
                  </div>
                </div>
                <Button variant="outline" disabled className="w-fit rounded-full font-bold border-white/10 opacity-50 mt-8">Coming Soon</Button>
              </Card>

              {/* Training Plans */}
              <Card className="bg-white/5 border-white/5 p-8 rounded-3xl flex flex-col justify-between group hover:bg-white/10 transition-all min-h-[280px]">
                <div className="space-y-6">
                  <div className="p-4 bg-primary/10 rounded-2xl w-fit">
                    <Bike className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black">Training Plans</h3>
                    <p className="text-gray-400 font-medium mt-2 leading-relaxed">
                      Power-based plans tailored for high-altitude South African racing.
                    </p>
                  </div>
                </div>
                <button className="flex items-center gap-2 text-primary font-bold mt-8 group-hover:translate-x-1 transition-transform">
                  See Plans <ChevronRight className="w-4 h-4" />
                </button>
              </Card>

              {/* Request a Race */}
              <Card className="bg-white/5 border-white/5 p-8 rounded-3xl flex flex-col justify-between group hover:bg-white/10 transition-all min-h-[280px]">
                <div className="space-y-6">
                  <div className="p-4 bg-primary/10 rounded-2xl w-fit">
                    <ExternalLink className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black">Request a Race</h3>
                    <p className="text-gray-400 font-medium mt-2 leading-relaxed">
                      Want a specific race added to the calculator? Tell us about it and we'll integrate the GPS data.
                    </p>
                  </div>
                </div>
                <Button variant="outline" className="w-fit rounded-full font-bold border-white/10 mt-8">Suggest Now</Button>
              </Card>
            </div>
          </section>
        </main>
      )}

      {/* Footer */}
      <footer ref={footerRef} className="mt-40 border-t border-white/5 bg-black/40 backdrop-blur-md px-6 py-12">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="text-center md:text-left space-y-2">
            <p className="text-sm font-bold text-gray-400">
              A passion project for the South African cycling community by{' '}
              <Link 
                href="https://strava.app.link/FSnhCW2qsXb" 
                target="_blank" 
                className="text-primary underline-offset-4 decoration-primary/30 hover:decoration-primary transition-all"
              >
                Spera Didiza
              </Link>
            </p>
            <p className="text-[10px] text-gray-600 font-black tracking-widest uppercase">
              © {new Date().getFullYear()} RideWise Splits. All rights reserved.
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild variant="outline" className="rounded-full font-bold border-white/10 bg-white/5 hover:bg-white/10 h-11 px-6">
              <Link href="https://strava.app.link/FSnhCW2qsXb" target="_blank">
                <Heart className="mr-2 h-4 w-4 text-red-500 fill-red-500" /> Follow on Strava
              </Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full font-bold border-white/10 bg-white/5 hover:bg-white/10 h-11 px-6">
              <Link href="https://paystack.shop/pay/spera" target="_blank">
                <Coffee className="mr-2 h-4 w-4" /> Buy me a coffee
              </Link>
            </Button>
          </div>
        </div>
      </footer>

      {/* Floating Action Button */}
      <Link 
        href="https://paystack.shop/pay/spera" 
        target="_blank" 
        className={cn(
          "fixed bottom-8 right-8 z-50 h-16 w-16 bg-primary rounded-2xl flex items-center justify-center text-white shadow-[0_15px_35px_rgba(139,92,246,0.4)] transition-all duration-500 hover:scale-110 active:scale-95 group",
          isAtBottom ? "translate-y-24 opacity-0" : "translate-y-0 opacity-100"
        )}
      >
        <Coffee className="w-8 h-8 group-hover:rotate-12 transition-transform" />
      </Link>
    </div>
  );
};

export default RaceSplitsCalculator;
