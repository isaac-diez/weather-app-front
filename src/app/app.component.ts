import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
})
export class AppComponent {
  title = 'weather-frontend';
  constructor(private translate: TranslateService) {

    this.translate.setDefaultLang('en');

    const browserLang = this.translate.getBrowserLang();

    this.translate.use(browserLang?.match(/es/) ? 'es' : 'en');
  }
}
