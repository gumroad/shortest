import { afterAll, beforeAll, define, UITestBuilder, expect } from 'shortest';
import { client, db } from "@/lib/db/drizzle";

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
    })
    .when('Logged in', async () => {
      const user = await db.query.users.findFirst();
      expect(user).toBeDefined();
    })
    .expect('should redirect to /dashboard');
});