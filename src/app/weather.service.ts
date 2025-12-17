import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, throwError } from 'rxjs';
import { map, tap, catchError, retry } from 'rxjs/operators';

// Las interfaces deben exportarse para ser usadas por el componente
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

export interface ForecastDayDTO {
  date: string;
  temperatureMax: number;
  temperatureMin: number;
  precipitationProbabilityMax: number;
}

export interface ForecastDTO {
  city: string;
  days: ForecastDayDTO[];
}

export interface GeminiRequest {
mode: 'outfit' | 'activity' | 'laundry' | 'drink' | string;
latitude: number;
longitude: number;
city: string;
}

@Injectable({
  providedIn: 'root'
})
export class WeatherService {

  private baseUrl = `${environment.apiUrl}/weather`;

  constructor(private http: HttpClient) { }

  getCities(name: string): Observable<CityListDTO> {
    return this.http.get<CityListDTO>(`${this.baseUrl}/cities?name=${name}`);
  }

  getCurrentWeather(city: CityDTO): Observable<CurrentWeatherDTO> {
    return this.http.post<CurrentWeatherDTO>(`${this.baseUrl}/current`, city)
      .pipe(
        tap(data => console.log('Datos Crudos del Backend:', data)),
        map(data => ({
        ...data,
        conditionText: data.conditionText ?? (data.precipitation > 0 ? 'Lluvia' : data.cloudCover > 50 ? 'Nublado' : 'Despejado')
      })));
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
