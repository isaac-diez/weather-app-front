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

@Injectable({
  providedIn: 'root'
})
export class WeatherService {

  // ATENCIÓN: Esta URL asume que el backend Java se ejecuta en localhost:8080.
  private baseUrl = 'http://localhost:8080/api/weather';

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

  getGeminiSuggestion(prompt: string): Observable<string> {
    const apiKey = `***REMOVED***`;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

    const payload = {
      contents: [{
        parts: [{ text: prompt }]
      }]
    };

    const maxRetries = 3;

    return from(fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(async response => {
      if (!response.ok) {
        const errorDetails = await response.text();
        console.error('Gemini API Non-OK Response:', response.status, errorDetails);
        throw new Error(`API Error: ${response.status}`);
      }
      return response.json();
    })).pipe(
      retry({
        count: maxRetries,
        delay: (error, retryCount) => {
          if (retryCount >= maxRetries) {
            return throwError(() => new Error('Error de conexión persistente con la IA.'));
          }
          const delayTime = Math.pow(2, retryCount) * 1000;
          return new Observable(observer => {
            const timeout = setTimeout(() => observer.next(undefined), delayTime);
            return () => clearTimeout(timeout);
          });
        }
      }),
      map((data: any) => { // Mantengo 'any' para la respuesta JSON, pero aseguro el retorno 'string'
        return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No se pudo generar una sugerencia.';
      }),
      catchError(err => {
        console.error('Error final de Gemini API después de reintentos:', err);
        return throwError(() => new Error('Falló la consulta a la IA (inténtalo más tarde).'));
      })
    );
  }
}
