import { afterAll, beforeAll, define, UITestBuilder } from 'shortest';

interface loginButton {
  url: string;
}

define('Validate login button in home page', () => {

  new UITestBuilder<loginButton>('/')
    .test('Validate login button is visible and works')
    .given('baseUrl', { url: 'http://localhost:3000' })
    .expect('Should redirect to login page')

});
