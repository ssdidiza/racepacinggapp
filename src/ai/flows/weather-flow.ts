'use server';
/**
 * @fileOverview A weather forecasting AI flow.
 *
 * - getWeatherForecast - A function that returns a simulated weather forecast.
 */

import {ai} from '@/ai/genkit';
import {
  WeatherInputSchema,
  type WeatherInput,
  WeatherForecastSchema,
  type WeatherForecast
} from '@/ai/schemas/weather-schema';


export async function getWeatherForecast(input: WeatherInput): Promise<WeatherForecast> {
  return weatherFlow(input);
}

const prompt = ai.definePrompt({
  name: 'weatherForecastPrompt',
  input: {schema: WeatherInputSchema},
  output: {schema: WeatherForecastSchema},
  prompt: `You are a weather forecasting service. Generate a plausible hourly weather forecast for a cycling race in {{location}} during the month of {{month}}. 
  The race starts at {{raceStartTime}} and lasts approximately {{raceHours}} hours.
  
  Provide an hourly forecast starting from one hour before the race begins until one hour after it is expected to finish.
  For each hour, provide the temperature in Celsius, wind speed in km/h, wind direction, a short condition description, and a relevant Google Material Symbols icon name.
  
  Take into account typical weather patterns for {{location}} in {{month}}. 
  For example, if it's Johannesburg in November, it's typically warm with afternoon thunderstorms. If it's Cape Town in March, it's often windy (the "Cape Doctor") and mild.
  
  Example hourly forecast object:
  { time: '06:00', temperature: 16, windSpeed: 5, windDirection: 'N', condition: 'Clear', icon: 'sunny' }
  `,
});

const weatherFlow = ai.defineFlow(
  {
    name: 'weatherFlow',
    inputSchema: WeatherInputSchema,
    outputSchema: WeatherForecastSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
