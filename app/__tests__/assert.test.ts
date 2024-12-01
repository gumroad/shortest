import { UITestBuilder } from '@antiwork/shortest';
import { db } from "@/lib/db/drizzle";

interface User {
  email: string;
  name: string;
}

define('Test Assertions', async () => {
  // Test 1: Basic Assertions (Will Pass)
  afterAll(async () => {
    console.log('Clearing DB after all tests');
  });
  beforeAll(async () => {
    console.log('Clearing DB before all tests');
  });
   new UITestBuilder<User>('/')
    .after(async () => {
      console.log('end assert test 1');
    })
    .before(async () => {
      console.log('start assert test 1');
    })
    .test('Basic assertions that pass')
    .given('a test user', { email: 'test@test.com', name: 'Test User' }, async () => {
      expect(true).toBe(true);
      expect({ foo: 'bar' }).toEqual({ foo: 'bar' });
      expect([1, 2, 3]).toContain(2);
    })
    .when('checking database', async () => {
      const mockUser = { id: 1, email: 'test@test.com' };
      expect(mockUser).toHaveProperty('email');
      expect(mockUser.email).toMatch(/test@test.com/);
    })
    .expect('all assertions to pass');

  // Test 2: Failing Assertions (Will Fail)
new UITestBuilder<User>('/')
    .after(async () => {
      console.log('end assert test 2');
    })
    .before(async () => {
      console.log('start assert test 2');
    })
    .test('Assertions that should fail')
    .given('some data', { email: 'fail@test.com', name: 'Fail Test' }, async () => {
      expect(true).toBe(false);
      expect({ foo: 'bar' }).toEqual({ foo: 'baz' });
    })
    .when('checking values', async () => {
      expect(null).toBeDefined();
      expect(undefined).toBeTruthy();
    })
    .expect('to see failure reports');

  // Test 3: Async Assertions (Mix of Pass/Fail)
new UITestBuilder<User>('/')
    .after(async () => {
      console.log('end assert test 3');
    })
    .before(async () => {
      console.log('start assert test 3');
    })
    .test('Async assertions')
    .given('database connection', async () => {
      const user = await db.query.users.findFirst();
      expect(user).toBeDefined();
    })
    .when('querying data', async () => {
      const result = await Promise.resolve({ status: 'error' });
      expect(result.status).toBe('success');
    })
    .expect('to see mix of pass/fail results');
});
