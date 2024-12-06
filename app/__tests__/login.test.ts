import { test } from '@antiwork/shortest';
import { db } from "@/lib/db/drizzle";
import { sql } from "drizzle-orm";
import dotenv from "dotenv";

dotenv.config();

const githubCredentials = {
  email: process.env.GITHUB_EMAIL || 'argo.mohrad@gmail.com',
  username: process.env.GITHUB_USERNAME,
  password: process.env.GITHUB_PASSWORD,
}

test('Login to the app using Github login', githubCredentials , async ({ page }) => {    
    try {
      // Basic URL assertion
      // expect(1).toBe(2);
      
      // DOM element assertions
      const title = await page.title();
      console.log('Title:', title);
      expect(title).toBe('Shortest');

    } catch (error) {
      console.error('Assertion Error:', error);
      throw error;
    }
})