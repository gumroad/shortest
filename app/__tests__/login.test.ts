import { test } from '@antiwork/shortest';

const githubCredentials = {
  email: process.env.GITHUB_EMAIL || 'argo.mohrad@gmail.com',
  username: process.env.GITHUB_USERNAME,
  password: process.env.GITHUB_PASSWORD,
}

test('Login to the app using Github login', githubCredentials)