import { test } from '@antiwork/shortest';
import { db } from "@/lib/db/drizzle";
import { sql } from "drizzle-orm";
import dotenv from "dotenv";

dotenv.config();

const githubCredentials = {
  email: process.env.GITHUB_EMAIL,
  username: process.env.GITHUB_USERNAME,
  password: process.env.GITHUB_PASSWORD,
}

test('Login to the app using Github login', githubCredentials , async ({ page }) => {
    console.log('Validating DB for the given user: ', githubCredentials.username);
    
    try {
      console.log('Starting DB validation...');
      const [customer] = await db.execute<{ id: string, name: string, email: string }>(sql`
        SELECT * FROM customers WHERE email = 'argo.mohrad@gmail.com'
      `);
  
      if (!customer) {
        throw new Error('Customer argo.mohrad@gmail.com not found in database');
      }
  
      console.log('Found customer in DB:', customer);
      expect(customer.email).toBe(githubCredentials.username);
      expect(customer.name).toBe(githubCredentials.email);
  
    } catch (error) {
      console.error('DB Validation Error:', error);
      throw error;
    }
})

test('Validate write new test button generates test cases and make sure you can commit new tests to github')