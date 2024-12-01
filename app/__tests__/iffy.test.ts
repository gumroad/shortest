import { UITestBuilder } from '@antiwork/shortest';

define('Validate clerk authentication', async () => {
  new UITestBuilder<any>('/sign-in')
    .before(() => {
      console.log('before');
    })
    .test('Validate new users can sign up')
    .given('navigate to the sign in page', { url: 'http://localhost:3001/sign-in' })
    .when('user enters email and password', {email: "iffy+clerk_test@example.com", password: "password"})
    .expect('user is redirected to /dashboard page', {url: 'http://localhost:3000/dashboard'});
});
