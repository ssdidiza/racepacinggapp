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
  
  The race takes place in {{location}} in the month typical for this event.

  Use the following regional context to inform the forecast:
  {{{regionalContext}}}
  
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
    const regionalContext = input.location === "Cape Town, South Africa"
      ? "Cape Town in March: typically warm sunny mornings starting 16-18°C, strong SE 'Cape Doctor' wind developing by 9am reaching 25-40 km/h, direction is SE which means a tailwind going south but headwind on the return through Noordhoek and Hout Bay. Risk of cloud over the mountain but rarely rain in March."
      : "Johannesburg in November: clear cool mornings 15-18°C, warming to 26-30°C by midday, risk of afternoon thunderstorms after 14:00, low wind in the morning.";

    const {output} = await prompt({
      ...input,
      regionalContext
    });
    return output!;
  }
);
