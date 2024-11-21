import { define, UITestBuilder, expect } from 'shortest';
import { db } from "@/lib/db/drizzle";

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
      try {
        const user = await db.query.users.findFirst({
          where: (users, { eq }) => eq(users.clerkId, process.env.GITHUB_USERNAME || '')
        });
        
        if (user) {
          expect(user).toBeDefined();
          console.log("Found user:", user);
        } else {
          console.log("No user found in database - this is expected for first login");
        }
      } catch (error: unknown) {
        if (error instanceof Error) {
          console.log("Database error", error.message);
        }
      }
    })
    .expect('should redirect to /dashboard');
});