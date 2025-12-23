import { Component } from '@angular/core';
import { WeatherService, CityDTO, CurrentWeatherDTO, ForecastDTO, CityListDTO, GeminiRequest } from '../weather.service';
import { Observable } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-weather',
  templateUrl: './weather.component.html',
  styles: []
})
export class WeatherComponent {

  searchName = '';
  cityList: CityDTO[] = [];
  selectedCity?: CityDTO;
  showDropdown = false;

  currentWeather?: CurrentWeatherDTO;
  forecast?: ForecastDTO;
  error?: string;

  // AI State
  aiResponse: string | null = null;
  isAiLoading = false;
  aiError: string | null = null;
  activeAiMode: 'outfit' | 'activity' | 'laundry' | 'drink' | null = null;

  constructor(
    private weatherService: WeatherService,
    private translate: TranslateService
  ) {}

  searchCities() {
    if (!this.searchName.trim()) {
      this.cityList = [];
      this.showDropdown = false;
      return;
    }

    this.weatherService.getCities(this.searchName).subscribe({
      next: (data: CityListDTO) => {
        this.cityList = data.cities;
        this.showDropdown = true;
        this.error = undefined;
      },
      error: (err: any) => {
        console.error(err);
        this.error = 'Error al buscar ciudades.';
      }
    });
  }

  selectCity(city: CityDTO) {
    this.selectedCity = city;
    this.searchName = `${city.name}, ${city.country}`;
    this.cityList = [];
    this.showDropdown = false;
    this.loadWeather();
  }

  loadWeather() {
    if (!this.selectedCity) return;

    this.error = undefined;
    this.currentWeather = undefined;
    this.forecast = undefined;
    this.aiResponse = null;
    this.activeAiMode = null;

    this.weatherService.getCurrentWeather(this.selectedCity).subscribe({
      next: (data: CurrentWeatherDTO) => {
        this.currentWeather = data;
      },
      error: (err: any) => {
        console.error(err);
        this.error = 'No se pudo cargar el tiempo actual.';
      }
    });

    this.weatherService.getForecast(this.selectedCity).subscribe({
      next: (data: ForecastDTO) => {
        this.forecast = data;
      },
      error: (err: any) => {
        console.error(err);
        this.error = 'No se pudo cargar el pronóstico.';
      }
    });
  }

  getWeatherIconClass(isDay: number, precip: number, cloud: number): string {
    if (precip > 0.5) return 'bi-cloud-drizzle-fill';
    if (cloud > 50) return 'bi-clouds-fill';
    if (isDay === 1) return 'bi-sun-fill';
    return 'bi-moon-stars-fill';
  }

  getWindDirectionIcon(windDirection: number): string {
  if (windDirection >= 337.5 || windDirection < 22.5) return 'bi-arrow-up-circle';
  if (windDirection >= 22.5 && windDirection < 67.5) return 'bi-arrow-up-right-circle';
  if (windDirection >= 67.5 && windDirection < 112.5) return 'bi-arrow-right-circle';
  if (windDirection >= 112.5 && windDirection < 157.5) return 'bi-arrow-down-right-circle';
  if (windDirection >= 157.5 && windDirection < 202.5) return 'bi-arrow-down-circle';
  if (windDirection >= 202.5 && windDirection < 247.5) return 'bi-arrow-down-left-circle';
  if (windDirection >= 247.5 && windDirection < 292.5) return 'bi-arrow-left-circle';
  return 'bi-arrow-up-left';
}

  askAi(mode: 'outfit' | 'activity' | 'laundry' | 'drink') {
    if (!this.currentWeather || !this.selectedCity) return;

    this.isAiLoading = true;
    this.aiResponse = null;
    this.aiError = null;
    this.activeAiMode = mode;

    const request: GeminiRequest = {
        mode: mode,
        latitude: this.selectedCity.latitude,
        longitude: this.selectedCity.longitude,
        city: this.selectedCity.name,
        language: this.translate.currentLang || this.translate.defaultLang || 'en'
    };

    this.weatherService.getAiSuggestion(request).subscribe({
      next: (response: string) => {
        this.aiResponse = response;
        this.isAiLoading = false;
      },
      error: (err: any) => {
        this.aiError = 'La IA no está disponible.';
        this.isAiLoading = false;
      }
    });
  }
}
