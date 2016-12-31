import { FmjsPage } from './app.po';

describe('fmjs App', function() {
  let page: FmjsPage;

  beforeEach(() => {
    page = new FmjsPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
