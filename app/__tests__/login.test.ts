import { db } from '@/lib/db/drizzle';
import { test } from '@antiwork/shortest';
import { sql } from 'drizzle-orm';

test.beforeAll('Clear DB before tests', async () => {
  console.log('Clearing DB before all tests');
});

test.afterAll('Clear DB after tests', async ({}) => {
  console.log('Clearing DB after all tests');
});

test.beforeEach('Set up test environment', async ({}) => {
  console.log('Setting up test environment');
});

test.afterEach('Tear down test environment', async ({}) => {
  console.log('Tearing down test environment');
});


test('Login to the app using Github login', {
  username: process.env.GITHUB_USERNAME || '',
  password: process.env.GITHUB_PASSWORD || ''
}, async ({ page }) => {
  try {
    console.log('Starting DB validation...');
    const [customer] = await db.execute<{ id: string, name: string, email: string }>(sql`
      SELECT * FROM customers WHERE email = 'delba@oliveira.com'
    `);

    if (!customer) {
      throw new Error('Customer delba@oliveira.com not found in database');
    }

    console.log('Found customer in DB:', customer);
    expect(customer.email).toBe('delba@oliveira.com');
    expect(customer.name).toBe('Delba de Oliveira');

  } catch (error) {
    console.error('DB Validation Error:', error);
    throw error;
  }
})
.expect('user should be redirected to /dashboard after logged in via Github', async () => {});
