/**
 * @fileOverview Zod schemas and TypeScript types for the weather forecast feature.
 *
 * - WeatherInputSchema, WeatherInput
 * - HourlyForecastSchema, HourlyForecast
 * - WeatherForecastSchema, WeatherForecast
 */
import { z } from 'zod';

export const WeatherInputSchema = z.object({
  location: z.string().describe('The city and country for the weather forecast.'),
  month: z.string().optional().describe('The month the race takes place.'),
  raceStartTime: z.string().describe('The start time of the race in HH:MM format.'),
  raceHours: z.number().describe('The approximate duration of the race in hours.'),
  regionalContext: z.string().optional().describe('Specific meteorological context for the region and time of year.'),
});
export type WeatherInput = z.infer<typeof WeatherInputSchema>;

export const HourlyForecastSchema = z.object({
  time: z.string().describe('The hour for the forecast in HH:00 format.'),
  temperature: z.number().describe('The temperature in Celsius.'),
  windSpeed: z.number().describe('The wind speed in km/h.'),
  windDirection: z.string().describe('The wind direction (e.g., N, SW, ENE).'),
  condition: z.string().describe('A brief weather condition description (e.g., Sunny, Partly Cloudy, Light Rain).'),
  icon: z.string().describe('A suitable Material Symbols Outlined icon name for the condition (e.g., sunny, partly_cloudy_day, rainy).')
});
export type HourlyForecast = z.infer<typeof HourlyForecastSchema>;


export const WeatherForecastSchema = z.object({
  hourly: z.array(HourlyForecastSchema),
});
export type WeatherForecast = z.infer<typeof WeatherForecastSchema>;
