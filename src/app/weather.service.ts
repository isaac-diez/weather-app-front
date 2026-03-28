import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { environment } from '../environments/environment';
import { TranslateService } from '@ngx-translate/core';

export interface CityDTO {
name: string;
country: string;
region?: string;
latitude: number;
longitude: number;
}

export interface CityListDTO {
cities: CityDTO[];
}

export interface ForecastDayDTO {
date: string;
temperatureMax: number;
temperatureMin: number;
precipitationProbabilityMax: number;
uvIndexMax: number;
sunshineDuration: number;
}

export interface ForecastHourDTO {
hour: string;
temperature_2m: number;
weather_code: number;
precipitation_probability: number;
rain: number;
uv_index: number;
shortwave_radiation: number;
}

export interface ForecastDTO {
days: ForecastDayDTO[];
hours: ForecastHourDTO[];
}

export interface SolarSummaryDTO {
uvIndexHourly: number;
maxUvIndexToday: number;
peakUvTime: string;
sunshineHours: string;
daylightHours: string;
riskLevel: string;
recommendation: string;
shortwaveRadiation: number;
sunrise: string;
sunset: string;
dayProgressPercent: number;
isNight: boolean;
}

export interface CurrentWeatherDTO {
city: string;
temperature: number;
relativeHumidity: number;
apparentTemperature: number;
isDay: number;
precipitation: number;
cloudCover: number;
windSpeed: number;
windDirection: number;
windGusts: number;
uvIndex: number;
conditionText?: string;
observationTime: string;
}

export interface FullWeatherDTO {
current: CurrentWeatherDTO;
forecast: ForecastDTO;
solarSummary: SolarSummaryDTO;
}

export interface GeminiRequest {
mode: 'outfit' | 'activity' | 'laundry' | 'drink' | string;
latitude: number;
longitude: number;
city: string;
language: string;
}

@Injectable({
providedIn: 'root'
})
export class WeatherService {

private baseUrl = `${environment.apiUrl}/weather`;

constructor(private http: HttpClient, private translate: TranslateService) { }

  getCities(name: string): Observable<CityListDTO> {
    return this.http.get<CityListDTO>(`${this.baseUrl}/cities?name=${name}`);
  }

  getFullWeather(city: CityDTO): Observable<FullWeatherDTO> {
    return this.http.post<FullWeatherDTO>(`${this.baseUrl}/full`, city);
  }

  getCurrentWeather(city: CityDTO): Observable<CurrentWeatherDTO> {
    return this.http.post<CurrentWeatherDTO>(`${this.baseUrl}/current`, city)
      .pipe(
        switchMap(data => {
          if (data.conditionText) return of(data);

          const key = data.precipitation > 0 ? 'WEATHER.RAIN' :
                      data.cloudCover > 50 ? 'WEATHER.CLOUDY' : 'WEATHER.CLEAR';

          return this.translate.get(key).pipe(
            map(translatedText => ({
              ...data,
              conditionText: translatedText
            }))
          );
        })
      );
  }

  getForecast(city: CityDTO): Observable<ForecastDTO> {
    return this.http.post<ForecastDTO>(`${this.baseUrl}/forecast`, city);
  }

  getAiSuggestion(request: GeminiRequest): Observable<string> {
    return this.http.post(`${this.baseUrl}/gemini-suggest`, request, {
      responseType: 'text'
    });
  }
}
