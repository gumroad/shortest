import { UITestBuilder } from '@antiwork/shortest';
import { db } from "@/lib/db/drizzle";
import { sql } from "drizzle-orm";
import dotenv from "dotenv";

dotenv.config();

interface LoginState {
  username: string;
  password: string;
}

define('Validate login feature implemented with Clerk', async () => {
  new UITestBuilder<LoginState>('/')
    .test('Login to the app using Github login')
    .before(async () => {
      console.log('Clearing DB before each test');
    })
    .given('Github username and password', { 
      username: process.env.GITHUB_USERNAME || '',
      password: process.env.GITHUB_PASSWORD || ''
    }, async () => {
      expect(process.env.GITHUB_USERNAME).toBeDefined();
    })
    .when('user is logged in', async () => {
      try {
        console.log('Starting DB validation...');
        const [customer] = await db.execute<{ id: string, name: string, email: string }>(sql`
          SELECT * FROM customers WHERE email = 'delba@oliveira.com'
        `);

        if (!customer) {
          throw new Error('Customer delba@oliveira.com not found in database');
        }

        console.log('Found customer in DB:', customer);
        expect(customer.email).toBe('delba@oliveira.com');
        expect(customer.name).toBe('Delba de Oliveira');

      } catch (error) {
        console.error('DB Validation Error:', error);
        throw error; // Re-throw to fail the test
      }
    })
    .expect('user should be redirected to /dashboard after logged in via Github')
});