import { afterAll, beforeAll, define, UITestBuilder } from 'shortest';

interface CountState {
  countNumber: number;
}

define('Home page validation', () => {
  const countTest = new UITestBuilder<CountState>('/')
    .test('Count button interactions')
    .before('setupEnvironment', { clean: true })
    .before(async () => {
      // function setup
    })
    .given('initial state of button', { countNumber: 0 })
    .given({ countNumber: 0 })
    .when('button isclicked')
    .when({ countNumber: 1 })
    .expect('button to be visible')
    .expect({ countNumber: 1 })
    .after('cleanup', { removeData: true })
    .after(async (response) => {
      // function cleanup
    });
});