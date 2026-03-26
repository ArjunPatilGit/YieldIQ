/**
 * @fileOverview Live weather data integration using Open-Meteo.
 */

export interface WeatherData {
  currentTemp: number;
  currentHumidity: number;
  currentRainfall: number;
  weatherCode: number;
  soilMoistureTop: number;
  soilTempSurface: number;
  eto: number;
  forecast7dayRain: number;
  forecastMaxTemp: number;
  dailyForecast: any;
}

export async function getWeatherData(lat: number, lng: number): Promise<WeatherData | null> {
  try {
    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.searchParams.set('latitude', lat.toString());
    url.searchParams.set('longitude', lng.toString());
    url.searchParams.set('current', [
      'temperature_2m', 'relative_humidity_2m', 'precipitation',
      'weather_code', 'soil_temperature_0cm', 'soil_moisture_0_to_1cm'
    ].join(','));
    url.searchParams.set('daily', [
      'temperature_2m_max', 'temperature_2m_min',
      'precipitation_sum', 'et0_fao_evapotranspiration',
      'weather_code'
    ].join(','));
    url.searchParams.set('forecast_days', '7');
    url.searchParams.set('timezone', 'Asia/Kolkata');

    const res = await fetch(url.toString(), { next: { revalidate: 1800 } }); 
    if (!res.ok) return null;
    
    const data = await res.json();

    return {
      currentTemp: data.current.temperature_2m,
      currentHumidity: data.current.relative_humidity_2m,
      currentRainfall: data.current.precipitation,
      weatherCode: data.current.weather_code,
      soilMoistureTop: data.current.soil_moisture_0_to_1cm,
      soilTempSurface: data.current.soil_temperature_0cm,
      eto: data.daily.et0_fao_evapotranspiration[0],
      forecast7dayRain: data.daily.precipitation_sum.reduce((a: number, b: number) => a + b, 0),
      forecastMaxTemp: Math.max(...data.daily.temperature_2m_max),
      dailyForecast: data.daily,
    };
  } catch (error) {
    console.error("Weather fetch failed:", error);
    return null;
  }
}
