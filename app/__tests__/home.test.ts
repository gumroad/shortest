import { afterAll, beforeAll, define, UITestBuilder } from 'shortest';

interface loginButton {
  url: string;
}

define('Validate Dasboard is accessible by users', () => {

  new UITestBuilder<loginButton>('/')
    .test('Validate that users can access the dashboard')
    .given('baseUrl', { url: 'http://localhost:3000' })
    .expect('Should redirect to /dashboard and see the dashboard')

});
