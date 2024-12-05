import { test } from '@antiwork/shortest';

test.beforeAll(async () => {
  console.log('Clearing DB before all tests');
});

test.afterAll(async () => {
  console.log('Clearing DB after all tests');
});

test('Validate that users can access the dashboard')
  .expect('Should be able redirect to /dashboard and see the dashboard');
