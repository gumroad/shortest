import { define, UITestBuilder, expect } from 'shortest';
import { db } from "@/lib/db/drizzle";

interface User {
  email: string;
  name: string;
}

define('Test Assertions', async () => {
  // Test 1: Basic Assertions (Will Pass)
   new UITestBuilder<User>('/')
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
