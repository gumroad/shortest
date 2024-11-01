import { afterAll, beforeAll, define, UITestBuilder } from 'shortest';

interface CountState {
  countNumber: number;
}

define('Home page validation', () => {
  beforeAll(async () => {
    console.log('beforeAll');
  });

  afterAll(async () => {
    console.log('afterAll');
  });

  new UITestBuilder<CountState>('/')
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

    new UITestBuilder<CountState>('/')
    .test('Login and logout')
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
});
