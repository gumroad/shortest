import { define, UITestBuilder, expect } from 'shortest';
import dotenv from "dotenv";

dotenv.config();

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
    }, async () => {
      expect(process.env.GITHUB_USERNAME).toBeDefined();
      expect(1).toBe(2);
    })
    .when('Logged in', async () => {
      // Just wait for redirect
      console.log('Waiting for redirect...');
    })
    .expect('should redirect to /dashboard');
});