import { test } from '@antiwork/shortest';


const githubCredentials = {
    username: process.env.GITHUB_USERNAME,
    password: process.env.GITHUB_PASSWORD,
}
  
test('Login to the app using Github login', githubCredentials)

test('clicking write new test button should initiate test generation')