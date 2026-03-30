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

    const supportedLangs = ['es', 'en', 'de', 'fr', 'it', 'pt', 'ru', 'zh', 'ja', 'ko', 'gl', 'ca', 'eu'];

    const browserLang = this.translate.getBrowserLang() || 'en';

    const langToUse = supportedLangs.includes(browserLang) ? browserLang : 'en';

    this.translate.use(langToUse);
  }
}
