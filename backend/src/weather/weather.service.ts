import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';

@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name);
  private readonly BASE_URL = 'https://api.open-meteo.com/v1/forecast';

  // ✅ Clean names (no parentheses or special characters)
  private readonly REGION_COORDS: Record<string, { lat: number; lon: number }> = {
    'Addis Ababa': { lat: 9.0320, lon: 38.7469 },
    'Adama': { lat: 8.5400, lon: 39.2700 },
    'Jimma': { lat: 7.6733, lon: 36.8344 },
    'Hawassa': { lat: 7.0621, lon: 38.4764 },
    'Bahir Dar': { lat: 11.5936, lon: 37.3908 },
    'Gondar': { lat: 12.6030, lon: 37.4521 },
    'Mekelle': { lat: 13.4967, lon: 39.4753 },
    'Dire Dawa': { lat: 9.5900, lon: 41.8600 },
    'Harar': { lat: 9.3117, lon: 42.1181 },
    'Arba Minch': { lat: 6.0333, lon: 37.5500 },
    'Bishoftu': { lat: 8.7500, lon: 38.9833 },
    'Nekemte': { lat: 9.0833, lon: 36.5500 },
    'Asosa': { lat: 10.0667, lon: 34.5333 },
    'Gambela': { lat: 8.2500, lon: 34.5833 },
    'Semera': { lat: 11.7934, lon: 41.0058 },
  };

  constructor(private prisma: PrismaService) {}

  // ==================== FETCH ALL DATA AT ONCE (Open-Meteo) ====================
  private async fetchOpenMeteoData(lat: number, lon: number) {
    try {
      const response = await axios.get(this.BASE_URL, {
        params: {
          latitude: lat,
          longitude: lon,
          current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m',
          daily: 'weather_code,temperature_2m_max,temperature_2m_min,uv_index_max,precipitation_sum,precipitation_probability_max,wind_speed_10m_max',
          timezone: 'auto',
          forecast_days: 7,
        },
        timeout: 10000,
      });
      return response.data;
    } catch (error) {
      this.logger.error(`Open-Meteo API error: ${error.message}`);
      throw new BadRequestException('Failed to fetch weather data from Open-Meteo');
    }
  }

  // ==================== MAP WMO CODES TO DESCRIPTIONS ====================
  private getWeatherInfo(code: number) {
    const mapping: Record<number, { condition: string; description: string; icon: string }> = {
      0: { condition: 'Clear', description: 'clear sky', icon: '01d' },
      1: { condition: 'Mainly Clear', description: 'mainly clear', icon: '02d' },
      2: { condition: 'Partly Cloudy', description: 'partly cloudy', icon: '03d' },
      3: { condition: 'Overcast', description: 'overcast', icon: '04d' },
      45: { condition: 'Fog', description: 'fog', icon: '50d' },
      48: { condition: 'Depositing Rime Fog', description: 'depositing rime fog', icon: '50d' },
      51: { condition: 'Light Drizzle', description: 'light drizzle', icon: '09d' },
      53: { condition: 'Moderate Drizzle', description: 'moderate drizzle', icon: '09d' },
      55: { condition: 'Dense Drizzle', description: 'dense drizzle', icon: '09d' },
      61: { condition: 'Slight Rain', description: 'slight rain', icon: '10d' },
      63: { condition: 'Moderate Rain', description: 'moderate rain', icon: '10d' },
      65: { condition: 'Heavy Rain', description: 'heavy rain', icon: '10d' },
      71: { condition: 'Slight Snow', description: 'slight snow fall', icon: '13d' },
      73: { condition: 'Moderate Snow', description: 'moderate snow fall', icon: '13d' },
      75: { condition: 'Heavy Snow', description: 'heavy snow fall', icon: '13d' },
      80: { condition: 'Slight Rain Showers', description: 'slight rain showers', icon: '09d' },
      81: { condition: 'Moderate Rain Showers', description: 'moderate rain showers', icon: '09d' },
      82: { condition: 'Violent Rain Showers', description: 'violent rain showers', icon: '09d' },
      95: { condition: 'Thunderstorm', description: 'thunderstorm', icon: '11d' },
      96: { condition: 'Thunderstorm with Hail', description: 'thunderstorm with slight hail', icon: '11d' },
      99: { condition: 'Thunderstorm with Heavy Hail', description: 'thunderstorm with heavy hail', icon: '11d' },
    };
    return mapping[code] || { condition: 'Unknown', description: 'unknown', icon: '01d' };
  }

  // ==================== HELPER: MAP DATA ====================
  private mapWeatherData(data: any, lat: number, lon: number, regionName: string) {
    const current = data.current;
    const daily = data.daily;
    const currentInfo = this.getWeatherInfo(current.weather_code);

    const mappedCurrent = {
      temperature: current.temperature_2m,
      feelsLike: current.apparent_temperature,
      humidity: current.relative_humidity_2m,
      windSpeed: current.wind_speed_10m,
      windDirection: current.wind_direction_10m,
      condition: currentInfo.condition,
      description: currentInfo.description,
      icon: currentInfo.icon,
      uvIndex: daily.uv_index_max[0],
      timestamp: new Date().toISOString(),
      location: { lat, lon },
    };

    const mappedForecast = daily.time.map((date: string, i: number) => {
      const dayInfo = this.getWeatherInfo(daily.weather_code[i]);
      return {
        date: date,
        tempMin: daily.temperature_2m_min[i],
        tempMax: daily.temperature_2m_max[i],
        humidity: 60, 
        windSpeed: daily.wind_speed_10m_max[i],
        condition: dayInfo.condition,
        description: dayInfo.description,
        icon: dayInfo.icon,
        rainChance: daily.precipitation_probability_max[i] / 100,
        rainAmount: daily.precipitation_sum[i],
        uvIndex: daily.uv_index_max[i],
      };
    });

    return {
      region: regionName,
      current: mappedCurrent,
      forecast: mappedForecast,
      alerts: [],
      advisory: this.getCropAdvisory(mappedCurrent, mappedForecast),
    };
  }

  // ==================== GET WEATHER BY REGION NAME ====================
  async getWeatherByRegion(region: string) {
    const coords = this.REGION_COORDS[region];
    if (!coords) {
      throw new BadRequestException(`Unknown region: ${region}`);
    }

    const data = await this.fetchOpenMeteoData(coords.lat, coords.lon);
    return this.mapWeatherData(data, coords.lat, coords.lon, region);
  }

  // ==================== GET WEATHER BY COORDINATES (GPS) ====================
  async getWeatherWithCache(lat: number, lon: number) {
    const data = await this.fetchOpenMeteoData(lat, lon);
    return this.mapWeatherData(data, lat, lon, 'My Current Location');
  }

  // ==================== CROP-SPECIFIC ADVISORY ====================
  private getCropAdvisory(current: any, forecast: any[]) {
    const advisories: string[] = [];

    if (forecast[0] && forecast[0].rainChance > 0.6) {
      advisories.push('🌧️ Rain expected today — do not spray pesticides or fertilizers');
    }
    if (forecast[0] && forecast[0].tempMin < 5) {
      advisories.push('❄️ Frost risk tonight — cover sensitive crops');
    }
    if (current.temperature > 35) {
      advisories.push('🔥 High heat — increase irrigation, avoid midday field work');
    }
    if (current.uvIndex > 8) {
      advisories.push('☀️ Very high UV — protect workers and young plants');
    }
    if (current.humidity > 85) {
      advisories.push('🍄 High humidity — monitor for fungal diseases');
    }
    if (current.windSpeed > 10) {
      advisories.push('💨 Strong winds — secure structures and young trees');
    }
    const dryDays = forecast.slice(0, 7).filter((d: any) => d.rainChance < 0.2).length;
    if (dryDays >= 5) {
      advisories.push('🏜️ Dry week ahead — plan irrigation carefully');
    }

    return advisories;
  }
}