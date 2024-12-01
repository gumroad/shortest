import { UITestBuilder } from '@antiwork/shortest';

interface loginButton {
  url: string;
}

define('Validate Dasboard is accessible by users', async () => {
  afterAll(async () => {
    console.log('Clearing DB after all tests');
  });
  beforeAll(async () => {
    console.log('Clearing DB before all tests');
  });
  new UITestBuilder<loginButton>('/')
    .test('Validate that users can access the dashboard')
    
    .given('baseUrl', { url: 'http://localhost:3000' })
    .when('Clicking on view dashboard button')
    .expect('Should be able redirect to /dashboard and see the dashboard')
    .before(async () => {
      console.log('start home test');
    })
    .after(async () => {
      console.log('end home test');
    });
});
