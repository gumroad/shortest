import { afterAll, beforeAll, define, UITestBuilder } from 'shortest';

interface LoginState {
  username: string;
  password: string;
}

define('Validate login feature implemented with Clerk', () => {

  new UITestBuilder<LoginState>('/')
    .test('Login to the app using Email and Password')
    .given('username and password', { username: 'argo.mohrad@gmail.com', password: 'Shortest1234' })
    .when('Logged in, click on view dashboard button')
    .expect('should successfully redirect to /')

    // new UITestBuilder<LoginState>('/')
    // .test('Login to the app using Google account')
    // .given('username and password', { username: 'test', password: 'test' })
    // .expect('should successfully redirect to /dashboard')

});