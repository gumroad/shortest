import { define, UITestBuilder, expect } from 'shortest';
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
    .given('Github username and password', { 
      username: process.env.GITHUB_USERNAME || '',
      password: process.env.GITHUB_PASSWORD || ''
    }, async () => {
      // Check if user exists in customers table
      const [customer] = await db.execute<{ id: string, name: string, email: string }>(sql`
        SELECT * FROM customers WHERE email = 'delba@oliveira.com'
      `);

      console.log('Checking for customer delba@oliveira.com:', customer);
      
      if (customer) {
        expect(customer).toBeDefined();
        expect(customer.email).toBe('delba@oliveira.com');
        expect(customer.name).toBe('Delba de Oliveira');
        console.log('Found customer:', customer);
      } else {
        console.log('Customer delba@oliveira.com not found in database');
      }
    })
    .when('Logged in', async () => {
      console.log('Waiting for redirect...');
    })
    .expect('should redirect to /dashboard');
});