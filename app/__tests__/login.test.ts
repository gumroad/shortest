import { define, UITestBuilder, expect } from 'shortest';

interface LoginState {
  username: string;
  password: string;
}

define('Validate login feature implemented with Clerk', async () => {
  new UITestBuilder<LoginState>('/')
    .test('Login to the app using Github login')
    .given('Github username and password', { 
      username: process.env.GITHUB_USERNAME || '',
      password: process.env.GITHUB_PASSWORD || ''
    })
    .when('Logged in')
    .expect('should redirect to /dashboard');
});