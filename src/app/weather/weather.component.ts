import { Component, OnInit, OnDestroy } from '@angular/core';
import { WeatherService, CityDTO, FullWeatherDTO, CurrentWeatherDTO, ForecastDTO, CityListDTO, GeminiRequest, SolarSummaryDTO, AirQualityCurrentDTO, AirQualityDTO, AirQualityHourDTO } from '../weather.service';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-weather',
  templateUrl: './weather.component.html',
  styles: []
})
export class WeatherComponent implements OnInit, OnDestroy {

  searchName = '';
  isCitiesLoading = false;
  isWeatherLoading = false;
  cityList: CityDTO[] = [];
  selectedCity?: CityDTO;
  showDropdown = false;

  currentWeather?: CurrentWeatherDTO;
  forecast?: ForecastDTO;
  solarSummary?: SolarSummaryDTO;
  airSummary?: AirQualityCurrentDTO;
  error?: string;

  // AI State
  aiResponse: string | null = null;
  isAiLoading = false;
  aiError: string | null = null;
  activeAiMode: 'outfit' | 'activity' | 'laundry' | 'drink' | 'sun' | 'energy' | null = null;

  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;

  viewMode: 'general' | 'solar' | 'air' = 'general';

  constructor(
    private weatherService: WeatherService,
    private translate: TranslateService
  ) {

    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(city => {
      this._executeSearch(city);
    });
  }

  ngOnInit() {
    const saved = localStorage.getItem('lastCity');
    if (saved) {
      try {
        const city: CityDTO = JSON.parse(saved);
        this.selectCity(city);
      } catch (e) {
        console.error("Error retrieving last searched city", e);
      }
    }
  }

  ngOnDestroy() {
    this.searchSubscription?.unsubscribe();
  }

  searchCities() {
    this.searchSubject.next(this.searchName);
    }

  private _executeSearch(name: string) {
  const term = name.trim();
  if (term.length < 3) {
    this.cityList = [];
    this.showDropdown = false;
    return;
  }

  this.isCitiesLoading = true;
  this.weatherService.getCities(term).subscribe({
    next: (data: CityListDTO) => {
      this.cityList = data.cities;
      this.showDropdown = true;
      this.error = undefined;
      this.isCitiesLoading = false;
    },
    error: (err: any) => {
      console.error(err);
      this.error = 'Error al buscar ciudades.';
      this.isCitiesLoading = false;
    }
  });
}

  selectCity(city: CityDTO) {
    this.selectedCity = city;
    this.searchName = `${city.name}, ${city.country}`;
    this.cityList = [];
    this.showDropdown = false;

    localStorage.setItem('lastCity', JSON.stringify(city));

    this.loadWeather();
  }

  onInputFocus() {
    this.searchName = '';
  }

loadWeather() {
  if (!this.selectedCity) return;

  this.aiResponse = null;
  this.activeAiMode = null;
  this.aiError = null;

  this.isWeatherLoading = true;
  this.weatherService.getFullWeather(this.selectedCity).subscribe({
    next: (data: FullWeatherDTO) => {
      this.currentWeather = data.current;
      this.forecast = data.forecast;
      this.solarSummary = data.solar;
      this.airSummary = data.airQuality?.current;
      this.isWeatherLoading = false;
    },
    error: (err) => {
      this.error = 'Error al cargar los datos del tiempo.';
      this.isWeatherLoading = false;
    }
  });
}

  getUvColorClass(uv: number): string {
    if (uv <= 2) return 'text-green-500';
    if (uv <= 5) return 'text-yellow-500';
    if (uv <= 7) return 'text-orange-500';
    if (uv <= 10) return 'text-red-500';
    return 'text-purple-600';
  }

  getUvBarColorClass(uv: number): string {
    if (uv <= 2) return 'bg-green-400';
    if (uv <= 5) return 'bg-yellow-400';
    if (uv <= 7) return 'bg-orange-400';
    if (uv <= 10) return 'bg-red-400';
    return 'bg-purple-400';
  }

getSunPosition(percent: number | undefined): { x: number; y: number } {
  const safePercent = percent ?? 0;

  const angleRad = Math.PI * (1 - safePercent / 100);

  const radius = 50;

  const centerX = 50;

  const centerY = 50;

  return {
    x: centerX + radius * Math.cos(angleRad),
    y: centerY - radius * Math.sin(angleRad)
  };
}

  isToday(dateStr: string): boolean {
    const today = new Date().getDate();
    const date = new Date(dateStr).getDate();
    return today === date;
  }

  getWeatherIconClass(isDay: number, precip: number, cloud: number): string {
    if (precip > 0.1) return 'bi-cloud-drizzle-fill';
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

changeView(mode: 'general' | 'solar' | 'air') {
  this.viewMode = mode;

  this.aiResponse = null;
  this.activeAiMode = null;
  this.aiError = null;
}

  getAqiColor(aqi: number): string {
    if (aqi <= 20) return '#50f0e6';
    if (aqi <= 40) return '#50ccaa';
    if (aqi <= 60) return '#f0e641';
    if (aqi <= 80) return '#ff5050';
    if (aqi <= 100) return '#960032';
    return '#960032';
  }

  getAqiAdvice(aqi: number): string {
    if (aqi <= 20) return 'AIR_ADVICE.GOOD';
    if (aqi <= 40) return 'AIR_ADVICE.MODERATE';
    if (aqi <= 65) return 'AIR_ADVICE.UNHEALTHY_SENSITIVE';
    if (aqi <= 80) return 'AIR_ADVICE.UNHEALTHY';
    if (aqi <= 100) return 'AIR_ADVICE.VERY_UNHEALTHY';
    return 'AIR_ADVICE.HAZARDOUS';
  }

  getPm25Color(pm25: number): string {
    if (pm25 <= 10) return '#50f0e6';
    if (pm25 <= 20) return '#50ccaa';
    if (pm25 <= 25) return '#f0e641';
    if (pm25 <= 50) return '#ff5050';
    if (pm25 <= 75) return '#960032';
    return '#960032';
  }

  getPm10Color(pm10: number): string {
    if (pm10 <= 20) return '#50f0e6';
    if (pm10 <= 40) return '#50ccaa';
    if (pm10 <= 55) return '#f0e641';
    if (pm10 <= 100) return '#ff5050';
    if (pm10 <= 150) return '#960032';
    return '#960032';
  }

  getNo2Color(no2: number): string {
    if (no2 <= 40) return '#50f0e6';
    if (no2 <= 90) return '#50ccaa';
    if (no2 <= 120) return '#f0e641';
    if (no2 <= 230) return '#ff5050';
    if (no2 <= 340) return '#960032';
    return '#960032';
  }

  getO3Color(o3: number): string {
    if (o3 <= 50) return '#50f0e6';
    if (o3 <= 100) return '#50ccaa';
    if (o3 <= 130) return '#f0e641';
    if (o3 <= 240) return '#ff5050';
    if (o3 <= 380) return '#960032';
    return '#960032';
  }

  getSo2Color(so2: number): string {
    if (so2 <= 100) return '#50f0e6';
    if (so2 <= 200) return '#50ccaa';
    if (so2 <= 350) return '#f0e641';
    if (so2 <= 500) return '#ff5050';
    if (so2 <= 750) return '#960032';
    return '#960032';
  }

  askAi(mode: 'outfit' | 'activity' | 'laundry' | 'drink' | 'sun' | 'energy') {
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
        this.aiResponse = response.trim();
        this.isAiLoading = false;
      },
      error: (err: any) => {
        this.aiError = 'AI_SECTION.NO_AI';
        this.isAiLoading = false;
      }
    });
  }
}
