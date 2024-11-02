import { afterAll, beforeAll, define, UITestBuilder } from 'shortest';

interface LoginState {
  username: string;
  password: string;
}

define('Validate login feature implemented with Clerk', () => {

  new UITestBuilder<LoginState>('/')
    .test('Login to the app using Github account')
    .given('username and password', { username: 'test', password: 'test' })
    .expect('should successfully redirect to /dashboard')

    new UITestBuilder<LoginState>('/')
    .test('Login to the app using Google account')
    .given('username and password', { username: 'test', password: 'test' })
    .expect('should successfully redirect to /dashboard')

});
