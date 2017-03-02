import { FernandomillanPage } from './app.po';

describe('fernandomillan App', () => {
  let page: FernandomillanPage;

  beforeEach(() => {
    page = new FernandomillanPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('fm works!');
  });
});
