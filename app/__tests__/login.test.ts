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

test('Login to the app using Github login', githubCredentials)