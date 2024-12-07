import { test } from '@antiwork/shortest';

test('Login to the app using Github login', { username: process.env.GITHUB_USERNAME, password: process.env.GITHUB_PASSWORD })