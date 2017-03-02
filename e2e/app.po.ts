import { browser, element, by } from 'protractor';

export class FernandomillanPage {
  navigateTo() {
    return browser.get('/');
  }

  getParagraphText() {
    return element(by.css('fm-root h1')).getText();
  }
}
