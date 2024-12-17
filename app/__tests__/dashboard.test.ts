import { shortest } from '@antiwork/shortest';
  
shortest('Login to the app using Github login', { username: process.env.GITHUB_USERNAME, password: process.env.GITHUB_PASSWORD });
shortest('clicking write new test button should initiate test generation');