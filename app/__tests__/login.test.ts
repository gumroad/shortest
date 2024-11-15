import { afterAll, beforeAll, define, UITestBuilder } from 'shortest';

interface LoginState {
  username: string;
  password: string;
}

define('Validate login feature implemented with Clerk', () => {

  // new UITestBuilder<LoginState>('/')
    // .test('Login to the app using Email and Password')
    // .given('username and password', { username: 'argo.mohrad@gmail.com', password: 'Shortest1234' })
    // .when('Logged in, click on view dashboard button')
    // .expect('should successfully redirect to /')

    new UITestBuilder<LoginState>('/')
    .test('Login to the app using Github login')
    .given('Github username and password', { username: `${process.env.GITHUB_USERNAME}`, password: `${process.env.GITHUB_PASSWORD}` })
    .expect('should successfully redirect to /dashboard')

});