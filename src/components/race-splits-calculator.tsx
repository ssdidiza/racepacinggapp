"use client";

import { useState, useEffect } from 'react';
import { Download, Calculator, Clock, Mountain, TrendingUp, BarChart, ChevronRight, AlertTriangle, Info, CheckCircle2, XCircle, Coffee, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import Link from 'next/link';

interface Split {
  name: string;
  distance: number;
  cumulativeDistance: number;
  timeToPoint: number;
  splitTime: number;
  splitDistance: number;
  speedOnSplit: number;
  movingAverageSpeed: number;
  terrainFactor: number;
  description: string;
}

type PaceValidation = {
  level: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  Icon: React.ElementType;
} | null;

const RaceSplitsCalculator = () => {
  const [targetHours, setTargetHours] = useState(3);
  const [targetMinutes, setTargetMinutes] = useState(45);
  const [splits, setSplits] = useState<Split[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [paceValidation, setPaceValidation] = useState<PaceValidation>(null);

  const checkpoints = [
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

  useEffect(() => {
    validatePace();
    setShowResults(false);
  }, [targetHours, targetMinutes]);


  const validatePace = () => {
    const totalMinutes = targetHours * 60 + targetMinutes;
    if (totalMinutes < 150) { // < 2:30
      setPaceValidation({
        level: 'error', title: 'Elite Professional Pace',
        message: 'This is a world-class time, typically reserved for professional cyclists. Please ensure this is a realistic goal.',
        Icon: XCircle
      });
    } else if (totalMinutes < 180) { // 2:30 - 3:00
      setPaceValidation({
        level: 'warning', title: 'Very Aggressive Pace',
        message: 'This is a highly competitive goal for experienced racers. It requires dedicated training and race strategy.',
        Icon: AlertTriangle
      });
    } else if (totalMinutes < 210) { // 3:00 - 3:30
      setPaceValidation({
        level: 'info', title: 'Competitive Time',
        message: 'A strong and challenging goal for dedicated recreational cyclists. Great job!',
        Icon: Info
      });
    } else if (totalMinutes <= 270) { // 3:30 - 4:30
      setPaceValidation({
        level: 'success', title: 'Realistic & Achievable',
        message: 'This is a great target for most riders. With consistent training, you can achieve this!',
        Icon: CheckCircle2
      });
    } else if (totalMinutes <= 360) { // 4:30 - 6:00
      setPaceValidation({
        level: 'info', title: 'Leisurely & Enjoyable Pace',
        message: 'A comfortable pace to enjoy the ride and soak in the atmosphere. Perfect for a fun day out.',
        Icon: Info
      });
    } else { // > 6:00
      setPaceValidation({
        level: 'warning', title: 'Very Conservative Pace',
        message: 'This pace is quite relaxed. Be mindful of official cut-off times along the route.',
        Icon: AlertTriangle
      });
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
  
  const getDifficultyIcon = (terrainFactor: number, className?: string) => {
    if (terrainFactor >= 1.2) return <TrendingUp className={cn("w-5 h-5 text-green-500", className)} />;
    if (terrainFactor >= 0.8) return <div className={cn("w-3 h-3 rounded-full bg-yellow-400", className)} />;
    return <Mountain className={cn("w-5 h-5 text-red-500", className)} />;
  };

  const getDifficultyDescription = (terrainFactor: number) => {
    if (terrainFactor >= 1.2) return "Fast";
    if (terrainFactor >= 0.8) return "Moderate";
    return "Hilly";
  };


  const calculateSplits = () => {
    const targetTotalMinutes = targetHours * 60 + targetMinutes;
    if (targetTotalMinutes <= 0) return;
    const totalDistance = 98;
    
    const baseAverageSpeed = totalDistance / (targetTotalMinutes / 60);
    
    const calculatedSplits: Split[] = [];
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
        movingAverageSpeed: 0, // Placeholder
        terrainFactor: checkpoint.terrainFactor,
        description: checkpoint.description
      });
    }
    
    const totalCalculatedTime = calculatedSplits[calculatedSplits.length - 1].timeToPoint;
    const normalizationFactor = targetTotalMinutes / totalCalculatedTime;
    
    let normalizedCumulativeTime = 0;
    const finalSplits = calculatedSplits.map((split) => {
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
    
    setSplits(finalSplits);
    setShowResults(true);
  };
  
  const downloadCSV = () => {
    if (typeof window === "undefined") return;
    const headers = [
      'Point on Route', 'Distance (km)', 'Time to Point', 'Split Time', 
      'Split Distance (km)', 'Speed on Split (km/h)', 'Moving Average Speed (km/h)', 'Terrain Description'
    ];
    
    const csvData = splits.map(split => [
      split.name, split.distance.toFixed(1),
      formatTime(split.timeToPoint), formatTime(split.splitTime), split.splitDistance.toFixed(1),
      split.speedOnSplit.toFixed(2), split.movingAverageSpeed.toFixed(2), `"${split.description}"`
    ]);
    
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

  const overallAverageSpeed = showResults ? (98 / ((targetHours * 60 + targetMinutes) / 60)).toFixed(2) : (98 / ((targetHours * 60 + targetMinutes) / 60)).toFixed(2) || 0;

  return (
    <div className="p-2 sm:p-4 lg:p-6">
      <Card className="max-w-7xl mx-auto shadow-2xl shadow-primary/10 border-primary/20">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-3xl md:text-4xl font-extrabold tracking-tight text-primary">RideWise Splits</CardTitle>
          <CardDescription className="text-lg text-muted-foreground mt-2 max-w-2xl mx-auto">
            947 Ride Joburg Terrain-Adjusted Race Splits Calculator (98km)
          </CardDescription>
          <div className="flex items-center justify-center text-sm text-muted-foreground pt-2 gap-2">
            <Clock className="w-4 h-4" />
            <span>Realistic pacing based on course terrain</span>
            <Mountain className="w-4 h-4" />
          </div>
        </CardHeader>

        <CardContent className="space-y-8">
          <Card className="bg-card">
            <CardHeader>
              <CardTitle>Your Target Finish Time</CardTitle>
              <CardDescription>Enter your goal time or select a preset below.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap items-end gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="hours">Hours</Label>
                      <Input
                        id="hours"
                        type="number" min="2" max="8" value={targetHours}
                        onChange={(e) => setTargetHours(parseInt(e.target.value) || 2)}
                        className="w-24 text-lg"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="minutes">Minutes</Label>
                      <Input
                        id="minutes"
                        type="number" min="0" max="59" value={targetMinutes}
                        onChange={(e) => setTargetMinutes(parseInt(e.target.value) || 0)}
                        className="w-24 text-lg"
                      />
                    </div>
                    <div className="text-2xl font-bold text-primary pb-2">
                      = {targetHours}:{targetMinutes.toString().padStart(2, '0')}:00
                    </div>
                  </div>
                  {paceValidation && (
                    <Alert variant={paceValidation.level === 'error' ? 'destructive' : 'default'} className={cn({
                      'bg-yellow-50 border-yellow-300 text-yellow-800 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-200 [&>svg]:text-yellow-500': paceValidation.level === 'warning',
                      'bg-blue-50 border-blue-300 text-blue-800 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-200 [&>svg]:text-blue-500': paceValidation.level === 'info',
                      'bg-green-50 border-green-300 text-green-800 dark:bg-green-950 dark:border-green-800 dark:text-green-200 [&>svg]:text-green-500': paceValidation.level === 'success',
                    })}>
                      <paceValidation.Icon className="h-4 w-4" />
                      <AlertTitle>{paceValidation.title}</AlertTitle>
                      <AlertDescription>{paceValidation.message}</AlertDescription>
                    </Alert>
                  )}
              </div>
              <div>
                <Label className="mb-3 block">Quick Select Presets</Label>
                <div className="flex flex-wrap gap-2">
                  {presets.map(preset => (
                     <Button
                        key={preset.label}
                        variant="outline"
                        size="sm"
                        onClick={() => setPresetTime(preset.hours, preset.minutes)}
                        className={cn(
                          "flex flex-col h-auto p-2",
                           targetHours === preset.hours && targetMinutes === preset.minutes ? "border-primary ring-2 ring-primary" : ""
                        )}
                      >
                       <span className="font-semibold">{preset.label}</span>
                       <span className="text-xs text-muted-foreground">{preset.time}</span>
                     </Button>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button onClick={calculateSplits} size="lg">
                  <Calculator className="mr-2" />
                  Generate Terrain Splits
                </Button>
                {showResults && (
                  <Button onClick={downloadCSV} variant="outline" size="lg" className="border-accent text-accent hover:bg-accent hover:text-accent-foreground">
                    <Download className="mr-2" />
                    Download CSV
                  </Button>
                )}
              </div>
            </CardContent>
            {showResults && (
              <CardFooter>
                  <Alert className="w-full">
                    <BarChart className="h-4 w-4" />
                    <AlertTitle>Overall Average Speed Required</AlertTitle>
                    <AlertDescription>
                      {overallAverageSpeed} km/h 
                      <span className="ml-1 sm:ml-4 text-xs text-muted-foreground">(Note: Your actual speed will vary by terrain. See table for details.)</span>
                    </AlertDescription>
                  </Alert>
              </CardFooter>
            )}
          </Card>
          
          {showResults && (
            <>
              <Card>
                <CardHeader>
                    <CardTitle>Terrain Legend</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-x-6 gap-y-2 text-sm items-center">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                    <span>Fast Section (Downhill/Flat)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <span>Moderate Terrain</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mountain className="w-5 h-5 text-red-500" />
                    <span>Challenging Hills</span>
                  </div>
                </CardContent>
              </Card>

              {/* Mobile Card Layout */}
              <div className="space-y-4 lg:hidden">
                {splits.map((split, index) => (
                  <div key={index}>
                    <Card className="shadow-md">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span className="text-xl">{split.name}</span>
                          <div className="flex items-center gap-2 text-sm font-medium px-2 py-1 rounded-full bg-secondary">
                              {getDifficultyIcon(split.terrainFactor, "w-4 h-4")}
                              <span>{getDifficultyDescription(split.terrainFactor)}</span>
                          </div>
                        </CardTitle>
                        <CardDescription>{split.distance.toFixed(1)} km into race</CardDescription>
                      </CardHeader>
                      <CardContent className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <div className="font-semibold">Time to Point:</div>
                        <div className="font-mono text-primary font-bold text-right">{formatTime(split.timeToPoint)}</div>
                        
                        <div className="font-semibold">Expected Speed:</div>
                        <div className={cn(
                          "font-mono font-medium text-right",
                          split.terrainFactor >= 1.2 ? 'text-green-600' : 
                          split.terrainFactor < 0.8 ? 'text-red-600' : ''
                        )}>
                          {split.speedOnSplit.toFixed(1)} km/h
                        </div>

                        <div className="font-semibold">Split Time:</div>
                        <div className="font-mono text-right">{formatTime(split.splitTime)}</div>

                        <div className="font-semibold">Split Distance:</div>
                        <div className="font-mono text-right">{split.splitDistance.toFixed(1)} km</div>
                      </CardContent>
                      <CardFooter>
                         <p className="text-xs text-muted-foreground">{split.description}</p>
                      </CardFooter>
                    </Card>
                    {index < splits.length - 1 && (
                      <div className="flex justify-center my-2">
                        <ChevronRight className="w-6 h-6 text-muted-foreground/50 -rotate-90" />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Tablet and Desktop Table Layout */}
              <div className="hidden lg:block">
                <ScrollArea className="w-full whitespace-nowrap rounded-md border">
                  <Table className="min-w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="sticky left-0 bg-card z-10 w-[180px] min-w-[180px]">Checkpoint</TableHead>
                        <TableHead className="text-center">Terrain</TableHead>
                        <TableHead className="text-center">Dist. (km)</TableHead>
                        <TableHead className="text-center">Time to Point</TableHead>
                        <TableHead className="text-center">Split Time</TableHead>
                        <TableHead className="text-center">Split Dist. (km)</TableHead>
                        <TableHead className="text-center">Speed (km/h)</TableHead>
                        <TableHead className="text-center">Moving Avg (km/h)</TableHead>
                        <TableHead>Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {splits.map((split, index) => (
                        <TableRow key={index}>
                          <TableCell className="sticky left-0 bg-card z-10 font-medium">{split.name}</TableCell>
                          <TableCell className="flex justify-center items-center h-full pt-6">{getDifficultyIcon(split.terrainFactor)}</TableCell>
                          <TableCell className="text-center font-mono">{split.distance.toFixed(1)}</TableCell>
                          <TableCell className="text-center font-mono text-primary font-semibold">{formatTime(split.timeToPoint)}</TableCell>
                          <TableCell className="text-center font-mono">{formatTime(split.splitTime)}</TableCell>
                          <TableCell className="text-center font-mono">{split.splitDistance.toFixed(1)}</TableCell>
                          <TableCell className={cn(
                            "text-center font-medium font-mono",
                            split.terrainFactor >= 1.2 ? 'text-green-600' : 
                            split.terrainFactor < 0.8 ? 'text-red-600' : ''
                          )}>
                            {split.speedOnSplit.toFixed(1)}
                          </TableCell>
                          <TableCell className="text-center font-mono">{split.movingAverageSpeed.toFixed(1)}</TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-pre-wrap min-w-[200px]">{split.description}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </div>
            </>
          )}

          <Card className="bg-secondary/30">
            <CardHeader>
              <CardTitle>Course Analysis & Strategy</CardTitle>
              <CardDescription>Based on Historical Data</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-x-8 gap-y-6">
              <div>
                <h4 className="font-semibold mb-3 text-primary">Pacing Strategy</h4>
                <ul className="text-sm text-muted-foreground space-y-2.5 list-disc pl-4">
                  <li><strong>Start to M1 (17km):</strong> Settle in with a steady, conservative warm-up pace.</li>
                  <li><strong>M1 to Kyalami (27km):</strong> This is a fast, flowing section. Increase your effort and take advantage.</li>
                  <li><strong>Kyalami Track (5km):</strong> A technical section with short, sharp hills. Conserve energy.</li>
                  <li><strong>To Mandela Bridge (35km):</strong> The toughest part. Pace yourself on the climbs to avoid burning out.</li>
                  <li><strong>Final 14km:</strong> Recover on the initial descent from the bridge, then empty the tank.</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-3 text-primary">Key Insights</h4>
                <ul className="text-sm text-muted-foreground space-y-2.5 list-disc pl-4">
                  <li>Fast sections can see a ~25% speed increase over your average.</li>
                  <li>The main hill sections can reduce your speed by as much as 25-35%.</li>
                  <li>The climb towards the Mandela Bridge is consistently the slowest for most riders.</li>
                  <li>Plan nutrition and hydration to fuel you through the difficult middle section.</li>
                  <li>There's a good recovery stretch after the Mandela Bridge to prepare for the final push.</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </CardContent>

        <CardFooter className="flex-col sm:flex-row items-center justify-center gap-4 text-center text-sm text-muted-foreground border-t pt-6">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-red-500" />
            <span>A passion project by Spera Didiza.</span>
          </div>
          <Button asChild variant="outline" className="border-amber-500/50 text-amber-600 hover:bg-amber-500/10 hover:text-amber-700 dark:hover:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30">
            <Link href="https://paystack.shop/pay/spera" target="_blank">
              <Coffee className="mr-2" />
              Buy me a coffee
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default RaceSplitsCalculator;
