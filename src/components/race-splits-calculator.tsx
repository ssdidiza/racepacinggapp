"use client";

import { useState } from 'react';
import { Download, Calculator, Clock, Mountain, TrendingUp, BarChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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

const RaceSplitsCalculator = () => {
  const [targetHours, setTargetHours] = useState(3);
  const [targetMinutes, setTargetMinutes] = useState(45);
  const [splits, setSplits] = useState<Split[]>([]);
  const [showResults, setShowResults] = useState(false);

  const checkpoints = [
    { name: 'M1 17km', distance: 17, terrainFactor: 1.0, description: 'Moderate start, mixed terrain' },
    { name: 'Kyalami Entrance 44.2km', distance: 44.2, terrainFactor: 1.25, description: 'Fast section - downhill/flat' },
    { name: 'Kyalami Exit 49.3km', distance: 49.3, terrainFactor: 0.75, description: 'Challenging hills - expect slowdown' },
    { name: 'Mandela Bridge 84.2km', distance: 84.2, terrainFactor: 0.65, description: 'Toughest section - major hills' },
    { name: 'Finish 98km', distance: 98, terrainFactor: 0.85, description: 'Final push - mixed terrain' }
  ];

  const formatTime = (totalMinutes: number) => {
    if (isNaN(totalMinutes)) return "00:00:00";
    const totalSeconds = totalMinutes * 60;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getDifficultyIcon = (terrainFactor: number) => {
    if (terrainFactor >= 1.2) return <TrendingUp className="w-5 h-5 text-green-500" />;
    if (terrainFactor >= 0.8) return <div className="w-3 h-3 rounded-full bg-yellow-400" />;
    return <Mountain className="w-5 h-5 text-red-500" />;
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

  const overallAverageSpeed = showResults ? (98 / ((targetHours * 60 + targetMinutes) / 60)).toFixed(2) : 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Card className="max-w-7xl mx-auto shadow-2xl shadow-primary/10 border-primary/20">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-3xl md:text-4xl font-extrabold tracking-tight text-primary">RideWise Splits</CardTitle>
          <CardDescription className="text-lg text-muted-foreground mt-2">
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
            </CardHeader>
            <CardContent className="space-y-6">
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
              <div className="flex flex-wrap gap-3">
                <Button onClick={calculateSplits} size="lg">
                  <Calculator className="mr-2" />
                  Generate Terrain Splits
                </Button>
                {showResults && (
                  <Button onClick={downloadCSV} variant="outline" size="lg" className="border-accent/80 text-accent-foreground hover:bg-accent/90 hover:text-accent-foreground">
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
                      <span className="ml-4 text-xs text-muted-foreground">(Note: Your actual speed will vary by terrain. See table for details.)</span>
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

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px]">Checkpoint</TableHead>
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
                        <TableCell className="font-medium">{split.name}</TableCell>
                        <TableCell className="flex justify-center items-center h-full pt-6">{getDifficultyIcon(split.terrainFactor)}</TableCell>
                        <TableCell className="text-center font-mono">{split.distance.toFixed(1)}</TableCell>
                        <TableCell className="text-center font-mono text-primary font-semibold">{formatTime(split.timeToPoint)}</TableCell>
                        <TableCell className="text-center font-mono">{formatTime(split.splitTime)}</TableCell>
                        <TableCell className="text-center font-mono">{split.splitDistance.toFixed(1)}</TableCell>
                        <TableCell className={`text-center font-medium font-mono ${
                          split.terrainFactor >= 1.2 ? 'text-green-600' : 
                          split.terrainFactor < 0.8 ? 'text-red-600' : ''
                        }`}>
                          {split.speedOnSplit.toFixed(1)}
                        </TableCell>
                        <TableCell className="text-center font-mono">{split.movingAverageSpeed.toFixed(1)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{split.description}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
      </Card>
    </div>
  );
};

export default RaceSplitsCalculator;
